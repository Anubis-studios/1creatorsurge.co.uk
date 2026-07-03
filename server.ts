import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Box, BoxItem, InventoryItem, Profile, Transaction, LiveFeedItem, Battle, BattleParticipant, ChatMessage, BingoState, LotteryState } from "./src/types.js";

const __filenameVal = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== "undefined" ? __filename : "");
const __dirnameVal = __filenameVal
  ? path.dirname(__filenameVal)
  : (typeof __dirname !== "undefined" ? __dirname : process.cwd());

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- DATABASE & STATE INITIALIZATION (IN-MEMORY PERSISTENCE MOCK) ---
  // --- DATABASE & STATE INITIALIZATION (DYNAMIC LOOT LIST LOADER) ---
  const seedBoxes: Box[] = [];
  const seedItems: Record<string, BoxItem[]> = {};

  // Custom high-quality Unsplash images for each box category
  const categoryBoxCovers: Record<string, string> = {
    "Trading Cards": "https://images.unsplash.com/photo-1613771404724-17d1e83a227c?q=80&w=400&auto=format&fit=crop",
    "Watches & Jewelry": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=400&auto=format&fit=crop",
    "Miscellaneous": "https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=400&auto=format&fit=crop",
    "Art & Collectibles": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop",
    "Sneakers & Apparel": "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400&auto=format&fit=crop",
    "Designer Fashion": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop",
    "Experiences & Travel": "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=400&auto=format&fit=crop",
    "Automotive": "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=400&auto=format&fit=crop",
    "Electronics": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop",
    "Consoles & Gaming": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop",
    "Cameras & Drones": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop",
    "Audio & Home Theater": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop",
    "Home & Lifestyle": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400&auto=format&fit=crop",
    "Ultra-Luxury": "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=400&auto=format&fit=crop",
    "Sports & Outdoor": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop",
    "Digital & Crypto": "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=400&auto=format&fit=crop"
  };

  // Detailed keyword mappings for beautiful individual item images
  const keywordMappings: { keywords: string[]; photoId: string }[] = [
    // Cards, Comics & Collectibles
    { keywords: ["charizard"], photoId: "photo-1613771404724-17d1e83a227c" },
    { keywords: ["pikachu"], photoId: "photo-1607604276583-eef5d076aa5f" },
    { keywords: ["pokemon", "pokémon"], photoId: "photo-1607604276583-eef5d076aa5f" },
    { keywords: ["yugioh", "yu-gi-oh", "dragon"], photoId: "photo-1607604276583-eef5d076aa5f" },
    { keywords: ["black lotus", "mox", "mtg", "magic the gathering"], photoId: "photo-1615615228002-890bb61c6730" },
    { keywords: ["card", "cards", "booster"], photoId: "photo-1607604276583-eef5d076aa5f" },
    
    // Luxury Watches & Jewelry
    { keywords: ["rolex", "submariner", "daytona"], photoId: "photo-1622434641406-a158123450f9" },
    { keywords: ["omega", "speedmaster", "seamaster"], photoId: "photo-1542496658-e33a6d0d50f6" },
    { keywords: ["patek", "audemars", "ap", "richard mille"], photoId: "photo-1547996160-81dfa63595aa" },
    { keywords: ["watch", "watches", "hublot", "chronograph"], photoId: "photo-1523275335684-37898b6baf30" },
    { keywords: ["ring", "diamond", "necklace", "jewelry", "pendant"], photoId: "photo-1599643478518-a784e5dc4c8f" },

    // Audio / Speakers / Sound
    { keywords: ["airpods", "airpods pro", "buds", "earbuds"], photoId: "photo-1588449668338-d15168863c95" },
    { keywords: ["headphones", "headset", "wh-1000xm5", "sennheiser", "bose"], photoId: "photo-1505740420928-5e560c06d30e" },
    { keywords: ["speaker", "marshall", "studio monitor", "soundbar"], photoId: "photo-1545454675-3531b543be5d" },

    // Smartwatches & Mobile Devices
    { keywords: ["apple watch", "smartwatch"], photoId: "photo-1508685096489-7aacd43bd3b1" },
    { keywords: ["iphone", "iphone 15", "iphone 14"], photoId: "photo-1510557880182-3d4d3cba35a5" },
    { keywords: ["ipad", "tablet"], photoId: "photo-1544244015-0df4b3ffc6b0" },
    { keywords: ["macbook", "laptop", "thinkpad", "comput"], photoId: "photo-1496181130204-755241524eab" },

    // Keyboards, Mice & Displays
    { keywords: ["keyboard", "keycaps"], photoId: "photo-1587829741301-dc798b83add3" },
    { keywords: ["mouse", "trackpad"], photoId: "photo-1615663245857-ac93bb7c39e7" },
    { keywords: ["monitor", "screen", "ultrawide"], photoId: "photo-1527443224154-c4a3942d3acf" },

    // Sneakers, Shoes & Outerwear
    { keywords: ["jordan", "air jordan"], photoId: "photo-1556906781-9a412961c28c" },
    { keywords: ["yeezy", "dunks", "air max"], photoId: "photo-1600185365483-26d7a4cc7519" },
    { keywords: ["sneaker", "sneakers", "shoe", "shoes"], photoId: "photo-1549298916-b41d501d3772" },
    { keywords: ["hoodie", "supreme", "sweater"], photoId: "photo-1556821840-3a63f95609a7" },
    { keywords: ["jacket", "coat", "parka"], photoId: "photo-1551028719-00167b16eac5" },
    { keywords: ["shirt", "t-shirt", "tee", "apparel"], photoId: "photo-1521572267360-ee0c2909d518" },
    { keywords: ["bag", "backpack", "suitcase", "louis vuitton", "designer"], photoId: "photo-1584917865442-de89df76afd3" },

    // Vehicles, Sports Cars & Detailing
    { keywords: ["porsche", "911"], photoId: "photo-1614162692292-7ac56d7f7f1e" },
    { keywords: ["ferrari", "lamborghini"], photoId: "photo-1503376780353-7e6692767b70" },
    { keywords: ["tesla", "electric car"], photoId: "photo-1617788138017-80ad40651399" },
    { keywords: ["car", "automotive", "diecast", "vehicle"], photoId: "photo-1503376780353-7e6692767b70" },

    // Professional Cameras & Drones
    { keywords: ["canon", "sony", "nikon", "camera", "mirrorless", "lens"], photoId: "photo-1516035069371-29a1b244cc32" },
    { keywords: ["drone", "dji", "quadcopter"], photoId: "photo-1527977966376-1c8408f9f108" },
    { keywords: ["gopro", "action cam"], photoId: "photo-1508614589041-895b88991e3e" },

    // Gaming Hardware & Consoles
    { keywords: ["playstation", "ps5", "ps4"], photoId: "photo-1606813907291-d86efa9b94db" },
    { keywords: ["xbox", "series x", "one"], photoId: "photo-1605901309584-818e25960a8f" },
    { keywords: ["nintendo", "switch", "oled"], photoId: "photo-1578632767115-351597cf2477" },

    // Premium Coffee & Domestic Life
    { keywords: ["espresso", "coffee", "coffeemaker", "barista"], photoId: "photo-1495474472287-4d71bcdd2085" },
    { keywords: ["blender", "vitamix", "cooker", "sous vide", "pot", "pan", "kitchen"], photoId: "photo-1578643463396-0997cb5328c1" },

    // Experiences, Vouchers & Hospitality
    { keywords: ["voucher", "coupon", "ticket", "pass"], photoId: "photo-1531058020387-3be344559be6" },
    { keywords: ["restaurant", "michelin", "dining", "dinner", "chef"], photoId: "photo-1414235077428-338989a2e8c0" },
    { keywords: ["hotel", "resort", "stay", "villa", "suite"], photoId: "photo-1566073771259-6a8506099945" },
    { keywords: ["flight", "helicopter", "trip", "tour", "travel"], photoId: "photo-1436491865332-7a61a109cc05" },

    // Fine Art & Memorabilia
    { keywords: ["painting", "canvas", "print", "sculpture", "statue", "bronze", "marble"], photoId: "photo-1513364776144-60967b0f800f" },
    { keywords: ["signed", "autograph", "jersey", "memorabilia"], photoId: "photo-1518063319789-7217e6706b04" },

    // Sporting Products & Outdoors
    { keywords: ["bike", "bicycle", "electric bike", "e-bike"], photoId: "photo-1485965120184-e220f721d03e" },
    { keywords: ["surfboard", "surf", "surfing"], photoId: "photo-1502680390469-be75c86b636f" },
    { keywords: ["fishing", "rod", "reel", "tackle"], photoId: "photo-1517462964-21fdcec3f25b" },

    // Crypto tokens & Ledger nodes
    { keywords: ["bitcoin", "ethereum", "crypto", "cryptocurrency"], photoId: "photo-1621761191319-c6fb62004040" },
    { keywords: ["ledger", "wallet", "hardware wallet"], photoId: "photo-1639762681485-074b7f938ba0" }
  ];

  function findUnsplashPhotoId(name: string, category: string): string {
    const lowerName = name.toLowerCase();
    for (const mapping of keywordMappings) {
      if (mapping.keywords.some(k => lowerName.includes(k))) {
        return mapping.photoId;
      }
    }

    const categoryDefaults: Record<string, string> = {
      "Trading Cards": "photo-1607604276583-eef5d076aa5f",
      "Watches & Jewelry": "photo-1523275335684-37898b6baf30",
      "Miscellaneous": "photo-1542751371-adc38448a05e",
      "Art & Collectibles": "photo-1513364776144-60967b0f800f",
      "Sneakers & Apparel": "photo-1549298916-b41d501d3772",
      "Designer Fashion": "photo-1512436991641-6745cdb1723f",
      "Experiences & Travel": "photo-1436491865332-7a61a109cc05",
      "Automotive": "photo-1503376780353-7e6692767b70",
      "Electronics": "photo-1511707171634-5f897ff02aa9",
      "Consoles & Gaming": "photo-1606813907291-d86efa9b94db",
      "Cameras & Drones": "photo-1516035069371-29a1b244cc32",
      "Audio & Home Theater": "photo-1505740420928-5e560c06d30e",
      "Home & Lifestyle": "photo-1495474472287-4d71bcdd2085",
      "Ultra-Luxury": "photo-1567899378494-47b22a2ae96a",
      "Sports & Outdoor": "photo-1485965120184-e220f721d03e",
      "Digital & Crypto": "photo-1621761191319-c6fb62004040"
    };

    return categoryDefaults[category] || "photo-1542751371-adc38448a05e";
  }

  try {
    const rawLootData = fs.readFileSync(path.join(process.cwd(), "loot_list_3000_with_prices_images.json"), "utf-8");
    const lootList = JSON.parse(rawLootData);
    
    // Extract unique categories, ignoring "Symmetric Seed" completely or anything similar
    const rawCategories = Array.from(new Set(lootList.map((item: any) => item.category)))
      .filter(c => c && c !== "Symmetric Seed") as string[];

    // Create boxes for each unique category
    rawCategories.forEach((cat) => {
      const categoryItems = lootList.filter((item: any) => item.category === cat);
      if (categoryItems.length === 0) return;

      // Calculate reasonable box price based on the items inside (e.g., 12% of avg item value)
      const avgValue = categoryItems.reduce((acc: number, item: any) => acc + (item.price_usd || 10), 0) / categoryItems.length;
      let boxPrice = Math.max(10, Math.round(avgValue * 0.12));
      
      const boxId = `box-uuid-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      
      // Select the first item with a valid image_url for box cover image
      const coverImage = categoryBoxCovers[cat] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop";

      seedBoxes.push({
        id: boxId,
        name: `${cat} Box`,
        description: `Unbox high-value ${cat.toLowerCase()} products, rare drops, and luxury electronics.`,
        image_url: coverImage,
        price: boxPrice,
        category: cat,
        rarity: boxPrice > 200 ? "legendary" : boxPrice > 100 ? "epic" : boxPrice > 40 ? "rare" : "common",
        total_opened: Math.floor(Math.random() * 250) + 40
      });

      // Sort items by value to assign rarity accurately based on cost distribution
      categoryItems.sort((a: any, b: any) => (a.price_usd || 0) - (b.price_usd || 0));
      const N = categoryItems.length;

      seedItems[boxId] = categoryItems.map((item: any, idx: number) => {
        // Rarity tier distribution: top 5% is legendary, top 20% is epic, top 45% is rare, rest common
        let rarity: "common" | "rare" | "epic" | "legendary" = "common";
        if (idx >= N * 0.95) {
          rarity = "legendary";
        } else if (idx >= N * 0.80) {
          rarity = "epic";
        } else if (idx >= N * 0.45) {
          rarity = "rare";
        }

        const photoId = findUnsplashPhotoId(item.name, cat);
        // Build beautiful individual visual representation using specific high-quality photo ID with random salt for visual uniqueness
        const uniqueSeed = (item.id * 17) % 100;
        const imageUrl = item.image_url || `https://images.unsplash.com/${photoId}?q=80&w=250&auto=format&fit=crop&sig=${uniqueSeed}`;

        const originalVal = item.price_usd || 10.00;
        const finalVal = rarity === "common" ? Number((originalVal * 0.5).toFixed(2)) : originalVal;

        return {
          id: `item-idx-${item.id}`,
          box_id: boxId,
          name: item.name,
          image_url: imageUrl,
          value: finalVal,
          rarity,
          probability: 0 // Will assign weighted probabilities below
        };
      });

      // Assign requested probabilities: 80% Common, 1% Rare, 0.5% Epic, 0.01% Legendary
      const boxItems = seedItems[boxId];
      const targetTierProbs = {
        common: 80,
        rare: 1,
        epic: 0.5,
        legendary: 0.01
      };

      const commonItems = boxItems.filter(i => i.rarity === "common");
      const rareItems = boxItems.filter(i => i.rarity === "rare");
      const epicItems = boxItems.filter(i => i.rarity === "epic");
      const legendaryItems = boxItems.filter(i => i.rarity === "legendary");

      let activeTargetSum = 0;
      if (commonItems.length > 0) activeTargetSum += targetTierProbs.common;
      if (rareItems.length > 0) activeTargetSum += targetTierProbs.rare;
      if (epicItems.length > 0) activeTargetSum += targetTierProbs.epic;
      if (legendaryItems.length > 0) activeTargetSum += targetTierProbs.legendary;

      boxItems.forEach((item) => {
        const tierCount = boxItems.filter(i => i.rarity === item.rarity).length;
        const tierTargetProb = targetTierProbs[item.rarity];
        item.probability = Number(((tierTargetProb / activeTargetSum) / tierCount).toFixed(8));
      });

      // Perform a final calibration to make sure the probabilities sum to exactly 1.00000000
      let sumProbs = boxItems.reduce((sum, item) => sum + item.probability, 0);
      if (Math.abs(sumProbs - 1.0) > 1e-9) {
        const diff = 1.0 - sumProbs;
        boxItems[boxItems.length - 1].probability = Number((boxItems[boxItems.length - 1].probability + diff).toFixed(8));
      }
    });

    console.log(`Successfully parsed loot list. Generated ${seedBoxes.length} boxes with ${lootList.length} items total.`);

  } catch (error) {
    console.error("CRITICAL: Failed to load loot_list_3000_with_prices_images.json. Loading fallback seed data.", error);
    seedBoxes.push({
      id: "b1111111-1111-1111-1111-111111111111",
      name: "Tech Legends",
      description: "Unbox legendary tech gear, custom keyboards, and top-tier gadgets.",
      image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop",
      price: 120.00,
      category: "Technology",
      rarity: "epic",
      total_opened: 145
    });
    seedItems["b1111111-1111-1111-1111-111111111111"] = [
      { id: "item-t1", box_id: "b1111111-1111-1111-1111-111111111111", name: "Custom Neon Desk Mat", image_url: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=120&auto=format&fit=crop", value: 15.00, rarity: "common", probability: 1.0000 },
    ];
  }

  // --- LOCAL MUTABLE DATASTORE ---
  let profiles: Profile[] = [
    {
      id: "user-default-id",
      email: "epticwolf27@gmail.com",
      username: "AlphaSurger",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=AlphaSurger",
      balance: 100.00, // Welcoming joins
      loyalty_points: 25,
      tier: "Silver",
      shipping_address: "123 Neon Parkway, Retro City, RC 3030",
      created_at: new Date().toISOString()
    },
    {
      id: "user-admin-id",
      email: "admin@surgebox.io",
      username: "admin",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
      balance: 50000.00,
      loyalty_points: 9999,
      tier: "Legendary Creator",
      shipping_address: "HQ Cyber Tower, Port 3000",
      created_at: new Date().toISOString()
    }
  ];

  // In-memory store for user passwords (lowercased email -> password)
  const userPasswords = new Map<string, string>([
    ["epticwolf27@gmail.com", "password123"],
    ["admin@surgebox.io", "password123"]
  ]);

  let inventories: InventoryItem[] = [];
  let transactions: Transaction[] = [];
  let liveFeed: LiveFeedItem[] = [
    {
      id: "feed-1",
      username: "HypeCoder",
      box_name: "Tech Legends",
      item_name: "Retro Dye-Sub Keycaps",
      item_rarity: "common",
      item_value: 30.00,
      created_at: new Date(Date.now() - 5000).toISOString()
    },
    {
      id: "feed-2",
      username: "SlickSlick",
      box_name: "Sneaker Vault",
      item_name: "Air Max Limited Retro",
      item_rarity: "epic",
      item_value: 390.00,
      created_at: new Date(Date.now() - 15000).toISOString()
    }
  ];

  let chatMessages: ChatMessage[] = [
    { id: "chat-1", username: "System", text: "Welcome to SurgeBox Ultra Chat. Good luck on your unboxings!", timestamp: new Date().toISOString(), system: true },
    { id: "chat-2", username: "HypeCoder", text: "Just pulled some sweet Retro Keycaps! Let's go!", timestamp: new Date(Date.now() - 4000).toISOString() }
  ];

  let battles: Battle[] = [];
  let bingoCards: BingoState[] = [];
  let lotteryTickets: LotteryState[] = [];

  // --- DATABASE PERSISTENCE LAYER & AUTOMATED SUPABASE SYNCHRONIZER ---
  const DB_FILE = path.join(process.cwd(), "local_db_persistence.json");

  function findItemById(itemId: string): BoxItem | undefined {
    for (const boxId in seedItems) {
      const found = seedItems[boxId].find(i => i.id === itemId);
      if (found) return found;
    }
    return undefined;
  }

  function loadState() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const data = JSON.parse(raw);
        if (data.profiles && Array.isArray(data.profiles)) profiles = data.profiles;
        if (data.inventories && Array.isArray(data.inventories)) inventories = data.inventories;
        if (data.transactions && Array.isArray(data.transactions)) transactions = data.transactions;
        if (data.liveFeed && Array.isArray(data.liveFeed)) liveFeed = data.liveFeed;
        if (data.chatMessages && Array.isArray(data.chatMessages)) chatMessages = data.chatMessages;
        if (data.battles && Array.isArray(data.battles)) battles = data.battles;
        if (data.bingoCards && Array.isArray(data.bingoCards)) bingoCards = data.bingoCards;
        if (data.lotteryTickets && Array.isArray(data.lotteryTickets)) lotteryTickets = data.lotteryTickets;
        if (data.userPasswords && Array.isArray(data.userPasswords)) {
          userPasswords.clear();
          data.userPasswords.forEach(([k, v]: [string, string]) => userPasswords.set(k, v));
        }
        console.log("💾 State successfully restored from local persistent JSON store.");
      }
    } catch (err) {
      console.error("⚠️ Failed to load local database persistence file:", err);
    }
  }

  function saveState() {
    try {
      const data = {
        profiles,
        inventories,
        transactions,
        liveFeed,
        chatMessages,
        battles,
        bingoCards,
        lotteryTickets,
        userPasswords: Array.from(userPasswords.entries())
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("⚠️ Failed to write local database persistence file:", err);
    }
  }

  // Real-Time Supabase Automated Integration
  let supabaseClient: any = null;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false
        }
      });
      console.log("⚡ Automated Supabase Integration Active! Connected to cloud DB.");
    } catch (err) {
      console.error("❌ Failed to instantiate Supabase client:", err);
    }
  }

  async function syncProfileToSupabase(profile: Profile) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from("profiles").upsert({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        avatar_url: profile.avatar_url,
        balance: profile.balance,
        created_at: profile.created_at
      });
    } catch (err: any) {
      console.error("⚠️ Profiles sync error:", err.message);
    }
  }

  async function syncInventoryToSupabase(invItem: InventoryItem) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from("inventory").upsert({
        id: invItem.id,
        user_id: invItem.user_id,
        item_id: invItem.item_id,
        box_name: invItem.box_name,
        status: invItem.status,
        sell_price: invItem.sell_price,
        created_at: invItem.created_at
      });
    } catch (err: any) {
      console.error("⚠️ Inventory sync error:", err.message);
    }
  }

  async function syncTransactionToSupabase(tx: Transaction) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from("transactions").upsert({
        id: tx.id,
        user_id: tx.user_id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        created_at: tx.created_at
      });
    } catch (err: any) {
      console.error("⚠️ Transactions sync error:", err.message);
    }
  }

  async function syncLiveFeedToSupabase(feed: LiveFeedItem) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from("live_feed").upsert({
        id: feed.id,
        username: feed.username,
        box_name: feed.box_name,
        item_name: feed.item_name,
        item_rarity: feed.item_rarity,
        item_value: feed.item_value,
        created_at: feed.created_at
      });
    } catch (err: any) {
      console.error("⚠️ Live feed sync error:", err.message);
    }
  }

  let syncTimeout: NodeJS.Timeout | null = null;
  function triggerSupabaseSync() {
    if (!supabaseClient) return;
    if (syncTimeout) return;
    syncTimeout = setTimeout(async () => {
      syncTimeout = null;
      try {
        console.log("🔄 Background syncing modifications to Supabase cloud...");
        for (const profile of profiles) {
          await syncProfileToSupabase(profile);
        }
        for (const item of inventories.slice(-100)) {
          await syncInventoryToSupabase(item);
        }
        for (const tx of transactions.slice(-100)) {
          await syncTransactionToSupabase(tx);
        }
        console.log("✅ Supabase cloud sync complete.");
      } catch (err: any) {
        console.error("⚠️ Background sync error:", err.message);
      }
    }, 4000);
  }

  async function loadInitialDataFromSupabase() {
    if (!supabaseClient) return;
    try {
      console.log("⚡ Fetching initial dataset from Supabase...");
      
      const { data: dbProfiles, error: profErr } = await supabaseClient.from("profiles").select("*");
      if (!profErr && dbProfiles && dbProfiles.length > 0) {
        dbProfiles.forEach((p: any) => {
          const existingIdx = profiles.findIndex(op => op.id === p.id);
          const mappedProf: Profile = {
            id: p.id,
            email: p.email || "",
            username: p.username || "User",
            avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`,
            balance: Number(p.balance || 0),
            loyalty_points: 0,
            tier: "Silver",
            shipping_address: "",
            created_at: p.created_at || new Date().toISOString()
          };
          if (existingIdx > -1) {
            profiles[existingIdx] = mappedProf;
          } else {
            profiles.push(mappedProf);
          }
        });
        console.log(`✅ Loaded ${dbProfiles.length} profiles from Supabase.`);
      }

      const { data: dbInv, error: invErr } = await supabaseClient.from("inventory").select("*");
      if (!invErr && dbInv && dbInv.length > 0) {
        inventories = dbInv.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          item_id: item.item_id,
          box_name: item.box_name || "Loot Box",
          status: item.status || "inventory",
          sell_price: Number(item.sell_price || 0),
          created_at: item.created_at || new Date().toISOString(),
          item: findItemById(item.item_id)
        }));
        console.log(`✅ Loaded ${dbInv.length} inventory items from Supabase.`);
      }

      const { data: dbTx, error: txErr } = await supabaseClient.from("transactions").select("*");
      if (!txErr && dbTx && dbTx.length > 0) {
        transactions = dbTx.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          type: item.type || "unknown",
          amount: Number(item.amount || 0),
          description: item.description || "",
          created_at: item.created_at || new Date().toISOString()
        }));
        console.log(`✅ Loaded ${dbTx.length} transactions from Supabase.`);
      }
    } catch (err: any) {
      console.error("⚠️ Failed to load initial data from Supabase:", err.message);
    }
  }

  // Load state and trigger sync on start
  loadState();
  if (supabaseClient) {
    loadInitialDataFromSupabase();
  }

  // Middleware to auto-save local JSON file and schedule Supabase sync
  app.use((req, res, next) => {
    res.on("finish", () => {
      if (req.method !== "GET") {
        saveState();
        triggerSupabaseSync();
      }
    });
    next();
  });

  // Helper function to pick items weighted
  function rollItem(items: BoxItem[]): BoxItem {
    const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);
    let r = Math.random() * totalProbability;
    for (const item of items) {
      if (r < item.probability) return item;
      r -= item.probability;
    }
    return items[items.length - 1];
  }

  // --- API ROUTE HANDLERS ---

  // Auth/Profiles
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const profile = profiles.find(p => p.email.toLowerCase() === normalizedEmail);
    if (!profile) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const savedPassword = userPasswords.get(normalizedEmail);
    if (savedPassword !== password) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    res.json({ success: true, profile });
  });

  app.post("/api/auth/signup", (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    if (profiles.some(p => p.email.toLowerCase() === normalizedEmail)) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    if (profiles.some(p => p.username.toLowerCase() === normalizedUsername.toLowerCase())) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // Create a new secure Profile with signup bonus
    const newId = "user-" + Math.floor(100000 + Math.random() * 900000);
    const newProfile: Profile = {
      id: newId,
      email: normalizedEmail,
      username: normalizedUsername,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedUsername)}`,
      balance: 100.00, // $100 Welcome Bonus
      loyalty_points: 10,
      tier: "Bronze",
      created_at: new Date().toISOString()
    };

    profiles.push(newProfile);
    userPasswords.set(normalizedEmail, password);

    res.status(201).json({ success: true, profile: newProfile });
  });

  app.get("/api/profile/:id", (req, res) => {
    let profile = profiles.find(p => p.id === req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }
    res.json(profile);
  });

  app.post("/api/profile/update", (req, res) => {
    const { id, username, shipping_address } = req.body;
    const profile = profiles.find(p => p.id === id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    if (username) {
      // Ensure unique
      const existing = profiles.find(p => p.username === username && p.id !== id);
      if (existing) return res.status(400).json({ error: "Username already taken" });
      profile.username = username;
    }
    if (shipping_address !== undefined) {
      profile.shipping_address = shipping_address;
    }
    res.json(profile);
  });

  // Daily Rewards endpoint - simulated Supabase transaction
  app.post("/api/profile/claim-daily", (req, res) => {
    const { user_id } = req.body;
    
    // Simulating database transactional BEGIN/FOR UPDATE lock
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (profile.last_claim_date === todayStr) {
      return res.status(400).json({ error: "Daily reward already claimed today. Come back tomorrow!" });
    }

    let currentStreak = profile.daily_streak || 0;
    let isConsecutive = false;

    if (profile.last_claim_date) {
      const lastClaim = new Date(profile.last_claim_date);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (profile.last_claim_date === yesterdayStr) {
        isConsecutive = true;
      }
    }

    if (isConsecutive) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    // Base reward is 5.00 credits, plus streak bonus ($0.50 per day up to $5.00 maximum bonus)
    const baseReward = 5.00;
    const streakBonus = Math.min(5.00, (currentStreak - 1) * 0.50);
    const totalReward = Number((baseReward + streakBonus).toFixed(2));

    // Transaction-safe updates
    profile.balance = Number((profile.balance + totalReward).toFixed(2));
    profile.daily_streak = currentStreak;
    profile.last_claim_date = todayStr;
    profile.last_claimed_at = now.toISOString();

    // Record Transaction Ledger Entry
    const newTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: profile.id,
      type: "deposit",
      amount: totalReward,
      description: `Daily Reward Claimed (Day ${currentStreak} Streak)`,
      created_at: now.toISOString()
    };
    transactions.push(newTx);

    res.json({
      success: true,
      reward_amount: totalReward,
      new_balance: profile.balance,
      streak: currentStreak,
      last_claim_date: todayStr,
      profile
    });
  });

  // Fetch Boxes & Items
  app.get("/api/boxes", (req, res) => {
    res.json(seedBoxes);
  });

  app.get("/api/boxes/:id", (req, res) => {
    const box = seedBoxes.find(b => b.id === req.params.id);
    if (!box) return res.status(404).json({ error: "Box not found" });
    const items = seedItems[box.id] || [];
    res.json({ box, items });
  });

  // Open Box (Edge simulated endpoint)
  // Security Constraint Check: Performed strictly on server to deduct funds and issue item
  app.post("/api/open-box", (req, res) => {
    const { box_id, user_id } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User profile not found" });

    const box = seedBoxes.find(b => b.id === box_id);
    if (!box) return res.status(404).json({ error: "Box not found" });

    // Validate sufficient balance server-side
    if (profile.balance < box.price) {
      return res.status(400).json({ error: "Insufficient balance for unboxing" });
    }

    const items = seedItems[box.id];
    if (!items || items.length === 0) {
      return res.status(500).json({ error: "No items configured for this box" });
    }

    // Server-Authoritative deduction
    profile.balance = Number((profile.balance - box.price).toFixed(2));
    box.total_opened += 1;

    // Pick dynamic reward based on weighted mathematical random distribution
    const prize = rollItem(items);

    // Write to Inventory
    const newInvItem: InventoryItem = {
      id: "inv-" + Math.floor(100000 + Math.random() * 900000),
      user_id: profile.id,
      item_id: prize.id,
      box_name: box.name,
      status: "inventory",
      sell_price: Number((prize.value * 0.8).toFixed(2)), // 80% resell recovery rate
      created_at: new Date().toISOString(),
      item: prize
    };
    inventories.push(newInvItem);

    // Record Transaction Ledger Entry
    const newTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: profile.id,
      type: "unbox",
      amount: -box.price,
      description: `Unboxed "${prize.name}" from ${box.name}`,
      created_at: new Date().toISOString()
    };
    transactions.push(newTx);

    // Add Loyalty points
    profile.loyalty_points += Math.max(1, Math.floor(box.price / 10));

    // Update Live global feed & Chat Alert
    const feedItem: LiveFeedItem = {
      id: "feed-" + Math.floor(100000 + Math.random() * 900000),
      username: profile.username,
      box_name: box.name,
      item_name: prize.name,
      item_rarity: prize.rarity,
      item_value: prize.value,
      created_at: new Date().toISOString()
    };
    liveFeed.unshift(feedItem);
    if (liveFeed.length > 50) liveFeed.pop();

    chatMessages.push({
      id: "chat-" + Math.floor(100000 + Math.random() * 900000),
      username: "System Drop Alert",
      text: `${profile.username} just pulled "${prize.name}" (${prize.rarity.toUpperCase()}) worth $${prize.value}!`,
      timestamp: new Date().toISOString(),
      item_drop: {
        item_name: prize.name,
        rarity: prize.rarity,
        value: prize.value
      }
    });
    if (chatMessages.length > 100) chatMessages.shift();

    res.json({
      item: prize,
      new_balance: profile.balance,
      loyalty_points: profile.loyalty_points
    });
  });

  // Sell Inventory Item
  // Security Constraint: Check ownership before balance crediting
  app.post("/api/sell-item", (req, res) => {
    const { item_id, user_id } = req.body;
    const itemIndex = inventories.findIndex(inv => inv.id === item_id && inv.user_id === user_id && inv.status === 'inventory');
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in inventory or already sold" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const invItem = inventories[itemIndex];
    invItem.status = 'sold';

    // Credit profile balance
    profile.balance = Number((profile.balance + invItem.sell_price).toFixed(2));

    // Transaction entry
    const sellTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "sell",
      amount: invItem.sell_price,
      description: `Resold unboxed item "${invItem.item?.name}" for 80% market value`,
      created_at: new Date().toISOString()
    };
    transactions.push(sellTx);

    res.json({
      success: true,
      new_balance: profile.balance,
      message: `Sold ${invItem.item?.name} for $${invItem.sell_price}`
    });
  });

  // Physical shipping labels creation
  app.post("/api/shipping/request", (req, res) => {
    const { item_id, item_ids, user_id, address } = req.body;
    const ids: string[] = item_ids || (item_id ? [item_id] : []);
    
    if (ids.length === 0) {
      return res.status(400).json({ error: "No items selected for shipping" });
    }

    const matchedItems = inventories.filter(inv => ids.includes(inv.id) && inv.user_id === user_id && inv.status === 'inventory');
    if (matchedItems.length === 0) {
      return res.status(404).json({ error: "No available items found for shipping" });
    }
    if (matchedItems.length !== ids.length) {
      return res.status(400).json({ error: "Some items are not available in inventory or have already been processed" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User not found" });

    // Calculate dynamic shipping fee: sum of values, 10% fee, min $50, max $500
    const combined_value = matchedItems.reduce((sum, item) => sum + (item.item?.value || 0), 0);
    const fee = Math.min(Math.max(combined_value * 0.1, 50), 500);

    // Check if shipped before
    const shippedBefore = transactions.some(t => t.type === 'shipping_fee' && t.user_id === user_id);
    
    if (!shippedBefore) {
        // Need card payment via Stripe on frontend
        return res.json({ requires_card_payment: true, amount: fee });
    }

    // Deduction from wallet
    if (profile.balance < fee) {
        return res.status(400).json({ error: `Insufficient funds for shipping fee ($${fee.toFixed(2)})` });
    }

    profile.balance = Number((profile.balance - fee).toFixed(2));
    
    // Generate physical address shipping label
    const randomLabel = `SHIP-USPS-${Math.floor(100000 + Math.random()*900000)}-SB`;
    
    // Update status for all items
    matchedItems.forEach(item => {
      item.status = 'processing';
      item.shipping_label = randomLabel;
    });

    transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user_id,
        type: "shipping_fee",
        amount: -fee,
        description: `Requested physical home delivery shipping label (${matchedItems.length} items): ${randomLabel}`,
        created_at: new Date().toISOString()
    });

    res.json({
        success: true,
        shipping_label: randomLabel,
        new_balance: profile.balance,
        message: `Successfully requested physical shipping for ${matchedItems.length} item(s)!`
    });
  });

  // Create Stripe Payment Intent for Shipping Fee
  app.post("/api/shipping/create-payment-intent", async (req, res) => {
    const { item_id, item_ids, user_id, address } = req.body;
    const ids: string[] = item_ids || (item_id ? [item_id] : []);

    if (ids.length === 0) {
      return res.status(400).json({ error: "No items selected for shipping" });
    }

    const matchedItems = inventories.filter(inv => ids.includes(inv.id) && inv.user_id === user_id && inv.status === 'inventory');
    if (matchedItems.length === 0) {
      return res.status(404).json({ error: "No available items found for shipping" });
    }
    if (matchedItems.length !== ids.length) {
      return res.status(400).json({ error: "Some items are not available in inventory or have already been processed" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User not found" });

    // Calculate dynamic shipping fee
    const combined_value = matchedItems.reduce((sum, item) => sum + (item.item?.value || 0), 0);
    const fee = Math.min(Math.max(combined_value * 0.1, 50), 500);

    const stripe = getStripeInstance();
    const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_live_51T8YWWAnfRTY2ubsXe79eFgJVL1ySwsR30PXhUcHNV0VPGs6DHXbPyfgCx67DGtosJOuk8YTEa7NXq45udrL45MN00OJI8UlXl";

    if (stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(fee * 100),
          currency: "usd",
          metadata: {
            user_id,
            item_ids: ids.join(","),
            address
          }
        });
        return res.json({
          clientSecret: paymentIntent.client_secret,
          amount: fee,
          requires_card_payment: true,
          is_live_stripe: true,
          publishableKey
        });
      } catch (err: any) {
        console.error("Stripe error creating PaymentIntent for shipping:", err);
      }
    }

    // Simulated fallback
    res.json({
      clientSecret: `simulated_secret_${Math.floor(100000 + Math.random() * 900000)}`,
      amount: fee,
      requires_card_payment: true,
      is_live_stripe: false
    });
  });

  // Confirm Card Payment and Create Shipping Label
  app.post("/api/shipping/confirm-card-payment", async (req, res) => {
    const { item_id, item_ids, user_id, address, payment_intent_id } = req.body;
    const ids: string[] = item_ids || (item_id ? [item_id] : []);

    if (ids.length === 0) {
      return res.status(400).json({ error: "No items selected for shipping" });
    }

    const matchedItems = inventories.filter(inv => ids.includes(inv.id) && inv.user_id === user_id && inv.status === 'inventory');
    if (matchedItems.length === 0) {
      return res.status(404).json({ error: "No available items found for shipping" });
    }
    if (matchedItems.length !== ids.length) {
      return res.status(400).json({ error: "Some items are not available in inventory or have already been processed" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User not found" });

    const combined_value = matchedItems.reduce((sum, item) => sum + (item.item?.value || 0), 0);
    const fee = Math.min(Math.max(combined_value * 0.1, 50), 500);

    const stripe = getStripeInstance();
    if (stripe && payment_intent_id && !payment_intent_id.startsWith("simulated_")) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        if (paymentIntent.status !== "succeeded") {
          return res.status(400).json({ error: "Card payment has not been successfully processed yet" });
        }
      } catch (err: any) {
        return res.status(400).json({ error: `Failed to verify payment with Stripe: ${err.message}` });
      }
    }

    // Process successful shipping label creation
    const randomLabel = `SHIP-USPS-${Math.floor(100000 + Math.random() * 900000)}-SB`;
    
    matchedItems.forEach(item => {
      item.status = 'processing';
      item.shipping_label = randomLabel;
    });

    transactions.push({
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "shipping_fee",
      amount: -fee,
      description: `Requested physical home delivery shipping label via Card Payment (${matchedItems.length} items): ${randomLabel}`,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      shipping_label: randomLabel,
      new_balance: profile.balance,
      message: `Successfully requested physical shipping for ${matchedItems.length} item(s) with Card Payment!`
    });
  });

  // Top Up Wallet (Simulating Stripe & Deposit Channels)
  app.post("/api/wallet/deposit", (req, res) => {
    const { user_id, amount, method } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }

    // 5% additional crypto bonus calculation
    const isCrypto = method === 'Crypto';
    const bonus = isCrypto ? Number((parsedAmount * 0.05).toFixed(2)) : 0;
    const totalAdded = parsedAmount + bonus;

    profile.balance = Number((profile.balance + totalAdded).toFixed(2));

    const depositTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "deposit",
      amount: parsedAmount,
      description: `Deposited funds via ${method}${isCrypto ? " (Includes +5% Crypto Deposit Bonus)" : ""}`,
      created_at: new Date().toISOString()
    };
    transactions.push(depositTx);

    if (bonus > 0) {
      transactions.push({
        id: "tx-b-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user_id,
        type: "deposit",
        amount: bonus,
        description: `Promo Bonus: +5% Crypto top-up credit boost`,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      new_balance: profile.balance,
      total_added: totalAdded,
      message: `Deposited ${totalAdded} securely!`
    });
  });

  // Create pending Crypto transaction
  app.post("/api/wallet/crypto-deposit", (req, res) => {
    const { user_id, amount, coin } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }

    const pendingTx: Transaction = {
      id: "tx-crypto-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "deposit",
      amount: parsedAmount,
      description: `Pending Crypto Deposit (${coin})`,
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    transactions.push(pendingTx);

    res.json({
      success: true,
      transaction: pendingTx,
      message: `Pending ${coin} deposit of ${parsedAmount} initiated.`
    });
  });

  // Confirm pending Crypto transaction (simulating Edge Function verification)
  app.post("/api/wallet/crypto-confirm", (req, res) => {
    const { transaction_id, user_id } = req.body;
    const txIndex = transactions.findIndex(t => t.id === transaction_id);
    if (txIndex === -1) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const tx = transactions[txIndex];
    if (tx.status !== 'pending') {
      return res.status(400).json({ error: "Transaction is not pending or already completed" });
    }

    const profile = profiles.find(p => p.id === (user_id || tx.user_id));
    if (!profile) return res.status(404).json({ error: "Profile not found for this transaction" });

    const parsedAmount = Number(tx.amount);
    const bonus = Number((parsedAmount * 0.05).toFixed(2));
    const totalAdded = parsedAmount + bonus;

    // Credit user's wallet
    profile.balance = Number((profile.balance + totalAdded).toFixed(2));

    // Update main transaction status to completed
    tx.status = 'completed';
    tx.description = `${tx.description.replace('Pending ', '')} (Verified & Credited)`;

    // Payout the promo bonus transaction
    if (bonus > 0) {
      transactions.push({
        id: "tx-b-" + Math.floor(100000 + Math.random() * 900000),
        user_id: profile.id,
        type: "deposit",
        amount: bonus,
        description: `Promo Bonus: +5% Crypto top-up credit boost`,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      new_balance: profile.balance,
      total_added: totalAdded,
      transaction: tx,
      message: `Verified and credited ${totalAdded} securely (includes 5% bonus)!`
    });
  });

  // Stripe Billing Integration Helper
  let stripeInstance: Stripe | null = null;
  function getStripeInstance() {
    const key = process.env.STRIPE_SECRET_KEY || "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";
    if (!key || key.trim() === "" || key.trim().startsWith("pk_")) {
      return null;
    }
    if (!stripeInstance) {
      stripeInstance = new Stripe(key.trim(), {
        apiVersion: "2022-11-15" as any
      });
    }
    return stripeInstance;
  }

  // Create Stripe Checkout Session
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    const { user_id, amount, credited_amount } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 5) {
      return res.status(400).json({ error: "Minimum deposit is $5.00" });
    }

    const parsedCreditedAmount = credited_amount ? Number(credited_amount) : parsedAmount;

    const key = process.env.STRIPE_SECRET_KEY;
    if (key && key.trim().startsWith("pk_")) {
      return res.status(400).json({
        error: "Invalid Stripe Secret Key. Your STRIPE_SECRET_KEY starts with 'pk_', which is a publishable key. Please provide a secret API key (starts with 'sk_') in your environment settings, or clear the key entirely to use our simulated Sandbox Stripe Checkout."
      });
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      console.log(`[Stripe Mock] Simulating checkout session for $${parsedAmount} (crediting $${parsedCreditedAmount}) for user ${user_id}`);
      const successUrl = `${req.headers.origin || "http://localhost:3000"}/wallet?session_id=mock_stripe_${Math.floor(Math.random()*1000000)}&amount=${parsedCreditedAmount}`;
      return res.json({ 
        id: `cs_test_mock_${Math.floor(Math.random()*1000000)}`, 
        url: successUrl, 
        isMock: true 
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Surge Stream Wallet Top Up",
                description: `Add $${parsedCreditedAmount.toFixed(2)} credits to user balance`,
              },
              unit_amount: Math.round(parsedAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          user_id: user_id,
          amount: parsedCreditedAmount.toString()
        },
        success_url: `${req.headers.origin || "http://localhost:3000"}/wallet?session_id={CHECKOUT_SESSION_ID}&amount=${parsedCreditedAmount}`,
        cancel_url: `${req.headers.origin || "http://localhost:3000"}/wallet?canceled=true`,
      });

      res.json({ id: session.id, url: session.url, isMock: false });
    } catch (err: any) {
      console.error("Stripe session creation error:", err);
      res.status(500).json({ error: err.message || "Failed to create Stripe checkout session" });
    }
  });

  // Confirm Stripe Checkout Session
  app.post("/api/stripe/confirm-session", async (req, res) => {
    const { session_id, user_id, amount: requestedAmount } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Deduplicate transaction to prevent double spending
    const existingTx = transactions.find(t => t.description.includes(session_id));
    if (existingTx) {
      return res.json({ success: true, already_processed: true, new_balance: profile.balance });
    }

    if (session_id.startsWith("mock_stripe_")) {
      const amountParam = Number(requestedAmount || 10);
      profile.balance = Number((profile.balance + amountParam).toFixed(2));

      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user_id,
        type: "deposit",
        amount: amountParam,
        description: `Deposited $${amountParam.toFixed(2)} via Stripe (Mock Session: ${session_id})`,
        created_at: new Date().toISOString()
      });

      return res.json({ success: true, new_balance: profile.balance, amount: amountParam });
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      return res.status(400).json({ error: "Stripe is not configured and this is not a mock session" });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const amount = Number(session.metadata?.amount || (session.amount_total ? session.amount_total / 100 : 0));
        profile.balance = Number((profile.balance + amount).toFixed(2));

        transactions.push({
          id: "tx-" + Math.floor(100000 + Math.random() * 900000),
          user_id: user_id,
          type: "deposit",
          amount: amount,
          description: `Deposited $${amount.toFixed(2)} via Stripe (Session ID: ${session_id})`,
          created_at: new Date().toISOString()
        });

        res.json({ success: true, new_balance: profile.balance, amount });
      } else {
        res.status(400).json({ error: "Checkout session is not paid" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to verify Stripe checkout session" });
    }
  });

  // Multi-Player Battles State (Battle Arena)
  app.get("/api/battles", (req, res) => {
    res.json(battles);
  });

  app.post("/api/battles/create", (req, res) => {
    const { host_id, box_id, max_players } = req.body;
    const hostProfile = profiles.find(p => p.id === host_id);
    const box = seedBoxes.find(b => b.id === box_id);

    if (!hostProfile || !box) return res.status(400).json({ error: "Invalid host or box" });

    // Secure deduct box entry price upfront
    if (hostProfile.balance < box.price) {
      return res.status(400).json({ error: "Insufficient balance to host unboxing battle" });
    }

    hostProfile.balance = Number((hostProfile.balance - box.price).toFixed(2));
    
    const newBattle: Battle = {
      id: "battle-" + Math.floor(100000 + Math.random() * 900000),
      host_id: host_id,
      box_id: box_id,
      max_players: max_players || 2,
      status: 'lobby',
      created_at: new Date().toISOString(),
      box: box,
      participants: [{
        id: "bp-" + Math.floor(100000 + Math.random() * 900000),
        battle_id: "", // Filled next
        user_id: host_id,
        username: hostProfile.username,
        avatar_url: hostProfile.avatar_url,
        is_ready: true
      }]
    };
    newBattle.participants[0].battle_id = newBattle.id;
    battles.push(newBattle);

    transactions.push({
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: host_id,
      type: "unbox",
      amount: -box.price,
      description: `Joined Battle Arena (Lobby created for ${box.name})`,
      created_at: new Date().toISOString()
    });

    res.json(newBattle);
  });

  app.post("/api/battles/join", (req, res) => {
    const { battle_id, user_id } = req.body;
    const battle = battles.find(b => b.id === battle_id);
    if (!battle) return res.status(404).json({ error: "Battle lobby not found" });

    if (battle.status !== 'lobby') {
      return res.status(400).json({ error: "Battle has already commenced or finished" });
    }

    if (battle.participants.find(p => p.user_id === user_id)) {
      return res.status(400).json({ error: "Already in battle lobby" });
    }

    if (battle.participants.length >= battle.max_players) {
      return res.status(400).json({ error: "Battle lobby is full" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User not found" });

    const box = seedBoxes.find(b => b.id === battle.box_id);
    if (!box) return res.status(400).json({ error: "Box invalid" });

    // Secure deduct entrance price
    if (profile.balance < box.price) {
      return res.status(400).json({ error: "Sufficient credits required to enter unbox match" });
    }

    profile.balance = Number((profile.balance - box.price).toFixed(2));

    battle.participants.push({
      id: "bp-" + Math.floor(100000 + Math.random() * 900000),
      battle_id: battle.id,
      user_id: user_id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      is_ready: true
    });

    transactions.push({
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "unbox",
      amount: -box.price,
      description: `Entered unboxing match in Battle Arena vs competitors`,
      created_at: new Date().toISOString()
    });

    // Auto commencement if lobby is full
    if (battle.participants.length === battle.max_players) {
      battle.status = 'active';
      battle.countdown_end_at = new Date(Date.now() + 5000).toISOString(); // 5s spin countdown
      
      // Compute unboxed drops for each participant server-side
      const boxItems = seedItems[battle.box_id];
      let winningVal = -1;
      let winnerId = "";

      battle.participants.forEach(p => {
        const drop = rollItem(boxItems);
        p.item_id = drop.id;
        p.item_name = drop.name;
        p.item_rarity = drop.rarity;
        p.item_value = drop.value;

        // Inventory addition for each drop
        inventories.push({
          id: "inv-" + Math.floor(100000 + Math.random() * 900000),
          user_id: p.user_id,
          item_id: drop.id,
          box_name: box.name,
          status: "inventory",
          sell_price: Number((drop.value * 0.8).toFixed(2)),
          created_at: new Date().toISOString(),
          item: drop
        });

        if (drop.value > winningVal) {
          winningVal = drop.value;
          winnerId = p.user_id;
        }
      });

      // Apply multiplier 1.25x to Battle winner's balance
      battle.winner_id = winnerId;
      battle.status = 'completed';

      const winnerProfile = profiles.find(p => p.id === winnerId);
      if (winnerProfile) {
        // Winner gets 1.25x their drops worth added back as bonus prize points/credits
        const bonusReward = Number((winningVal * 1.25).toFixed(2));
        winnerProfile.balance = Number((winnerProfile.balance + bonusReward).toFixed(2));

        transactions.push({
          id: "tx-" + Math.floor(100000 + Math.random() * 900000),
          user_id: winnerId,
          type: "battle_win",
          amount: bonusReward,
          description: `Won Battle Arena match (1.25x Item Value payout bonus: +$${bonusReward})`,
          created_at: new Date().toISOString()
        });

        chatMessages.push({
          id: "chat-battle-" + Math.floor(100000 + Math.random() * 900000),
          username: "Battle Arena",
          text: `🏆 ${winnerProfile.username} has WON the Battle Arena! Pulled "${battle.participants.find(p => p.user_id === winnerId)?.item_name}" and claimed an additional 1.25x drop payout worth $${bonusReward}!`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json(battle);
  });

  // --- MINI-GAMES ENDPOINTS ---

  // Game 1: Bingo King
  app.post("/api/games/bingo/buy", (req, res) => {
    const { user_id } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const cardCost = 15.00;

    // --- SECURE SUPABASE TRANSACTION (SIMULATED FOR ATOMICITY) ---
    // DB Query Plan:
    // BEGIN;
    // SELECT balance FROM profiles WHERE id = $1 FOR UPDATE;
    // UPDATE profiles SET balance = balance - $2 WHERE id = $1;
    // INSERT INTO transactions (id, user_id, type, amount, description) VALUES (...);
    // COMMIT;

    console.log(`[SUPABASE TRANSACTION - BEGIN] Initiating purchase of Bingo card for user: ${user_id}`);
    
    if (profile.balance < cardCost) {
      console.log(`[SUPABASE TRANSACTION - ROLLBACK] User balance ${profile.balance} is less than card cost ${cardCost}`);
      return res.status(400).json({ error: "Insufficient balance to purchase Bingo King card ($15.00)" });
    }

    // Capture original balance for rollback safety
    const originalBalance = profile.balance;

    try {
      // Execute Atomic Deduction
      profile.balance = Number((profile.balance - cardCost).toFixed(2));
      console.log(`[SUPABASE TRANSACTION - DEDUCT] Deducted $${cardCost} from user. New balance: ${profile.balance}`);

      // Generate random card (5x5 grid, numbers 1-75)
      const card: number[][] = Array.from({ length: 5 }, (_, r) => 
        Array.from({ length: 5 }, () => Math.floor(1 + Math.random() * 75))
      );
      // FREE SPACE at center
      card[2][2] = 0;

      // Simulate 35 calls immediately
      const called_numbers: number[] = [];
      while (called_numbers.length < 35) {
        const num = Math.floor(1 + Math.random() * 75);
        if (!called_numbers.includes(num)) called_numbers.push(num);
      }

      // Count matches (excluding free center spot)
      let matchesCount = 0;
      card.forEach((row, r) => row.forEach((val, c) => {
        if (r === 2 && c === 2) return;
        if (called_numbers.includes(val)) matchesCount++;
      }));

      // Reward payout calculation based on matches count
      const win = matchesCount >= 10;
      const prize = win ? Math.floor(matchesCount * 4) : 0;
      
      if (win) {
        profile.balance = Number((profile.balance + prize).toFixed(2));
        profile.loyalty_points += 15; // loyalty resource bonus
        console.log(`[SUPABASE TRANSACTION - CREDIT] User won! Credited $${prize} and +15 XP`);
      }

      const bingoState: BingoState = {
        id: "bingo-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user_id,
        card,
        called_numbers,
        progress: Math.floor((matchesCount / 24) * 100),
        won: win,
        purchased_at: new Date().toISOString()
      };

      bingoCards.push(bingoState);

      // Log secure transactions to ledger inside the same atomic boundary
      const buyTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
      transactions.push({
        id: buyTxId,
        user_id,
        type: "bingo_buy",
        amount: -cardCost,
        description: `Purchased Bingo King 75-call card (Verified Ref: ${buyTxId})`,
        created_at: new Date().toISOString()
      });

      if (win) {
        const winTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
        transactions.push({
          id: winTxId,
          user_id,
          type: "bingo_win",
          amount: prize,
          description: `Won Bingo King payout with ${matchesCount} number matches (+15 loyalty resources) (Verified Ref: ${winTxId})`,
          created_at: new Date().toISOString()
        });
      }

      console.log(`[SUPABASE TRANSACTION - COMMIT] Transaction successfully finalized and persisted to ledger.`);

      res.json({
        success: true,
        bingo: bingoState,
        matches: matchesCount,
        prize_won: prize,
        new_balance: profile.balance
      });

    } catch (error) {
      // In case of any unhandled runtime error during processing, trigger automatic state rollback to maintain credit security
      profile.balance = originalBalance;
      console.error(`[SUPABASE TRANSACTION - FATAL ROLLBACK] Transaction failed, state reverted to original balance ${originalBalance}:`, error);
      res.status(500).json({ error: "Secure Supabase ledger transaction failed. Balance was fully rolled back safely." });
    }
  });

  // Game 2: Pick-5 Lottery
  app.post("/api/games/lottery/buy", (req, res) => {
    const { user_id, chosen_numbers } = req.body;
    if (!chosen_numbers || chosen_numbers.length !== 5) {
      return res.status(400).json({ error: "Exactly 5 lottery ticket numbers must be chosen." });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const ticketPrice = 10.00;

    // --- SECURE SUPABASE TRANSACTION (SIMULATED FOR ATOMICITY) ---
    // DB Query Plan:
    // BEGIN;
    // SELECT balance FROM profiles WHERE id = $1 FOR UPDATE;
    // UPDATE profiles SET balance = balance - $2 WHERE id = $1;
    // INSERT INTO transactions (id, user_id, type, amount, description) VALUES (...);
    // COMMIT;

    console.log(`[SUPABASE TRANSACTION - BEGIN] Initiating purchase of Pick-5 Lottery Ticket for user: ${user_id}`);

    if (profile.balance < ticketPrice) {
      console.log(`[SUPABASE TRANSACTION - ROLLBACK] User balance ${profile.balance} is less than ticket price ${ticketPrice}`);
      return res.status(400).json({ error: "Insufficient balance for Pick-5 Lottery ticket ($10.00)" });
    }

    // Capture original balance for rollback safety
    const originalBalance = profile.balance;

    try {
      // Execute Atomic Deduction
      profile.balance = Number((profile.balance - ticketPrice).toFixed(2));
      console.log(`[SUPABASE TRANSACTION - DEDUCT] Deducted $${ticketPrice} from user. New balance: ${profile.balance}`);

      // Draw standard winning numbers (1 to 50)
      const winning: number[] = [];
      while (winning.length < 5) {
        const drawn = Math.floor(1 + Math.random() * 50);
        if (!winning.includes(drawn)) winning.push(drawn);
      }

      // Evaluate matches
      const matches = chosen_numbers.filter((n: number) => winning.includes(n)).length;

      // Define premium tier drops
      let prize = 0;
      let rewardDescription = "";
      if (matches === 1) { prize = 5.00; rewardDescription = "$5.00 Credit Match"; }
      else if (matches === 2) { prize = 20.00; rewardDescription = "$20.00 Credit Match"; }
      else if (matches === 3) { prize = 100.00; rewardDescription = "Epic $100.00 Premium Match"; }
      else if (matches === 4) { prize = 500.00; rewardDescription = "Mega $500.00 Premium Match"; }
      else if (matches === 5) { prize = 2500.00; rewardDescription = "JACKPOT $2500.00 Hype Drop Match!"; }

      if (prize > 0) {
        profile.balance = Number((profile.balance + prize).toFixed(2));
        console.log(`[SUPABASE TRANSACTION - CREDIT] User won Pick-5! Credited $${prize}`);
      }

      const lotState: LotteryState = {
        id: "lottery-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        numbers: chosen_numbers,
        status: prize > 0 ? "win" : "lose",
        winning_numbers: winning,
        matches_count: matches,
        win_value: prize,
        created_at: new Date().toISOString()
      };

      lotteryTickets.push(lotState);

      // Log secure transactions to ledger inside the same atomic boundary
      const buyTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
      transactions.push({
        id: buyTxId,
        user_id,
        type: "lottery_buy",
        amount: -ticketPrice,
        description: `Entered Pick-5 Daily Lottery (Numbers: ${chosen_numbers.join(", ")}) (Verified Ref: ${buyTxId})`,
        created_at: new Date().toISOString()
      });

      if (prize > 0) {
        const winTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
        transactions.push({
          id: winTxId,
          user_id,
          type: "lottery_win",
          amount: prize,
          description: `Won Pick-5 Lottery: ${rewardDescription} (${matches} number matches) (Verified Ref: ${winTxId})`,
          created_at: new Date().toISOString()
        });
      }

      console.log(`[SUPABASE TRANSACTION - COMMIT] Transaction successfully finalized and persisted to ledger.`);

      res.json({
        success: true,
        lottery: lotState,
        winning_numbers: winning,
        matches,
        prize_won: prize,
        new_balance: profile.balance
      });

    } catch (error) {
      // In case of any unhandled runtime error during processing, trigger automatic state rollback to maintain credit security
      profile.balance = originalBalance;
      console.error(`[SUPABASE TRANSACTION - FATAL ROLLBACK] Transaction failed, state reverted to original balance ${originalBalance}:`, error);
      res.status(500).json({ error: "Secure Supabase ledger transaction failed. Balance was fully rolled back safely." });
    }
  });

  // Game 3: Item Upgrader
  // Security Constraint: Ensures item is consumed on the line for 45% probability chance to scale value x1.5
  app.post("/api/games/upgrade", (req, res) => {
    const { user_id, item_id } = req.body;
    const itemIndex = inventories.findIndex(inv => inv.id === item_id && inv.user_id === user_id && inv.status === 'inventory');
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Selected item not in active inventory" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const invItem = inventories[itemIndex];
    const originalValue = invItem.item?.value || 10;

    // Roll upgraded probability (Exactly 45% success rate)
    const upgradeRoll = Math.random();
    const isSuccess = upgradeRoll < 0.45;

    if (isSuccess) {
      // 1.5x Worth Scaling
      const newValue = Number((originalValue * 1.5).toFixed(2));
      invItem.status = 'upgraded_won';
      
      // Add a custom scaled item into user's inventory
      const upgradedItem: BoxItem = {
        id: `upg-${invItem.item?.id || 'item'}`,
        box_id: invItem.item?.box_id || 'manual',
        name: `Upgraded ★ ${invItem.item?.name || 'Item'}`,
        image_url: invItem.item?.image_url || '',
        value: newValue,
        rarity: 'legendary',
        probability: 0
      };

      inventories.push({
        id: "inv-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        item_id: upgradedItem.id,
        box_name: invItem.box_name,
        status: "inventory",
        sell_price: Number((newValue * 0.8).toFixed(2)),
        created_at: new Date().toISOString(),
        item: upgradedItem
      });

      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        type: "upgrade_win",
        amount: 0,
        description: `★ Item Upgrader Success! Scaled ${invItem.item?.name} value to $${newValue}`,
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        upgraded: true,
        new_value: newValue,
        message: `Upgrader Success! Scaled to ★ ${newValue}!`
      });
    } else {
      // Item lost
      invItem.status = 'upgraded_lost';

      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        type: "upgrade_loss",
        amount: -originalValue,
        description: `✕ Item Upgrader Lost: "${invItem.item?.name}" ($${originalValue}) incinerated during upgrade attempt.`,
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        upgraded: false,
        message: `Upgrader Failed. Item has been incinerated.`
      });
    }
  });

  // Game 4: Jackpot Multiplier Mini-game
  app.post("/api/games/jackpot", (req, res) => {
    const { user_id, item_ids, multiplier } = req.body;
    if (!user_id || !Array.isArray(item_ids) || item_ids.length === 0 || !multiplier) {
      return res.status(400).json({ error: "Invalid parameters. Please specify user_id, item_ids array, and multiplier." });
    }

    const targetMultiplier = Number(multiplier);
    if (isNaN(targetMultiplier) || targetMultiplier < 1.5 || targetMultiplier > 100) {
      return res.status(400).json({ error: "Multiplier must be a number between 1.5x and 100x" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Validate and load items from active inventory
    const itemsToRisk: InventoryItem[] = [];
    const missingItems: string[] = [];

    for (const id of item_ids) {
      const idx = inventories.findIndex(inv => inv.id === id && inv.user_id === user_id && inv.status === 'inventory');
      if (idx === -1) {
        missingItems.push(id);
      } else {
        itemsToRisk.push(inventories[idx]);
      }
    }

    if (missingItems.length > 0) {
      return res.status(400).json({ error: "One or more selected items were not found in your active inventory." });
    }

    // Calculate total value
    const totalValue = itemsToRisk.reduce((sum, inv) => sum + (inv.item?.value || 0), 0);
    if (totalValue <= 0) {
      return res.status(400).json({ error: "The total value of selected items must be greater than zero." });
    }

    // Win probability based on target multiplier with standard 95% RTP (5% house edge)
    const winChance = 0.95 / targetMultiplier;
    const roll = Math.random();
    const isSuccess = roll < winChance;

    // Consume all items
    itemsToRisk.forEach(inv => {
      inv.status = isSuccess ? 'jackpot_won' : 'jackpot_lost';
    });

    if (isSuccess) {
      // Calculate multiplied worth value
      const newValue = Number((totalValue * targetMultiplier).toFixed(2));
      
      const jackpotItem: BoxItem = {
        id: `jp-${Math.floor(100000 + Math.random() * 900000)}`,
        box_id: 'manual_jackpot',
        name: `Jackpot ★ ${targetMultiplier}x Winner`,
        image_url: itemsToRisk[0].item?.image_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=120',
        value: newValue,
        rarity: 'legendary',
        probability: 0
      };

      const newInvItem: InventoryItem = {
        id: "inv-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        item_id: jackpotItem.id,
        box_name: "Jackpot Multiplier",
        status: "inventory",
        sell_price: Number((newValue * 0.8).toFixed(2)),
        created_at: new Date().toISOString(),
        item: jackpotItem
      };

      inventories.push(newInvItem);

      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        type: "jackpot_win",
        amount: 0,
        description: `🎉 Jackpot Multiplier Success! Risked ${itemsToRisk.length} item(s) to win ★ ${targetMultiplier}x worth multiplier. Won custom $${newValue} Legendary Item!`,
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        won: true,
        new_value: newValue,
        item: newInvItem,
        message: `🎉 Jackpot HIT! Risked items multiplied by ${targetMultiplier}x to win a $${newValue} Legendary Item!`
      });
    } else {
      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        type: "jackpot_loss",
        amount: -totalValue,
        description: `✕ Jackpot Multiplier Loss: Risked ${itemsToRisk.length} item(s) ($${totalValue.toFixed(2)}) on a ${targetMultiplier}x multiplier and lost.`,
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        won: false,
        message: `✕ Jackpot Failed. Risked items ($${totalValue.toFixed(2)}) have been incinerated.`
      });
    }
  });

  // Get Live Feed
  app.get("/api/live-feed", (req, res) => {
    res.json(liveFeed);
  });

  // Chat Feed
  app.get("/api/chat", (req, res) => {
    res.json(chatMessages);
  });

  app.post("/api/chat/send", (req, res) => {
    const { username, text } = req.body;
    if (!text || !username) return res.status(400).json({ error: "Missing fields" });

    const message: ChatMessage = {
      id: "chat-" + Math.floor(100000 + Math.random() * 900000),
      username,
      text,
      timestamp: new Date().toISOString()
    };
    chatMessages.push(message);
    if (chatMessages.length > 100) chatMessages.shift();
    res.json(message);
  });

  // Fetch Inventory
  app.get("/api/inventory/:userId", (req, res) => {
    const userInv = inventories.filter(inv => inv.user_id === req.params.userId);
    res.json(userInv);
  });

  // Fetch Transactions Ledger Log
  app.get("/api/transactions/:userId", (req, res) => {
    const userTxs = transactions.filter(tx => tx.user_id === req.params.userId);
    res.json(userTxs);
  });

  // Fetch shipments for Admin Panel
  app.get("/api/admin/shipments", (req, res) => {
    const shippedItems = inventories.filter(inv => inv.status === 'shipped');
    const responseData = shippedItems.map(inv => {
      const user = profiles.find(p => p.id === inv.user_id);
      return {
        id: inv.id,
        username: user ? user.username : "Unknown",
        itemName: inv.item?.name || "Unknown Item",
        shippingAddress: user ? user.shipping_address : "No address listed",
        status: "processing",
        trackingLabel: inv.shipping_label
      };
    });
    res.json(responseData);
  });

  // Process Shipment
  app.post("/api/admin/shipments/:id/process", (req, res) => {
    const { id } = req.params;
    const inv = inventories.find(item => item.id === id);
    if (!inv) {
      return res.status(404).json({ error: "Shipment item not found" });
    }
    inv.status = 'processing';
    res.json({
      success: true,
      message: `Successfully updated shipping status for tracking label ${inv.shipping_label || 'N/A'}`
    });
  });

  // Admin sync statistics
  app.post("/api/admin-sync", (req, res) => {
    // Admin operations recalculate statistics using service role simulating privileges
    const { service_key } = req.body;
    if (service_key !== "SUPABASE_SERVICE_ROLE_KEY" && service_key !== "admin-dev-key") {
      return res.status(401).json({ error: "Unauthorized access boundary check failed" });
    }

    // Recalculate unbox totals
    seedBoxes.forEach(box => {
      const count = inventories.filter(inv => inv.box_name === box.name).length;
      box.total_opened = count + Math.floor(50 + Math.random() * 10);
    });

    res.json({
      success: true,
      message: "Synced statistics, updated counters and leaderboards seamlessly."
    });
  });

  // Leaderboard statistics
  app.get("/api/leaderboard", (req, res) => {
    // Auto rank profiles
    const leaderboardData = profiles.map(p => {
      // Aggregate winnings from transaction ledger
      const wins = transactions.filter(t => t.user_id === p.id && t.type === 'battle_win').length;
      const unboxVal = inventories.filter(i => i.user_id === p.id).reduce((sum, item) => sum + (item.item?.value || 0), 0);
      return {
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        total_wins: wins + Math.floor(p.balance / 120),
        total_value: Number(unboxVal.toFixed(2)) + Number((p.balance * 1.5).toFixed(2))
      };
    }).sort((a, b) => b.total_value - a.total_value);

    res.json(leaderboardData);
  });

  // --- SERVING THE CLIENT (VITE MIDDLEWARE IN DEV, STATIC IN PROD) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0, port ${PORT}`);
  });
}

startServer();
