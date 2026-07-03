CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE boxes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  total_opened INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boxes public read" ON boxes FOR SELECT USING (true);

CREATE TABLE box_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  box_id UUID REFERENCES boxes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  value DECIMAL(10,2) NOT NULL,
  rarity TEXT NOT NULL,
  probability DECIMAL(5,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE box_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Box items public read" ON box_items FOR SELECT USING (true);

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile only" ON profiles FOR ALL USING (auth.uid() = id);

CREATE TABLE unbox_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  box_id UUID REFERENCES boxes(id),
  item_id UUID REFERENCES box_items(id),
  item_name TEXT,
  item_rarity TEXT,
  item_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE unbox_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own results only" ON unbox_results FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES box_items(id),
  box_name TEXT,
  status TEXT DEFAULT 'pending',
  sell_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own inventory only" ON inventory FOR ALL USING (auth.uid() = user_id);

CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT,
  amount DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own transactions only" ON transactions FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE live_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT,
  box_name TEXT,
  item_name TEXT,
  item_rarity TEXT,
  item_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE live_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Live feed public" ON live_feed FOR SELECT USING (true);

CREATE TABLE battles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id),
  box_id UUID REFERENCES boxes(id),
  max_players INTEGER DEFAULT 2 CHECK (max_players BETWEEN 2 AND 4),
  status TEXT DEFAULT 'lobby',
  countdown_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE battle_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES box_items(id),
  item_name TEXT,
  item_rarity TEXT,
  item_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  username TEXT,
  total_wins INTEGER DEFAULT 0,
  total_value DECIMAL(12,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Battles public read" ON battles FOR SELECT USING (true);

ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own battle participants" ON battle_participants FOR ALL USING (auth.uid() = user_id);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard public read" ON leaderboard FOR SELECT USING (true);
