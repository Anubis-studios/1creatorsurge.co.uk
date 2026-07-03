import React from 'react';

export default function Loader({ message = "Loading Cyber Assets..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-orange-500/10 animate-pulse"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-b-amber-500/50 animate-spin" style={{ animationDirection: 'reverse' }}></div>
      </div>
      <p className="font-sans text-xs text-orange-500 uppercase tracking-widest font-black animate-pulse">{message}</p>
    </div>
  );
}
