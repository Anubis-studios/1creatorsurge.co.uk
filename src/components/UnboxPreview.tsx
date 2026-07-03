import React, { useState } from 'react';
import '../animations/unbox-reel.css';
import { Sparkles, Play } from 'lucide-react';

export default function UnboxPreview() {
  const [demoSpin, setDemoSpin] = useState(false);

  const mockDemoItems = [
    { name: "Retro Keycaps", value: "$30", img: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=120", rarity: "rare-glow" },
    { name: "Cyber Mouse", value: "$80", img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=120", rarity: "rare-glow" },
    { name: "GeForce RTX 4080", value: "$1200", img: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=120", rarity: "legendary-glow" },
    { name: "Gas Spring Arm", value: "$110", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=120", rarity: "common-glow" },
    { name: "Immersive Headset", value: "$110", img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=120", rarity: "epic-glow" },
    { name: "Suede Clean Kit", value: "$40", img: "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=120", rarity: "rare-glow" },
  ];

  const handleDemoSpin = () => {
    setDemoSpin(true);
    setTimeout(() => {
      setDemoSpin(false);
    }, 3500);
  };

  return (
    <div className="flex flex-col space-y-4 rounded-2xl bg-white/5 border border-white/10 p-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
          <h3 className="font-sans text-xs font-black uppercase tracking-wider text-white">
            Spinning Reel Sandbox Mode
          </h3>
        </div>
        <span className="rounded bg-orange-500/20 px-2.5 py-1 font-sans text-[9px] font-black text-orange-400 border border-orange-500/30">
          DEMO
        </span>
      </div>

      {/* Viewport Frame */}
      <div className="reel-wrapper bg-black/40 border border-white/5 rounded-xl overflow-hidden relative">
        <div className="reel-selector"></div>
        
        {/* Track */}
        <div 
          className={`reel-track ${demoSpin ? 'reel-spin' : ''}`}
          style={{
            animationDuration: demoSpin ? '3s' : '0s',
            animationFillMode: 'forwards',
            animationTimingFunction: 'cubic-bezier(0.12, 0.8, 0.15, 1)'
          }}
        >
          {/* Repeating items for infinite scroll appearance */}
          {Array.from({ length: 10 }).flatMap((_, i) => mockDemoItems).map((item, idx) => (
            <div 
              key={`${item.name}-${idx}`} 
              className="reel-item border border-white/5 flex flex-col items-center justify-center p-2 rounded-lg bg-black/40"
              style={{ width: '130px' }}
            >
              <img 
                src={item.img} 
                alt={item.name} 
                className="h-12 w-12 object-contain rounded"
                referrerPolicy="no-referrer"
              />
              <span className="mt-1 text-[10px] font-bold text-white truncate max-w-[100px]">
                {item.name}
              </span>
              <span className="text-[9px] font-mono text-orange-400 font-bold">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[10px] text-white/40 font-mono">
          Click play to see the real-time spinning-reel unbox demo run instantly.
        </span>
        <button
          disabled={demoSpin}
          onClick={handleDemoSpin}
          className="flex items-center space-x-1.5 rounded-lg bg-orange-500 px-4 py-2 font-sans text-xs font-black uppercase text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/20"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>{demoSpin ? "SPINNING..." : "TEST SPIN"}</span>
        </button>
      </div>
    </div>
  );
}
