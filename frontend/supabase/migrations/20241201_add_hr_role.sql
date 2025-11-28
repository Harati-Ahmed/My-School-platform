-- =============================================
-- Add HR Role to User Role Enum - Part 1
-- =============================================
-- This migration adds 'hr' as a new role option
--
-- NOTE: Enum value additions must be committed before they can be used
-- This file ONLY adds the enum value. Policies and functions are in part 2.

-- Add 'hr' to the user_role enum
-- This must be committed before it can be used in functions/policies
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';

