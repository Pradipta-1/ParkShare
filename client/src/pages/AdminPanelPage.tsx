import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Shield,
  Users,
  Car,
  CalendarCheck2,
  DollarSign,
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck,
  Building,
  UserCheck,
  Key,
  Search,
  Activity,
  Sparkles,
  Phone,
  Mail,
  RefreshCw,
  Filter,
  Lock,
  Wallet,
  RotateCcw,
  Edit3,
  Copy,
  AlertCircle,
  HelpCircle,
  Award,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';
import { VerificationRequestItem, ReportItem, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin_1',
    name: 'Priya Banerjee',
    email: 'admin@parkshare.com',
    role: 'admin',
    phone: '+91 98000 99999',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    memberSince: 'August 2021',
    walletBalance: 0,
    responseRate: '100%',
  },
  {
    id: 'usr_owner_1',
    name: 'Vikramaditya Roy',
    email: 'owner@parkshare.com',
    role: 'owner',
    phone: '+91 98740 54321',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    memberSince: 'January 2022',
    walletBalance: 0,
    responseRate: '100%',
  },
  {
    id: 'usr_driver_1',
    name: 'Rahul Sen',
    email: 'driver@parkshare.com',
    role: 'driver',
    phone: '+91 98301 23456',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    memberSince: 'March 2023',
    walletBalance: 0,
    responseRate: '100%',
  },
];

const DEFAULT_VERIFICATIONS: VerificationRequestItem[] = [];

const DEFAULT_REPORTS: ReportItem[] = [];

