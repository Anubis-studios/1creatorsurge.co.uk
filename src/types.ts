export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  balance: number;
  loyalty_points: number;
  tier: string;
  shipping_address?: string;
  created_at: string;
  last_claim_date?: string;
  last_claimed_at?: string;
  daily_streak?: number;
}

export interface Box {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  total_opened: number;
  created_at?: string;
}

export interface BoxItem {
  id: string;
  box_id: string;
  name: string;
  image_url: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  probability: number;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  box_name: string;
  status: 'pending' | 'inventory' | 'sold' | 'shipped' | 'processing' | 'in_transit' | 'delivered' | 'upgraded_lost' | 'upgraded_won' | 'jackpot_won' | 'jackpot_lost';
  sell_price: number;
  created_at: string;
  shipping_label?: string;
  item?: BoxItem; // Joined detail
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'unbox' | 'sell' | 'upgrade_win' | 'upgrade_loss' | 'bingo_buy' | 'bingo_win' | 'lottery_buy' | 'lottery_win' | 'shipping_fee' | 'battle_win' | 'jackpot_win' | 'jackpot_loss';
  amount: number;
  description: string;
  created_at: string;
  status?: 'pending' | 'completed';
}

export interface LiveFeedItem {
  id: string;
  username: string;
  box_name: string;
  item_name: string;
  item_rarity: string;
  item_value: number;
  created_at: string;
}

export interface Battle {
  id: string;
  host_id: string;
  box_id: string;
  max_players: number;
  status: 'lobby' | 'active' | 'completed';
  countdown_end_at?: string;
  winner_id?: string;
  created_at: string;
  box?: Box;
  participants: BattleParticipant[];
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  item_id?: string;
  item_name?: string;
  item_rarity?: string;
  item_value?: number;
  is_ready: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  system?: boolean;
  item_drop?: {
    item_name: string;
    rarity: string;
    value: number;
  };
}

export interface BingoState {
  id: string;
  user_id: string;
  card: number[][]; // 5x5 grid
  called_numbers: number[];
  progress: number; // percentage matches
  won: boolean;
  purchased_at: string;
}

export interface LotteryState {
  id: string;
  user_id: string;
  numbers: number[]; // 5 chosen numbers
  status: 'pending' | 'win' | 'lose';
  winning_numbers?: number[];
  matches_count?: number;
  win_value?: number;
  created_at: string;
}
