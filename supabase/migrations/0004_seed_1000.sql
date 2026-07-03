DO $$
DECLARE
  box_uuid UUID;
  i INT;
BEGIN
  FOR i IN 1..1000 LOOP
    box_uuid := gen_random_uuid();
    INSERT INTO boxes (id, name, description, image_url, price, category, rarity, total_opened)
    VALUES (
      box_uuid,
      'Mega Volume Box ' || i,
      'A programmatic mega box representing scale and robustness testing.',
      'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?q=80&w=200&auto=format&fit=crop',
      8.00 + (i % 80),
      'Mega Volume',
      CASE WHEN i % 5 = 0 THEN 'common' WHEN i % 5 = 1 THEN 'rare' WHEN i % 5 = 2 THEN 'epic' ELSE 'legendary' END,
      0
    );

    -- 70% Common
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Mega Copper Token ' || i, 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=120&auto=format&fit=crop', 0.80 + (i % 3), 'common', 0.7000);

    -- 20% Rare
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Mega Silver Node ' || i, 'https://images.unsplash.com/photo-1605773527852-c54373bd779b?q=80&w=120&auto=format&fit=crop', 6.00 + (i % 8), 'rare', 0.2000);

    -- 8% Epic
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Mega Golden Scepter ' || i, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=120&auto=format&fit=crop', 30.00 + (i % 15), 'epic', 0.0800);

    -- 2% Legendary
    INSERT INTO box_items (id, box_id, name, image_url, value, rarity, probability)
    VALUES (gen_random_uuid(), box_uuid, 'Mega Cyber Relic ' || i, 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=120&auto=format&fit=crop', 180.00 + (i % 90), 'legendary', 0.0200);
  END LOOP;
END $$;
