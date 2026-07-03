import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatCurrency';
import { createStripeSession, confirmStripeSession } from '../lib/api';
import { Wallet, CreditCard, DollarSign, Calendar, Info, RefreshCw, Sparkles, Send, Loader2, Zap, ShieldCheck, ChevronLeft, ChevronRight, Filter, Search, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Award, Copy, Check, ExternalLink, Timer, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonusText?: string;
  badge?: string;
  colorClass: string;
  glowClass: string;
  btnColor: string;
}

const creditPackages: CreditPackage[] = [
  {
    id: 'value',
    name: 'Value Pack',
    price: 25,
    credits: 26.50,
    bonusText: 'Includes $1.50 Bonus Credits',
    badge: 'Popular',
    colorClass: 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50',
    glowClass: 'bg-cyan-500/10',
    btnColor: 'bg-cyan-500 text-black hover:bg-cyan-400',
  },
  {
    id: 'streamer',
    name: 'Ultra Stream Pack',
    price: 50,
    credits: 54.00,
    bonusText: 'Includes $4.00 Bonus Credits',
    badge: 'Best Value',
    colorClass: 'border-orange-500/40 bg-orange-500/5 hover:border-orange-500/60 ring-1 ring-orange-500/20',
    glowClass: 'bg-orange-500/10',
    btnColor: 'bg-orange-500 text-black hover:bg-orange-400',
  },
  {
    id: 'chaos',
    name: 'Chaos Master',
    price: 100,
    credits: 110.00,
    bonusText: 'Includes $10.00 Bonus Credits',
    badge: 'Huge Bonus',
    colorClass: 'border-[#FF3DF5]/30 bg-[#FF3DF5]/5 hover:border-[#FF3DF5]/50',
    glowClass: 'bg-[#FF3DF5]/10',
    btnColor: 'bg-[#FF3DF5] text-black hover:bg-magenta-400',
  },
  {
    id: 'sovereign',
    name: 'Void Sovereign',
    price: 250,
    credits: 280.00,
    bonusText: 'Includes $30.00 Bonus Credits',
    badge: 'Whale Deal',
    colorClass: 'border-[#8A3DFF]/40 bg-[#8A3DFF]/5 hover:border-[#8A3DFF]/60',
    glowClass: 'bg-[#8A3DFF]/10',
    btnColor: 'bg-[#8A3DFF] text-white hover:bg-violet-400',
  }
];

