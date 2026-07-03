import React, { useEffect, useState } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { useAuthStore } from '../store/useAuthStore';
import { getBoxDetails, joinBattle } from '../lib/api';
import { BoxItem } from '../types';
import SpinningReel from './SpinningReel';
import { formatCurrency } from '../utils/formatCurrency';
import { Swords, ArrowLeft, Users, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface BattleRoomProps {
  battleId: string;
  onLeave: () => void;
}

export default function BattleRoom({ battleId, onLeave }: BattleRoomProps) {
  const { currentBattle, pollActiveBattle, setCurrentBattle } = useBattleStore();
  const { profile, refreshProfile } = useAuthStore();
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCompleted, setSpinCompleted] = useState(false);

  useEffect(() => {
    // Initial fetch
    pollActiveBattle();

    // Setup active poll loops to simulate real-time supabase listeners
    const pollTimer = setInterval(() => {
      pollActiveBattle();
    }, 2000);

    return () => {
      clearInterval(pollTimer);
      setCurrentBattle(null);
    };
  }, [battleId]);

  // Load box items once boxId is present
  useEffect(() => {
    if (currentBattle?.box_id) {
      getBoxDetails(currentBattle.box_id).then(res => {
        setBoxItems(res.items);
      });
    }

    if (currentBattle?.status === 'completed' && !isSpinning && !spinCompleted) {
      // Trigger spins automatically when full state registers
      setIsSpinning(true);
    }
  }, [currentBattle]);

  const handleJoinBattle = async () => {
    if (!profile) return toast.error("Please login first");
    try {
      await joinBattle(battleId, profile.id);
      toast.success("Joined battle room!");
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to join battle lobby");
    }
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    setSpinCompleted(true);
    refreshProfile();
  };

  if (!currentBattle) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-white/40 font-sans text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-2xl">
        Connecting to Battle Lobby Arena...
      </div>
    );
  }

  const isUserParticipant = currentBattle.participants.some(p => p.user_id === profile?.id);
  const slotsRemaining = currentBattle.max_players - currentBattle.participants.length;

  // Find winner participant details
  const winnerId = currentBattle.winner_id;
  const winnerDetails = currentBattle.participants.find(p => p.user_id === winnerId);

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <button 
          onClick={onLeave}
          className="flex items-center space-x-2 text-[10px] font-sans uppercase tracking-widest font-black text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>BACK TO LOBBY</span>
        </button>

        <div className="flex items-center space-x-2">
          <Swords className="h-4 w-4 text-orange-500" />
          <span className="font-sans font-bold text-[10px] text-white/40 uppercase tracking-widest">
            Battle ID: <strong className="text-orange-400 font-sans font-black">{currentBattle.id}</strong>
          </span>
        </div>
      </div>

      {/* Arena Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Competitors Sidebar Panels */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between font-sans text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
            <span className="text-white/40">Lobby Status</span>
            <span className="text-orange-400 font-sans font-black">{currentBattle.participants.length} / {currentBattle.max_players} Joined</span>
          </div>

          <div className="space-y-3">
            {currentBattle.participants.map((p, idx) => (
              <div 
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  p.user_id === profile?.id 
                    ? 'bg-orange-500/10 border-orange-500/30' 
                    : 'bg-black/40 border-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={p.avatar_url} 
                    alt={p.username} 
                    className="h-8 w-8 rounded-full border border-orange-500/30 bg-black/40"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase">{p.username}</span>
                    <span className="text-[8px] font-sans font-black text-white/30 uppercase tracking-wider">
                      {idx === 0 ? "HOST" : "CONTENDER"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-[9px] font-sans font-black text-orange-400 tracking-wider">READY</span>
                </div>
              </div>
            ))}

            {/* Waiting Slot Placeholders */}
            {Array.from({ length: Math.max(0, slotsRemaining) }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="flex items-center justify-center p-3.5 border-2 border-dashed border-white/10 rounded-xl font-sans text-[9px] text-white/30 uppercase tracking-widest font-black bg-black/10"
              >
                Waiting for Contenders...
              </div>
            ))}
          </div>

          {/* Join CTA if not in participant slot */}
          {!isUserParticipant && currentBattle.status === 'lobby' && (
            <button
              onClick={handleJoinBattle}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-black py-3 font-sans text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-orange-500/20"
            >
              <Users className="h-4 w-4 text-black" />
              <span>JOIN BATTLE vs COMPETITORS</span>
            </button>
          )}
        </div>

        {/* Real-time Unboxing Stage Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-6 shadow-xl relative overflow-hidden">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Arena Match: Unboxing <strong className="text-orange-500 font-sans font-black">{currentBattle.box?.name}</strong>
                </h3>
                <p className="text-xs text-white/60">
                  Single drop match. Winner takes the round plus an additional 1.25x unbox value refund!
                </p>
              </div>

              <div className="flex items-center space-x-2 font-mono text-sm font-bold bg-black/45 border border-white/10 px-3.5 py-1.5 rounded-xl text-white">
                <span className="text-white/40 uppercase font-sans font-black text-[10px] tracking-wider shrink-0">Crate Cost:</span>
                <span className="text-orange-400 font-mono font-black">{formatCurrency(currentBattle.box?.price || 0)}</span>
              </div>
            </div>

            {/* Battle Status Display states */}
            {currentBattle.status === 'lobby' && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-dashed border-orange-500/20 border-t-orange-500 animate-spin"></div>
                  <Swords className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-orange-500 animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-sans text-xs font-black text-white uppercase tracking-widest">
                    Assembling Challengers...
                  </p>
                  <p className="text-[10px] text-white/40 font-mono uppercase font-semibold">
                    Waiting for {slotsRemaining} more contender(s) to automatically launch the spins!
                  </p>
                </div>
              </div>
            )}

            {/* Spinner Execution Reel (Shared mockup of users rolling) */}
            {isSpinning && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center text-[10px] font-sans font-black uppercase tracking-wider text-orange-400 animate-pulse">
                  ⚠ SCROLL ROLLS IN PROGRESS! HOLD FOR DECISIVE DROP RATIO EVALUATION
                </div>
                <SpinningReel 
                  items={boxItems} 
                  winningItem={boxItems.find(i => i.id === currentBattle.participants[0]?.item_id) || null} 
                  isSpinning={isSpinning}
                  onComplete={handleSpinComplete}
                />
              </div>
            )}

            {/* Results Showcase Table Grid */}
            {spinCompleted && currentBattle.status === 'completed' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Winner Spotlight Crown Box */}
                {winnerDetails && (
                  <div className="relative rounded-2xl border border-orange-500/40 bg-orange-500/5 p-5 flex flex-col items-center text-center space-y-3 shadow-xl shadow-orange-500/5">
                    <div className="absolute -top-6 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1.5 rounded-full flex items-center space-x-1.5 shadow-lg border border-orange-400/30 text-black font-sans text-[10px] font-black uppercase tracking-widest animate-bounce">
                      <Trophy className="h-3.5 w-3.5 fill-current text-black" />
                      <span>MATCH WINNER</span>
                    </div>

                    <div className="flex items-center space-x-3 mt-2">
                      <img 
                        src={winnerDetails.avatar_url} 
                        alt={winnerDetails.username} 
                        className="h-12 w-12 rounded-full border-2 border-orange-500 bg-black/40"
                      />
                      <div className="text-left">
                        <h4 className="font-sans text-base font-black text-white uppercase tracking-wider">
                          {winnerDetails.username}
                        </h4>
                        <p className="text-xs text-orange-400 font-sans font-black uppercase tracking-wide">
                          Won {formatCurrency(winnerDetails.item_value || 0)} drop with an additional +1.25x credit payout!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid list of contenders drops */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-sans uppercase text-white/40 tracking-widest font-black">Contenders Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentBattle.participants.map(p => {
                      const isWinner = p.user_id === winnerId;
                      return (
                        <div 
                          key={p.id}
                          className={`rounded-xl border p-4 flex items-center justify-between ${
                            isWinner 
                              ? 'border-orange-500/30 bg-orange-500/5' 
                              : 'border-white/5 bg-black/40 hover:border-white/10 transition-colors'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <img src={p.avatar_url} alt={p.username} className="h-9 w-9 rounded-full bg-black/40 border border-white/5" />
                            <div>
                              <span className="block text-xs font-bold text-white uppercase">{p.username}</span>
                              <span className="block text-[10px] font-mono text-white/60 truncate max-w-[130px]" title={p.item_name}>
                                Pulled: {p.item_name}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col">
                            <span className={`font-mono text-xs font-black ${isWinner ? 'text-orange-400' : 'text-white/40'}`}>
                              {formatCurrency(p.item_value || 0)}
                            </span>
                            {isWinner && (
                              <span className="text-[9px] font-sans text-orange-400 font-black uppercase tracking-wider mt-0.5">
                                +1.25x Winner
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSpinCompleted(false);
                      setIsSpinning(false);
                      onLeave();
                    }}
                    className="rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-sans font-black text-xs uppercase px-5 py-3 transition-colors cursor-pointer shadow-lg shadow-orange-500/20"
                  >
                    RETURN TO BATTLE LOBBIES
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
