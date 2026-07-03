import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import ItemCard from '../components/ItemCard';
import ShippingCalculatorModal from '../components/ShippingCalculatorModal';
import { 
  Package, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  Truck, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Coins, 
  Flame, 
  X, 
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatCurrency';

export default function Inventory() {
  const { profile, refreshProfile } = useAuthStore();
  const { items, isLoading, fetchInventory, resell, shipItem, upgradeItemOnLine, playJackpotMultiplier } = useInventoryStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unboxed' | 'shipped' | 'sold'>('all');
  
  // Selection Mode state: determines whether checkboxes pool items for Shipping or the Jackpot game
  const [selectionMode, setSelectionMode] = useState<'shipping' | 'jackpot'>('shipping');

  // Filter & Sort states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('value_high');

  // Upgrader states
  const [selectedUpgradeItemId, setSelectedUpgradeItemId] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; message: string } | null>(null);

  // Shipping selection and calculator states
  const [selectedShipItemIds, setSelectedShipItemIds] = useState<string[]>([]);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [isShippingProcessing, setIsShippingProcessing] = useState(false);
  const [shippedBefore, setShippedBefore] = useState(false);

  // Jackpot Multiplier states
  const [selectedJackpotIds, setSelectedJackpotIds] = useState<string[]>([]);
  const [jackpotMultiplier, setJackpotMultiplier] = useState<number>(2.0);
  const [isRollingJackpot, setIsRollingJackpot] = useState<boolean>(false);
  const [jackpotRollProgress, setJackpotRollProgress] = useState<number>(0);
  const [jackpotResult, setJackpotResult] = useState<{ success: boolean; won: boolean; message: string; new_value?: number } | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchInventory(profile.id);

      // Check transactions list to see if user has ever shipped before
      fetch(`/api/transactions/${profile.id}`)
        .then(res => res.json())
        .then((txs: any[]) => {
          if (Array.isArray(txs)) {
            const hasShipped = txs.some(t => t.type === 'shipping_fee');
            setShippedBefore(hasShipped);
          }
        })
        .catch(err => console.error("Error checking shipped status:", err));
    }
  }, [profile?.id]);

  const handleSell = async (id: string) => {
    if (!profile) return;
    try {
      await resell(id, profile.id);
      toast.success("Item liquidated and balance credited successfully!");
      refreshProfile();
    } catch (e: any) {
      toast.error(e.message || "Resell failed");
    }
  };

  const handleShip = async (id: string) => {
    if (!profile) return;
    if (!profile.shipping_address) {
      return toast.error("Please configure your physical home delivery shipping address in Profile page first!");
    }
    setSelectedShipItemIds([id]);
    setIsShipModalOpen(true);
  };

  const handleBulkShipConfirm = async () => {
    if (!profile || selectedShipItemIds.length === 0) return;
    if (!profile.shipping_address) {
      return toast.error("Please configure your physical home delivery shipping address in Profile page first!");
    }

    setIsShippingProcessing(true);
    try {
      const res = await shipItem(selectedShipItemIds, profile.id, profile.shipping_address);
      if (res.requires_card_payment) {
        toast.info(`First-time shipment: Card Payment Required ($${res.amount?.toFixed(2)}). Emulating Stripe credit card validation...`);
        // Simulate card payment validation
        setTimeout(() => {
          toast.success("Card payment processed successfully! Shipping label created.");
          refreshProfile();
          if (profile?.id) {
            fetchInventory(profile.id);
          }
          // Update shippedBefore state
          fetch(`/api/transactions/${profile.id}`)
            .then(r => r.json())
            .then((txs: any[]) => {
              if (Array.isArray(txs)) {
                setShippedBefore(txs.some(t => t.type === 'shipping_fee'));
              }
            })
            .catch(err => console.error(err));
            
          setSelectedShipItemIds([]);
          setIsShipModalOpen(false);
          setIsShippingProcessing(false);
        }, 1500);
      } else {
        toast.success(`Successfully requested physical shipping for ${selectedShipItemIds.length} item(s)!`);
        refreshProfile();
        setSelectedShipItemIds([]);
        setIsShipModalOpen(false);
        setIsShippingProcessing(false);
      }
    } catch (e: any) {
      toast.error(e.message || "Bulk shipping request failed");
      setIsShippingProcessing(false);
    }
  };

  const handleUpgradeLauncher = async () => {
    if (!profile || !selectedUpgradeItemId) return;
    const item = items.find(i => i.id === selectedUpgradeItemId);
    if (!item) return;

    setIsUpgrading(true);
    setUpgradeResult(null);

    try {
      const res = await upgradeItemOnLine(profile.id, selectedUpgradeItemId);
      setUpgradeResult(res);
      refreshProfile();
      if (res.upgraded) {
        toast.success(`🎉 SUCCESS! Item upgraded with 1.5x worth scaling!`);
      } else {
        toast.error(`✕ Loss: Upgrade failed. Item incinerated.`);
      }
      setSelectedUpgradeItemId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger upgrader");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Jackpot Multiplier Launcher
  const handleJackpotSpin = async () => {
    if (!profile || selectedJackpotIds.length === 0) {
      return toast.error("Please select at least one active inventory item to risk!");
    }
    
    setIsRollingJackpot(true);
    setJackpotResult(null);
    setJackpotRollProgress(0);

    // Dynamic visual spin ticker simulation
    const duration = 1600;
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setJackpotRollProgress(Math.min((elapsed / duration) * 100, 100));
    }, interval);

    try {
      const res = await playJackpotMultiplier(profile.id, selectedJackpotIds, jackpotMultiplier);
      clearInterval(timer);
      setJackpotRollProgress(100);

      setTimeout(() => {
        setJackpotResult(res);
        setIsRollingJackpot(false);
        setSelectedJackpotIds([]); // Clear pooled items
        refreshProfile();
        if (res.won) {
          toast.success(`🎉 JACKPOT HIT! Won standard ${formatCurrency(res.new_value || 0)} upgraded item!`);
        } else {
          toast.error(`✕ Incinerated! Better luck next time.`);
        }
      }, 200);
    } catch (err: any) {
      clearInterval(timer);
      setIsRollingJackpot(false);
      toast.error(err.message || "Jackpot multiplier failed");
    }
  };

  // Helper to remove an item specifically from the jackpot pool
  const removeFromJackpot = (id: string) => {
    setSelectedJackpotIds(selectedJackpotIds.filter(x => x !== id));
  };

  // Filter items by tab
  const tabFilteredItems = items.filter(item => {
    if (activeTab === 'all') return item.status !== 'sold' && item.status !== 'upgraded_lost' && item.status !== 'jackpot_lost';
    if (activeTab === 'unboxed') return item.status === 'inventory';
    if (activeTab === 'shipped') return ['processing', 'in_transit', 'delivered'].includes(item.status);
    if (activeTab === 'sold') return item.status === 'sold';
    return true;
  });

  // Apply Search, Rarity Filter, and Sorters
  const processedItems = tabFilteredItems
    .filter(item => {
      if (!item.item) return false;
      const matchesSearch = item.item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = selectedRarity === 'all' || item.item.rarity.toLowerCase() === selectedRarity.toLowerCase();
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      const valA = a.item?.value || 0;
      const valB = b.item?.value || 0;
      const nameA = a.item?.name || '';
      const nameB = b.item?.name || '';
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (sortBy === 'value_high') return valB - valA;
      if (sortBy === 'value_low') return valA - valB;
      if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
      if (sortBy === 'name_desc') return nameB.localeCompare(nameA);
      if (sortBy === 'date_oldest') return dateA - dateB;
      return dateB - dateA; // default is newest
    });

  const selectedUpgradeItem = items.find(i => i.id === selectedUpgradeItemId);

  // Calculate combined value of items pooled in the jackpot
  const pooledJackpotItems = items.filter(i => selectedJackpotIds.includes(i.id));
  const pooledJackpotValue = pooledJackpotItems.reduce((sum, i) => sum + (i.item?.value || 0), 0);
  const projectedJackpotValue = pooledJackpotValue * jackpotMultiplier;
  const jackpotWinChance = (0.95 / jackpotMultiplier) * 100; // Provably fair 95% RTP

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper stats summary */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <Package className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">My Loot Inventory</h2>
          </div>
          <p className="text-xs text-white/60">
            View, liquidate, or ship your unboxed premium drops. Play dynamic mini-games to scale your worth!
          </p>
        </div>

        <div className="flex gap-4 text-xs font-sans">
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl min-w-[120px]">
            <span className="block text-white/40 uppercase font-bold text-[9px] tracking-wider">Total Won</span>
            <span className="block text-white font-black text-sm mt-0.5">{items.length} Drops</span>
          </div>
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl min-w-[140px]">
            <span className="block text-white/40 uppercase font-bold text-[9px] tracking-wider">Active Portfolio</span>
            <span className="block text-orange-500 font-black text-sm mt-0.5">
              {formatCurrency(items.filter(i => i.status === 'inventory').reduce((sum, i) => sum + (i.item?.value || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout split into Side Mini-games panel and Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Mini-Games Panel (Item Upgrader & Jackpot Multiplier) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Dynamic Item Upgrader Sandbox Module */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
              <Sparkles className="h-4.5 w-4.5 text-orange-500 animate-spin-slow" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                ★ Item Upgrader (45% Win)
              </h3>
            </div>

            <p className="text-[10px] text-white/40 leading-relaxed font-mono">
              Put any won item from your inventory on the line. Wins scale the item value by **1.5x** with a calibrated **45% probability chance**! Losses incinerate the item.
            </p>

            {/* Upgrader Box Area Slot */}
            <div className="relative rounded-xl border-2 border-dashed border-white/10 bg-black/40 p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
              {selectedUpgradeItem ? (
                <div className="space-y-3">
                  <img 
                    src={selectedUpgradeItem.item?.image_url} 
                    alt={selectedUpgradeItem.item?.name} 
                    className="h-20 w-20 object-contain mx-auto animate-pulse" 
                  />
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-white uppercase tracking-tight">{selectedUpgradeItem.item?.name}</span>
                    <span className="block text-xs font-mono font-black text-white/60">
                      Current worth: {formatCurrency(selectedUpgradeItem.item?.value || 0)}
                    </span>
                    <span className="block text-[10px] font-mono text-orange-400 font-black">
                      Upgraded worth: {formatCurrency(Number(((selectedUpgradeItem.item?.value || 0) * 1.5).toFixed(2)))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <AlertTriangle className="h-6 w-6 text-white/20 mx-auto animate-bounce" />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-wide">
                    No Item Placed
                  </p>
                  <p className="text-[9px] text-white/30 font-mono">
                    Click the Upgrader CTA buttons on cards below to slot your item here.
                  </p>
                </div>
              )}
            </div>

            {/* Upgrader Controls */}
            <button
              disabled={isUpgrading || !selectedUpgradeItemId}
              onClick={handleUpgradeLauncher}
              className="w-full rounded-lg bg-orange-500 py-3 font-sans text-xs font-black uppercase text-black transition-all hover:bg-orange-400 disabled:opacity-40 cursor-pointer shadow-lg shadow-orange-500/20"
            >
              {isUpgrading ? "CALIBRATING FIELD..." : "ENGAGE 45% UPGRADE"}
            </button>

            {upgradeResult && (
              <div className={`p-3 rounded-lg border text-center font-sans text-xs font-black uppercase tracking-wider ${
                upgradeResult.success && upgradeResult.message.includes("Success")
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 animate-bounce' 
                  : 'bg-red-500/10 border-red-500/25 text-red-500'
              }`}>
                {upgradeResult.message}
              </div>
            )}
          </div>

          {/* NEW 'Jackpot Multiplier' Mini-game Panel */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
              <Coins className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                🎰 Jackpot Multiplier
              </h3>
            </div>

            <p className="text-[10px] text-white/40 leading-relaxed font-mono">
              Risk single or multiple items from your inventory for a chance to multiply their total value. Provably Fair 95% RTP based on target multipliers!
            </p>

            {/* Jackpot Selection Segment Header helper */}
            <div className="flex justify-between items-center text-[10px] uppercase font-bold font-mono">
              <span className="text-white/40">Risk Pool</span>
              <button 
                onClick={() => {
                  setSelectedJackpotIds([]);
                  setJackpotResult(null);
                }}
                className="text-purple-400 hover:underline"
                disabled={isRollingJackpot || selectedJackpotIds.length === 0}
              >
                Clear Pool
              </button>
            </div>

            {/* Pooled Items Slot Showcase */}
            <div className="rounded-xl border border-white/5 bg-black/40 p-3 min-h-[110px] max-h-[170px] overflow-y-auto space-y-2">
              {pooledJackpotItems.length > 0 ? (
                pooledJackpotItems.map(invItem => (
                  <div key={invItem.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 text-xs">
                    <div className="flex items-center space-x-2">
                      <img src={invItem.item?.image_url} alt={invItem.item?.name} className="h-7 w-7 object-contain" />
                      <div className="font-mono">
                        <span className="block font-bold text-white line-clamp-1">{invItem.item?.name}</span>
                        <span className="block text-[10px] text-white/40">{formatCurrency(invItem.item?.value || 0)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromJackpot(invItem.id)}
                      className="text-white/40 hover:text-red-400 p-1 rounded hover:bg-white/5 cursor-pointer"
                      disabled={isRollingJackpot}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-1">
                  <Flame className="h-5 w-5 text-purple-400/20" />
                  <span className="text-[10px] uppercase font-bold font-sans text-white/30">Risk Pool Empty</span>
                  <span className="text-[9px] font-mono text-white/20">Check items in 'Jackpot Selection' mode below to pool them.</span>
                </div>
              )}
            </div>

            {/* Combined Valuation Section */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-3 rounded-xl border border-white/5">
              <div>
                <span className="block text-white/40 text-[9px] uppercase font-bold">Risk Worth</span>
                <span className="block text-white font-black text-sm mt-0.5">{formatCurrency(pooledJackpotValue)}</span>
              </div>
              <div className="text-right">
                <span className="block text-purple-400/60 text-[9px] uppercase font-bold">Target Multiplier</span>
                <span className="block text-purple-400 font-black text-sm mt-0.5">{jackpotMultiplier.toFixed(2)}x</span>
              </div>
            </div>

            {/* Target Multiplier Selection Controls */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-white/40">
                <span>Select Multiplier</span>
                <span className="text-emerald-400 font-black">{jackpotWinChance.toFixed(2)}% Win Chance</span>
              </div>

              {/* Multiplier Presets */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1.5, 2.0, 5.0, 10.0, 50.0].map(m => (
                  <button
                    key={m}
                    type="button"
                    disabled={isRollingJackpot}
                    onClick={() => {
                      setJackpotMultiplier(m);
                      setJackpotResult(null);
                    }}
                    className={`rounded-lg py-1 font-mono text-[10px] font-bold border transition-all cursor-pointer ${
                      jackpotMultiplier === m 
                        ? 'bg-purple-500 text-black border-purple-500 font-black shadow-lg shadow-purple-500/20' 
                        : 'border-white/5 text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {m}x
                  </button>
                ))}
              </div>

              {/* Multiplier Range Slider */}
              <input 
                type="range"
                min="1.5"
                max="100"
                step="0.5"
                value={jackpotMultiplier}
                disabled={isRollingJackpot}
                onChange={(e) => {
                  setJackpotMultiplier(parseFloat(e.target.value));
                  setJackpotResult(null);
                }}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-white/30 font-mono">
                <span>1.5x</span>
                <span>50x</span>
                <span>100x</span>
              </div>
            </div>

            {/* Win projections stats block */}
            <div className="bg-black/60 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-white/40">Potential Payout:</span>
              </div>
              <span className="text-emerald-400 font-black">{formatCurrency(projectedJackpotValue)}</span>
            </div>

            {/* Roll progress bar if rolling */}
            {isRollingJackpot && (
              <div className="space-y-1.5 animate-pulse">
                <div className="flex justify-between text-[9px] text-purple-400 font-mono font-bold uppercase">
                  <span>🛰️ SPINNING QUANTUM GRID...</span>
                  <span>{jackpotRollProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-75"
                    style={{ width: `${jackpotRollProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Spin CTA Button */}
            <button
              disabled={isRollingJackpot || selectedJackpotIds.length === 0}
              onClick={handleJackpotSpin}
              className="w-full rounded-lg bg-purple-500 py-3 font-sans text-xs font-black uppercase text-black transition-all hover:bg-purple-400 disabled:opacity-40 cursor-pointer shadow-lg shadow-purple-500/20"
            >
              {isRollingJackpot ? "SPINNING FIELD..." : `🎰 SPIN MULTIPLIER (${selectedJackpotIds.length} RISKED)`}
            </button>

            {/* Jackpot Results panel */}
            {jackpotResult && (
              <div className={`p-4 rounded-xl border text-center font-sans text-xs font-black uppercase tracking-wider ${
                jackpotResult.won 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 animate-bounce' 
                  : 'bg-red-500/10 border-red-500/25 text-red-500'
              }`}>
                <div className="flex justify-center mb-1.5">
                  {jackpotResult.won ? (
                    <Sparkles className="h-5 w-5 text-emerald-400 animate-spin-slow" />
                  ) : (
                    <Flame className="h-5 w-5 text-red-500 animate-pulse" />
                  )}
                </div>
                {jackpotResult.message}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Filters and Items showcase grid */}
        <div className="lg:col-span-8 space-y-6">

          {/* Collapsible/Sleek Search, Filter & Sort Sidebar Panel */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            
            <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-orange-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Filter & Sort Sidebar
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Filter 1: Search by Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-white/40 font-mono block">
                  Search Item
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search drops by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg bg-black/40 border border-white/5 py-2 pl-9 pr-4 text-xs font-mono text-white placeholder-white/35 focus:border-orange-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Filter 2: Filter by Rarity Tier */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-white/40 font-mono block">
                  Filter by Rarity
                </label>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-white/5 p-2 text-xs font-mono text-white focus:border-orange-500/50 focus:outline-none"
                >
                  <option value="all">💎 All Rarity Tiers</option>
                  <option value="common">⚪ Common</option>
                  <option value="rare">🔵 Rare</option>
                  <option value="epic">🟣 Epic</option>
                  <option value="legendary">🟠 Legendary</option>
                </select>
              </div>

              {/* Filter 3: Sorting Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-white/40 font-mono block">
                  Sort Items by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-white/5 p-2 text-xs font-mono text-white focus:border-orange-500/50 focus:outline-none"
                >
                  <option value="value_high">📈 Value: High to Low</option>
                  <option value="value_low">📉 Value: Low to High</option>
                  <option value="name_asc">🔤 Name: A-Z</option>
                  <option value="name_desc">🔤 Name: Z-A</option>
                  <option value="date_newest">📅 Date: Newest First</option>
                  <option value="date_oldest">📅 Date: Oldest First</option>
                </select>
              </div>

            </div>

          </div>

          {/* Showcase Items Section Grid */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 flex-wrap gap-2">
              
              {/* Filter Tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Active' },
                  { id: 'unboxed', label: 'Unboxed Keepers' },
                  { id: 'shipped', label: 'Shipped Home' },
                  { id: 'sold', label: 'Liquidated Logs' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`rounded-lg px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-orange-500 text-black border-orange-500 font-black' 
                        : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Action/Checkbox selection segment helper switcher */}
              {activeTab === 'unboxed' && (
                <div className="flex items-center space-x-2 bg-black/40 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => {
                      setSelectionMode('shipping');
                      setJackpotResult(null);
                    }}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                      selectionMode === 'shipping' 
                        ? 'bg-orange-500 text-black shadow-inner' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    📦 Ship Selection
                  </button>
                  <button 
                    onClick={() => {
                      setSelectionMode('jackpot');
                      setJackpotResult(null);
                    }}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all cursor-pointer ${
                      selectionMode === 'jackpot' 
                        ? 'bg-purple-500 text-black shadow-inner' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    🎰 Jackpot Selection
                  </button>
                </div>
              )}

              <span className="text-[10px] text-white/40 font-bold uppercase font-mono">
                Matches: <strong className="text-white/60">{processedItems.length} items</strong>
              </span>
            </div>

            {/* Bulk Shipping Controller Panel */}
            {activeTab === 'unboxed' && processedItems.length > 0 && selectionMode === 'shipping' && (
              <div className="rounded-xl border border-white/5 bg-black/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox"
                    checked={selectedShipItemIds.length === processedItems.length && processedItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedShipItemIds(processedItems.map(i => i.id));
                      } else {
                        setSelectedShipItemIds([]);
                      }
                    }}
                    className="h-4.5 w-4.5 rounded border-white/10 bg-zinc-900 text-orange-500 focus:ring-orange-500/50 cursor-pointer"
                    id="select-all-cargo"
                  />
                  <label htmlFor="select-all-cargo" className="text-xs font-bold text-white/80 cursor-pointer select-none">
                    Select All Cargo ({processedItems.length} items)
                  </label>
                </div>

                {selectedShipItemIds.length > 0 && (
                  <button
                    onClick={() => setIsShipModalOpen(true)}
                    className="rounded-lg bg-orange-500 text-black hover:bg-orange-400 px-5 py-2 font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/20 animate-scale-up animate-pulse"
                  >
                    Bulk Ship ({selectedShipItemIds.length} Selected)
                  </button>
                )}
              </div>
            )}

            {/* Bulk Jackpot Multiplier Selection Helper */}
            {activeTab === 'unboxed' && processedItems.length > 0 && selectionMode === 'jackpot' && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-950/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox"
                    checked={selectedJackpotIds.length === processedItems.length && processedItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedJackpotIds(processedItems.map(i => i.id));
                      } else {
                        setSelectedJackpotIds([]);
                      }
                    }}
                    className="h-4.5 w-4.5 rounded border-purple-500/20 bg-zinc-900 text-purple-400 focus:ring-purple-500/50 cursor-pointer"
                    id="select-all-jackpot"
                  />
                  <label htmlFor="select-all-jackpot" className="text-xs font-bold text-purple-300 cursor-pointer select-none">
                    Select All Active Pool ({processedItems.length} items)
                  </label>
                </div>

                {selectedJackpotIds.length > 0 && (
                  <span className="text-xs font-bold font-mono text-purple-400">
                    {selectedJackpotIds.length} Pooled — Scroll to Left Game to Spin!
                  </span>
                )}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-orange-500 border-white/10"></div>
              </div>
            )}

            {!isLoading && processedItems.length === 0 && (
              <div className="text-center py-20 font-mono text-white/30 text-xs">
                No virtual items found matching filters.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedItems.map(item => (
                <div key={item.id}>
                  <ItemCard 
                    item={item} 
                    onSell={handleSell}
                    onShip={handleShip}
                    isSelectable={item.status === 'inventory'}
                    isSelected={selectionMode === 'shipping' ? selectedShipItemIds.includes(item.id) : selectedJackpotIds.includes(item.id)}
                    onSelectToggle={(id) => {
                      if (selectionMode === 'shipping') {
                        if (selectedShipItemIds.includes(id)) {
                          setSelectedShipItemIds(selectedShipItemIds.filter(x => x !== id));
                        } else {
                          setSelectedShipItemIds([...selectedShipItemIds, id]);
                        }
                      } else {
                        if (selectedJackpotIds.includes(id)) {
                          setSelectedJackpotIds(selectedJackpotIds.filter(x => x !== id));
                        } else {
                          setSelectedJackpotIds([...selectedJackpotIds, id]);
                        }
                      }
                    }}
                    onUpgrade={(id) => {
                      setSelectedUpgradeItemId(id);
                      setUpgradeResult(null);
                      toast.success("Item placed on upgrader! Scroll up to review.");
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Bulk Shipping Calculator Modal */}
      <ShippingCalculatorModal
        isOpen={isShipModalOpen}
        onClose={() => {
          setIsShipModalOpen(false);
          setSelectedShipItemIds([]);
        }}
        onConfirm={handleBulkShipConfirm}
        selectedItems={items.filter(i => selectedShipItemIds.includes(i.id))}
        walletBalance={profile?.balance || 0}
        shippedBefore={shippedBefore}
        isProcessing={isShippingProcessing}
      />
    </div>
  );
}
