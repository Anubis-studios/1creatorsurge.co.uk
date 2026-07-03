import React, { useEffect, useState } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBoxesStore } from '../store/useBoxesStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Swords, Plus, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BattleLobby({ onJoinRoom }: { onJoinRoom: (id: string) => void }) {
  const { battles, isLoading, fetchBattles, createRoom } = useBattleStore();
  const { profile } = useAuthStore();
  const { boxes, fetchBoxes } = useBoxesStore();

  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBattles();
    fetchBoxes();
    const timer = setInterval(() => {
      fetchBattles();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error("Please log in first to host battles");
    if (!selectedBoxId) return toast.error("Please choose a battle target box");

    const box = boxes.find(b => b.id === selectedBoxId);
    if (box && profile.balance < box.price) {
      return toast.error(`Insufficient balance. Crate cost is ${formatCurrency(box.price)}`);
    }

    setIsCreating(true);
    try {
      const room = await createRoom(profile.id, selectedBoxId, maxPlayers);
      toast.success("Battle lobby hosted successfully!");
      onJoinRoom(room.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to host battle");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (id: string) => {
    if (!profile) return toast.error("Log in to enter the battle arena");
    try {
      onJoinRoom(id);
    } catch (e: any) {
      toast.error(e.message || "Could not join lobby");
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Hero Block */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <Swords className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Multiplayer Battle Arena</h2>
          </div>
          <p className="text-xs text-white/60 max-w-xl">
            Enter competitive unboxing rooms. The highest value unboxed drop takes the round, securing an additional **1.25x drop payout multiplier**!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Host/Create Room Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2">
            Host Battle Arena Lobby
          </h3>
          
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Select Battle Crate Target
              </label>
              <select
                value={selectedBoxId}
                onChange={(e) => setSelectedBoxId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                required
              >
                <option value="" className="bg-[#0A0A0F]">-- Choose Box --</option>
                {boxes.map(b => (
                  <option key={b.id} value={b.id} className="bg-[#0A0A0F]">
                    {b.name} ({formatCurrency(b.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Maximum Opponents
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`rounded-lg border py-1.5 font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      maxPlayers === num 
                        ? 'bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/20' 
                        : 'border-white/10 text-white/40 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    {num} Players
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 py-3 font-sans text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-orange-400 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/20"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <Plus className="h-4 w-4 text-black" />
              )}
              <span>HOST STREAM MATCH</span>
            </button>
          </form>
        </div>

        {/* Live Active Lobbies */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2">
            Active Battle Queues
          </h3>

          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto" />}

          {!isLoading && battles.length === 0 && (
            <div className="text-center py-12 text-white/30 font-mono text-xs">
              No active battle lobbies queued up. Be the first to host!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {battles.map(battle => {
              const boxPrice = battle.box?.price || 0;
              return (
                <div 
                  key={battle.id}
                  className="rounded-xl border border-white/5 bg-black/40 p-4 flex flex-col justify-between space-y-3 transition-colors hover:border-orange-500/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{battle.box?.name || "Premium Crate"}</h4>
                      <div className="flex items-center space-x-1 font-mono text-xs text-orange-400 font-bold">
                        <span>Entry:</span>
                        <span>{formatCurrency(boxPrice)}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-sans font-black uppercase tracking-wider border ${
                      battle.status === 'lobby' 
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {battle.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-white/40">
                    <div className="flex items-center space-x-1 font-sans font-black text-[10px] uppercase">
                      <Users className="h-3.5 w-3.5 text-white/30" />
                      <span>{battle.participants.length} / {battle.max_players} Players</span>
                    </div>
                    <span className="text-[10px] font-sans uppercase font-bold text-white/30">Host: {battle.participants[0]?.username}</span>
                  </div>

                  <button
                    disabled={battle.status !== 'lobby'}
                    onClick={() => handleJoin(battle.id)}
                    className="w-full rounded-lg bg-orange-500 text-black py-2.5 font-sans text-xs font-black uppercase tracking-wider transition-colors hover:bg-orange-400 disabled:opacity-40 cursor-pointer shadow-lg shadow-orange-500/20"
                  >
                    {battle.status === 'lobby' ? 'ENTER FIGHT' : 'WATCHING'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
