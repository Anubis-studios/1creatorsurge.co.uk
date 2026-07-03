import React from 'react';
import { AlertTriangle, X, ShieldAlert, Coins } from 'lucide-react';
import { getRarityStyle } from '../utils/rarityColors';
import { formatCurrency } from '../utils/formatCurrency';

interface ConfirmSellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  sellPrice: number;
  itemImageUrl?: string;
  rarity: string;
}

export default function ConfirmSellModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  sellPrice,
  itemImageUrl,
  rarity
}: ConfirmSellModalProps) {
  if (!isOpen) return null;

  const style = getRarityStyle(rarity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" id="confirm-sell-modal">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-scale-up">
        
        {/* Glow Accent */}
        <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-orange-500/10 blur-[60px] pointer-events-none"></div>
        <div className={`absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${style.gradient} opacity-10 blur-[60px] pointer-events-none`}></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
          id="close-confirm-sell-btn"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Indicator */}
        <div className="flex items-center space-x-3 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-[11px] font-sans font-bold uppercase tracking-wider leading-relaxed">
            Warning: Instant liquidation is irreversible. Check details below before finalizing.
          </p>
        </div>

        {/* Item Summary Card */}
        <div className="rounded-xl border border-white/5 bg-white/5 p-4 flex items-center space-x-4">
          <div className="relative h-16 w-16 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
            {itemImageUrl ? (
              <img 
                src={itemImageUrl} 
                alt={itemName} 
                className="h-12 w-12 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-[9px] font-mono text-white/30">Loot</span>
            )}
          </div>
          <div className="space-y-1">
            <span className={`inline-block rounded px-2 py-0.5 text-[8px] font-sans font-black uppercase tracking-widest ${style.badge}`}>
              {rarity}
            </span>
            <h4 className="text-sm font-black uppercase text-white tracking-tight leading-tight line-clamp-1">
              {itemName}
            </h4>
          </div>
        </div>

        {/* Financial Recoup Summary */}
        <div className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center text-white/60">
            <span>Market Estimation:</span>
            <span>{formatCurrency(sellPrice / 0.8)}</span>
          </div>
          <div className="flex justify-between items-center text-white/40 border-b border-white/5 pb-2">
            <span>Recoup Percentage:</span>
            <span>80%</span>
          </div>
          <div className="flex justify-between items-center text-white font-bold pt-1 text-sm">
            <span className="flex items-center space-x-1.5 font-sans uppercase font-black text-xs text-orange-500">
              <Coins className="h-4 w-4 text-orange-500" />
              <span>Credits to Gain</span>
            </span>
            <span className="text-orange-500 text-base font-black">
              {formatCurrency(sellPrice)}
            </span>
          </div>
        </div>

        {/* Confirm / Cancel Button CTA Row */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 py-3 text-center text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer"
            id="cancel-sell-btn"
          >
            Cancel Keep
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 py-3 text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            id="confirm-sell-btn"
          >
            Liquidate Item
          </button>
        </div>

      </div>
    </div>
  );
}
