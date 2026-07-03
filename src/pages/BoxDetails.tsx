import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoxesStore } from '../store/useBoxesStore';
import { useAuthStore } from '../store/useAuthStore';
import { openBox, sellItem } from '../lib/api';
import { BoxItem } from '../types';
import SpinningReel from '../components/SpinningReel';
import { getRarityStyle } from '../utils/rarityColors';
import { formatCurrency } from '../utils/formatCurrency';
import { Sparkles, ShoppingBag, ArrowLeft, RefreshCw, Info, Check, ShieldCheck, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function BoxDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { currentBox, currentItems, isLoading, loadBoxDetails, error } = useBoxesStore();
  const { profile, refreshProfile } = useAuthStore();

  const [isSpinning, setIsSpinning] = useState(false);
  const [wonItem, setWonItem] = useState<BoxItem | null>(null);
  const [unboxedResultId, setUnboxedResultId] = useState<string | null>(null);
  const [showPrizeCard, setShowPrizeCard] = useState(false);

  useEffect(() => {
    if (id) {
      loadBoxDetails(id);
    }
  }, [id]);

  const handleUnbox = async () => {
    if (!profile) {
      return navigate("/login");
    }
    if (!currentBox) return;

    if (profile.balance < currentBox.price) {
      return toast.error(`Insufficient balance. Please top up! Needs ${formatCurrency(currentBox.price)}`);
    }

    setIsSpinning(true);
    setWonItem(null);
    setShowPrizeCard(false);

    try {
      // Server-Authoritative draw call
      const res = await openBox(currentBox.id, profile.id);
      
      // Set drawn winning item
      setWonItem(res.item);
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to unbox crate");
      setIsSpinning(false);
    }
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    setShowPrizeCard(true);
    toast.success(`You pulled a ${wonItem?.name}!`);
  };

  const handleInstantSell = async () => {
    if (!wonItem || !profile) return;
    const sellPrice = Number((wonItem.value * 0.8).toFixed(2));
    try {
      // Create quick resell transaction using our API
      // We look up the last inventory item created for this user
      const res = await fetch(`/api/inventory/${profile.id}`);
      const invItems = await res.json();
      const lastItem = invItems[invItems.length - 1]; // Latest pulled

      if (lastItem && lastItem.item_id === wonItem.id) {
        await sellItem(lastItem.id, profile.id);
        toast.success(`Liquidated item. Credited ${formatCurrency(sellPrice)} to your balance!`);
        setShowPrizeCard(false);
        refreshProfile();
      } else {
        toast.error("Could not trace item. Added to your inventory!");
      }
    } catch (err: any) {
      toast.error("Failed to liquidate item");
    }
  };

  if (isLoading && !isSpinning) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-orange-500 border-white/10"></div>
      </div>
    );
  }

  if (error || !currentBox) {
    return (
      <div className="text-center py-12 text-orange-500 font-sans text-xs font-bold uppercase tracking-wider">
        Box not found or connection lost: {error || "Invalid box selection"}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header breadcrumb back link */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-xs font-sans font-black uppercase text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-orange-500" />
          <span>BACK TO CRATE GRID</span>
        </button>

        <span className="font-sans text-xs text-white/40 uppercase font-black">
          Category: <strong className="text-orange-400">{currentBox.category}</strong>
        </span>
      </div>

      {/* Main Unboxing Stage Area */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-5">
          <div className="flex items-center space-x-4">
            <img src={currentBox.image_url} alt={currentBox.name} className="h-16 w-16 object-contain bg-black/40 p-2 rounded-xl border border-white/5" />
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white uppercase tracking-tight">{currentBox.name}</h1>
              <p className="text-xs text-white/60 max-w-xl">{currentBox.description}</p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="font-sans text-[10px] uppercase text-white/40 tracking-widest font-bold">Crate Cost</span>
            <span className="font-sans text-2xl font-black text-white">
              {formatCurrency(currentBox.price)}
            </span>
          </div>
        </div>

        {/* Carousel Spinning Reel Arena */}
        {(isSpinning || wonItem) ? (
          <div className="space-y-6">
            <SpinningReel 
              items={currentItems} 
              winningItem={wonItem} 
              isSpinning={isSpinning} 
              onComplete={handleSpinComplete}
            />

            {/* Glowing Prize Win Showcase Card */}
            {showPrizeCard && wonItem && (
              <div className="flex flex-col items-center justify-center py-4 animate-scale-up">
                <div className={`relative max-w-md w-full rounded-2xl border-2 p-6 flex flex-col items-center text-center space-y-4 shadow-2xl bg-black/80 ${getRarityStyle(wonItem.rarity).border} ${getRarityStyle(wonItem.rarity).glow}`}>
                  
                  {/* Glowing background */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${getRarityStyle(wonItem.rarity).gradient} opacity-5`}></div>

                  <div className="space-y-1 z-10">
                    <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-sans font-black uppercase tracking-widest ${getRarityStyle(wonItem.rarity).badge}`}>
                      {wonItem.rarity} DROP
                    </span>
                    <h2 className="text-lg font-black text-white uppercase mt-2 tracking-tight">{wonItem.name}</h2>
                    <p className="font-mono text-xl font-black text-orange-400">{formatCurrency(wonItem.value)}</p>
                  </div>

                  <img 
                    src={wonItem.image_url} 
                    alt={wonItem.name} 
                    className="h-32 w-32 object-contain z-10 transition-transform hover:scale-110 duration-300"
                    referrerPolicy="no-referrer"
                  />

                  {/* Actions: Resell vs Keep */}
                  <div className="grid grid-cols-2 gap-3 w-full z-10 pt-3 border-t border-white/5">
                    <button
                      onClick={handleInstantSell}
                      className="flex items-center justify-center space-x-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black py-3 font-sans text-xs font-black uppercase transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                      title="Sell instantly for 80% valuation!"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>SELL ${Number((wonItem.value * 0.8).toFixed(2))}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPrizeCard(false);
                        setWonItem(null);
                        toast.success("Added to inventory! View on My Inventory page.");
                      }}
                      className="flex items-center justify-center space-x-1.5 rounded-lg bg-orange-500 text-black py-3 font-sans text-xs font-black uppercase hover:bg-orange-400 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                    >
                      <Check className="h-4 w-4" />
                      <span>KEEP DROP</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        ) : (
          /* Landing CTA Stage if not unboxing */
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-orange-500 opacity-10 blur-3xl group-hover:opacity-25 transition-opacity duration-500"></div>
              <img src={currentBox.image_url} alt={currentBox.name} className="h-44 w-44 object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.25)] animate-pulse" />
            </div>

            <button
              onClick={handleUnbox}
              className="flex items-center space-x-2.5 rounded-xl bg-orange-500 text-black hover:bg-orange-400 px-8 py-4 font-sans text-sm font-black tracking-widest uppercase transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5 fill-current" />
              <span>UNBOX FOR {formatCurrency(currentBox.price)}</span>
            </button>
          </div>
        )}

      </div>

      {/* Probability list table display */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
          <Info className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Available Drops and Calibration Probabilities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentItems.map(item => {
            const style = getRarityStyle(item.rarity);
            return (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/40 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3.5 animate-fade-in">
                  <img src={item.image_url} alt={item.name} className="h-10 w-10 object-contain rounded bg-white/5 border border-white/5 p-1" />
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-white uppercase tracking-tight">{item.name}</span>
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-sans font-black uppercase tracking-wider ${style.badge}`}>
                      {item.rarity}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="block font-mono text-xs font-bold text-white">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="block font-mono text-[10px] text-orange-400 font-bold">
                    {(item.probability * 100).toFixed(1)}% odds
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
