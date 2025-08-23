-- Sample transactions for testing dashboard
INSERT INTO transactions (user_id, category_id, amount, type, description, date, payment_method) VALUES
-- Income transactions
(1, 1, 3500.00, 'income', 'Monthly Salary', '2025-08-01', 'bank_transfer'),
(1, 1, 500.00, 'income', 'Freelance Work', '2025-08-15', 'bank_transfer'),

-- Expense transactions
(1, 2, 1200.00, 'expense', 'Monthly Rent', '2025-08-01', 'bank_transfer'),
(1, 3, 350.00, 'expense', 'Groceries', '2025-08-05', 'debit_card'),
(1, 4, 80.00, 'expense', 'Gas Station', '2025-08-07', 'credit_card'),
(1, 5, 120.00, 'expense', 'Internet Bill', '2025-08-10', 'bank_transfer'),
(1, 6, 45.00, 'expense', 'Movie Tickets', '2025-08-12', 'credit_card'),
(1, 7, 200.00, 'expense', 'New Shoes', '2025-08-14', 'debit_card'),
(1, 8, 75.00, 'expense', 'Doctor Visit', '2025-08-18', 'cash'),

-- Previous month data for trends
(1, 1, 3500.00, 'income', 'Monthly Salary', '2025-07-01', 'bank_transfer'),
(1, 2, 1200.00, 'expense', 'Monthly Rent', '2025-07-01', 'bank_transfer'),
(1, 3, 280.00, 'expense', 'Groceries', '2025-07-15', 'debit_card'),
(1, 4, 90.00, 'expense', 'Gas Station', '2025-07-20', 'credit_card');

-- Sample budget data
INSERT INTO budgets (user_id, category_id, period, amount) VALUES
(1, 2, '2025-08', 1200.00),  -- Rent & Housing
(1, 3, '2025-08', 400.00),   -- Food & Dining
(1, 4, '2025-08', 150.00),   -- Transport
(1, 5, '2025-08', 200.00),   -- Subscriptions
(1, 6, '2025-08', 100.00),   -- Entertainment
(1, 7, '2025-08', 300.00),   -- Shopping
(1, 8, '2025-08', 200.00);   -- Health
