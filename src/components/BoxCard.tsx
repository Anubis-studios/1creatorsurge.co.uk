import React from 'react';
import { Box } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { Sparkles, ShoppingBag } from 'lucide-react';

interface BoxCardProps {
  box: Box;
  onSelect: (boxId: string) => void;
}

export default function BoxCard({ box, onSelect }: BoxCardProps) {
  // Get rarity accent color
  const rarityColors = {
    common: 'border-white/10 text-white bg-white/5',
    rare: 'border-blue-500/30 text-blue-400 bg-white/5',
    epic: 'border-purple-500/30 text-purple-400 bg-white/5',
    legendary: 'border-orange-500/30 text-orange-400 bg-white/5 shadow-[0_0_20px_rgba(249,115,22,0.05)]',
  }[box.rarity] || 'border-white/10 text-white';

  const hoverGlow = {
    common: 'hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]',
    rare: 'hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    epic: 'hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
    legendary: 'hover:border-orange-500/60 hover:shadow-[0_0_30px_rgba(249,115,22,0.25)]',
  }[box.rarity] || 'hover:border-orange-500';

  const buttonStyle = {
    common: 'bg-white text-black hover:bg-gray-200 font-black',
    rare: 'bg-blue-500 hover:bg-blue-400 text-white font-black',
    epic: 'bg-purple-500 hover:bg-purple-400 text-white font-black',
    legendary: 'bg-orange-500 hover:bg-orange-400 text-black font-black shadow-lg shadow-orange-500/20',
  }[box.rarity] || 'bg-orange-500 text-black font-black';

  return (
    <div 
      onClick={() => onSelect(box.id)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${rarityColors} ${hoverGlow}`}
    >
      {/* Absolute Glow Background Accent */}
      <div className="absolute -inset-1 bg-gradient-to-b from-orange-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

      <div>
        {/* Category Badge & Opened Stats */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white/60 border border-white/5">
            {box.category}
          </span>
          <span className="font-mono text-[10px] text-white/40 group-hover:text-white/60">
            Opened: <strong className="text-white/60">{box.total_opened}</strong>
          </span>
        </div>

        {/* Crate Visual Frame */}
        <div className="relative my-4 flex items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-white/5 p-6 h-40">
          <img 
            src={box.image_url} 
            alt={box.name} 
            className="h-28 w-28 object-contain transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-2"
            referrerPolicy="no-referrer"
          />
          {box.rarity === 'legendary' && (
            <div className="absolute left-2 top-2 text-orange-500 animate-bounce">
              <Sparkles className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 uppercase tracking-tight">
          {box.name}
        </h3>
        <p className="mt-1 text-xs text-white/40 line-clamp-2 min-h-[32px]">
          {box.description}
        </p>
      </div>

      {/* Buy/Open CTA Price Bar */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider">Price</span>
          <span className="font-mono text-lg font-bold text-white">
            {formatCurrency(box.price)}
          </span>
        </div>

        <button 
          className={`flex items-center justify-center space-x-1.5 rounded-lg px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${buttonStyle}`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>UNBOX</span>
        </button>
      </div>
    </div>
  );
}
