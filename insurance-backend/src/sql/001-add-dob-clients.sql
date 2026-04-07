-- Migration: Add date of birth column to clients table
ALTER TABLE clients ADD COLUMN dob DATE NULL AFTER phone;
