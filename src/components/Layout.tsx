import React, { useEffect, useState, useRef } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuthStore } from '../store/useAuthStore';
import { getChatMessages, sendChatMessage, getLiveFeed } from '../lib/api';
import { ChatMessage, LiveFeedItem } from '../types';
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, loadProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveFeedDrops, setLiveFeedDrops] = useState<LiveFeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'drops'>('chat');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-redirect if not logged in
  useEffect(() => {
    if (!isLoading && !profile && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [profile, isLoading, location.pathname, navigate]);

  const fetchChatAndDrops = async () => {
    try {
      const chat = await getChatMessages();
      setMessages(chat);
      const drops = await getLiveFeed();
      setLiveFeedDrops(drops);
    } catch (e) {
      console.error("Failed to fetch chat logs", e);
    }
  };

  useEffect(() => {
    loadProfile();
    fetchChatAndDrops();
    // Refresh periodically
    const interval = setInterval(() => {
      fetchChatAndDrops();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const username = profile ? profile.username : "GuestUnboxer";
    try {
      const newMsg = await sendChatMessage(username, chatInput);
      setMessages(prev => [...prev, newMsg]);
      setChatInput('');
    } catch (err) {
      toast.error("Message send failed");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050507] text-white font-sans">
      
      {/* Toast Notification Provider */}
      <Toaster position="top-right" theme="dark" closeButton />

      {/* Top Bar Header */}
      <Navbar />

      {/* Main Structural Layout Split */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Drawer Desktop Rail */}
        <Sidebar />

        {/* Center Main App Stage */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 lg:pb-8 relative">
          {/* Atmosphere Ambient Glow in the background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/10 blur-[150px] rounded-full -z-10 pointer-events-none animate-pulse duration-[6000ms]"></div>
          {children}
        </main>

        {/* Right Live Stream Sidebar Chat & Drops Feed */}
        <aside className="hidden xl:flex flex-col w-80 border-l border-white/5 bg-black/20 shrink-0">
          
          {/* Tabs Selector Header */}
          <div className="grid grid-cols-2 border-b border-white/5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3.5 font-sans text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center space-x-1.5 border-b-2 ${
                activeTab === 'chat' 
                  ? 'border-orange-500 text-orange-400 bg-white/5' 
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
              <span>LIVE CHAT</span>
            </button>

            <button
              onClick={() => setActiveTab('drops')}
              className={`py-3.5 font-sans text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center space-x-1.5 border-b-2 ${
                activeTab === 'drops' 
                  ? 'border-purple-500 text-purple-400 bg-white/5' 
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>LIVE DROPS</span>
            </button>
          </div>

          {/* Active Tab Viewport Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {activeTab === 'chat' ? (
              <>
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      msg.system 
                        ? 'bg-orange-500/10 border-orange-500/20 text-white' 
                        : msg.username === 'System Drop Alert' 
                        ? 'bg-purple-500/10 border-purple-500/20 text-white font-medium'
                        : 'bg-white/5 border-white/5 text-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className={`text-[10px] font-black tracking-wider uppercase ${
                        msg.system 
                          ? 'text-orange-400' 
                          : msg.username === 'System Drop Alert' 
                          ? 'text-purple-400'
                          : 'text-orange-400'
                      }`}>
                        {msg.username}
                      </strong>
                      <span className="text-[9px] font-mono text-white/30">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
                <div ref={chatBottomRef}></div>
              </>
            ) : (
              <>
                {liveFeedDrops.map((drop) => {
                  const rarityBadge = {
                    common: 'border-white/10 text-white/40 bg-white/5',
                    rare: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
                    epic: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
                    legendary: 'border-orange-500/40 text-orange-400 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.15)]',
                  }[drop.item_rarity] || 'border-white/10 text-white/40';

                  return (
                    <div 
                      key={drop.id} 
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 bg-white/5 border-white/5 hover:border-white/10 transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-white/60">
                          {drop.username}
                        </span>
                        <span className="text-[9px] text-white/30 font-mono">
                          {drop.box_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[140px]">
                          {drop.item_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${rarityBadge}`}>
                          ${drop.item_value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Chat Messaging Form Input Footer */}
          {activeTab === 'chat' && (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/40 flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={profile ? "Type a chat message..." : "Connect wallet to chat..."}
                disabled={!profile}
                className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!profile || !chatInput.trim()}
                className="p-2 rounded-lg bg-orange-500 text-black hover:bg-orange-400 transition-all disabled:opacity-40 shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}

        </aside>
      </div>

      {/* Responsive Mobile Navigation Footer Bar */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-t border-white/10 py-3 px-4 flex items-center justify-around">
        <a href="/" className="flex flex-col items-center text-white/60 hover:text-orange-500 transition-colors">
          <span className="text-[10px] font-sans font-black uppercase tracking-wider">Dashboard</span>
        </a>
        <a href="/battles" className="flex flex-col items-center text-white/60 hover:text-orange-500 transition-colors">
          <span className="text-[10px] font-sans font-black uppercase tracking-wider">Arena</span>
        </a>
        <a href="/inventory" className="flex flex-col items-center text-white/60 hover:text-orange-500 transition-colors">
          <span className="text-[10px] font-sans font-black uppercase tracking-wider">Inventory</span>
        </a>
        <a href="/games" className="flex flex-col items-center text-white/60 hover:text-orange-500 transition-colors">
          <span className="text-[10px] font-sans font-black uppercase tracking-wider">Arcade</span>
        </a>
        <a href="/wallet" className="flex flex-col items-center text-white/60 hover:text-orange-500 transition-colors">
          <span className="text-[10px] font-sans font-black uppercase tracking-wider">Wallet</span>
        </a>
      </footer>

    </div>
  );
}