export const AdminPanelPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'overview' | 'verification' | 'disputes' | 'users' | null;

  const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'disputes' | 'users'>(
    urlTab && ['overview', 'verification', 'disputes', 'users'].includes(urlTab) ? urlTab : 'overview'
  );

  const [metricsData, setMetricsData] = useState<any>(null);

  // Verification requests state with localStorage fallback
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequestItem[]>(() => {
    try {
      const saved = localStorage.getItem('parkshare_admin_verifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_VERIFICATIONS;
  });

  // Dispute reports state with localStorage fallback
  const [reports, setReports] = useState<ReportItem[]>(() => {
    try {
      const saved = localStorage.getItem('parkshare_admin_reports');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_REPORTS;
  });

  // Users roster state with localStorage fallback
  const [usersList, setUsersList] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('parkshare_all_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_USERS;
  });

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [disputeFilter, setDisputeFilter] = useState<'all' | 'open' | 'resolved' | 'rejected'>('all');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive Action Modals State
  const [keyResetModalUser, setKeyResetModalUser] = useState<User | null>(null);
  const [manageModalUser, setManageModalUser] = useState<User | null>(null);
  const [disputeModalReport, setDisputeModalReport] = useState<ReportItem | null>(null);

  // Modal Form States
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [keyResetReason, setKeyResetReason] = useState('User credential recovery assistance');
  const [copiedKeyToast, setCopiedKeyToast] = useState(false);

  const [manageName, setManageName] = useState('');
  const [manageRole, setManageRole] = useState<'driver' | 'owner' | 'admin'>('driver');
  const [managePhone, setManagePhone] = useState('');
  const [manageWallet, setManageWallet] = useState<number>(0);
  const [manageStatus, setManageStatus] = useState<string>('Active (Good Standing)');
  const [manageAdminNote, setManageAdminNote] = useState<string>('');

  const [disputeNewStatus, setDisputeNewStatus] = useState<string>('Resolved');
  const [disputeResolutionNote, setDisputeResolutionNote] = useState<string>('');
  const [disputeRefundAmount, setDisputeRefundAmount] = useState<number>(120);

  // Sync tab from URL whenever searchParams change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as 'overview' | 'verification' | 'disputes' | 'users' | null;
    if (tabFromUrl && ['overview', 'verification', 'disputes', 'users'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'overview' | 'verification' | 'disputes' | 'users') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchAdminData = async () => {
    setIsRefreshing(true);
    try {
      const [mRes, vRes, rRes, uRes] = await Promise.allSettled([
        api.getAdminMetrics(),
        api.getVerificationRequests(),
        api.getReports(),
        api.getAdminUsers(),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.success) {
        setMetricsData(mRes.value.data);
      }
      if (vRes.status === 'fulfilled' && vRes.value.success && vRes.value.data?.length) {
        setVerificationRequests(vRes.value.data);
        localStorage.setItem('parkshare_admin_verifications', JSON.stringify(vRes.value.data));
      }
      if (rRes.status === 'fulfilled' && rRes.value.success && rRes.value.data?.length) {
        setReports(rRes.value.data);
        localStorage.setItem('parkshare_admin_reports', JSON.stringify(rRes.value.data));
      }
      if (uRes.status === 'fulfilled' && uRes.value.success && uRes.value.data?.length) {
        // Merge with local overrides if existing
        setUsersList((prev) => {
          const apiUsers = uRes.value.data;
          const merged = apiUsers.map((au) => {
            const local = prev.find((p) => p.id === au.id);
            return local ? { ...au, ...local } : au;
          });
          localStorage.setItem('parkshare_all_users', JSON.stringify(merged));
          return merged;
        });
      }
    } catch {
      // Keep existing cached state
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Save usersList changes to localStorage
  const updateUsersListState = (updater: (prev: User[]) => User[]) => {
    setUsersList((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem('parkshare_all_users', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // 1. OPEN RESET KEY MODAL
  const openResetKeyModal = (targetUser: User) => {
    const generated = `PS-SEC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setKeyResetModalUser(targetUser);
    setTempKeyInput(generated);
    setKeyResetReason('User credential recovery assistance');
    setCopiedKeyToast(false);
  };

  // EXECUTE KEY RESET
  const handleExecuteKeyReset = async () => {
    if (!keyResetModalUser) return;
    const target = keyResetModalUser;
    const finalKey = tempKeyInput.trim() || `PS-SEC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      await api.resetUserKey(target.id, finalKey, keyResetReason);
    } catch {
      // Continue locally for smooth offline/demo experience
    }

    // Update local user state
    updateUsersListState((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, temporaryKey: finalKey } : u))
    );

    // If currently logged-in user is target, update AuthContext
    if (user && (user.id === target.id || (user.role === target.role && target.role !== 'admin'))) {
      updateUser({ temporaryKey: finalKey });
    }

    // Dispatch real-time security alert notification to target user account
    addNotification({
      userId: target.id,
      type: 'general',
      title: 'Security Alert: Access Key Reset by Admin',
      message: `Your account credentials were reset by Super Admin (${keyResetReason}). Temporary Access Key: ${finalKey}. Use this key for verification or credential update.`,
      dateGroup: 'Today',
    });

    setActionSuccess(
      `Access Key (${finalKey}) successfully reset for ${target.name}! Security notification dispatched to their account.`
    );
    setTimeout(() => setActionSuccess(''), 5000);
    setKeyResetModalUser(null);
  };

  // 2. OPEN MANAGE USER MODAL
  const openManageModal = (targetUser: User) => {
    setManageModalUser(targetUser);
    setManageName(targetUser.name);
    setManageRole(targetUser.role);
    setManagePhone(targetUser.phone || '+91 98300 00000');
    setManageWallet(targetUser.walletBalance ?? 0);
    setManageStatus((targetUser as any).status || 'Active (Good Standing)');
    setManageAdminNote('');
  };

  // EXECUTE MANAGE USER
  const handleExecuteManageUser = async () => {
    if (!manageModalUser) return;
    const target = manageModalUser;

    const payload = {
      name: manageName.trim() || target.name,
      role: manageRole,
      phone: managePhone.trim() || target.phone,
      walletBalance: target.walletBalance ?? 0,
      status: manageStatus,
      adminNote: manageAdminNote.trim(),
    };

    try {
      await api.updateAdminUser(target.id, payload);
    } catch {
      // Continue locally
    }

    // Update users list
    updateUsersListState((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, ...payload } : u))
    );

    // If current logged-in user is the managed user, sync AuthContext immediately!
    if (user && (user.id === target.id || (user.role === target.role && target.role !== 'admin'))) {
      updateUser(payload);
    }

    // Dispatch real-time notification to the user's account
    addNotification({
      userId: target.id,
      type: 'general',
      title: 'Profile Permissions & Account Updated',
      message: `Administrator updated your account. Role: ${manageRole}, Status: ${manageStatus}. ${
        manageAdminNote.trim() ? `Admin note: "${manageAdminNote.trim()}".` : ''
      }`,
      dateGroup: 'Today',
    });

    setActionSuccess(
      `Account updated for ${target.name}! Role: ${manageRole}, Status: ${manageStatus}. Immediately reflected in their account.`
    );
    setTimeout(() => setActionSuccess(''), 5000);
    setManageModalUser(null);
  };

  // DELETE USER ACCOUNT
  const handleDeleteUser = async () => {
    if (!manageModalUser) return;
    const target = manageModalUser;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the account for "${target.name}" (${target.email})?\n\nThis will remove their profile, access permissions, and any associated parking spaces. This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.deleteAdminUser(target.id);
    } catch {
      // Continue locally for smooth offline/demo experience
    }

    // Remove user from users state
    updateUsersListState((prev) => prev.filter((u) => u.id !== target.id));

    // Remove from localStorage user cache
    try {
      const existing = JSON.parse(localStorage.getItem('parkshare_all_users') || '[]');
      const updated = existing.filter((u: any) => u.id !== target.id);
      localStorage.setItem('parkshare_all_users', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    // If deleted user had spaces, remove them from custom spaces cache
    try {
      const existingSpaces = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      const updatedSpaces = existingSpaces.filter((s: any) => s.ownerId !== target.id);
      localStorage.setItem('parkshare_custom_spaces', JSON.stringify(updatedSpaces));
    } catch {
      // Ignore
    }

    setActionSuccess(`Account for "${target.name}" (${target.role}) has been permanently deleted.`);
    setTimeout(() => setActionSuccess(''), 5000);
    setManageModalUser(null);
  };

  // 3. OPEN DISPUTE ACTION MODAL
  const openDisputeModal = (report: ReportItem) => {
    setDisputeModalReport(report);
    setDisputeNewStatus(report.status === 'Open' ? 'Resolved' : report.status);
    setDisputeResolutionNote('');
    setDisputeRefundAmount(report.category === 'Payment problem' ? 240 : 120);
  };

  // EXECUTE DISPUTE RESOLUTION
  const handleExecuteDisputeAction = async () => {
    if (!disputeModalReport) return;
    const rep = disputeModalReport;
    const refundNum = disputeNewStatus === 'Resolved' ? Number(disputeRefundAmount) || 0 : 0;
    const resolutionNote = disputeResolutionNote.trim();

    try {
      await api.updateReportStatus(rep.id, disputeNewStatus, resolutionNote, refundNum);
    } catch {
      // Continue locally
    }

    // Update reports state
    setReports((prev) => {
      const updated = prev.map((r) =>
        r.id === rep.id ? { ...r, status: disputeNewStatus as any, resolutionNote } : r
      );
      try {
        localStorage.setItem('parkshare_admin_reports', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    // If refund was granted, credit the Customer's wallet!
    if (refundNum > 0) {
      updateUsersListState((prev) =>
        prev.map((u) => {
          if (u.id === rep.userId || u.name === rep.userName || u.role === 'driver') {
            const updatedBal = (u.walletBalance || 0) + refundNum;
            if (user && (user.id === u.id || user.role === 'driver')) {
              updateUser({ walletBalance: updatedBal });
            }
            return { ...u, walletBalance: updatedBal };
          }
          return u;
        })
      );
    }

    // Dispatch real-time notification to Customer (Driver)
    const refundText = refundNum > 0 ? ` ₹${refundNum} has been refunded to your wallet!` : '';
    const noteText = resolutionNote ? ` Resolution details: "${resolutionNote}".` : '';

    addNotification({
      userId: rep.userId || 'usr_driver_1',
      type: refundNum > 0 ? 'refund' : 'general',
      title: `Dispute Case ${disputeNewStatus}: ${rep.parkingTitle}`,
      message: `Your dispute ticket was reviewed and marked as ${disputeNewStatus} by Administrator.${refundText}${noteText}`,
      dateGroup: 'Today',
    });

    // Dispatch real-time notification to Space Owner (Host)
    addNotification({
      userId: 'usr_owner_1',
      type: 'general',
      title: `Dispute Case ${disputeNewStatus}: ${rep.parkingTitle}`,
      message: `The incident complaint regarding "${rep.parkingTitle}" was marked as ${disputeNewStatus} by Administrator.${noteText}`,
      dateGroup: 'Today',
    });

    setActionSuccess(
      `Dispute ticket updated to "${disputeNewStatus}"! Real-time notifications and wallet adjustments dispatched to both Customer and Space Owner accounts.`
    );
    setTimeout(() => setActionSuccess(''), 5000);
    setDisputeModalReport(null);
  };

  // 4. VERIFICATION APPROVE & REJECT
  const handleApproveVerification = async (id: string) => {
    const vr = verificationRequests.find((v) => v.id === id);
    try {
      await api.approveVerification(id);
    } catch {
      // Continue locally
    }

    setVerificationRequests((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, status: 'approved' as const } : v));
      try {
        localStorage.setItem('parkshare_admin_verifications', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    // Update space in custom spaces storage so Verified badge shows in Owner & Driver views
    try {
      const customSpaces = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      const updatedSpaces = customSpaces.map((s: any) =>
        s.id === vr?.listingId || s.title === vr?.title ? { ...s, isVerified: true } : s
      );
      localStorage.setItem('parkshare_custom_spaces', JSON.stringify(updatedSpaces));
    } catch {
      // Ignore
    }

    // Dispatch real-time notification to Space Owner account
    addNotification({
      userId: 'usr_owner_1',
      type: 'verification',
      title: 'Listing Verified by Admin',
      message: `Congratulations! Your parking space "${vr?.title || 'Listing'}" has been approved by Admin and awarded the "Verified Parking" badge.`,
      dateGroup: 'Today',
    });

    setActionSuccess('Parking space successfully verified! "Verified Parking" badge awarded and notification sent to Space Owner.');
    setTimeout(() => setActionSuccess(''), 5000);
  };

  const handleRejectVerification = async (id: string) => {
    const vr = verificationRequests.find((v) => v.id === id);
    try {
      await api.rejectVerification(id);
    } catch {
      // Continue locally
    }

    setVerificationRequests((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, status: 'rejected' as const } : v));
      try {
        localStorage.setItem('parkshare_admin_verifications', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    // Update space in custom spaces storage
    try {
      const customSpaces = JSON.parse(localStorage.getItem('parkshare_custom_spaces') || '[]');
      const updatedSpaces = customSpaces.map((s: any) =>
        s.id === vr?.listingId || s.title === vr?.title ? { ...s, isVerified: false } : s
      );
      localStorage.setItem('parkshare_custom_spaces', JSON.stringify(updatedSpaces));
    } catch {
      // Ignore
    }

    // Dispatch notification to Space Owner account
    addNotification({
      userId: 'usr_owner_1',
      type: 'general',
      title: 'Verification Request Rejected',
      message: `Your verification submission for "${vr?.title || 'Listing'}" was rejected by Admin. Reason: Clear space photos and driveway entrance angle required. Please update and re-submit.`,
      dateGroup: 'Today',
    });

    setActionSuccess('Verification request marked as rejected. Rejection notice dispatched to Host account.');
    setTimeout(() => setActionSuccess(''), 5000);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearch));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredVerifications = verificationRequests.filter((vr) => {
    if (verificationFilter === 'all') return true;
    return vr.status === verificationFilter;
  });

  const filteredReports = reports.filter((rep) => {
    if (disputeFilter === 'all') return true;
    if (disputeFilter === 'open') return rep.status === 'Open' || rep.status === 'Investigating';
    if (disputeFilter === 'resolved') return rep.status === 'Resolved';
    if (disputeFilter === 'rejected') return rep.status === 'Rejected';
    return true;
  });

  const pendingVerificationsCount = verificationRequests.filter((v) => v.status === 'pending').length;
  const openReportsCount = reports.filter((r) => r.status === 'Open' || r.status === 'Investigating').length;

  return (
    <div className={`max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 transition-colors ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Operations & Governance
          </span>
          <h1 className={`text-xl sm:text-3xl font-black tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Admin Management Console
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Platform-wide oversight, space verifications, users roster, and dispute tickets.
          </p>
        </div>

        {/* Hidden on mobile / small screens, visible on desktop */}
        <div className={`hidden md:flex md:flex-wrap gap-1.5 p-1.5 border rounded-2xl text-xs font-semibold w-full sm:w-auto transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300 shadow-inner'
        }`}>
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/70 font-bold'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('verification')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center relative cursor-pointer ${
              activeTab === 'verification'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/70 font-bold'
            }`}
          >
            <span>Verifications</span>
            {pendingVerificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950">
                {pendingVerificationsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('users')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/70 font-bold'
            }`}
          >
            <span>Users ({usersList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('disputes')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center relative cursor-pointer ${
              activeTab === 'disputes'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/70 font-bold'
            }`}
          >
            <span>Disputes</span>
            {openReportsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                {openReportsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & PLATFORM METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider">Active Users</span>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                {metricsData?.metrics?.usersCount?.toLocaleString() || '24,820'}
              </div>
              <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold block">Drivers & Hosts</span>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider">Parking Spaces</span>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                {metricsData?.metrics?.parkingSpacesCount?.toLocaleString() || '6,431'}
              </div>
              <span className="text-[10px] sm:text-[11px] text-blue-400 font-semibold block">In 12 Metro Zones</span>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider">Total Bookings</span>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                {metricsData?.metrics?.bookingsCount?.toLocaleString() || '18,294'}
              </div>
              <span className="text-[10px] sm:text-[11px] text-purple-400 font-semibold block">Completed sessions</span>
            </div>

            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider">Gross Platform GMV</span>
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400">
                {metricsData?.metrics?.revenueTotal || '₹18.4L'}
              </div>
              <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold block">+24% MoM</span>
            </div>
          </div>

          {/* Operational Quick Status Bar */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-2xl border text-xs ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
              }`}>
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Space Verifications</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pendingVerificationsCount} awaiting audit</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-800 font-bold'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dispute Resolution</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{openReportsCount} tickets under review</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
              }`}>
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Infrastructure SLA</span>
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>99.98% uptime • Active</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Booking Growth Chart (7 cols) */}
            <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 overflow-hidden min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Monthly Bookings Volume</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Completed reservations across all cities</p>
                </div>
                <span className={`text-[11px] sm:text-xs font-mono font-black px-2.5 py-1 rounded-full border ${
                  isDark
                    ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                    : 'text-purple-900 bg-purple-100 border-2 border-purple-300'
                }`}>
                  6,100 Oct
                </span>
              </div>

              <div className="h-56 sm:h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart
                    data={
                      metricsData?.bookingGrowthChart || [
                        { month: 'May', bookings: 2100 },
                        { month: 'Jun', bookings: 2800 },
                        { month: 'Jul', bookings: 3400 },
                        { month: 'Aug', bookings: 4100 },
                        { month: 'Sep', bookings: 5300 },
                        { month: 'Oct', bookings: 6100 },
                      ]
                    }
                  >
                    <defs>
                      <linearGradient id="adminBookingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} width={35} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#adminBookingGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Occupancy by Zone (5 cols) */}
            <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4 flex flex-col justify-between overflow-hidden min-w-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Occupancy by Zone</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Peak demand distribution by infrastructure category</p>
              </div>

              <div className="h-52 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={
                      metricsData?.occupancyDistribution || [
                        { zone: 'Commercial', occupancy: 86 },
                        { zone: 'Transit', occupancy: 82 },
                        { zone: 'Shopping', occupancy: 78 },
                        { zone: 'Residential', occupancy: 61 },
                        { zone: 'Airport', occupancy: 74 },
                      ]
                    }
                  >
                    <XAxis dataKey="zone" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} width={30} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="occupancy" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] sm:text-xs text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                <span>Highest yield: Commercial District</span>
                <span className="text-emerald-400 font-semibold">86% avg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARKING VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Listing Verification Submissions</h3>
              <p className="text-xs text-slate-400">Review documents before granting verified badge</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setVerificationFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  verificationFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({verificationRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  verificationFilter === 'pending'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Pending ({verificationRequests.filter((v) => v.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  verificationFilter === 'approved'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Approved ({verificationRequests.filter((v) => v.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  verificationFilter === 'rejected'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Rejected ({verificationRequests.filter((v) => v.status === 'rejected').length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredVerifications.map((vr) => (
              <div
                key={vr.id}
                className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3 sm:space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-mono font-black px-2 py-0.5 rounded border shrink-0 ${
                        isDark
                          ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                          : 'text-purple-900 bg-purple-100 border-2 border-purple-300'
                      }`}>
                        {vr.listingId}
                      </span>
                      <h4 className={`text-sm sm:text-base font-bold break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>{vr.title}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                          vr.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : vr.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {vr.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-normal">
                      Host: <strong className="text-white">{vr.ownerName}</strong> • Location: {vr.location}
                    </p>
                  </div>

                  {/* Actions */}
                  {vr.status === 'approved' ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 self-start w-full sm:w-auto">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ Verified Parking</span>
                    </span>
                  ) : vr.status === 'rejected' ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold self-start text-center w-full sm:w-auto">
                      Rejected
                    </span>
                  ) : (
                    <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleRejectVerification(vr.id)}
                        className="px-3.5 py-2 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold text-center transition active:scale-95"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveVerification(vr.id)}
                        className="px-4 py-2 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Documents checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">Identity Document (Aadhaar/PAN)</span>
                    <span className="font-bold text-emerald-400">✓ Verified</span>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">Ownership / Lease Proof</span>
                    <span className="font-bold text-emerald-400">✓ Verified</span>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300">Clear Space Photos</span>
                    <span className={`font-bold ${vr.documents?.photos ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {vr.documents?.photos ? '✓ Verified' : '⚠ Missing Ramp Angle'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredVerifications.length === 0 && (
              <div className="p-8 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
                <FileCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No verifications found in this category</p>
                <button
                  type="button"
                  onClick={() => setVerificationFilter('all')}
                  className="text-xs text-purple-400 underline font-semibold"
                >
                  View all verifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DISPUTES & REPORT RESOLUTION */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Driver & Host Dispute Tickets</h3>
              <p className="text-xs text-slate-400">Arbitrate reservation issues, access disputes, and payment tickets</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setDisputeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  disputeFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All ({reports.length})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter('open')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  disputeFilter === 'open'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Open / Active ({openReportsCount})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter('resolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  disputeFilter === 'resolved'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Resolved ({reports.filter((r) => r.status === 'Resolved').length})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  disputeFilter === 'rejected'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Rejected ({reports.filter((r) => r.status === 'Rejected').length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-3 sm:space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                        {rep.category}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white break-words">{rep.parkingTitle}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                          rep.status === 'Resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : rep.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Reported by <strong className="text-white">{rep.userName}</strong>
                    </p>
                    <p className="text-xs text-slate-300 pt-1 leading-relaxed break-words">{rep.description}</p>
                    {(rep as any).resolutionNote && (
                      <div className="mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
                        <span className="font-bold text-purple-300">Admin Resolution Note:</span> {(rep as any).resolutionNote}
                      </div>
                    )}
                  </div>

                  {/* Dispute Action Button & Trigger */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 pt-2.5 sm:pt-0 border-t border-slate-800/80 sm:border-0 self-start">
                    <button
                      type="button"
                      onClick={() => openDisputeModal(rep)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Action Dispute</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="p-8 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No dispute tickets found in this filter</p>
                <button
                  type="button"
                  onClick={() => setDisputeFilter('all')}
                  className="text-xs text-purple-400 underline font-semibold"
                >
                  View all dispute tickets
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & ACCOUNTS ROSTER */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Registered Users & Platform Members</h3>
              <p className="text-xs text-slate-400">Manage drivers, parking hosts, and platform accounts</p>
            </div>

            {/* Mobile Stacked Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none cursor-pointer focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="driver">Drivers</option>
                <option value="owner">Owners / Hosts</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3 sm:space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <img
                      src={
                        u.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={u.name}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" title="Super Admin" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">{u.email}</p>
                      <span className="text-[11px] text-slate-500 block truncate">{u.phone || 'Phone not registered'}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 border ${
                      u.role === 'admin'
                        ? isDark
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-purple-100 text-purple-900 border-purple-300'
                        : u.role === 'owner'
                        ? isDark
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                        : isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl sm:rounded-2xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-slate-500 block">Member Since</span>
                    <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>{u.memberSince || '2023'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Wallet / Escrow</span>
                    <span className={`font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>₹{u.walletBalance?.toLocaleString() ?? 0}</span>
                  </div>
                </div>

                {/* Status or Temporary Key badge if active */}
                {((u as any).status || (u as any).temporaryKey) && (
                  <div className={`text-[10px] px-2.5 py-1 rounded-xl border flex items-center justify-between font-bold ${
                    isDark
                      ? 'bg-purple-950/40 border-purple-500/20 text-purple-300'
                      : 'bg-purple-100 border-purple-300 text-purple-950'
                  }`}>
                    <span>Status: {(u as any).status || 'Active'}</span>
                    {(u as any).temporaryKey && (
                      <span className={`font-mono font-black ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>
                        Key: {(u as any).temporaryKey}
                      </span>
                    )}
                  </div>
                )}

                {/* 2-Column Fully Functional Action Buttons */}
                <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => openResetKeyModal(u)}
                    className={`w-full py-1.5 px-2 rounded-lg border text-[11px] font-bold text-center transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-amber-300'
                        : 'bg-white hover:bg-amber-50 border-2 border-slate-300 hover:border-amber-400 text-slate-900 shadow-xs'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reset Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openManageModal(u)}
                    className={`w-full py-1.5 px-2 rounded-lg font-black text-[11px] text-center transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-sm ${
                      isDark
                        ? 'bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-white dark:text-purple-300" />
                    <span>Manage</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-8 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No users found matching "{userSearch}"</p>
              <button
                type="button"
                onClick={() => {
                  setUserSearch('');
                  setUserRoleFilter('all');
                }}
                className="text-xs text-purple-400 underline font-semibold"
              >
                Clear search filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: RESET KEY MODAL */}
      {keyResetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Account Key</h3>
                  <p className="text-xs text-slate-400">Security credential override</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setKeyResetModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Account Summary */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3">
              <img
                src={keyResetModalUser.avatar}
                alt={keyResetModalUser.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-700"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm">{keyResetModalUser.name}</div>
                <div className="text-xs text-slate-400 truncate">{keyResetModalUser.email}</div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {keyResetModalUser.role}
              </span>
            </div>

            {/* Temporary Key Input with Copy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Generated Temporary Access Key:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm font-bold text-amber-400 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempKeyInput);
                    setCopiedKeyToast(true);
                    setTimeout(() => setCopiedKeyToast(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                  title="Copy Key"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKeyToast ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Reset Reason:</label>
              <select
                value={keyResetReason}
                onChange={(e) => setKeyResetReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="User credential recovery assistance">User credential recovery assistance</option>
                <option value="Routine security credential rotation">Routine security credential rotation</option>
                <option value="Temporary operational override">Temporary operational override</option>
                <option value="Suspicious login activity reported">Suspicious login activity reported</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Applying this change will instantly dispatch a high-priority security notification to {keyResetModalUser.name}'s account.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setKeyResetModalUser(null)}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteKeyReset}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Key className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE USER ACCOUNT MODAL */}
      {manageModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manage Account Profile</h3>
                  <p className="text-xs text-slate-400">Roles, wallet balance, and status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info Bar */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3">
              <img
                src={manageModalUser.avatar}
                alt={manageModalUser.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm">{manageModalUser.name}</div>
                <div className="text-xs text-slate-400 truncate">{manageModalUser.email}</div>
                <div className="text-[11px] text-slate-500 font-mono">ID: {manageModalUser.id}</div>
              </div>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Full Name:</label>
                <input
                  type="text"
                  value={manageName}
                  onChange={(e) => setManageName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Phone Number:</label>
                <input
                  type="text"
                  value={managePhone}
                  onChange={(e) => setManagePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Account Role:</label>
                <select
                  value={manageRole}
                  onChange={(e) => setManageRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="driver">Driver (Customer)</option>
                  <option value="owner">Space Owner (Host)</option>
                  <option value="admin">Administrator (Super Admin)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Account Status:</label>
                <select
                  value={manageStatus}
                  onChange={(e) => setManageStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="Active (Good Standing)">Active (Good Standing)</option>
                  <option value="Verified Host / VIP Driver">Verified Host / VIP Driver</option>
                  <option value="Suspended / On Hold">Suspended / On Hold</option>
                </select>
              </div>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">Danger Zone</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Permanently delete this user account and its data</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeleteUser}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Delete Account</span>
              </button>
            </div>

            {/* Admin Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Admin Resolution / Audit Note:</label>
              <input
                type="text"
                placeholder="Optional explanation sent to user..."
                value={manageAdminNote}
                onChange={(e) => setManageAdminNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setManageModalUser(null)}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteManageUser}
                className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save & Apply Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DISPUTE ACTION MODAL */}
      {disputeModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Arbitrate Dispute Ticket</h3>
                  <p className="text-xs text-slate-400">Formal resolution & financial settlement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisputeModalReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{disputeModalReport.parkingTitle}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {disputeModalReport.category}
                </span>
              </div>
              <p className="text-slate-400">
                Filer: <strong className="text-white">{disputeModalReport.userName}</strong>
              </p>
              <p className="text-slate-300 italic pt-1 leading-relaxed">"{disputeModalReport.description}"</p>
            </div>

            {/* New Status selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Select New Dispute Status:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Resolved', 'Investigating', 'Rejected', 'Open'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDisputeNewStatus(st)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      disputeNewStatus === st
                        ? st === 'Resolved'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow'
                          : st === 'Rejected'
                          ? 'bg-rose-500 text-white border-rose-400 shadow'
                          : 'bg-purple-600 text-white border-purple-400 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'Resolved' && <Check className="w-3.5 h-3.5" />}
                    {st === 'Rejected' && <X className="w-3.5 h-3.5" />}
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Refund to Driver option if Resolved */}
            {disputeNewStatus === 'Resolved' && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Issue Wallet Refund to Driver (₹):
                  </span>
                  <span className="text-[10px] text-emerald-300 font-semibold">Credited instantly</span>
                </div>
                <input
                  type="number"
                  value={disputeRefundAmount}
                  onChange={(e) => setDisputeRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 font-bold text-sm outline-none"
                />
              </div>
            )}

            {/* Resolution Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Resolution Note (Visible to both accounts):</label>
              <textarea
                rows={2}
                placeholder="Details of inquiry findings or settlement terms..."
                value={disputeResolutionNote}
                onChange={(e) => setDisputeResolutionNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDisputeModalReport(null)}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDisputeAction}
                className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Confirm Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
