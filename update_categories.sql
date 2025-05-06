-- SQL Script to update categories table with only necessary categories
-- First, delete all existing user-created categories (where user_id is not null)
DELETE FROM categories WHERE user_id IS NOT NULL;

-- Then, delete all system categories except the ones we want to keep
DELETE FROM categories 
WHERE user_id IS NULL 
AND name NOT IN ('Food', 'Transportation', 'Entertainment', 'Gifts');

-- Update the remaining categories to match our frontend display
-- Food category
UPDATE categories 
SET name = 'Food & Dining', 
    color = '#22C55E', 
    icon = 'ShoppingBagIcon',
    description = 'Groceries, restaurants, and food delivery'
WHERE name = 'Food';

-- Transportation category
UPDATE categories 
SET color = '#3B82F6', 
    icon = 'TruckIcon',
    description = 'Gas, public transit, and vehicle maintenance'
WHERE name = 'Transportation';

-- Entertainment category
UPDATE categories 
SET color = '#8B5CF6', 
    icon = 'FilmIcon',
    description = 'Movies, games, and hobbies'
WHERE name = 'Entertainment';

-- Gifts category (if it exists as income, update it; otherwise we'll insert it)
UPDATE categories 
SET type = 'expense',
    color = '#EC4899', 
    icon = 'GiftIcon',
    description = 'Presents and special occasions'
WHERE name = 'Gifts';

-- Insert Pet Expenses category if it doesn't exist
INSERT INTO categories (name, type, color, icon, description, is_default, user_id)
SELECT 'Pet Expenses', 'expense', '#EC4899', 'HeartIcon', 'Food and care for pets', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pet Expenses');
