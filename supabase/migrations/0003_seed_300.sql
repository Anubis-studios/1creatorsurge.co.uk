DO $$
DECLARE
  box_uuid UUID;
  i INT;
BEGIN
  FOR i IN 1..300 LOOP
    box_uuid := gen_random_uuid();
    INSERT INTO boxes (id, name, description, image_url, price, category, rarity, total_opened)
    VALUES (
      box_uuid,
      'Symmetric Seed Box ' || i,
      'A scalable box generated for load testing and seed validation.',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop',
      15.00 + (i % 40),
      'Symmetric Seed',
      CASE WHEN i % 4 = 0 THEN 'common' WHEN i % 4 = 1 THEN 'rare' WHEN i % 4 = 2 THEN 'epic' ELSE 'legendary' END,
      0
    );

    -- 70% Common
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Seed Metal Crest ' || i, 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=120&auto=format&fit=crop', 1.50 + (i % 5), 'common', 0.7000);

    -- 20% Rare
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Seed Plasma Connector ' || i, 'https://images.unsplash.com/photo-1605773527852-c54373bd779b?q=80&w=120&auto=format&fit=crop', 10.00 + (i % 10), 'rare', 0.2000);

    -- 8% Epic
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Seed Fusion Core ' || i, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=120&auto=format&fit=crop', 45.00 + (i % 25), 'epic', 0.0800);

    -- 2% Legendary
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Seed Quantum Processor ' || i, 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=120&auto=format&fit=crop', 220.00 + (i % 100), 'legendary', 0.0200);
  END LOOP;
END $$;
