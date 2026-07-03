import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { updateProfile } from '../lib/api';
import DailyRewards from '../components/DailyRewards';
import { User, MapPin, Award, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { profile, refreshProfile } = useAuthStore();

  const [username, setUsername] = useState(profile?.username || '');
  const [shippingAddress, setShippingAddress] = useState(profile?.shipping_address || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error("Please login first");

    setIsUpdating(true);
    try {
      const updated = await updateProfile(profile.id, {
        username,
        shipping_address: shippingAddress,
        avatar_url: avatarUrl
      });
      toast.success("Profile saved successfully!");
      refreshProfile();
    } catch (err: any) {
      toast.error("Profile save failed");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-white/40 font-sans text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-2xl">
        Connect your wallet to configure personal profile metrics.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Upper summary card banner */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

        <img 
          src={profile.avatar_url} 
          alt={profile.username} 
          className="h-16 w-16 rounded-2xl border-2 border-orange-500 bg-black/40"
        />
        <div className="text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <h2 className="font-sans text-xl font-black uppercase tracking-tight italic text-white">{profile.username}</h2>
            <span className="rounded bg-orange-500/10 border border-orange-500/25 px-2.5 py-0.5 font-sans text-[9px] text-orange-400 font-black uppercase tracking-wider">
              LEVEL {Math.floor(profile.loyalty_points / 100) + 1}
            </span>
          </div>
          <p className="text-xs text-white/60 font-mono">
            Loyalty point resources: **{profile.loyalty_points}** • Profile Registered
          </p>
        </div>
      </div>

      {/* Daily Reward Arena Section */}
      <DailyRewards />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Milestone Badge listings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center space-x-1.5">
            <Award className="h-4 w-4 text-orange-500" />
            <span>Unboxer Milestones</span>
          </h3>

          <div className="space-y-3 font-sans text-[11px]">
            <div className="p-3 rounded-lg border border-white/5 bg-black/40 flex items-center justify-between">
              <div>
                <span className="block text-white/60 font-bold uppercase">VIP Platinum</span>
                <span className="text-[9px] text-white/40">Unboxed &gt; 100 boxes</span>
              </div>
              <span className="text-white/30 font-bold uppercase text-[9px]">Locked</span>
            </div>

            <div className="p-3 rounded-lg border border-white/5 bg-black/40 flex items-center justify-between">
              <div>
                <span className="block text-white/60 font-bold uppercase">Arena Glider</span>
                <span className="text-[9px] text-white/40">Won first battle match</span>
              </div>
              <span className="text-white/30 font-bold uppercase text-[9px]">Locked</span>
            </div>

            <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 flex items-center justify-between">
              <div>
                <span className="block text-orange-400 font-black uppercase">Early Adopter</span>
                <span className="text-[9px] text-orange-400/70">Joined during launch</span>
              </div>
              <span className="text-orange-400 font-extrabold text-[9px] uppercase tracking-wider">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Profile configuration Form */}
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider border-b border-white/5 pb-2">
            Configure Personal Credentials & Shipping Address
          </h3>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                  Unbox Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                  Avatar Image URL
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Physical home delivery shipping address (For USPS Shipping requests)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                <textarea
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  placeholder="123 Cosmic Way, Sector 7, Cyber City, NY 10001, United States"
                  required
                />
              </div>
              <span className="block text-[9px] font-sans text-white/30 mt-1 uppercase font-bold">
                Ensure correctness. Home shipment requests require valid USPS-compliant delivery labels to route physically.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="rounded-lg bg-orange-500 text-black hover:bg-orange-400 font-sans text-xs font-black uppercase px-6 py-3 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-orange-500/20"
              >
                {isUpdating ? "SAVING CHANGES..." : "SAVE PROFILE"}
              </button>
            </div>
          </form>
        </div>

       </div>
    </div>
  );
}
