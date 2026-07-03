import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { Award, Trophy, Zap, Sparkles } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  username: string;
  avatar_url: string;
  total_unboxed: number;
  portfolio_value: number;
  arena_wins: number;
}

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    // Simulated top unboxing leaderboard metrics
    const list: LeaderboardUser[] = [
      { rank: 1, username: "Satoshi_Unbox", avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=satoshi", total_unboxed: 120, portfolio_value: 12450.00, arena_wins: 34 },
      { rank: 2, username: "cyber_collector", avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=cyber", total_unboxed: 95, portfolio_value: 9800.00, arena_wins: 21 },
      { rank: 3, username: "SurgeLord", avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=lord", total_unboxed: 82, portfolio_value: 7120.50, arena_wins: 19 },
      { rank: 4, username: "UnboxWizard", avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=wizard", total_unboxed: 64, portfolio_value: 5890.00, arena_wins: 15 },
      { rank: 5, username: "LootGamer", avatar_url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=loot", total_unboxed: 45, portfolio_value: 3950.00, arena_wins: 8 },
    ];
    setTopUsers(list);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title block banner */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <Trophy className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Top Unboxers Leaderboard</h2>
          </div>
          <p className="text-xs text-white/60">
            Showcase of top collectors, drop valuations, and arena match victories.
          </p>
        </div>
      </div>

      {/* Leaderboard Table List grid */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden shadow-xl">
        
        <div className="grid grid-cols-12 gap-2 bg-black/40 px-6 py-3.5 font-sans text-[10px] uppercase text-white/40 font-bold border-b border-white/5">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Collector</div>
          <div className="col-span-2 text-center">Unboxes</div>
          <div className="col-span-2 text-center">Arena Wins</div>
          <div className="col-span-2 text-right">Portfolio Value</div>
        </div>

        <div className="divide-y divide-white/5">
          {topUsers.map(user => (
            <div 
              key={user.rank}
              className="grid grid-cols-12 gap-2 px-6 py-4 items-center text-xs hover:bg-white/5 transition-all"
            >
              <div className="col-span-1 font-mono font-black">
                {user.rank <= 3 ? (
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30 font-sans font-black">
                    {user.rank}
                  </span>
                ) : (
                  <span className="text-white/40">#{user.rank}</span>
                )}
              </div>

              <div className="col-span-5 flex items-center space-x-3">
                <img 
                  src={user.avatar_url} 
                  alt={user.username} 
                  className="h-8 w-8 rounded-lg bg-black/40 border border-white/10" 
                />
                <span className="font-bold font-sans uppercase tracking-tight text-white">{user.username}</span>
              </div>

              <div className="col-span-2 text-center font-mono font-semibold text-white/60">
                {user.total_unboxed}
              </div>

              <div className="col-span-2 text-center font-mono font-black text-emerald-400">
                {user.arena_wins} wins
              </div>

              <div className="col-span-2 text-right font-mono font-black text-orange-400">
                {formatCurrency(user.portfolio_value)}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
