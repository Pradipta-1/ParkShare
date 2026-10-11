import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  CreditCard,
  Building,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const EarningsPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payouts, setPayouts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalEarnings: 0,
    thisMonth: 0,
    pendingPayout: 0,
    paidOut: 0,
  });
  const [monthlyGrowth, setMonthlyGrowth] = useState<any[]>([]);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string>('');

  const loadPayouts = async () => {
    try {
      const res = await api.getOwnerPayouts();
      const localBookingsRaw: any[] = JSON.parse(
        localStorage.getItem('parkshare_custom_bookings') || '[]'
      );
      const cancelledIds: string[] = JSON.parse(
        localStorage.getItem('parkshare_cancelled_booking_ids') || '[]'
      );

      // Merge any server bookings with local bookings
      const serverPayouts = (res.success && Array.isArray(res.data)) ? res.data : [];
      let combined = [...localBookingsRaw];

      const validBookings = combined.filter(
        (b) =>
          b.bookingStatus !== 'cancelled' &&
          !cancelledIds.includes(b.id) &&
          !(b.bookingCode && cancelledIds.includes(b.bookingCode))
      );

      const totalEarnings = validBookings.reduce(
        (sum, b) => sum + (b.subtotal || b.totalAmount || 0),
        0
      );

      const paidOut = serverPayouts
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const pendingPayout = Math.max(0, totalEarnings - paidOut);

      // Dynamic trailing 5 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const trailingMonths: { month: string; year: number; monthIdx: number }[] = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        trailingMonths.push({
          month: monthNames[d.getMonth()],
          year: d.getFullYear(),
          monthIdx: d.getMonth(),
        });
      }

      const dynamicMonthlyGrowth = trailingMonths.map(({ month, year, monthIdx }) => {
        const list = validBookings.filter((b) => {
          const d = new Date(b.date);
          if (isNaN(d.getTime())) return false;
          return d.getMonth() === monthIdx && d.getFullYear() === year;
        });
        return {
          month,
          amount: list.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0),
          bookings: list.length,
        };
      });

      const thisMonth =
        dynamicMonthlyGrowth[dynamicMonthlyGrowth.length - 1]?.amount || totalEarnings;

      setSummary({
        totalEarnings,
        thisMonth,
        pendingPayout,
        paidOut,
      });

      if (dynamicMonthlyGrowth.some((m) => m.amount > 0)) {
        setMonthlyGrowth(dynamicMonthlyGrowth);
      } else if (res.summary?.monthlyGrowth) {
        setMonthlyGrowth(res.summary.monthlyGrowth);
      } else {
        setMonthlyGrowth(dynamicMonthlyGrowth);
      }

      // Live settlement line items from real driver bookings
      const bookingSettlements = validBookings.map((b) => ({
        id: b.id || b.transactionId,
        amount: b.subtotal || b.totalAmount,
        status: 'completed',
        date: b.date,
        method: `${b.parkingTitle} (${b.spotNumber || 'Bay Assigned'}) • ${b.arrivalTime || '02:00 PM'}`,
        bookingCode: b.bookingCode,
      }));

      const finalPayouts =
        bookingSettlements.length > 0 ? bookingSettlements : serverPayouts;
      setPayouts(finalPayouts);
    } catch {
      // Offline fallback
      try {
        const localBookings: any[] = JSON.parse(
          localStorage.getItem('parkshare_custom_bookings') || '[]'
        );
        const cancelledIds: string[] = JSON.parse(
          localStorage.getItem('parkshare_cancelled_booking_ids') || '[]'
        );
        const valid = localBookings.filter(
          (b) => b.bookingStatus !== 'cancelled' && !cancelledIds.includes(b.id)
        );
        const total = valid.reduce((sum, b) => sum + (b.subtotal || b.totalAmount || 0), 0);
        setSummary((prev: any) => ({ ...prev, totalEarnings: total, thisMonth: total }));
      } catch {}
    }
  };

  useEffect(() => {
    loadPayouts();
    const handleSync = () => loadPayouts();
    window.addEventListener('parkshare_booking_created', handleSync);
    window.addEventListener('parkshare_booking_cancelled', handleSync);
    window.addEventListener('parkshare_space_created', handleSync);
    window.addEventListener('parkshare_spots_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('parkshare_booking_created', handleSync);
      window.removeEventListener('parkshare_booking_cancelled', handleSync);
      window.removeEventListener('parkshare_space_created', handleSync);
      window.removeEventListener('parkshare_spots_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const growthComparison = useMemo(() => {
    if (!monthlyGrowth || monthlyGrowth.length < 2) {
      return { diffText: 'Live tracking', isPositive: true };
    }
    const current = monthlyGrowth[monthlyGrowth.length - 1];
    const prev = monthlyGrowth[monthlyGrowth.length - 2];
    if (!prev || prev.amount === 0) {
      return { diffText: 'Live revenue', isPositive: true };
    }
    const pct = Math.round(((current.amount - prev.amount) / prev.amount) * 100);
    const sign = pct >= 0 ? '+' : '';
    return {
      diffText: `${sign}${pct}% vs ${prev.month}`,
      isPositive: pct >= 0,
    };
  }, [monthlyGrowth]);

  const handleRequestPayout = async () => {
    setIsRequesting(true);
    try {
      const res = await api.requestPayout(summary.pendingPayout || 2100);
      if (res.success) {
        setPayouts([res.data, ...payouts]);
        setSummary({ ...summary, pendingPayout: 0, paidOut: summary.paidOut + (summary.pendingPayout || 2100) });
        setPayoutSuccessMsg('Payout transfer initiated to linked HDFC Bank account!');
        setTimeout(() => setPayoutSuccessMsg(''), 4000);
      }
    } catch {
      // Ignore
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDownloadStatement = () => {
    const csvContent = "data:text/csv;charset=utf-8,Date,TransactionID,Description,Amount,Status\n2026-10-06,TXN-9021839210,Central Avenue Spot P24,120,Completed\n2026-10-05,TXN-883192001,Metro Station Hub Spot M08,105,Completed\n2026-10-04,TXN-771829104,Airport Express Bay A02,240,Completed";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ParkShare_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/owner')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all group shadow-sm cursor-pointer ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-emerald-500/40'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-500 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Host Overview</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
            Finance & Settlements
          </span>
          <h1 className={`text-xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Earnings & Payouts
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Automated direct deposits deposited weekly into your registered bank account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadStatement}
            className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Statement (CSV)</span>
          </button>

          {summary.pendingPayout > 0 && (
            <button
              type="button"
              disabled={isRequesting}
              onClick={handleRequestPayout}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-50"
            >
              <DollarSign className="w-4 h-4" />
              <span>{isRequesting ? 'Transferring...' : `Withdraw ₹${summary.pendingPayout}`}</span>
            </button>
          )}
        </div>
      </div>

      {payoutSuccessMsg && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {/* Top 4 Metrics (Requirement 25) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border space-y-1 ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Earnings</span>
          <div className={`text-xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{summary.totalEarnings.toLocaleString()}</div>
          <span className="text-[10px] sm:text-[11px] text-emerald-500 font-semibold block truncate">Lifetime revenue</span>
        </div>

        <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border space-y-1 ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This Month</span>
          <div className="text-xl sm:text-3xl font-black text-emerald-500">₹{summary.thisMonth.toLocaleString()}</div>
          <span className={`text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 ${
            growthComparison.isPositive ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            <ArrowUpRight className={`w-3 h-3 ${growthComparison.isPositive ? '' : 'rotate-90'}`} />
            {growthComparison.diffText}
          </span>
        </div>

        <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border space-y-1 ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pending Payout</span>
          <div className="text-xl sm:text-3xl font-black text-amber-500">₹{summary.pendingPayout.toLocaleString()}</div>
          <span className={`text-[10px] sm:text-[11px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Due Friday</span>
        </div>

        <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border space-y-1 ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Paid Out</span>
          <div className={`text-xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{summary.paidOut.toLocaleString()}</div>
          <span className={`text-[10px] sm:text-[11px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Settled to bank</span>
        </div>
      </div>

      {/* Monthly Revenue Trend Area Chart */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Earnings Growth</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross revenue generated across all parking spaces</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {monthlyGrowth.length > 0
              ? `${monthlyGrowth[monthlyGrowth.length - 1].month}: ₹${(monthlyGrowth[monthlyGrowth.length - 1].amount || 0).toLocaleString()}`
              : 'Live Monthly Velocity'}
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyGrowth}>
              <defs>
                <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
              <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: isDark ? '#ffffff' : '#0f172a',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#payoutGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payout History & Bank Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payout History Table (8 cols) */}
        <div className={`lg:col-span-8 p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Settlement History</h3>

          <div className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
            {payouts.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>₹{item.amount.toLocaleString()}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{item.method}</p>
                </div>
                <span className={`font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Settlement Bank Account (4 cols) */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-500" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Linked Bank</h3>
          </div>

          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Bank Name</span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>HDFC Bank Ltd</span>
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Account Number</span>
              <span className={`font-mono text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>•••• •••• •••• 4921</span>
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>IFSC Code</span>
              <span className="font-mono text-emerald-500 text-xs font-semibold">HDFC0000245</span>
            </div>
          </div>

          <div className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Bank account verified for instant automated NEFT / IMPS payouts.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
