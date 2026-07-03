import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatCurrency';
import { createStripeSession, confirmStripeSession } from '../lib/api';
import { Wallet, CreditCard, DollarSign, Calendar, Info, RefreshCw, Sparkles, Send, Loader2, Zap, ShieldCheck } from 'lucide-react';
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

export default function Transactions() {
  const { profile, refreshProfile } = useAuthStore();
  const { transactions, isLoading, fetchTransactions, depositFunds } = useWalletStore();

  const [depositAmount, setDepositAmount] = useState('50');
  const [depositMethod, setDepositMethod] = useState<'Credit Card' | 'PayPal' | 'Crypto'>('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);

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
          const res = await confirmStripeSession(profile.id, sessionId, parsedAmount);
          if (res.success) {
            toast.success(`Stripe deposit of ${formatCurrency(res.amount)} credited successfully!`, {
              icon: '💳',
              duration: 5000,
            });
            refreshProfile();
            fetchTransactions(profile.id);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to verify Stripe session");
        } finally {
          setIsProcessing(false);
          // Strip URL query parameters
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
    // Open checkout in a new window/tab to prevent iframe embedding constraints (X-Frame-Options: deny)
    const popup = window.open(url, "stripe_checkout", "width=850,height=850,scrollbars=yes,status=yes");
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Fallback to current tab if popup is blocked
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
    if (!profile) return toast.error("Please login first to top up");

    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) {
      return toast.error("Please specify a valid positive deposit amount.");
    }

    if (depositMethod === 'Credit Card') {
      if (parsed < 20) {
        return toast.error("Minimum Stripe deposit amount is $20.00.");
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
    } else {
      setIsProcessing(true);
      try {
        const res = await depositFunds(profile.id, parsed, depositMethod);
        toast.success(res.message);
        setDepositAmount('50');
        refreshProfile();
      } catch (err: any) {
        toast.error("Deposit processing failed");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Wallet balance display card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <Wallet className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Financial Wallet & Ledger</h2>
          </div>
          <p className="text-xs text-white/60">
            Secure virtual currency top-ups and complete audited history logs.
          </p>
        </div>

        <div className="flex flex-col md:items-end">
          <span className="font-sans text-[10px] uppercase text-white/40 tracking-widest font-bold leading-none">Wallet Balance</span>
          <span className="font-mono text-2xl font-black text-orange-500 mt-2 leading-none">
            {profile ? formatCurrency(profile.balance) : '$0.00'}
          </span>
        </div>
      </div>

      {/* Credit Packages Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
          <Zap className="h-5 w-5 text-orange-500" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Premium Credit Packages
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {creditPackages.map((pack) => (
            <div 
              key={pack.id} 
              className={`rounded-2xl border p-4.5 flex flex-col justify-between space-y-4 transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] ${pack.colorClass}`}
            >
              {/* Blur Glow behind */}
              <div className={`absolute -top-12 -right-12 w-24 h-24 blur-2xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none ${pack.glowClass}`}></div>
              
              {pack.badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-sans font-black uppercase tracking-widest bg-orange-500 text-black border border-black shadow">
                  {pack.badge}
                </span>
              )}

              <div className="space-y-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">{pack.name}</h4>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-mono text-2xl font-black text-white">{formatCurrency(pack.credits)}</span>
                  <span className="text-[10px] font-bold text-white/40">credits</span>
                </div>
                {pack.bonusText && (
                  <p className="text-[9px] text-orange-400 font-sans font-medium uppercase tracking-wide">
                    {pack.bonusText}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-white/50 border-t border-white/5 pt-2">
                  <span>Price:</span>
                  <span className="font-mono font-bold text-white">${pack.price.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePurchasePackage(pack)}
                  className={`w-full py-2 rounded-lg font-sans text-[10px] font-black uppercase tracking-wider cursor-pointer text-center transition-all ${pack.btnColor} disabled:opacity-50 flex items-center justify-center space-x-1`}
                >
                  <CreditCard className="h-3 w-3" />
                  <span>Buy For ${pack.price}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Deposit/Secure Top-Up Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5 shadow-xl relative overflow-hidden">
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
                Deposit Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Credit Card', 'PayPal', 'Crypto'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDepositMethod(method)}
                    className={`rounded-lg border py-2 px-1 text-center font-sans text-[10px] font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                      depositMethod === method 
                        ? 'bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/20' 
                        : 'border-white/10 text-white/40 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    {method}
                    {method === 'Crypto' && (
                      <span className="absolute -top-1.5 -right-1 px-1 bg-amber-500 text-black font-sans font-black text-[7px] uppercase tracking-wider rounded border border-black">
                        +5%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

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

            {depositMethod === 'Crypto' && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start space-x-2.5 animate-pulse">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-500/95 leading-normal font-sans uppercase font-black tracking-wide">
                  Crypto Promo active: We will credit an additional **5% deposit bonus** instantly to your profile!
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 py-3 font-sans text-xs font-black uppercase tracking-wider text-black hover:bg-orange-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-black" />
              <span>{isProcessing ? "PROCESSING SECURE GATEWAY..." : `SECURE DEPOSIT ${formatCurrency(parseFloat(depositAmount) || 0)}`}</span>
            </button>
          </form>
        </div>

        {/* Financial Ledger Log Lists */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2">
            Detailed Transaction Ledger
          </h3>

          {isLoading && (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          )}

          {!isLoading && transactions.length === 0 && (
            <div className="text-center py-16 font-mono text-white/30 text-xs">
              No ledger entries logged on this account yet.
            </div>
          )}

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {transactions.map(tx => {
              const isPositive = tx.amount >= 0;
              const typeBadges: Record<string, string> = {
                deposit: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                unbox: 'bg-red-500/10 text-red-400 border-red-500/20',
                sell: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                upgrade_win: 'bg-[#FF3DF5]/10 text-[#FF3DF5] border-[#FF3DF5]/20',
                upgrade_loss: 'bg-red-500/10 text-red-400 border-red-500/20',
                bingo_buy: 'bg-slate-800/20 text-slate-300 border-slate-800',
                bingo_win: 'bg-[#00E6FF]/10 text-[#00E6FF] border-[#00E6FF]/20',
                lottery_buy: 'bg-slate-800/20 text-slate-300 border-slate-800',
                lottery_win: 'bg-[#00E6FF]/10 text-[#00E6FF] border-[#00E6FF]/20',
                shipping_fee: 'bg-slate-800/20 text-slate-300 border-slate-800',
                battle_win: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              };

              return (
                <div 
                  key={tx.id}
                  className="rounded-xl border border-white/5 bg-black/40 p-3 flex items-center justify-between font-mono text-xs hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-[10px] text-white/40 shrink-0">
                      <Calendar className="h-3.5 w-3.5 mb-1 text-white/30" />
                      <span>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="block text-white font-bold">{tx.description}</span>
                      <span className={`inline-block rounded px-1.5 py-0.2 text-[8px] font-sans font-black uppercase tracking-wider border ${typeBadges[tx.type] || 'bg-white/5 border-white/10 text-white/60'}`}>
                        {tx.type}
                      </span>
                    </div>
                  </div>

                  <span className={`font-mono font-black text-sm shrink-0 ${isPositive ? 'text-orange-500' : 'text-white/40'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
