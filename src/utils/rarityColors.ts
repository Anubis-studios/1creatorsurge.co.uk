export interface RarityStyle {
  border: string;
  text: string;
  bg: string;
  glow: string;
  gradient: string;
  badge: string;
}

export const rarityStyles: Record<string, RarityStyle> = {
  common: {
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    bg: 'bg-slate-900/40',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
    gradient: 'from-slate-800 to-slate-950',
    badge: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  },
  rare: {
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    bg: 'bg-blue-950/20',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    gradient: 'from-blue-900/40 to-slate-950',
    badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  },
  epic: {
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    bg: 'bg-purple-950/20',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
    gradient: 'from-purple-900/40 to-slate-950',
    badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  },
  legendary: {
    border: 'border-amber-500/60',
    text: 'text-amber-400 font-semibold',
    bg: 'bg-amber-950/25',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.55)]',
    gradient: 'from-amber-900/40 to-slate-950',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
};

export function getRarityStyle(rarity: string = 'common'): RarityStyle {
  return rarityStyles[rarity.toLowerCase()] || rarityStyles.common;
}
