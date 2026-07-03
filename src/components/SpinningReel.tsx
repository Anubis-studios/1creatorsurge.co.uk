import React, { useEffect, useRef, useState } from 'react';
import { BoxItem } from '../types';
import { getRarityStyle } from '../utils/rarityColors';
import { Sparkles, Trophy } from 'lucide-react';

interface SpinningReelProps {
  items: BoxItem[];
  winningItem: BoxItem | null;
  onComplete: () => void;
  isSpinning: boolean;
}

export default function SpinningReel({ items, winningItem, onComplete, isSpinning }: SpinningReelProps) {
  const [reelItems, setReelItems] = useState<BoxItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const winIndex = 32; // Positioning of the prize item inside the carousel chain

  useEffect(() => {
    if (items.length === 0) return;

    // Fill the carousel chain with randomized filler items for realistic scrolling weight
    const fillerCount = 45;
    const tempReel: BoxItem[] = [];
    
    for (let i = 0; i < fillerCount; i++) {
      if (i === winIndex && winningItem) {
        tempReel.push(winningItem);
      } else {
        const randomFiller = items[Math.floor(Math.random() * items.length)];
        tempReel.push(randomFiller);
      }
    }
    setReelItems(tempReel);
  }, [items, winningItem]);

  useEffect(() => {
    if (isSpinning && trackRef.current) {
      const track = trackRef.current;
      track.style.transition = 'none';
      track.style.transform = 'translateX(0px)';

      // Trigger redraw/reflow
      void track.offsetHeight;

      // Translate track to align index 32 item dead-center in our container viewport.
      // Item width is 130px + 10px margins. Center is container_width / 2.
      const itemOffset = winIndex * 140; // 130px width + 10px margin
      const containerWidth = track.parentElement?.clientWidth || 600;
      const centerTarget = itemOffset - (containerWidth / 2) + 70; // 70px is half item width

      track.style.transition = 'transform 4.5s cubic-bezier(0.12, 0.8, 0.15, 1)';
      track.style.transform = `translateX(-${centerTarget}px)`;

      const timer = setTimeout(() => {
        onComplete();
      }, 4700);

      return () => clearTimeout(timer);
    }
  }, [isSpinning, winningItem]);

  return (
    <div 
      className="relative flex flex-col items-center w-full"
      role="region" 
      aria-label="Unboxing Item Prize Reel"
      aria-live="polite"
    >
      {/* Viewport Frame */}
      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-white/10 bg-black/85 py-5 px-4 shadow-[inset_0_0_35px_rgba(0,0,0,0.95)]">
        
        {/* Horizontal Tick Center Cursor Line */}
        <div className="reel-selector" aria-hidden="true"></div>

        {/* Carousel Track Chain */}
        <div 
          ref={trackRef} 
          className="flex items-center will-change-transform"
          style={{ width: `${reelItems.length * 140}px` }}
        >
          {reelItems.map((item, idx) => {
            const style = getRarityStyle(item.rarity);
            const isWinner = idx === winIndex;
            return (
              <div 
                key={`${item.id}-${idx}`}
                className={`reel-item border-2 transition-all duration-300 ${style.border} ${isWinner && isSpinning ? 'scale-105 bg-orange-500/10 border-orange-500/50' : ''}`}
                style={{ width: '130px' }}
                aria-hidden={!isWinner}
              >
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="h-14 w-14 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className={`mt-2 text-[10px] font-bold truncate max-w-[110px] ${style.text}`}>
                  {item.name}
                </span>
                <span className="font-mono text-[9px] text-white/50 font-bold">
                  ${item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper Status Tip */}
      <div className="mt-4 flex items-center space-x-2 text-[10px] text-white/60 font-sans uppercase font-black tracking-widest">
        <Trophy className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
        <span>Aligning indicators. Weighted drop ratios fully operational.</span>
      </div>
    </div>
  );
}
