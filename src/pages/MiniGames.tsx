import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { playBingo, playLottery } from '../lib/api';
import { formatCurrency } from '../utils/formatCurrency';
import { Sparkles, Trophy, Coins, HelpCircle, Loader2, Play, Shuffle, CheckCircle, RefreshCw, AlertCircle, Heart, Star, Flame, Ticket } from 'lucide-react';
import { toast } from 'sonner';

export default function MiniGames() {
  const { profile, refreshProfile, loadProfile, login } = useAuthStore();

  // --- BINGO KING STATES ---
  const [isBingoLoading, setIsBingoLoading] = useState(false);
  const [bingoResult, setBingoResult] = useState<any | null>(null);
  const [bingoMatches, setBingoMatches] = useState<number>(0);
  const [bingoPrize, setBingoPrize] = useState<number>(0);

  // --- PICK-5 LOTTERY STATES ---
  const [chosenNumbers, setChosenNumbers] = useState<number[]>([]);
  const [isLotteryLoading, setIsLotteryLoading] = useState(false);
  const [lotteryResult, setLotteryResult] = useState<any | null>(null);

  const ensureProfile = async (): Promise<any> => {
    if (profile) return profile;
    try {
      await loadProfile();
      const current = useAuthStore.getState().profile;
      return current;
    } catch (e) {
      return null;
    }
  };

  // Helper to trigger Bingo play
  const handlePlayBingo = async () => {
    const activeProfile = await ensureProfile();
    if (!activeProfile) return toast.error("Please login first to enter the mini-games arena.");
    if (activeProfile.balance < 15.00) {
      return toast.error("Insufficient balance. Purchase credits in the Wallet first! ($15.00 card cost)");
    }

    setIsBingoLoading(true);
    setBingoResult(null);

    try {
      toast.loading("Purchasing ticket & marking Bingo balls...", { id: "bingo-init" });
      const res = await playBingo(activeProfile.id);
      toast.dismiss("bingo-init");
      
      setBingoResult(res.bingo);
      setBingoMatches(res.matches);
      setBingoPrize(res.prize_won);
      
      refreshProfile();

      if (res.prize_won > 0) {
        toast.success(`🎉 BINGO! You matched ${res.matches} numbers and won ${formatCurrency(res.prize_won)}!`, {
          duration: 6000,
        });
      } else {
        toast.info(`Matched ${res.matches} numbers. Try again for a lucky pattern!`, {
          duration: 5000,
        });
      }
    } catch (err: any) {
      toast.dismiss("bingo-init");
      toast.error(err.message || "Failed to finalize Bingo transaction");
    } finally {
      setIsBingoLoading(false);
    }
  };

  // Select number helper for Pick-5 Lottery
  const handleSelectLotteryNumber = (num: number) => {
    if (lotteryResult) {
      // Clear previous results to let them select new numbers
      setLotteryResult(null);
    }

    if (chosenNumbers.includes(num)) {
      setChosenNumbers(prev => prev.filter(n => n !== num));
    } else {
      if (chosenNumbers.length >= 5) {
        toast.warning("You can only select exactly 5 numbers.");
        return;
      }
      setChosenNumbers(prev => [...prev, num].sort((a, b) => a - b));
    }
  };

  // Lucky Dip picker (5 random distinct numbers 1-50)
  const handleLuckyDip = () => {
    setLotteryResult(null);
    const lucky: number[] = [];
    while (lucky.length < 5) {
      const num = Math.floor(1 + Math.random() * 50);
      if (!lucky.includes(num)) lucky.push(num);
    }
    setChosenNumbers(lucky.sort((a, b) => a - b));
    toast.success("Lucky Dip generated 5 random numbers!");
  };

  // Helper to trigger Pick-5 Lottery play
  const handlePlayLottery = async () => {
    const activeProfile = await ensureProfile();
    if (!activeProfile) return toast.error("Please login first to enter the mini-games arena.");
    if (chosenNumbers.length !== 5) {
      return toast.error("You must choose exactly 5 numbers first!");
    }
    if (activeProfile.balance < 10.00) {
      return toast.error("Insufficient balance. Purchase credits in the Wallet first! ($10.00 ticket cost)");
    }

    setIsLotteryLoading(true);
    setLotteryResult(null);

    try {
      toast.loading("Submitting ticket & drawing lottery machine...", { id: "lottery-init" });
      const res = await playLottery(activeProfile.id, chosenNumbers);
      toast.dismiss("lottery-init");

      setLotteryResult(res);
      refreshProfile();

      if (res.prize_won > 0) {
        toast.success(`🎉 JACKPOT DROP! You matched ${res.matches} numbers and won ${formatCurrency(res.prize_won)}!`, {
          duration: 6500,
        });
      } else {
        toast.info(`Matched ${res.matches} numbers. Try another combination!`, {
          duration: 5000,
        });
      }
    } catch (err: any) {
      toast.dismiss("lottery-init");
      toast.error(err.message || "Failed to finalize Lottery transaction");
    } finally {
      setIsLotteryLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="minigames-page-stage">
      
      {/* Top Banner Hero */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-xl" id="minigames-hero">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="space-y-1 relative">
          <div className="flex items-center space-x-2 text-purple-500">
            <Trophy className="h-6 w-6 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white font-sans">
              Ultra Arcade & Mini-Games
            </h2>
          </div>
          <p className="text-xs text-white/60 max-w-xl">
            Place your credits on the line to play high-fidelity mini-games. All entries trigger secure, verified micro-ledger transactions with instant balance payouts!
          </p>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 shrink-0 flex items-center space-x-3 text-xs font-sans relative">
          <Coins className="h-5 w-5 text-orange-500 animate-spin-slow" />
          <div>
            <span className="block text-white/40 uppercase font-black text-[9px] tracking-wider">Your Balance</span>
            <span className="block text-white font-mono font-black text-sm">{profile ? formatCurrency(profile.balance) : '$0.00'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ==================== BINGO KING BOARD ==================== */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-5 relative overflow-hidden shadow-2xl transition-all duration-300 hover:border-orange-500/20" id="bingo-king-section">
          {/* Accent glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Bingo King Arena</h3>
                <span className="text-[10px] font-mono text-white/40">Entry: $15.00 / card</span>
              </div>
            </div>
            <span className="rounded bg-orange-500/10 border border-orange-500/25 px-2 py-0.5 font-sans text-[8px] text-orange-400 font-black uppercase tracking-widest">
              MULTIPLIER PRIZES
            </span>
          </div>

          <p className="text-[11px] text-white/50 font-mono leading-relaxed">
            Purchase a 5x5 card with numbers (1 to 75). Our machine draws 35 balls. Get **10 or more matches** to win. Prizes scale up to <span className="text-orange-400 font-bold">$140.00</span> instantly!
          </p>

          {/* Bingo Grid Display */}
          <div className="flex justify-center py-2 relative">
            {bingoResult ? (
              <div className="grid grid-cols-5 gap-2 w-full max-w-[280px]">
                {bingoResult.card.map((row: number[], rIdx: number) => 
                  row.map((val: number, cIdx: number) => {
                    const isFreeSpace = rIdx === 2 && cIdx === 2;
                    const isMatched = !isFreeSpace && bingoResult.called_numbers.includes(val);

                    return (
                      <div 
                        key={`${rIdx}-${cIdx}`}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center border text-xs font-mono font-black relative transition-all duration-300 ${
                          isFreeSpace 
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-sans text-[9px] uppercase tracking-tighter' 
                            : isMatched 
                              ? 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/10 animate-scale-up scale-[1.02] border-2 font-extrabold'
                              : 'bg-black/45 border-white/5 text-white/40'
                        }`}
                      >
                        {isFreeSpace ? 'FREE' : val}
                        {isMatched && (
                          <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/40 h-[280px] w-full max-w-[280px] flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Flame className="h-10 w-10 text-white/10 animate-pulse" />
                <p className="text-xs text-white/30 font-bold uppercase tracking-wider">Bingo card is empty</p>
                <p className="text-[9px] text-white/20 font-mono">Buy a ticket below to draw and highlight matches.</p>
              </div>
            )}
          </div>

          {/* Matches & results summary if game was played */}
          {bingoResult && (
            <div className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-3 animate-scale-up font-mono text-xs">
              <div className="flex justify-between items-center text-white/60">
                <span>Drawn Bingo Balls:</span>
                <span className="text-[10px] text-white/40 font-mono truncate max-w-[180px]" title={bingoResult.called_numbers.join(", ")}>
                  {bingoResult.called_numbers.slice(0, 8).join(", ")}... (+27 others)
                </span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Card Match Matches:</span>
                <span className="text-orange-400 font-black">{bingoMatches} / 24</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2 font-sans text-sm font-black">
                <span className="uppercase italic tracking-tight">Game Outcome:</span>
                {bingoPrize > 0 ? (
                  <span className="text-emerald-400 uppercase tracking-widest animate-bounce">
                    WIN {formatCurrency(bingoPrize)}
                  </span>
                ) : (
                  <span className="text-white/30 uppercase tracking-wider">NO WIN (MIN 10 MATCHES)</span>
                )}
              </div>
            </div>
          )}

          {/* Play Button CTA */}
          <button
            disabled={isBingoLoading}
            onClick={handlePlayBingo}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 py-3.5 px-4 text-center font-sans text-xs font-black uppercase tracking-widest text-black hover:bg-orange-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
          >
            {isBingoLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                <span>CALIBRATING BINGO MATRIX...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 text-black" />
                <span>BUY CARD & PLAY BINGO ($15.00)</span>
              </>
            )}
          </button>
        </div>

        {/* ==================== PICK-5 LOTTERY BOARD ==================== */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-5 relative overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#8A3DFF]/20" id="pick5-lottery-section">
          {/* Accent glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#8A3DFF]/5 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center space-x-2">
              <Ticket className="h-5 w-5 text-purple-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Pick-5 Daily Lottery</h3>
                <span className="text-[10px] font-mono text-white/40">Entry: $10.00 / ticket</span>
              </div>
            </div>
            <span className="rounded bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 font-sans text-[8px] text-purple-400 font-black uppercase tracking-widest">
              JACKPOT EXPANSION
            </span>
          </div>

          <p className="text-[11px] text-white/50 font-mono leading-relaxed">
            Choose 5 unique numbers between **1 and 50**. If your numbers match the drawn lottery balls, win massive tiered payouts up to <span className="text-purple-400 font-bold">$2,500.00 jackpot</span>!
          </p>

          {/* Ticket Selector Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-sans text-white/40 uppercase font-bold tracking-wider text-[10px]">
                Your Ticket: <strong className="text-white font-mono">{chosenNumbers.length} / 5 Chosen</strong>
              </span>
              <button 
                onClick={handleLuckyDip}
                className="flex items-center space-x-1.5 text-[9px] font-sans font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/25 rounded-lg px-2.5 py-1 hover:bg-purple-500/20 transition-all cursor-pointer"
              >
                <Shuffle className="h-3 w-3" />
                <span>LUCKY DIP</span>
              </button>
            </div>

            {/* Scrolling Number grid */}
            <div className="rounded-xl border border-white/5 bg-black/40 p-3 max-h-[160px] overflow-y-auto grid grid-cols-10 gap-1.5 scrollbar-thin">
              {Array.from({ length: 50 }).map((_, idx) => {
                const val = idx + 1;
                const isSelected = chosenNumbers.includes(val);

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelectLotteryNumber(val)}
                    className={`aspect-square rounded flex items-center justify-center font-mono text-[10px] font-black transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#8A3DFF] text-white border-[#8A3DFF] shadow-md shadow-[#8A3DFF]/25 scale-[1.05]' 
                        : 'bg-white/5 border border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lottery Draw Results */}
          {lotteryResult && (
            <div className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-3 animate-scale-up font-mono text-xs">
              <div className="space-y-1.5">
                <span className="text-white/40 text-[9px] uppercase font-bold">Drawn Winning Numbers:</span>
                <div className="flex space-x-2">
                  {lotteryResult.winning_numbers.map((winNum: number, idx: number) => {
                    const isMatched = chosenNumbers.includes(winNum);
                    return (
                      <div 
                        key={idx}
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-mono font-black border animate-scale-up ${
                          isMatched 
                            ? 'bg-emerald-500 border-emerald-500 text-black font-extrabold animate-bounce' 
                            : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        {winNum}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center text-white/60 border-t border-white/5 pt-2.5">
                <span>Match count evaluation:</span>
                <span className="text-purple-400 font-black">{lotteryResult.matches} / 5 Matches</span>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-2 font-sans text-sm font-black">
                <span className="uppercase italic tracking-tight">Prize Credited:</span>
                {lotteryResult.prize_won > 0 ? (
                  <span className="text-emerald-400 uppercase tracking-widest animate-bounce">
                    WIN {formatCurrency(lotteryResult.prize_won)}
                  </span>
                ) : (
                  <span className="text-white/30 uppercase tracking-wider">NO WIN</span>
                )}
              </div>
            </div>
          )}

          {/* Submit lottery action */}
          <button
            disabled={isLotteryLoading || chosenNumbers.length !== 5}
            onClick={handlePlayLottery}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-[#8A3DFF] py-3.5 px-4 text-center font-sans text-xs font-black uppercase tracking-widest text-white hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#8A3DFF]/25 hover:shadow-[#8A3DFF]/40"
          >
            {isLotteryLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>SPINNING LOTTERY MACHINE...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 text-white" />
                <span>SUBMIT PICK-5 TICKET ($10.00)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Prize Tier Summary Panel */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-4">
        <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-white/5 pb-2">
          Mini-Games Payout Structure & Financial Verification
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono text-white/50">
          <div className="space-y-2">
            <span className="block text-white font-bold uppercase tracking-wider text-[10px] text-orange-400">Bingo King Tier List</span>
            <div className="space-y-1">
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>15+ Card Matches</span>
                <span className="text-white font-bold">Matches * $4.00 Credits</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>10-14 Card Matches</span>
                <span className="text-white font-bold">Matches * $4.00 Credits</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>Under 10 Matches</span>
                <span>No payout</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-white font-bold uppercase tracking-wider text-[10px] text-purple-400">Pick-5 Payout Tier List</span>
            <div className="space-y-1">
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>5 Number Matches</span>
                <span className="text-emerald-400 font-extrabold">$2,500.00 Credits Jackpot</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>4 Number Matches</span>
                <span className="text-white font-bold">$500.00 Credits</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>3 Number Matches</span>
                <span className="text-white font-bold">$100.00 Credits</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>2 Number Matches</span>
                <span className="text-white font-bold">$20.00 Credits</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>1 Number Match</span>
                <span className="text-white font-bold">$5.00 Credits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
