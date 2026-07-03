import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus, Sparkles, HelpCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please fill in email and password fields");
    }
    if (activeTab === 'signup' && !username.trim()) {
      return toast.error("Please choose a username for registration");
    }

    setIsProcessing(true);
    try {
      if (activeTab === 'login') {
        await login(email, password);
        toast.success("Welcome back to SurgeBox Ultra!");
      } else {
        await signup(email, username, password);
        toast.success("Account registered! Welcome to the SurgeBox Ultra matrix.");
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Authentication action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6 animate-fade-in font-sans">
      
      {/* Branding Header Banner */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider mb-2">
          <Sparkles className="h-3 w-3 text-orange-500 animate-pulse" />
          <span>SurgeBox Ultra Cryptographic Vault</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight italic text-white">
          SURGEBOX ULTRA AUTH
        </h2>
        <p className="text-xs text-white/50 font-mono">
          Enter credentials or build a new ledger account to enter the system.
        </p>
      </div>

      {/* Main Credentials Form Container */}
      <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              toast.info("Switched to Login portal");
            }}
            className={`py-2 text-center text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              toast.info("Switched to Registration portal");
            }}
            className={`py-2 text-center text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Address */}
          <div>
            <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-white/20 font-mono"
                placeholder="collector@example.com"
                required
              />
            </div>
          </div>

          {/* Username Input - ONLY for Signup */}
          {activeTab === 'signup' && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Choose Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-white/30 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-white/20 font-mono"
                  placeholder="NeonUnboxer"
                  required={activeTab === 'signup'}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder-white/20 font-mono"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 text-black py-3 font-sans text-xs font-black uppercase tracking-wider transition-all hover:bg-orange-400 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/20"
          >
            {activeTab === 'login' ? (
              <>
                <LogIn className="h-4 w-4 text-black" />
                <span>{isProcessing ? "SIGNING IN..." : "SECURE SIGN IN"}</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 text-black" />
                <span>{isProcessing ? "REGISTERING..." : "REGISTER ACCOUNT"}</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Neutral Legal Footer Links */}
      <div className="text-center text-[10px] text-white/40 font-sans uppercase font-bold tracking-wide">
        <span>By accessing your profile, you accept our standard </span>
        <a href="#terms" className="text-orange-400 hover:text-orange-300 transition-colors">Terms of Service</a>
        <span> and </span>
        <a href="#privacy" className="text-orange-400 hover:text-orange-300 transition-colors">Privacy Policy</a>
        <span> channels.</span>
      </div>

    </div>
  );
}
