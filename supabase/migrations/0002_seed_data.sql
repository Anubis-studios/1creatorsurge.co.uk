-- Seed core boxes
INSERT INTO boxes (id, name, description, image_url, price, category, rarity, total_opened) VALUES
('b1111111-1111-1111-1111-111111111111', 'Tech Legends', 'Unbox legendary tech gear, custom keyboards, and top-tier gadgets.', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop', 120.00, 'Technology', 'epic', 145),
('b2222222-2222-2222-2222-222222222222', 'Sneaker Vault', 'Limited edition hypebeast footwear and legendary drops.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=200&auto=format&fit=crop', 250.00, 'Lifestyle', 'legendary', 84),
('b3333333-3333-3333-3333-333333333333', 'Gaming Crate', 'Essential equipment for pro gamers, audio gears, and accessories.', 'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?q=80&w=200&auto=format&fit=crop', 45.00, 'Gaming', 'rare', 312);

-- Seed items for Tech Legends ($120)
-- 70% Common: custom mechanical desk mat ($15), custom keycap set ($30)
-- 20% Rare: gaming mouse ($80), ultra-wide monitor mount ($110)
-- 8% Epic: dynamic studio microphone ($250), custom mechanical keyboard ($350)
-- 2% Legendary: high-end graphics card ($1200)
INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability) VALUES
(gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'Custom Neon Desk Mat', 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=120&auto=format&fit=crop', 15.00, 'common', 0.4000),
(gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'Retro Dye-Sub Keycaps', 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=120&auto=format&fit=crop', 30.00, 'common', 0.3000),
(gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'Wireless Cyber Mouse', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=120&auto=format&fit=crop', 80.00, 'rare', 0.1200),
(gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'Premium Gas-Spring Arm', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=120&auto=format&fit=crop', 110.00, 'rare', 0.0800),
(gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'Dynamic Podcast Mic', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=120&auto=format&fit=crop', 250.00, 'epic', 0.0500),
(gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'Hot-Swap 75% Keyboard', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=120&auto=format&fit=crop', 350.00, 'epic', 0.0300),
(gen_random_uuid(), 'b1111111-1111-1111-1111-111111111111', 'GeForce RTX 4080 Super', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=120&auto=format&fit=crop', 1200.00, 'legendary', 0.0200);

-- Seed items for Sneaker Vault ($250)
-- 70% Common: sneaker storage boxes ($25), crease protectors ($10)
-- 20% Rare: premium suede cleaner ($40), street-style slide sandals ($90)
-- 8% Epic: vintage streetwear hoodie ($300), air max retro edition ($380)
-- 2% Legendary: limited collection basketball kicks ($1600)
INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability) VALUES
(gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'Crease Shields Multipack', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=120&auto=format&fit=crop', 10.00, 'common', 0.4500),
(gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'Acrylic Magnetic Display Cases', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=120&auto=format&fit=crop', 35.00, 'common', 0.2500),
(gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'Suede Cleaning Care Kit', 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=120&auto=format&fit=crop', 40.00, 'rare', 0.1200),
(gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'Platform Cyber Slides', 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=120&auto=format&fit=crop', 95.00, 'rare', 0.0800),
(gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'Retro Patchwork Hoodie', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=120&auto=format&fit=crop', 280.00, 'epic', 0.0500),
(gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'Air Max Limited Retro', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=120&auto=format&fit=crop', 390.00, 'epic', 0.0300),
(gen_random_uuid(), 'b2222222-2222-2222-2222-222222222222', 'Custom Hypebeast Dunks', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=120&auto=format&fit=crop', 1500.00, 'legendary', 0.0200);

-- Seed items for Gaming Crate ($45)
-- 70% Common: rubber keycaps ($5), rgb light strips ($12)
-- 20% Rare: gaming mouse bungee ($18), soundproofing tiles ($35)
-- 8% Epic: rgb gaming headset ($99), mechanical macro pad ($120)
-- 2% Legendary: custom desk control dock ($350)
INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability) VALUES
(gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', 'Silicone Anti-Slip Grips', 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=120&auto=format&fit=crop', 8.00, 'common', 0.4000),
(gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', 'Neon RGB Glow Strip', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=120&auto=format&fit=crop', 15.00, 'common', 0.3000),
(gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', 'High-Tension Mouse Bungee', 'https://images.unsplash.com/photo-1605773527852-c54373bd779b?q=80&w=120&auto=format&fit=crop', 22.00, 'rare', 0.1200),
(gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', 'Hexagon Acoustic Tiles x10', 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=120&auto=format&fit=crop', 40.00, 'rare', 0.0800),
(gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', 'Immersive RGB Headset', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=120&auto=format&fit=crop', 110.00, 'epic', 0.0500),
(gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', 'Premium USB Macro Pad', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=120&auto=format&fit=crop', 130.00, 'epic', 0.0300),
(gen_random_uuid(), 'b3333333-3333-3333-3333-333333333333', 'Tactile Stream Command Center', 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=120&auto=format&fit=crop', 380.00, 'legendary', 0.0200);
