-- SQL Script to update categories table with only the specified default categories
-- First, delete all existing categories
DELETE FROM categories;

-- Insert the five specified default categories with appropriate colors and icons
INSERT INTO categories (name, type, color, icon, description, is_default, user_id) VALUES 
('Food', 'expense', '#10B981', 'ShoppingBagIcon', 'Groceries, restaurants, and food delivery', 1, NULL),
('Transport', 'expense', '#3B82F6', 'TruckIcon', 'Gas, public transit, and vehicle maintenance', 1, NULL),
('Rent', 'expense', '#8B5CF6', 'HomeIcon', 'Monthly housing rent', 1, NULL),
('House Chores', 'expense', '#F59E0B', 'WrenchIcon', 'Cleaning, maintenance, and household supplies', 1, NULL),
('Subscriptions', 'expense', '#EC4899', 'CreditCardIcon', 'Recurring payments for services', 1, NULL);

-- Reset the auto-increment counter to ensure new categories start from a clean sequence
ALTER TABLE categories AUTO_INCREMENT = 6;
