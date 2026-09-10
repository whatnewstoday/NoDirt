-- Quick fix migration: Add missing columns and fix status ENUM
-- Run this if bookings are not appearing in the assignment page

-- 1. Add 'confirmed' to status ENUM (used by assignEmployee)
ALTER TABLE bookingservice
  MODIFY COLUMN status ENUM('booked', 'confirmed', 'processing', 'in progress', 'completed', 'cancelled') DEFAULT 'booked';

-- 2. Add access snapshot columns (required by bookService INSERT)
-- These will silently fail if columns already exist
ALTER TABLE bookingservice
  ADD COLUMN IF NOT EXISTS accessMethodSnapshot VARCHAR(50) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS lockboxLocationSnapshot VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS lockboxPinEncSnapshot TEXT NULL,
  ADD COLUMN IF NOT EXISTS condoGuideEncSnapshot TEXT NULL,
  ADD COLUMN IF NOT EXISTS accessNoteEncSnapshot TEXT NULL;

-- 3. Verify: Show current table structure
DESCRIBE bookingservice;
