import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, MapPin, Calendar, Clock, Car, ShieldCheck, User, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { MessageItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const MessagingPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [bookingContext, setBookingContext] = useState<any>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.getMessages('book_active_1');
      if (res.success) {
        setMessages(res.data);
        if (res.bookingContext) setBookingContext(res.bookingContext);
      }
    } catch {
      // Fallback
    }
  };

  // Ensure page always starts at top when opened
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMessages();
  }, []);

  // Scroll only the internal chat container to the bottom without scrolling the whole webpage
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const optimistic: MessageItem = {
      id: `temp_${Date.now()}`,
      bookingId: 'book_active_1',
      senderId: user?.id || 'usr_driver_1',
      senderName: user?.name || 'Rahul Sen',
      senderRole: user?.role || 'driver',
      receiverId: 'usr_owner_1',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimistic]);
    const textToSend = inputText;
    setInputText('');

    try {
      setIsSending(true);
      await api.sendMessage('book_active_1', textToSend);
    } catch {
      // Keep optimistic message
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-4 py-4 sm:py-8 space-y-3.5 sm:space-y-4">
      {/* Back button */}
      <div>
        <Link
          to={user?.role === 'owner' ? '/owner' : '/dashboard'}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>{user?.role === 'owner' ? 'Back to Host Overview' : 'Back to Overview Hub'}</span>
        </Link>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[78vh] sm:h-[75vh]">
        {/* Booking Context Header (Requirement 30) */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              P
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-xs sm:text-sm truncate">
                  {bookingContext?.parkingTitle || 'Central Avenue Covered Parking'}
                </h3>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  {bookingContext?.bookingCode || 'PS-482931'}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                <span>Spot: <strong className="text-emerald-400">{bookingContext?.spotNumber || 'P-24'}</strong></span>
                <span>•</span>
                <span>{bookingContext?.arrivalTime || '02:00 PM'} → {bookingContext?.departureTime || '05:00 PM'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-slate-900/60 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border border-slate-800/80 sm:border-0">
            <span className="text-[11px] sm:text-xs text-slate-400">Host:</span>
            <span className="text-xs font-bold text-white">Vikramaditya Roy</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Message Thread */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id || msg.senderRole === user?.role;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-1 px-1">
                  {isMe ? 'You' : msg.senderName} • {msg.timestamp}
                </span>
                <div
                  className={`max-w-[85%] sm:max-w-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900 border border-slate-800 text-white rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to your host (e.g. Which entrance gate should I take?)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
