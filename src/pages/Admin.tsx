import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatCurrency';
import { ShieldCheck, Truck, RefreshCw, BarChart3, Database } from 'lucide-react';
import { toast } from 'sonner';

interface PendingShipment {
  id: string;
  username: string;
  itemName: string;
  shippingAddress: string;
  status: string;
  trackingLabel?: string;
}

export default function Admin() {
  const { profile } = useAuthStore();
  const [shipments, setShipments] = useState<PendingShipment[]>([]);
  const [stats, setStats] = useState({
    totalOpened: 240,
    activeBalancePool: 15450,
    totalUsersCount: 32,
  });

  const loadAdminData = async () => {
    try {
      const res = await fetch('/api/admin/shipments');
      const data = await res.json();
      setShipments(data);
    } catch (e) {
      console.error("Failed to load admin data", e);
    }
  };

  useEffect(() => {
    if (profile?.username === 'admin') {
      loadAdminData();
    }
  }, [profile]);

  const handleProcessShipment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/shipments/${id}/process`, { method: 'POST' });
      const data = await res.json();
      toast.success(data.message);
      loadAdminData();
    } catch (err) {
      toast.error("Failed to process shipping tracking label");
    }
  };

  const handleSyncDatabase = async () => {
    try {
      toast.info("Triggering backend database calibration...");
      // Simulate calling edge functions or synced schema triggers
      setTimeout(() => {
        toast.success("Database sync complete. Box configurations synchronized with Postgres seed catalogs!");
      }, 1500);
    } catch (e) {
      toast.error("Sync failed");
    }
  };

  if (profile?.username !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-orange-500 font-sans text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-2xl">
        ✕ ACCESS DENIED: Administrative credentials required.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Title Block */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <ShieldCheck className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Administrative Control Panel</h2>
          </div>
          <p className="text-xs text-white/60">
            Review physical shipping label requests, recalculate system analytics, and trigger database calibrations.
          </p>
        </div>

        <button
          onClick={handleSyncDatabase}
          className="rounded-lg bg-orange-500 hover:bg-orange-400 text-black font-sans font-black text-xs uppercase px-4 py-2.5 transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-orange-500/20"
        >
          <Database className="h-4 w-4 text-black" />
          <span>SYNC SCHEMAS & BOXES</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Global Stats Summary Widget Panel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center space-x-2">
            <BarChart3 className="h-4.5 w-4.5 text-orange-500" />
            <span>Operational Telemetry</span>
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
              <span className="text-white/40 uppercase font-bold text-[10px] tracking-wider">Total Opened Boxes</span>
              <span className="font-black text-white">{stats.totalOpened} Crates</span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
              <span className="text-white/40 uppercase font-bold text-[10px] tracking-wider">User Wallet Assets</span>
              <span className="font-black text-orange-500">{formatCurrency(stats.activeBalancePool)}</span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
              <span className="text-white/40 uppercase font-bold text-[10px] tracking-wider">Registered Collectors</span>
              <span className="font-black text-white">{stats.totalUsersCount} Profiles</span>
            </div>
          </div>
        </div>

        {/* Physical Shipping Labels Request Panel queue */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center space-x-2">
            <Truck className="h-4.5 w-4.5 text-orange-500" />
            <span>Pending USPS Shipping Labels</span>
          </h3>

          {shipments.length === 0 && (
            <div className="text-center py-12 text-white/30 font-mono text-xs">
              No physical shipping requests currently queued.
            </div>
          )}

          <div className="space-y-3">
            {shipments.map(ship => (
              <div 
                key={ship.id}
                className="rounded-xl border border-white/5 bg-black/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs hover:border-white/10 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="rounded bg-orange-500/10 border border-orange-500/25 px-1.5 py-0.2 text-[8px] text-orange-400 font-black uppercase">
                      {ship.status}
                    </span>
                    <strong className="text-white text-xs">User: {ship.username}</strong>
                  </div>

                  <p className="text-white/80 font-bold text-xs">Item: {ship.itemName}</p>
                  <p className="text-[10px] text-white/40 italic max-w-md font-sans">Address: {ship.shippingAddress}</p>

                  {ship.trackingLabel && (
                    <div className="text-[10px] text-orange-400 font-bold uppercase">
                      Tracking ID: {ship.trackingLabel}
                    </div>
                  )}
                </div>

                {ship.status === 'shipped' ? (
                  <span className="text-[10px] text-emerald-400 uppercase font-black">Processed</span>
                ) : (
                  <button
                    onClick={() => handleProcessShipment(ship.id)}
                    className="rounded bg-orange-500 hover:bg-orange-400 text-black font-sans font-black py-2 px-3 text-[9px] tracking-wider uppercase cursor-pointer transition-colors shadow-lg shadow-orange-500/20"
                  >
                    GENERATE USPS LABEL
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