export default function WalletPage() {
  const { profile, refreshProfile } = useAuthStore();
  const { transactions, isLoading, fetchTransactions, depositFunds } = useWalletStore();

  const [depositAmount, setDepositAmount] = useState('25');
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination & Filtering state
  const [filterType, setFilterType] = useState<'all' | 'deposits' | 'unboxes' | 'sales' | 'gaming'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (profile?.id) {
      fetchTransactions(profile.id);
    }
  }, [profile?.id]);

  // Listen for Stripe messages from popup windows
  useEffect(() => {
    const handleStripeMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'STRIPE_SUCCESS_MESSAGE') {
        const { session_id, amount } = event.data;
        if (profile?.id && session_id) {
          setIsProcessing(true);
          const parsedAmount = amount ? parseFloat(amount) : undefined;
          try {
            toast.loading("Verifying checkout session with Stripe...", { id: "stripe-verify" });
            const res = await confirmStripeSession(profile.id, session_id, parsedAmount);
            toast.dismiss("stripe-verify");
            if (res.success) {
              toast.success(`Stripe deposit of ${formatCurrency(res.amount)} credited successfully!`, {
                icon: '💳',
                duration: 5000,
              });
              refreshProfile();
              fetchTransactions(profile.id);
            }
          } catch (err: any) {
            toast.dismiss("stripe-verify");
            toast.error(err.message || "Failed to verify Stripe session");
          } finally {
            setIsProcessing(false);
          }
        }
      } else if (event.data?.type === 'STRIPE_CANCELED') {
        toast.error("Stripe payment was canceled.");
      }
    };

    window.addEventListener('message', handleStripeMessage);
    return () => {
      window.removeEventListener('message', handleStripeMessage);
    };
  }, [profile?.id]);

  // Handle URL callback logic for self-verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const amountStr = params.get('amount');
    const canceled = params.get('canceled');

    const verifySession = async () => {
      if (sessionId && profile?.id) {
        // If we are running inside a popup/new tab, post a message back to window.opener
        if (window.opener) {
          try {
            window.opener.postMessage({
              type: 'STRIPE_SUCCESS_MESSAGE',
              session_id: sessionId,
              amount: amountStr
            }, '*');
            toast.success("Deposit processed successfully! Syncing browser window...", { duration: 3000 });
            setTimeout(() => {
              window.close();
            }, 1000);
            return;
          } catch (e) {
            console.error("Failed to post success message to opener", e);
          }
        }

        const parsedAmount = amountStr ? parseFloat(amountStr) : undefined;
        setIsProcessing(true);
        try {
          toast.loading("Verifying checkout session with Stripe...", { id: "stripe-verify" });
          const res = await confirmStripeSession(profile.id, sessionId, parsedAmount);
          toast.dismiss("stripe-verify");
          if (res.success) {
            toast.success(`Stripe deposit of ${formatCurrency(res.amount)} credited successfully!`, {
              icon: '💳',
              duration: 5000,
            });
            refreshProfile();
            fetchTransactions(profile.id);
          }
        } catch (err: any) {
          toast.dismiss("stripe-verify");
          toast.error(err.message || "Failed to verify Stripe session");
        } finally {
          setIsProcessing(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (canceled) {
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'STRIPE_CANCELED' }, '*');
            setTimeout(() => {
              window.close();
            }, 1000);
            return;
          } catch (e) {}
        }
        toast.error("Stripe payment was canceled.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    verifySession();
  }, [profile?.id]);

  const handleStripeRedirect = (url: string) => {
    // Open checkout in a new window/tab to prevent iframe embedding constraints
    const popup = window.open(url, "stripe_checkout", "width=850,height=850,scrollbars=yes,status=yes");
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      toast.warning("Popup blocked! Directing within active browser window...", { duration: 4000 });
      try {
        window.top!.location.href = url;
      } catch (e) {
        window.location.href = url;
      }
    }
  };

  const handlePurchasePackage = async (pack: CreditPackage) => {
    if (!profile) return toast.error("Please login first to purchase a package");
    
    setIsProcessing(true);
    try {
      toast.loading(`Initiating secure Stripe Checkout for ${pack.name}...`, { id: "stripe-init" });
      const res = await createStripeSession(profile.id, pack.price, pack.credits);
      toast.dismiss("stripe-init");
      toast.success(res.isMock ? "Opening Sandbox Checkout popup..." : "Opening Stripe Checkout popup...");
      handleStripeRedirect(res.url);
    } catch (err: any) {
      toast.dismiss("stripe-init");
      toast.error(err.message || `Failed to initiate checkout for ${pack.name}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error("Please login first to deposit");

    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed < 20) {
      return toast.error("Minimum deposit value is $20.00");
    }

    setIsProcessing(true);
    try {
      toast.loading("Initiating secure Stripe Billing checkout...", { id: "stripe-init" });
      const res = await createStripeSession(profile.id, parsed);
      toast.dismiss("stripe-init");
      toast.success(res.isMock ? "Opening Sandbox Checkout popup..." : "Opening Stripe Checkout popup...");
      handleStripeRedirect(res.url);
    } catch (err: any) {
      toast.dismiss("stripe-init");
      toast.error(err.message || "Failed to initiate Stripe billing session");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center text-white/40 max-w-lg mx-auto bg-white/5 border border-white/10 rounded-2xl my-12" id="wallet-not-logged-in">
        <Wallet className="h-12 w-12 text-white/20 mb-4 animate-bounce" />
        <h2 className="text-lg font-black uppercase text-white mb-1">Secure Wallet Portal</h2>
        <p className="text-xs text-white/50 mb-6">Connect your profile account to access credit purchasing gateways, and physical transaction histories.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="rounded-lg bg-orange-500 text-black font-sans font-black text-xs uppercase px-6 py-3 cursor-pointer hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
        >
          Authenticate Profile
        </button>
      </div>
    );
  }

  // Filter financial activity list
  const filteredTxs = transactions.filter(tx => {
    // 1. Filter by category
    if (filterType === 'deposits' && tx.type !== 'deposit') return false;
    if (filterType === 'unboxes' && tx.type !== 'unbox') return false;
    if (filterType === 'sales') {
      const isSaleRelated = tx.type === 'sell' || tx.type === 'upgrade_win' || tx.type === 'upgrade_loss';
      if (!isSaleRelated) return false;
    }
    if (filterType === 'gaming') {
      const isGameRelated = tx.type === 'bingo_buy' || tx.type === 'bingo_win' || tx.type === 'lottery_buy' || tx.type === 'lottery_win' || tx.type === 'battle_win';
      if (!isGameRelated) return false;
    }

    // 2. Filter by search term
    if (searchTerm) {
      const desc = tx.description.toLowerCase();
      const type = tx.type.toLowerCase();
      const s = searchTerm.toLowerCase();
      return desc.includes(s) || type.includes(s);
    }

    return true;
  });

  // Pagination math
  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTxs.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset pagination when filter changes
  const handleFilterChange = (type: typeof filterType) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  // Wallet high-level aggregated calculations
  const totalDeposited = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalUnboxed = transactions
    .filter(t => t.type === 'unbox')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSales = transactions
    .filter(t => t.type === 'sell')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in" id="wallet-page-container">
      
      {/* Wallet overview stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-orange-500/20 hover:scale-[1.01] hover:shadow-lg hover:shadow-orange-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="block text-[9px] font-sans font-black uppercase text-white/40 tracking-widest">Active Coin Balance</span>
            <span className="block text-2xl font-mono font-black text-white mt-1.5">{formatCurrency(profile.balance)}</span>
          </div>
          <div className="flex items-center space-x-1 text-[9px] font-sans font-black text-orange-400 mt-4 tracking-wider uppercase">
            <Zap className="h-3 w-3 animate-pulse" />
            <span>INSTANT LIQUIDATION APPROVED</span>
          </div>
        </div>

        {/* Aggregated Deposits Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-emerald-500/20 hover:scale-[1.01] hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="block text-[9px] font-sans font-black uppercase text-white/40 tracking-widest">Aggregate Deposits</span>
            <span className="block text-2xl font-mono font-black text-emerald-400 mt-1.5">{formatCurrency(totalDeposited)}</span>
          </div>
          <div className="flex items-center space-x-1 text-[9px] font-sans font-black text-emerald-500 mt-4 tracking-wider uppercase">
            <ArrowDownLeft className="h-3 w-3" />
            <span>Total Secured Inflow</span>
          </div>
        </div>

        {/* Aggregated Unboxes Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-red-500/20 hover:scale-[1.01] hover:shadow-lg hover:shadow-red-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="block text-[9px] font-sans font-black uppercase text-white/40 tracking-widest">Total Spent Unboxing</span>
            <span className="block text-2xl font-mono font-black text-red-400 mt-1.5">{formatCurrency(totalUnboxed)}</span>
          </div>
          <div className="flex items-center space-x-1 text-[9px] font-sans font-black text-red-500 mt-4 tracking-wider uppercase">
            <ArrowUpRight className="h-3 w-3" />
            <span>Unboxing Outflow Value</span>
          </div>
        </div>

        {/* Aggregated Sales Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-[#FF3DF5]/20 hover:scale-[1.01] hover:shadow-lg hover:shadow-[#FF3DF5]/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="block text-[9px] font-sans font-black uppercase text-white/40 tracking-widest">Total Recouped Sales</span>
            <span className="block text-2xl font-mono font-black text-[#FF3DF5] mt-1.5">{formatCurrency(totalSales)}</span>
          </div>
          <div className="flex items-center space-x-1 text-[9px] font-sans font-black text-pink-400 mt-4 tracking-wider uppercase">
            <Award className="h-3 w-3" />
            <span>Instant Liquidation Return</span>
          </div>
        </div>
      </div>

      {/* Credit Package Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Select Surge Credits Package</h3>
            <p className="text-xs text-white/40">Secure instant credit loads with bonus parameters configured directly by SurgeBox Ultra servers.</p>
          </div>
          <span className="rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-sans font-bold text-[9px] tracking-widest px-2.5 py-1">
            SECURE CHECKOUTS SECURED BY STRIPE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {creditPackages.map(pack => (
            <div 
              key={pack.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${pack.colorClass} group`}
            >
              {/* Blur accent */}
              <div className={`absolute -right-6 -top-6 h-16 w-16 rounded-full ${pack.glowClass} blur-xl transition-all duration-300 group-hover:scale-125`}></div>

              <div className="space-y-2 relative">
                {pack.badge && (
                  <span className="inline-block rounded bg-orange-500 text-black font-sans font-black text-[7px] uppercase tracking-wider px-1.5 py-0.5">
                    {pack.badge}
                  </span>
                )}
                <h4 className="text-xs font-black uppercase text-white/60 tracking-wider font-sans leading-tight">{pack.name}</h4>
                <div className="space-y-0.5">
                  <span className="block text-xl font-mono font-black text-white">{formatCurrency(pack.credits)}</span>
                  <span className="block text-[10px] font-mono text-white/40">Cost: {formatCurrency(pack.price)}</span>
                </div>
              </div>

              <div className="space-y-2 relative">
                {pack.bonusText && (
                  <p className="text-[9px] font-mono font-bold text-emerald-400 leading-tight">
                    {pack.bonusText}
                  </p>
                )}
                <button
                  disabled={isProcessing}
                  onClick={() => handlePurchasePackage(pack)}
                  className={`w-full py-2 text-center rounded-lg font-sans font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${pack.btnColor}`}
                >
                  BUY NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main transaction management block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left side: deposit gateway */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
            <CreditCard className="h-4.5 w-4.5 text-orange-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Secure Deposit Gateways
            </h3>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Pre-Set Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['25', '50', '100', '250'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val)}
                    className={`rounded-lg border py-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                      depositAmount === val 
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                        : 'border-white/10 text-white/40 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Custom Deposit Amount ($)
              </label>
              <input
                type="number"
                min="20"
                max="5000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                placeholder="50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 py-3 font-sans text-xs font-black uppercase tracking-wider text-black hover:bg-orange-400 transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              <Send className="h-3.5 w-3.5 text-black" />
              <span>{isProcessing ? "PROCESSING SECURE GATEWAY..." : `SECURE DEPOSIT ${formatCurrency(parseFloat(depositAmount) || 0)}`}</span>
            </button>
          </form>
        </div>

        {/* Right side: Detailed ledger (paginated, searchable, filterable) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5 shadow-xl relative">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                Financial Transparency Ledger
              </h3>
              <p className="text-xs text-white/40 font-mono">
                Showing {filteredTxs.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTxs.length)} of {filteredTxs.length} activity items.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500"
                placeholder="Search description..."
              />
            </div>
          </div>

          {/* Filter Tab Row */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'deposits', label: 'Deposits' },
              { id: 'unboxes', label: 'Unboxing Drops' },
              { id: 'sales', label: 'Sales & Upgrades' },
              { id: 'gaming', label: 'Arena Games' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  filterType === tab.id 
                    ? 'bg-orange-500 text-black border-orange-500 font-black' 
                    : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="flex justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          )}

          {!isLoading && filteredTxs.length === 0 && (
            <div className="text-center py-24 font-mono text-white/30 text-xs rounded-xl border border-dashed border-white/5 bg-black/20">
              No ledger transactions found matching filters.
            </div>
          )}

          {!isLoading && filteredTxs.length > 0 && (
            <div className="space-y-2">
              {currentItems.map(tx => {
                const isPositive = tx.amount >= 0;
                
                // Set color schemes based on the transaction category
                let cardStyle = "border-white/5 bg-black/40 hover:border-white/10";
                let textSign = "text-orange-500";
                let BadgeStyle = "bg-white/5 border-white/10 text-white/60";
                let iconEl = <TrendingUp className="h-3.5 w-3.5 text-orange-500 shrink-0" />;

                if (tx.type === 'deposit' || tx.type === 'sell' || tx.type === 'upgrade_win' || tx.type === 'bingo_win' || tx.type === 'lottery_win' || tx.type === 'battle_win') {
                  textSign = "text-emerald-400";
                  cardStyle = "border-emerald-500/5 bg-emerald-500/[0.02] hover:border-emerald-500/10";
                  BadgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  iconEl = <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
                } else if (tx.type === 'unbox' || tx.type === 'upgrade_loss' || tx.type === 'bingo_buy' || tx.type === 'lottery_buy' || tx.type === 'shipping_fee') {
                  textSign = "text-red-400";
                  cardStyle = "border-red-500/5 bg-red-500/[0.02] hover:border-red-500/10";
                  BadgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                  iconEl = <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />;
                }

                return (
                  <div 
                    key={tx.id}
                    className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 ${cardStyle}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {iconEl}
                      <div className="text-[10px] text-white/40 shrink-0">
                        <span className="block">{new Date(tx.created_at).toLocaleDateString()}</span>
                        <span className="block mt-0.5">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <span className="block text-white font-bold leading-tight uppercase truncate">{tx.description}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className={`inline-block rounded px-1.5 py-0.2 text-[8px] font-sans font-black uppercase tracking-wider border ${BadgeStyle}`}>
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0 pl-3">
                      <span className={`font-mono font-black text-sm ${textSign}`}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4 font-sans text-xs">
              <span className="text-white/40">
                Page <strong className="text-white/60">{currentPage}</strong> of <strong className="text-white/60">{totalPages}</strong>
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg p-2 border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-2 border border-white/10 bg-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
