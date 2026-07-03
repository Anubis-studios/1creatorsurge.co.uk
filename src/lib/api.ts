import { Box, BoxItem, InventoryItem, Profile, Transaction, LiveFeedItem, Battle, ChatMessage } from "../types";
import { callFunction } from "./supabase";

export async function getBoxes(): Promise<Box[]> {
  const res = await fetch("/api/boxes");
  if (!res.ok) throw new Error("Failed to fetch boxes");
  return res.json();
}

export async function getBoxDetails(boxId: string): Promise<{ box: Box; items: BoxItem[] }> {
  const res = await fetch(`/api/boxes/${boxId}`);
  if (!res.ok) throw new Error("Failed to fetch box details");
  return res.json();
}

export async function getProfile(userId: string): Promise<Profile> {
  const res = await fetch(`/api/profile/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function updateProfile(userId: string, data: { username: string; shipping_address: string; avatar_url?: string }): Promise<Profile> {
  const res = await fetch("/api/profile/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      id: userId, 
      username: data.username, 
      shipping_address: data.shipping_address,
      avatar_url: data.avatar_url 
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update profile");
  }
  return res.json();
}

export async function openBox(boxId: string, userId: string): Promise<{ item: BoxItem; new_balance: number; loyalty_points: number }> {
  return callFunction<{ item: BoxItem; new_balance: number; loyalty_points: number }>("open-box", { box_id: boxId, user_id: userId });
}

export async function sellItem(itemId: string, userId: string): Promise<{ success: boolean; new_balance: number; message: string }> {
  return callFunction<{ success: boolean; new_balance: number; message: string }>("sell-item", { item_id: itemId, user_id: userId });
}

export async function requestPhysicalShipping(itemId: string | string[], userId: string, address: string): Promise<{ success: boolean; shipping_label: string; new_balance: number; message: string; requires_card_payment?: boolean; amount?: number }> {
  const bodyData = Array.isArray(itemId) 
    ? { item_ids: itemId, user_id: userId, address }
    : { item_id: itemId, user_id: userId, address };

  const res = await fetch("/api/shipping/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Shipping request failed");
  }
  return res.json();
}

export async function createShippingPaymentIntent(itemId: string | string[], userId: string, address: string): Promise<{ clientSecret: string; amount: number; requires_card_payment: boolean; is_live_stripe: boolean; publishableKey?: string }> {
  const bodyData = Array.isArray(itemId) 
    ? { item_ids: itemId, user_id: userId, address }
    : { item_id: itemId, user_id: userId, address };

  const res = await fetch("/api/shipping/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create shipping payment intent");
  }
  return res.json();
}

export async function confirmShippingPayment(itemId: string | string[], userId: string, address: string, paymentIntentId?: string): Promise<{ success: boolean; shipping_label: string; new_balance: number; message: string }> {
  const bodyData = Array.isArray(itemId) 
    ? { item_ids: itemId, user_id: userId, address, payment_intent_id: paymentIntentId }
    : { item_id: itemId, user_id: userId, address, payment_intent_id: paymentIntentId };

  const res = await fetch("/api/shipping/confirm-card-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to confirm shipping payment");
  }
  return res.json();
}

export async function submitWalletDeposit(userId: string, amount: number, method: string): Promise<{ success: boolean; new_balance: number; total_added: number; message: string }> {
  const res = await fetch("/api/wallet/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount, method })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Deposit failed");
  }
  return res.json();
}

export async function createCryptoDeposit(userId: string, amount: number, coin: string): Promise<{ success: boolean; transaction: Transaction; message: string }> {
  const res = await fetch("/api/wallet/crypto-deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount, coin })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create crypto deposit");
  }
  return res.json();
}

export async function confirmCryptoDeposit(userId: string, transactionId: string): Promise<{ success: boolean; new_balance: number; total_added: number; transaction: Transaction; message: string }> {
  const res = await fetch("/api/wallet/crypto-confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, transaction_id: transactionId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to verify crypto deposit");
  }
  return res.json();
}

export async function getInventory(userId: string): Promise<InventoryItem[]> {
  const res = await fetch(`/api/inventory/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const res = await fetch(`/api/transactions/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function getLiveFeed(): Promise<LiveFeedItem[]> {
  try {
    const res = await fetch("/api/live-feed");
    if (!res.ok) throw new Error("Failed to fetch live feed");
    return await res.json();
  } catch (error) {
    console.warn("Could not reach /api/live-feed. Returning mock feed items.", error);
    return [
      {
        id: "feed-fallback-1",
        username: "BoxMaster",
        box_name: "Tech Legends",
        item_name: "Wireless Mechanical Keyboard",
        item_rarity: "common",
        item_value: 30.00,
        created_at: new Date(Date.now() - 5000).toISOString()
      },
      {
        id: "feed-fallback-2",
        username: "SlickSlick",
        box_name: "Sneaker Vault",
        item_name: "Air Max Limited Retro",
        item_rarity: "epic",
        item_value: 390.00,
        created_at: new Date(Date.now() - 15000).toISOString()
      }
    ];
  }
}

export async function getLeaderboard(): Promise<any[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

// Battles Arena wrappers
export async function getBattles(): Promise<Battle[]> {
  const res = await fetch("/api/battles");
  if (!res.ok) throw new Error("Failed to fetch battles list");
  return res.json();
}

export async function createBattle(hostId: string, boxId: string, maxPlayers: number): Promise<Battle> {
  const res = await fetch("/api/battles/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host_id: hostId, box_id: boxId, max_players: maxPlayers })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create battle lobby");
  }
  return res.json();
}

export async function joinBattle(battleId: string, userId: string): Promise<Battle> {
  const res = await fetch("/api/battles/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ battle_id: battleId, user_id: userId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to join battle lobby");
  }
  return res.json();
}

// Custom Mini-Games triggers
export async function buyBingoCard(userId: string): Promise<any> {
  const res = await fetch("/api/games/bingo/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Bingo purchase failed");
  }
  return res.json();
}

export async function buyLotteryTicket(userId: string, chosenNumbers: number[]): Promise<any> {
  const res = await fetch("/api/games/lottery/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, chosen_numbers: chosenNumbers })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Lottery entry failed");
  }
  return res.json();
}

export async function triggerItemUpgrade(userId: string, itemId: string): Promise<any> {
  const res = await fetch("/api/games/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, item_id: itemId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Item upgrade failed");
  }
  return res.json();
}

export async function triggerJackpotMultiplier(userId: string, itemIds: string[], multiplier: number): Promise<any> {
  const res = await fetch("/api/games/jackpot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, item_ids: itemIds, multiplier })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Jackpot multiplier failed");
  }
  return res.json();
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  try {
    const res = await fetch("/api/chat");
    if (!res.ok) throw new Error("Failed to load chat messages");
    return await res.json();
  } catch (error) {
    console.warn("Could not reach /api/chat. Falling back to local/mock messages.", error);
    return [
      { id: "fallback-1", username: "System", text: "Welcome to SurgeBox Ultra Chat! Good luck on your unboxings!", timestamp: new Date().toISOString(), system: true },
      { id: "fallback-2", username: "HypeCoder", text: "Just pulled some sweet Retro Keycaps! Let's go!", timestamp: new Date(Date.now() - 4000).toISOString() }
    ];
  }
}

export async function sendChatMessage(username: string, text: string): Promise<ChatMessage> {
  try {
    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, text })
    });
    if (!res.ok) throw new Error("Failed to send message");
    return await res.json();
  } catch (error) {
    console.warn("Could not reach /api/chat/send. Echoing message locally.", error);
    return {
      id: "fallback-msg-" + Math.floor(100000 + Math.random() * 900000),
      username,
      text,
      timestamp: new Date().toISOString()
    };
  }
}

export async function claimDailyReward(userId: string): Promise<{ success: boolean; reward_amount: number; new_balance: number; streak: number; last_claim_date: string; profile: Profile }> {
  const res = await fetch("/api/profile/claim-daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to claim daily reward" }));
    throw new Error(err.error || "Failed to claim daily reward");
  }
  return res.json();
}

export async function createStripeSession(userId: string, amount: number, creditedAmount?: number): Promise<{ id: string; url: string; isMock: boolean }> {
  const res = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount, credited_amount: creditedAmount })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to create checkout session" }));
    throw new Error(err.error || "Failed to create checkout session");
  }
  return res.json();
}

export async function confirmStripeSession(userId: string, sessionId: string, amount?: number): Promise<{ success: boolean; new_balance: number; amount: number; already_processed?: boolean }> {
  const res = await fetch("/api/stripe/confirm-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, session_id: sessionId, amount })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to confirm payment session" }));
    throw new Error(err.error || "Failed to confirm payment session");
  }
  return res.json();
}

export async function playBingo(userId: string): Promise<{ success: boolean; bingo: any; matches: number; prize_won: number; new_balance: number }> {
  const res = await fetch("/api/games/bingo/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to purchase Bingo card" }));
    throw new Error(err.error || "Failed to purchase Bingo card");
  }
  return res.json();
}

export async function playLottery(userId: string, chosenNumbers: number[]): Promise<{ success: boolean; lottery: any; winning_numbers: number[]; matches: number; prize_won: number; new_balance: number }> {
  const res = await fetch("/api/games/lottery/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, chosen_numbers: chosenNumbers })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to play Lottery" }));
    throw new Error(err.error || "Failed to play Lottery");
  }
  return res.json();
}


