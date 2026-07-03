import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout';
import Home from './pages/Home';
import BoxDetails from './pages/BoxDetails';
import BattleLobby from './components/BattleLobby';
import BattleRoom from './components/BattleRoom';
import Inventory from './pages/Inventory';
import WalletPage from './pages/WalletPage';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import Login from './pages/Login';
import MiniGames from './pages/MiniGames';
import SupabaseIntegration from './pages/SupabaseIntegration';

// Battle Arena page container routing lobby vs active room
function BattleArenaPage() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  if (activeRoomId) {
    return (
      <BattleRoom 
        battleId={activeRoomId} 
        onLeave={() => setActiveRoomId(null)} 
      />
    );
  }

  return <BattleLobby onJoinRoom={(id) => setActiveRoomId(id)} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/boxes/:id" element={<BoxDetails />} />
          <Route path="/battles" element={<BattleArenaPage />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/games" element={<MiniGames />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/supabase" element={<SupabaseIntegration />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <SpeedInsights />
    </BrowserRouter>
  );
}
