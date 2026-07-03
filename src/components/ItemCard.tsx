import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { getRarityStyle } from '../utils/rarityColors';
import { formatCurrency } from '../utils/formatCurrency';
import { DollarSign, Truck, Sparkles, AlertTriangle } from 'lucide-react';
import ConfirmSellModal from './ConfirmSellModal';
import ShippingTracker from './ShippingTracker';

interface ItemCardProps {
  item: InventoryItem;
  onSell?: (id: string) => void;
  onShip?: (id: string) => void;
  onUpgrade?: (id: string) => void;
  isSelected?: boolean;
  onSelectToggle?: (id: string) => void;
  isSelectable?: boolean;
}

export default function ItemCard({ 
  item, 
  onSell, 
  onShip, 
  onUpgrade, 
  isSelected = false, 
  onSelectToggle, 
  isSelectable = false 
}: ItemCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  
  const detail = item.item;
  if (!detail) return null;

  const style = getRarityStyle(detail.rarity);
  const individualShippingFee = Math.min(Math.max(detail.value * 0.1, 50), 500);

  const handleAction = async (fn?: (id: string) => void) => {
    if (!fn) return;
    setIsProcessing(true);
    try {
      await fn(item.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 bg-white/5 ${style.border} ${style.glow}`}>
      
      {/* Background Accent Gradients */}
      <div className={`absolute -right-12 -top-12 h-24 w-24 rounded-full bg-gradient-to-br ${style.gradient} opacity-10 blur-2xl`}></div>

      <div>
        {/* Header Badge Rarity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isSelectable && (
              <input 
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectToggle?.(item.id)}
                className="h-4 w-4 rounded border-white/10 bg-black/40 text-orange-500 focus:ring-orange-500/50 cursor-pointer"
              />
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-sans font-black uppercase tracking-widest ${style.badge}`}>
              {detail.rarity}
            </span>
          </div>
          <span className="font-mono text-[10px] text-white/40">
            {item.box_name}
          </span>
        </div>

        {/* Visual Showcase Box */}
        <div className="relative my-3 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 p-4 h-32">
          {detail.image_url ? (
            <img 
              src={detail.image_url} 
              alt={detail.name} 
              className="h-24 w-24 object-contain transition-transform hover:scale-115 duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded bg-white/5 font-mono text-xs text-white/40">
              No Asset Graphic
            </div>
          )}

          {/* Status Overlay Badges */}
          {item.status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl backdrop-blur-sm">
              <span className="font-sans text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/40 rounded px-2.5 py-1">
                LIQUIDATED
              </span>
            </div>
          )}
          {['processing', 'in_transit', 'delivered'].includes(item.status) && (
            <div className="absolute inset-0 flex flex-col bg-black/90 rounded-xl backdrop-blur-sm p-4">
              <span className="font-sans text-[10px] font-black uppercase tracking-widest text-orange-400 border border-orange-400/30 rounded px-2 py-0.5 self-center mb-2">
                SHIPPING
              </span>
              <ShippingTracker status={item.status as any} />
            </div>
          )}
          {item.status === 'upgraded_lost' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 rounded-xl backdrop-blur-sm">
              <span className="font-sans text-xs font-black uppercase tracking-widest text-red-500 border border-red-500/30 rounded px-2.5 py-1">
                INCINERATED
              </span>
            </div>
          )}
        </div>

        {/* Title Name & Appraisal Value */}
        <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">{detail.name}</h4>
        <div className="mt-1.5 flex items-baseline space-x-2">
          <span className="font-mono text-xs text-white/40">Value:</span>
          <span className={`font-mono text-sm font-black ${style.text}`}>
            {formatCurrency(detail.value)}
          </span>
        </div>
      </div>

      {/* Control Buttons Block */}
      {item.status === 'inventory' && (
        <div className="mt-4 border-t border-white/5 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Quick Liquidation Resell */}
            <button
              disabled={isProcessing}
              onClick={() => setIsSellModalOpen(true)}
              className="flex items-center justify-center space-x-1 rounded-lg bg-emerald-500 text-black py-2 px-2 font-sans text-[10px] font-black uppercase tracking-wider transition-all hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
              title={`Liquidate immediately for 80% market price: ${formatCurrency(item.sell_price)}`}
            >
              <DollarSign className="h-3 w-3" />
              <span>SELL ${item.sell_price}</span>
            </button>

            {/* Ship Item Label */}
            <button
              disabled={isProcessing}
              onClick={() => handleAction(onShip)}
              className="flex items-center justify-center space-x-1 rounded-lg bg-white text-black py-2 px-2 font-sans text-[10px] font-black uppercase tracking-wider transition-all hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
            >
              <Truck className="h-3 w-3" />
              <span>SHIP (${individualShippingFee})</span>
            </button>
          </div>

          {/* Upgrader Launcher option */}
          {onUpgrade && (
            <button
              disabled={isProcessing}
              onClick={() => handleAction(onUpgrade)}
              className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-orange-500 text-black py-2 px-2 font-sans text-[10px] font-black uppercase tracking-wider transition-all hover:bg-orange-400 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/20"
              title="Scale item worth 1.5x on a 45% win chance!"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-black" />
              <span>UPGRADE (45% CHANCE)</span>
            </button>
          )}
        </div>
      )}

      {/* Date unboxed indicator */}
      <div className="mt-2 text-[9px] text-white/30 font-mono text-right">
        {new Date(item.created_at).toLocaleDateString()}
      </div>

      <ConfirmSellModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onConfirm={() => handleAction(onSell)}
        itemName={detail.name}
        sellPrice={item.sell_price}
        itemImageUrl={detail.image_url}
        rarity={detail.rarity}
      />
    </div>
  );
}
