import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Swords, Package, CreditCard, User, HelpCircle, Shield, Sparkles, MessageSquare, Award, Gamepad2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Sidebar() {
  const { profile } = useAuthStore();

  const links = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/battles", icon: Swords, label: "Battle Arena" },
    { to: "/inventory", icon: Package, label: "My Inventory" },
    { to: "/games", icon: Gamepad2, label: "Arcade Games" },
    { to: "/wallet", icon: CreditCard, label: "Wallet & ledger" },
    { to: "/leaderboard", icon: Award, label: "Leaderboards" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="hidden lg:flex flex-col justify-between w-64 border-r border-white/5 bg-black/20 py-6 px-4 shrink-0">
      
      {/* Navigation Links List */}
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="block px-3 text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">
            Navigation Frame
          </span>

          <nav className="space-y-1 pt-2">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center space-x-3 rounded-xl px-3 py-2.5 font-mono text-xs font-bold transition-all border
                  ${isActive 
                    ? 'bg-white/5 text-orange-400 border-white/10 shadow-[0_0_15px_rgba(249,115,22,0.05)] font-black' 
                    : 'text-white/40 hover:text-white hover:bg-white/5 border-transparent'
                  }
                `}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Live Active Chat Status banner widget */}
        <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-mono text-[10px] text-orange-400 font-black uppercase">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-orange-500" />
            <span>Join SurgeBox Ultra</span>
          </div>
          <p className="text-[10px] text-white/40 font-medium">
            Join using code <strong className="text-orange-400">SURGEBOX</strong> to claim your welcome rewards!
          </p>
        </div>
      </div>

      {/* Footer / Copyright / Version info */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        {profile?.username === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `
              flex items-center space-x-3 rounded-xl px-3 py-2 text-xs font-mono font-bold transition-all
              ${isActive 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : 'text-white/40 hover:text-red-400 border border-transparent'
              }
            `}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>ADMINISTRATIVE</span>
          </NavLink>
        )}

        <div className="px-3">
          <span className="block font-mono text-[9px] text-white/30 font-bold uppercase tracking-wider">
            SYSTEM VERSION 2.4.0
          </span>
          <span className="block text-[9px] text-white/40 font-medium mt-0.5">
            SurgeBox Ultra © 2026.
          </span>
        </div>
      </div>

    </aside>
  );
}
