import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Send,
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  User,
  ArrowLeft,
  MessageSquare,
  Search,
  ChevronLeft,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { api } from '../services/api';
import { MessageItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export interface ConversationItem {
  id: string;
  bookingId: string;
  bookingCode?: string;
  parkingTitle: string;
  parkingAddress?: string;
  spotNumber: string;
  status: string;
  otherUser: {
    id: string;
    name: string;
    role: string;
    phone?: string;
    avatar?: string;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    senderId: string;
    senderName: string;
    isMe: boolean;
  };
  unreadCount: number;
  updatedAt: string;
}

export const MessagingPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { refreshNotifications } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlBookingId = searchParams.get('bookingId');

  // Determine if this is an owner viewing their general inquiries hub
  const isOwnerInquiriesHub = user?.role === 'owner' && !urlBookingId;

  // State for Customer / Single Chat view
  const [currentBookingId, setCurrentBookingId] = useState<string>(urlBookingId || 'latest');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [bookingContext, setBookingContext] = useState<any>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // State for Owner Multi-Customer Inquiries Hub
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);

  // 1. Fetch conversations for Owner Inquiries Hub (Only real-time chats, starts empty)
  const loadConversations = async () => {
    if (!isOwnerInquiriesHub) return;
    try {
      const res = await api.getConversations();
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConvId) {
          setActiveConvId(res.data[0].id);
        }
      }
    } catch {
      // Fallback
    }
  };

  // 2. Fetch messages for Customer / Single Booking Chat (Previous clean implementation)
  const fetchSingleBookingMessages = async () => {
    try {
      const bRes = await api.getBookings();
      const activeOrFirst =
        bRes.data?.find((b) => b.id === urlBookingId || b.bookingCode === urlBookingId) ||
        bRes.data?.find((b) => b.bookingStatus === 'active' || b.bookingStatus === 'confirmed') ||
        bRes.data?.[0];

      const targetId = urlBookingId || activeOrFirst?.id || 'latest';
      setCurrentBookingId(targetId);

      const res = await api.getMessages(targetId);
      if (res.success) {
        setMessages(res.data);
        if (res.bookingContext) {
          setBookingContext(res.bookingContext);
        } else if (activeOrFirst) {
          setBookingContext({
            bookingId: activeOrFirst.id,
            bookingCode: activeOrFirst.bookingCode,
            parkingTitle: activeOrFirst.parkingTitle,
            parkingAddress: activeOrFirst.parkingAddress,
            date: activeOrFirst.date,
            arrivalTime: activeOrFirst.arrivalTime,
            departureTime: activeOrFirst.departureTime,
            spotNumber: activeOrFirst.spotNumber,
            driverName: activeOrFirst.userName,
            ownerId: activeOrFirst.ownerId || 'usr_owner_1',
            ownerName: (activeOrFirst as any).ownerName || 'Vikramaditya Roy',
          });
        }
      }
    } catch {
      // Fallback
    }
  };

  // 3. Fetch messages for selected Owner conversation
  const loadOwnerActiveChatMessages = async (convId: string) => {
    if (!convId) return;
    try {
      const conv = conversations.find((c) => c.id === convId);
      const queryId = conv?.bookingId || convId;
      const res = await api.getMessages(queryId);
      if (res.success) {
        setMessages(res.data);
        if (res.bookingContext) {
          setBookingContext(res.bookingContext);
        } else if (conv) {
          setBookingContext({
            bookingId: conv.bookingId,
            bookingCode: conv.bookingCode,
            parkingTitle: conv.parkingTitle,
            parkingAddress: conv.parkingAddress,
            spotNumber: conv.spotNumber,
            driverName: conv.otherUser.name,
            ownerName: user?.name || 'Vikramaditya Roy',
            ownerId: user?.id || 'usr_owner_1',
          });
        }
        // Clear unread
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
        refreshNotifications();
      }
    } catch {
      // Fallback
    }
  };

  // Initial setup
  useEffect(() => {
    window.scrollTo(0, 0);
    if (isOwnerInquiriesHub) {
      loadConversations();
    } else {
      fetchSingleBookingMessages();
    }
  }, [urlBookingId, isOwnerInquiriesHub]);

  // Load chat for active conversation in owner hub
  useEffect(() => {
    if (isOwnerInquiriesHub && activeConvId) {
      loadOwnerActiveChatMessages(activeConvId);
    }
  }, [activeConvId, isOwnerInquiriesHub]);

  // Real-time synchronization
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (isOwnerInquiriesHub) {
        loadConversations();
        if (activeConvId) loadOwnerActiveChatMessages(activeConvId);
      } else {
        fetchSingleBookingMessages();
      }
    }, 4000);

    const handleMsgEvent = () => {
      if (isOwnerInquiriesHub) {
        loadConversations();
        if (activeConvId) loadOwnerActiveChatMessages(activeConvId);
      } else {
        fetchSingleBookingMessages();
      }
    };

    window.addEventListener('parkshare_message_received', handleMsgEvent);
    window.addEventListener('parkshare_notification_added', handleMsgEvent);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('parkshare_message_received', handleMsgEvent);
      window.removeEventListener('parkshare_notification_added', handleMsgEvent);
    };
  }, [isOwnerInquiriesHub, activeConvId, urlBookingId]);

  // Internal chat auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, showMobileChat, activeConvId]);

  useEffect(() => {
    if (showMobileChat) {
      window.scrollTo(0, 0);
    }
  }, [showMobileChat]);

  // Handler for sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const targetReceiver =
      user?.role === 'owner'
        ? (activeConv?.otherUser?.id || bookingContext?.driverId || 'usr_driver_1')
        : (bookingContext?.ownerId || 'usr_owner_1');

    const effectiveTargetBooking =
      (isOwnerInquiriesHub && activeConvId)
        ? (conversations.find((c) => c.id === activeConvId)?.bookingId || activeConvId)
        : currentBookingId;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const optimistic: MessageItem = {
      id: `temp_${Date.now()}`,
      bookingId: effectiveTargetBooking,
      conversationId: activeConvId || effectiveTargetBooking,
      senderId: user?.id || (user?.role === 'owner' ? 'usr_owner_1' : 'usr_driver_1'),
      senderName: user?.name || (user?.role === 'owner' ? 'Vikramaditya Roy' : 'Rahul Sen'),
      senderRole: (user?.role as any) || 'driver',
      receiverId: targetReceiver,
      text: textToSend,
      messageText: textToSend,
      timestamp,
      isRead: false,
      createdAt: now.toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputText('');

    try {
      setIsSending(true);
      await api.sendMessage(
        effectiveTargetBooking,
        textToSend,
        targetReceiver,
        activeConvId || effectiveTargetBooking
      );
      refreshNotifications();
      if (isOwnerInquiriesHub) {
        loadConversations();
      }
    } catch {
      // Keep optimistic message
    } finally {
      setIsSending(false);
    }
  };

  // Active conversation for owner view
  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0] || null;
  }, [conversations, activeConvId]);

  // Filtered conversations for owner search
  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (c) =>
        c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.parkingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.spotNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  // =========================================================================
  // VIEW A: NORMAL CUSTOMER / DRIVER BOOKING CHAT (PREVIOUSLY IMPLEMENTED)
  // Opened from "My Bookings" via Chat icon button or directly by customer
  // =========================================================================
  if (!isOwnerInquiriesHub) {
    return (
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-1 sm:py-8 space-y-1.5 sm:space-y-4">
        {/* Back button (Desktop only, mobile has it in header) */}
        <div className="hidden sm:block">
          <Link
            to={user?.role === 'owner' ? '/owner' : '/bookings'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group shadow-sm border cursor-pointer ${
              isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span>{user?.role === 'owner' ? 'Back to Host Overview' : 'Back to My Bookings'}</span>
          </Link>
        </div>

        <div
          className={`border rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[calc(100dvh-125px)] sm:h-[75vh] ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Booking Context Header */}
          <div
            className={`p-3 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Mobile Back Button */}
              <Link
                to={user?.role === 'owner' ? '/owner' : '/bookings'}
                className={`sm:hidden p-1.5 rounded-xl border shrink-0 cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                P
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-bold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {bookingContext?.parkingTitle || 'Reserved Parking Bay'}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                    {bookingContext?.bookingCode || 'PS-100303'}
                  </span>
                </div>
                <div
                  className={`text-[11px] sm:text-xs flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <span>
                    Spot: <strong className="text-emerald-500">{bookingContext?.spotNumber || 'P-01'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {bookingContext?.arrivalTime || '02:00 PM'} → {bookingContext?.departureTime || '05:00 PM'}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 self-start sm:self-auto shrink-0 px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 ${
                isDark ? 'bg-slate-900/60 sm:bg-transparent border-slate-800/80' : 'bg-slate-100 sm:bg-transparent border-slate-200'
              }`}
            >
              <span className={`text-[11px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Host:</span>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {bookingContext?.ownerName || 'Vikramaditya Roy'}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>

          {/* Message Thread */}
          <div
            ref={chatContainerRef}
            className={`flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-4 ${
              isDark ? 'bg-[#0b0f17]/40' : 'bg-slate-50/20'
            }`}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-emerald-400 mx-auto ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Direct Host Messaging
                </h4>
                <p className={`text-xs max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ask your parking host about entrance clearances, gate access codes, or directions.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe =
                  msg.senderId === user?.id ||
                  (user?.role === 'driver' && msg.senderRole === 'driver') ||
                  (!user && msg.senderRole === 'driver');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className={`text-[10px] mb-1 px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isMe ? 'You' : msg.senderName} • {msg.timestamp}
                    </span>
                    <div
                      className={`max-w-[85%] sm:max-w-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/10'
                          : isDark
                          ? 'bg-slate-900 border border-slate-800 text-white rounded-tl-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-xs'
                      }`}
                    >
                      {msg.text || (msg as any).messageText}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className={`p-3 sm:p-4 border-t flex items-center gap-2 shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message to your host (e.g. Which entrance gate should I take?)..."
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm outline-none border transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: OWNER DRIVER INQUIRIES HUB (NO PRELOADED DATA, EMPTY SHEET IF NONE)
  // If multiple customers message, shows different chats for different customers!
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-1 sm:py-6 space-y-1.5 sm:space-y-4">
      {/* Top Header */}
      <div className={`items-center justify-between gap-3 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <Link
          to="/owner"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group shadow-sm border cursor-pointer ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Host Overview</span>
        </Link>
      </div>

      {/* If No Inquiries Exist: Empty Sheet as requested */}
      {conversations.length === 0 ? (
        <div
          className={`rounded-2xl sm:rounded-3xl border p-12 sm:p-16 text-center space-y-4 shadow-xl max-w-2xl mx-auto ${
            isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200 shadow-slate-900/5'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Inbox className="w-8 h-8" />
          </div>
          <div>
            <h2 className={`text-lg sm:text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Your Driver Inquiries Sheet is Empty
            </h2>
            <p className={`text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              No customer inquiries have been received yet. When a customer messages you in real-time regarding a parking reservation or parking space, their conversation will appear here.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/owner"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              <span>Return to Overview</span>
            </Link>
          </div>
        </div>
      ) : (
        /* If Multiple Customer Inquiries Exist: Distinct Customer Options */
        <div
          className={`rounded-2xl sm:rounded-3xl border overflow-hidden shadow-2xl flex flex-col md:flex-row ${
            showMobileChat ? 'h-[calc(100dvh-125px)]' : 'h-[calc(100dvh-170px)]'
          } md:h-[82vh] md:max-h-[850px] md:min-h-[550px] ${
            isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200 shadow-slate-900/5'
          }`}
        >
          {/* Left Panel: Distinct Customer Chats List */}
          <div
            className={`w-full md:w-80 lg:w-96 flex flex-col border-r shrink-0 transition-all h-full ${
              isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
            } ${showMobileChat ? 'hidden md:flex' : 'flex'}`}
          >
            {/* Header */}
            <div className={`p-4 border-b space-y-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`font-extrabold text-sm sm:text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Driver Inquiries
                  </h2>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Distinct customer chats by parking space
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {conversations.length}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer, spot, or booking..."
                  className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none transition-all border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
              {filteredConversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setShowMobileChat(true);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border text-left flex items-start gap-3 group ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                          : 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400/20'
                        : isDark
                        ? 'border-transparent hover:bg-slate-900/70 hover:border-slate-800'
                        : 'border-transparent hover:bg-slate-100/80 hover:border-slate-200'
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      {conv.otherUser.avatar ? (
                        <img
                          src={conv.otherUser.avatar}
                          alt={conv.otherUser.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700/60"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                          {conv.otherUser.name.charAt(0)}
                        </div>
                      )}
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0b0f17] absolute bottom-0 right-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected
                              ? 'text-emerald-400 font-extrabold'
                              : isDark
                              ? 'text-white group-hover:text-emerald-400'
                              : 'text-slate-900 group-hover:text-emerald-600'
                          }`}
                        >
                          {conv.otherUser.name}
                        </h4>
                        <span className={`text-[10px] shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {conv.lastMessage.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                          {conv.spotNumber}
                        </span>
                        <span className={`text-[10px] truncate max-w-[140px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {conv.parkingTitle}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <p
                          className={`text-xs truncate leading-snug ${
                            conv.unreadCount > 0
                              ? isDark
                                ? 'text-slate-200 font-bold'
                                : 'text-slate-900 font-bold'
                              : isDark
                              ? 'text-slate-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {conv.lastMessage.isMe && <span className="text-emerald-400 font-semibold">You: </span>}
                          {conv.lastMessage.text}
                        </p>

                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black shrink-0 shadow-xs shadow-emerald-500/30">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Customer Chat Window */}
          <div
            className={`flex-1 flex flex-col min-w-0 h-full ${showMobileChat ? 'flex' : 'hidden md:flex'}`}
          >
            {activeConv ? (
              <>
                {/* Header */}
                <div
                  className={`p-3 sm:p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
                    isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowMobileChat(false)}
                      className={`md:hidden p-1.5 rounded-xl border cursor-pointer ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="relative shrink-0">
                      {activeConv.otherUser.avatar ? (
                        <img
                          src={activeConv.otherUser.avatar}
                          alt={activeConv.otherUser.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700/60"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                          {activeConv.otherUser.name.charAt(0)}
                        </div>
                      )}
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0b0f17] absolute bottom-0 right-0" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-extrabold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {activeConv.otherUser.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          Driver Customer
                        </span>
                      </div>
                      <div className={`text-[11px] sm:text-xs flex items-center gap-2 mt-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span>Spot: <strong className="text-emerald-500">{activeConv.spotNumber}</strong></span>
                        <span>•</span>
                        <span className="truncate">{activeConv.parkingTitle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className={`px-3 py-1.5 rounded-xl border text-right ${
                      isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Inquirer</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div
                  ref={chatContainerRef}
                  className={`flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 ${
                    isDark ? 'bg-[#090d14]/50' : 'bg-slate-50/30'
                  }`}
                >
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id || msg.senderRole === 'owner';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className={`text-[10px] mb-1 px-1 flex items-center gap-1 ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          <span>{isMe ? 'You' : msg.senderName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </span>
                        <div
                          className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-sm'
                              : isDark
                              ? 'bg-slate-900 border border-slate-800 text-white rounded-tl-none'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-xs'
                          }`}
                        >
                          {msg.text || (msg as any).messageText}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className={`p-3 sm:p-4 border-t flex items-center gap-2 sm:gap-2.5 shrink-0 ${
                    isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Type a reply to ${activeConv.otherUser.name}...`}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm outline-none border transition-colors ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-bold">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs">Select a customer from the left to view their inquiry.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
