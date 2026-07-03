import React, { useEffect, useState } from 'react';
import { useBoxesStore } from '../store/useBoxesStore';
import { useAuthStore } from '../store/useAuthStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { buyBingoCard, buyLotteryTicket } from '../lib/api';
import BoxCard from '../components/BoxCard';
import UnboxPreview from '../components/UnboxPreview';
import { formatCurrency } from '../utils/formatCurrency';
import { 
  Sparkles, Flame, Dice5, Coins, HelpCircle, 
  ChevronRight, Swords, Trophy, ShieldAlert, Award, AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const { boxes, fetchBoxes, isLoading } = useBoxesStore();
  const { profile, refreshProfile } = useAuthStore();
  const { items, fetchInventory } = useInventoryStore();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  // Mini-Games Bar states
  const [activeGame, setActiveGame] = useState<'bingo' | 'lottery' | 'none'>('none');
  const [bingoLoading, setBingoLoading] = useState(false);
  const [lotteryLoading, setLotteryLoading] = useState(false);
  const [chosenLotteryNumbers, setChosenLotteryNumbers] = useState<number[]>([]);

  useEffect(() => {
    fetchBoxes();
    if (profile?.id) {
      fetchInventory(profile.id);
    }
  }, [profile?.id]);

  // Handle Bingo King cards purchase
  const handleBuyBingo = async () => {
    if (!profile) return toast.error("Please login to play Bingo King");
    const cost = 15.00;
    if (profile.balance < cost) {
      return toast.error("Insufficient balance. Bingo cards cost $15.00 credits.");
    }

    setBingoLoading(true);
    try {
      const res = await buyBingoCard(profile.id);
      refreshProfile();
      if (res.prize_won > 0) {
        toast.success(`🎉 Bingo! You matched numbers and won ${formatCurrency(res.prize_won)} credit rewards plus +15 loyalty resources!`);
      } else {
        toast.info("Bingo complete: No line wins. Try purchasing another card!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to purchase card");
    } finally {
      setBingoLoading(false);
    }
  };

  // Handle Pick-5 Lottery submissions
  const handleChooseLotteryNumber = (num: number) => {
    if (chosenLotteryNumbers.includes(num)) {
      setChosenLotteryNumbers(chosenLotteryNumbers.filter(n => n !== num));
    } else {
      if (chosenLotteryNumbers.length >= 5) {
        return toast.error("Maximum 5 numbers can be chosen for daily tickets");
      }
      setChosenLotteryNumbers([...chosenLotteryNumbers, num]);
    }
  };

  const handleBuyLottery = async () => {
    if (!profile) return toast.error("Please login to enter lottery");
    if (chosenLotteryNumbers.length !== 5) {
      return toast.error("You must choose exactly 5 numbers for your Pick-5 ticket");
    }

    const ticketCost = 10.00;
    if (profile.balance < ticketCost) {
      return toast.error("Sufficient funds required to enter daily lottery ($10.00)");
    }

    setLotteryLoading(true);
    try {
      const res = await buyLotteryTicket(profile.id, chosenLotteryNumbers);
      refreshProfile();
      if (res.prize_won > 0) {
        toast.success(`🏆 Lottery WINNER! Matches: ${res.matches}. You won ${formatCurrency(res.prize_won)} drop credits!`);
      } else {
        toast.info(`Lottery results: matched ${res.matches} numbers. Winning numbers were: [${res.winning_numbers.join(", ")}]. Better luck next draw!`);
      }
      setChosenLotteryNumbers([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to enter lottery");
    } finally {
      setLotteryLoading(false);
    }
  };

  const filteredBoxes = categoryFilter === 'All' 
    ? boxes 
    : boxes.filter(b => b.category === categoryFilter);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Premium Promotional Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <Flame className="h-3.5 w-3.5 text-orange-500 animate-bounce" />
            <span className="text-[9px] font-black uppercase tracking-wider text-orange-400">
              Welcome promo code operational
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-tight">
            New Year <span className="text-orange-500 underline decoration-4 underline-offset-8">Ultra Drops</span>
          </h1>
          <p className="text-xs text-white/60 leading-relaxed">
            The biggest unboxing experience. Real items, real odds, instant withdrawals. $100 Join Bonus active. Unbox supreme cyber lifestyle items, technology accessories, and gaming crates.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button 
            onClick={() => navigate("/wallet")}
            className="flex items-center justify-center rounded-xl bg-orange-500 text-black hover:bg-orange-400 px-6 py-3.5 text-xs font-black uppercase transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <span>TOP UP WALLET</span>
          </button>
          <button 
            onClick={() => navigate("/battles")}
            className="flex items-center justify-center space-x-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-3 text-xs font-bold transition-all cursor-pointer"
          >
            <Swords className="h-4 w-4 text-orange-500" />
            <span>PLAY ARENA</span>
          </button>
        </div>
      </section>

      {/* Interactive Mini-Games Bar Panel */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center space-x-1.5">
              <Coins className="h-4 w-4 text-orange-500 animate-spin-slow" />
              <span>Interactive Mini-Games Bar</span>
            </h2>
            <p className="text-[10px] text-white/40 font-mono">
              Leverage your wallet balance on quick gaming side bets to boost loyalty resources or pull premium item drops.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveGame(activeGame === 'bingo' ? 'none' : 'bingo')}
              className={`rounded-lg px-3.5 py-1.5 font-sans text-xs font-bold border transition-all cursor-pointer ${
                activeGame === 'bingo' 
                  ? 'bg-orange-500 text-black border-orange-500' 
                  : 'border-white/10 text-white/60 hover:border-white/20 bg-black/20'
              }`}
            >
              Bingo King ($15)
            </button>
            <button
              onClick={() => setActiveGame(activeGame === 'lottery' ? 'none' : 'lottery')}
              className={`rounded-lg px-3.5 py-1.5 font-sans text-xs font-bold border transition-all cursor-pointer ${
                activeGame === 'lottery' 
                  ? 'bg-purple-500 text-white border-purple-500' 
                  : 'border-white/10 text-white/60 hover:border-white/20 bg-black/20'
              }`}
            >
              Pick-5 Lottery ($10)
            </button>
            <button
              onClick={() => {
                navigate("/inventory");
                toast.info("Select any item in your inventory to trigger the 45% Worth Upgrader!");
              }}
              className="rounded-lg px-3.5 py-1.5 font-sans text-xs font-bold border border-white/10 text-orange-400 hover:border-orange-500/50 bg-black/20 cursor-pointer"
            >
              Upgrader (45% Chance)
            </button>
          </div>
        </div>

        {/* Bingo King Active Game Board */}
        {activeGame === 'bingo' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 animate-slide-up">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-[#00E6FF] uppercase tracking-wider">Bingo King 75-Call Ticket</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Click unbox card to purchase. Matching at least 10 numbers instantly wins credit payouts of **$4.00 per number match**, plus **+15 loyalty points**!
              </p>
              
              <div className="grid grid-cols-5 gap-1 max-w-sm mt-2">
                {Array.from({ length: 25 }).map((_, i) => {
                  const r = Math.floor(i / 5);
                  const c = i % 5;
                  const isCenter = r === 2 && c === 2;
                  return (
                    <div 
                      key={i} 
                      className={`h-10 border rounded flex items-center justify-center font-mono text-xs font-black ${
                        isCenter 
                          ? 'bg-[#00E6FF]/20 border-[#00E6FF] text-[#00E6FF]' 
                          : 'bg-[#12121e] border-slate-800 text-slate-300'
                      }`}
                    >
                      {isCenter ? "FREE" : Math.floor(1 + Math.random() * 75)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between p-4 rounded-xl bg-[#12121e] border border-slate-800">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase text-slate-500 font-black">Cost per card</span>
                <span className="block font-mono text-lg font-black text-slate-200">$15.00</span>
              </div>
              <button
                disabled={bingoLoading}
                onClick={handleBuyBingo}
                className="w-full rounded-lg bg-[#00E6FF] py-2 text-center text-xs font-mono font-bold text-[#0A0A0F] hover:bg-[#FF3DF5] hover:text-white transition-all mt-4 disabled:opacity-50"
              >
                {bingoLoading ? "CALLING..." : "PURCHASE & DRAW"}
              </button>
            </div>
          </div>
        )}

        {/* Pick-5 Lottery Active Game Board */}
        {activeGame === 'lottery' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 animate-slide-up">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-[#FF3DF5] uppercase tracking-wider">Pick-5 Daily Tickets</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Select 5 numbers (from 1 to 50). Match drawn numbers to win premium payout drops up to **$2,500.00 Jackpot!**
              </p>

              <div className="flex flex-wrap gap-1 mt-2 max-w-md">
                {Array.from({ length: 50 }, (_, idx) => {
                  const num = idx + 1;
                  const isSelected = chosenLotteryNumbers.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleChooseLotteryNumber(num)}
                      className={`h-7 w-7 rounded font-mono text-[10px] font-black border transition-all ${
                        isSelected 
                          ? 'bg-[#FF3DF5] border-[#FF3DF5] text-white' 
                          : 'bg-[#12121e] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between p-4 rounded-xl bg-[#12121e] border border-slate-800">
              <div className="space-y-2">
                <span className="font-mono text-[9px] uppercase text-slate-500 font-black">Your selection</span>
                <div className="flex items-center space-x-1.5 font-mono text-xs font-black text-[#00E6FF]">
                  {chosenLotteryNumbers.length > 0 
                    ? chosenLotteryNumbers.join(", ") 
                    : "[Choose 5 Numbers]"}
                </div>
              </div>
              <button
                disabled={lotteryLoading || chosenLotteryNumbers.length !== 5}
                onClick={handleBuyLottery}
                className="w-full rounded-lg bg-[#FF3DF5] py-2 text-center text-xs font-mono font-bold text-white hover:bg-[#00E6FF] hover:text-[#0A0A0F] transition-all mt-4 disabled:opacity-40"
              >
                {lotteryLoading ? "DRAWING..." : "ENTER DRAW ($10)"}
              </button>
            </div>
          </div>
        )}

      </section>

      {/* Main Boxes Dashboard Categories Grid */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">
              Loot <span className="text-orange-500 underline decoration-4 underline-offset-8">Box Drops</span>
            </h2>
            <p className="text-xs text-white/40 font-mono">
              Calibrated drop distribution formulas. Resell instantly at 80% or requests home delivery.
            </p>
          </div>

          {/* Categories Tab selector */}
          <div className="flex flex-wrap gap-1.5">
            {['All', ...Array.from(new Set(boxes.map(b => b.category).filter(Boolean)))].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all border cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-orange-500 text-black border-orange-500' 
                    : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-[#00E6FF] border-slate-800"></div>
          </div>
        )}

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredBoxes.map(box => (
            <div key={box.id}>
              <BoxCard 
                box={box} 
                onSelect={(id) => navigate(`/boxes/${id}`)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Spinning Reel Sandbox Mode Demo section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-3 pr-2 flex flex-col justify-center">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            Calibrated Drop Probability Systems
          </h3>
          <p className="text-xs text-white/40 leading-relaxed font-mono">
            Each unboxing spins a multi-reel carousel using weighted random selection. System-wide probabilities are completely open:
          </p>
          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono mt-2">
            <div className="p-2.5 rounded bg-white/5 border border-white/5 col-span-2">
              <span className="block text-white/40 uppercase font-bold">Common Tier</span>
              <span className="block text-white font-black text-xs mt-0.5">80.00% Probability</span>
              <span className="block text-orange-400 font-bold text-[10px] mt-0.5">📉 Major price of the common tier value -50%</span>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/5">
              <span className="block text-blue-400/60 uppercase font-bold">Rare Tier</span>
              <span className="block text-blue-400 font-black text-xs mt-0.5">1.00% Probability</span>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/5">
              <span className="block text-purple-400/60 uppercase font-bold">Epic Tier</span>
              <span className="block text-purple-400 font-black text-xs mt-0.5">0.50% Probability</span>
            </div>
            <div className="p-2.5 rounded bg-white/5 border border-white/5 shadow-inner shadow-orange-500/5 col-span-2">
              <span className="block text-orange-400/60 uppercase font-bold">Legendary Tier</span>
              <span className="block text-orange-400 font-black text-xs mt-0.5">0.01% Probability</span>
            </div>
          </div>
        </div>

        {/* Standing alone unbox carousel sandbox demo component */}
        <UnboxPreview />
      </section>

    </div>
  );
}
