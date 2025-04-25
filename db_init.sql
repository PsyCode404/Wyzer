-- Wyzer Database Initialization Script
-- This script creates and initializes the database for Wyzer, a personal finance and budget tracking application
-- Created: April 24, 2025

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wyzer;

-- Use the wyzer database
USE wyzer;

-- -----------------------------------------------------
-- Table `users`
-- Stores user authentication information
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `verification_token` VARCHAR(255) NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expires` TIMESTAMP NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `profiles`
-- Stores user profile information
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `profiles` (
  `profile_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `currency_code` CHAR(3) NOT NULL DEFAULT 'USD',
  `date_format` VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',
  `avatar_url` VARCHAR(255) NULL,
  `theme_preference` VARCHAR(20) NOT NULL DEFAULT 'light',
  `notification_preferences` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`profile_id`),
  CONSTRAINT `fk_profiles_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `categories`
-- Stores transaction categories (both system defaults and user-created)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL, -- NULL for system default categories
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `color` VARCHAR(7) NOT NULL DEFAULT '#6366F1', -- Default color (indigo)
  `icon` VARCHAR(50) NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  CONSTRAINT `fk_categories_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `transactions`
-- Stores all financial transactions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `transaction_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `category_id` INT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('income', 'expense', 'transfer') NOT NULL,
  `description` VARCHAR(255) NULL,
  `date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NULL,
  `status` ENUM('cleared', 'pending', 'reconciled') NOT NULL DEFAULT 'cleared',
  `notes` TEXT NULL,
  `attachment_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `location` VARCHAR(255) NULL,
  `tags` JSON NULL,
  PRIMARY KEY (`transaction_id`),
  INDEX `idx_transactions_date` (`date` ASC),
  INDEX `idx_transactions_user_date` (`user_id` ASC, `date` ASC),
  CONSTRAINT `fk_transactions_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_transactions_categories`
    FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`category_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `recurring_transactions`
-- Stores recurring transaction templates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `recurring_transactions` (
  `recurring_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `category_id` INT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('income', 'expense', 'transfer') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `frequency` ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually') NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `next_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recurring_id`),
  INDEX `idx_recurring_next_date` (`next_date` ASC),
  INDEX `idx_recurring_user_next_date` (`user_id` ASC, `next_date` ASC),
  CONSTRAINT `fk_recurring_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_recurring_categories`
    FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`category_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Insert default categories
-- -----------------------------------------------------
INSERT INTO `categories` (`name`, `type`, `color`, `icon`, `is_default`) VALUES 
('Salary', 'income', '#10B981', 'cash', TRUE),
('Investments', 'income', '#6366F1', 'chart-bar', TRUE),
('Gifts', 'income', '#F59E0B', 'gift', TRUE),
('Other Income', 'income', '#6B7280', 'dots-horizontal', TRUE),
('Housing', 'expense', '#EF4444', 'home', TRUE),
('Transportation', 'expense', '#3B82F6', 'truck', TRUE),
('Food', 'expense', '#F97316', 'shopping-bag', TRUE),
('Utilities', 'expense', '#8B5CF6', 'light-bulb', TRUE),
('Healthcare', 'expense', '#EC4899', 'heart', TRUE),
('Entertainment', 'expense', '#14B8A6', 'ticket', TRUE),
('Shopping', 'expense', '#F59E0B', 'shopping-cart', TRUE),
('Education', 'expense', '#6366F1', 'academic-cap', TRUE),
('Personal Care', 'expense', '#EC4899', 'user', TRUE),
('Debt', 'expense', '#EF4444', 'credit-card', TRUE),
('Savings', 'expense', '#10B981', 'currency-dollar', TRUE),
('Gifts & Donations', 'expense', '#8B5CF6', 'gift', TRUE),
('Taxes', 'expense', '#6B7280', 'document', TRUE),
('Travel', 'expense', '#0EA5E9', 'globe', TRUE),
('Subscriptions', 'expense', '#6366F1', 'refresh', TRUE),
('Miscellaneous', 'expense', '#6B7280', 'dots-horizontal', TRUE);

-- End of Wyzer Database Initialization Script
