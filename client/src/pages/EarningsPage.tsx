import React, { useState, useEffect } from 'react';
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

export const EarningsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payouts, setPayouts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalEarnings: 24860,
    thisMonth: 8420,
    pendingPayout: 2100,
    paidOut: 22760,
  });
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string>('');

  useEffect(() => {
    const loadPayouts = async () => {
      try {
        const res = await api.getOwnerPayouts();
        if (res.success) {
          setPayouts(res.data);
          if (res.summary) setSummary(res.summary);
        }
      } catch {
        // Fallback
      }
    };
    loadPayouts();
  }, []);

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

  const monthlyGrowth = [
    { month: 'Jun', amount: 3400 },
    { month: 'Jul', amount: 4800 },
    { month: 'Aug', amount: 6200 },
    { month: 'Sep', amount: 7900 },
    { month: 'Oct', amount: 8420 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/owner')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Host Overview</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Finance & Settlements
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Earnings & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated direct deposits deposited weekly into your registered bank account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownloadStatement}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Statement (CSV)</span>
          </button>

          {summary.pendingPayout > 0 && (
            <button
              type="button"
              disabled={isRequesting}
              onClick={handleRequestPayout}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <DollarSign className="w-4 h-4" />
              <span>{isRequesting ? 'Transferring...' : `Withdraw ₹${summary.pendingPayout}`}</span>
            </button>
          )}
        </div>
      </div>

      {payoutSuccessMsg && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {/* Top 4 Metrics (Requirement 25) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Earnings</span>
          <div className="text-xl sm:text-3xl font-black text-white">₹{summary.totalEarnings.toLocaleString()}</div>
          <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold block truncate">Lifetime revenue</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">This Month</span>
          <div className="text-xl sm:text-3xl font-black text-emerald-400">₹{summary.thisMonth.toLocaleString()}</div>
          <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +18% vs Sep
          </span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pending Payout</span>
          <div className="text-xl sm:text-3xl font-black text-amber-400">₹{summary.pendingPayout.toLocaleString()}</div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Due Friday</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Paid Out</span>
          <div className="text-xl sm:text-3xl font-black text-white">₹{summary.paidOut.toLocaleString()}</div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Settled to bank</span>
        </div>
      </div>

      {/* Monthly Revenue Trend Area Chart */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Earnings Growth</h3>
            <p className="text-xs text-slate-400">Gross revenue generated across all parking spaces</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Consecutive Monthly Growth
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
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
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
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Settlement History</h3>

          <div className="divide-y divide-slate-800/80">
            {payouts.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>₹{item.amount.toLocaleString()}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-400">{item.method}</p>
                </div>
                <span className="text-slate-500 font-mono">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Settlement Bank Account (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Linked Bank</h3>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Bank Name</span>
              <span className="text-sm font-bold text-white">HDFC Bank Ltd</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Account Number</span>
              <span className="font-mono text-white text-xs">•••• •••• •••• 4921</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">IFSC Code</span>
              <span className="font-mono text-emerald-400 text-xs font-semibold">HDFC0000245</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bank account verified for instant automated NEFT / IMPS payouts.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
