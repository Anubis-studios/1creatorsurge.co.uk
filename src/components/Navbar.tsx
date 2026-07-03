import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Wallet, Award, Settings, User, LogOut, ShieldAlert, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Navbar() {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 flex items-center justify-between shrink-0">
      
      {/* Brand Logo Identity */}
      <div 
        onClick={() => navigate("/")}
        className="flex items-center space-x-3 cursor-pointer select-none group"
      >
        <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-black text-black text-lg shadow-lg shadow-orange-500/20 transform group-hover:scale-105 transition-all">
          S
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-tighter uppercase italic text-white leading-none">
            SurgeBox <span className="text-orange-500">Ultra</span>
          </span>
          <span className="font-mono text-[9px] font-black tracking-widest text-orange-400 leading-none uppercase mt-0.5">
            HUB CONTROL
          </span>
        </div>
      </div>

      {/* Wallet Balance, Loyalty Resources, Profile Indicator */}
      <div className="flex items-center space-x-4">
        
        {/* Wallet Balance Payout */}
        {profile && (
          <div 
            className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-3"
            title="Active balance. Click to deposit funds!"
          >
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest leading-none">Balance</span>
              <span className="font-mono text-sm md:text-base font-bold text-green-400 mt-0.5 leading-none">
                {formatCurrency(profile.balance)}
              </span>
            </div>
            <button 
              onClick={() => navigate("/wallet")}
              className="bg-green-500 hover:bg-green-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-black cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
        )}

        {/* Loyalty Point Tracker */}
        {profile && (
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-full border border-white/5 bg-white/5" title="Earned Loyalty Resources">
            <Award className="h-4 w-4 text-orange-500" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider leading-none">Loyalty</span>
              <span className="font-mono text-xs font-black text-orange-400 mt-0.5 leading-none">
                {profile.loyalty_points} XP
              </span>
            </div>
          </div>
        )}

        {/* Admin Shortcut Quick Flag */}
        {profile?.username === 'admin' && (
          <Link 
            to="/admin" 
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full font-mono text-[10px] text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>ADMIN MODE</span>
          </Link>
        )}

        {/* User Account Controls */}
        {profile ? (
          <div className="flex items-center space-x-3">
            <div 
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{profile.username}</p>
                <p className="text-[10px] text-orange-500 uppercase font-black tracking-tighter leading-none mt-0.5">
                  Level {Math.max(1, Math.min(100, Math.floor(profile.loyalty_points / 40) + 1))}
                </p>
              </div>
              <img 
                src={profile.avatar_url} 
                alt={profile.username} 
                className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full border-2 border-white/20 shadow-lg shadow-orange-500/20 object-cover group-hover:scale-105 transition-transform"
              />
            </div>

            {/* Logout Trigger */}
            <button 
              onClick={() => {
                logout();
                toast.success("Successfully logged out.");
                navigate("/login");
              }}
              className="p-1.5 rounded-full border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 hover:bg-white/5 transition-all"
              title="Logout Account"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate("/login")}
            className="rounded-full bg-orange-500 hover:bg-orange-400 text-black font-black text-xs px-5 py-2.5 shadow-lg shadow-orange-500/20 uppercase transition-all"
          >
            CONNECT WALLET
          </button>
        )}

      </div>
    </header>
  );
}
