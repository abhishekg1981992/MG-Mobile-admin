-- Migration: Add date of birth column to clients table (idempotent)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dob DATE NULL AFTER phone;
