import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { claimDailyReward } from '../lib/api';
import { Gift, Flame, ShieldCheck, Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyRewards() {
  const { profile, refreshProfile } = useAuthStore();
  const [isClaiming, setIsClaiming] = useState(false);

  if (!profile) return null;

  const handleClaimReward = async () => {
    setIsClaiming(true);
    try {
      const result = await claimDailyReward(profile.id);
      toast.success(`Claimed $${result.reward_amount.toFixed(2)} Daily Reward! (Day ${result.streak} Streak)`, {
        icon: '🎁',
        duration: 4000
      });
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim daily reward");
    } finally {
      setIsClaiming(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Checking last_claimed_at timestamp or last_claim_date fallback
  const isClaimedToday = profile.last_claimed_at 
    ? profile.last_claimed_at.split('T')[0] === todayStr
    : profile.last_claim_date === todayStr;

  const currentStreak = profile.daily_streak || 0;

  // Render a last claimed human-readable line if available
  const lastClaimedDateObj = profile.last_claimed_at ? new Date(profile.last_claimed_at) : null;
  const lastClaimedStr = lastClaimedDateObj 
    ? lastClaimedDateObj.toLocaleDateString(undefined, { dateStyle: 'medium' }) + ' at ' + lastClaimedDateObj.toLocaleTimeString(undefined, { timeStyle: 'short' })
    : profile.last_claim_date 
      ? new Date(profile.last_claim_date).toLocaleDateString(undefined, { dateStyle: 'medium' })
      : "Never";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-5 relative overflow-hidden shadow-xl transition-all hover:border-orange-500/20" id="daily-rewards-container">
      {/* Upper ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <Gift className="h-5 w-5 animate-bounce" />
            <h3 className="text-base font-black uppercase tracking-tight italic text-white font-sans">
              Daily Reward Portal
            </h3>
          </div>
          <p className="text-xs text-white/60 max-w-xl font-sans leading-relaxed">
            Log in daily to claim free streaming credits. Maintain your active streak to increase multiplier rewards up to a maximum boost of <span className="text-orange-400 font-bold">+$5.00</span> per day!
          </p>
          <div className="text-[10px] text-white/40 font-mono">
            Last claimed: <span className="text-white/60">{lastClaimedStr}</span>
          </div>
        </div>

        <button
          onClick={handleClaimReward}
          disabled={isClaimedToday || isClaiming}
          className={`flex items-center justify-center space-x-2 rounded-lg px-6 py-3 font-sans text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98] ${
            isClaimedToday
              ? 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed shadow-none'
              : 'bg-orange-500 text-black hover:bg-orange-400 shadow-orange-500/20 hover:shadow-orange-500/30'
          }`}
          id="claim-daily-reward-btn"
        >
          {isClaiming ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          ) : isClaimedToday ? (
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
          ) : (
            <Coins className="h-4.5 w-4.5 text-black" />
          )}
          <span>{isClaimedToday ? 'CLAIMED TODAY' : 'CLAIM DAILY REWARD'}</span>
        </button>
      </div>

      {/* Streak Visual Tracker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Flame className={`h-5 w-5 ${currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-white/30'}`} />
            <span className="font-sans uppercase font-black tracking-wider text-white">
              Current Streak: <strong className="text-orange-500">{currentStreak} Days</strong>
            </span>
          </div>
          <span className="font-sans uppercase font-bold text-white/40 text-[10px] tracking-widest hidden sm:inline-block">
            STREAK MULTIPLIER COMPOUND
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, idx) => {
            const dayNum = idx + 1;
            const isPassed = dayNum <= currentStreak;
            const isCurrent = dayNum === currentStreak + 1 && !isClaimedToday;
            const dayReward = 5.00 + (idx * 0.50);

            return (
              <div 
                key={dayNum}
                className={`rounded-xl p-3 flex flex-col items-center justify-center text-center border transition-all duration-300 ${
                  isPassed 
                    ? 'border-orange-500/40 bg-orange-500/10 shadow-md shadow-orange-500/5 hover:border-orange-500/60' 
                    : isCurrent 
                      ? 'border-white/20 bg-white/5 animate-pulse scale-[1.02]'
                      : 'border-white/5 bg-black/20'
                }`}
              >
                <span className={`block text-[9px] font-sans font-black uppercase tracking-wider ${isPassed ? 'text-orange-400' : 'text-white/40'}`}>
                  Day {dayNum}
                </span>
                <Flame className={`h-4.5 w-4.5 my-1.5 ${isPassed ? 'text-orange-500' : 'text-white/20'}`} />
                <span className={`block text-[10px] font-mono font-bold ${isPassed ? 'text-orange-300' : 'text-white/50'}`}>
                  ${dayReward.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
