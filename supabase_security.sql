-- 🚨 SECURITY HARDENING SCRIPT
-- Execute this in Supabase SQL Editor to secure your data and enable RPC.

-- 1. Enable Row Level Security (RLS) on 'users' table
-- This is the MOST CRITICAL step. Without this, your data is public.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Users can only view/edit their own data
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own data" ON users;

CREATE POLICY "Users can manage own data" ON users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Create Secure RPC Function for Gas Deduction
-- This ensures the logic runs on the server, preventing client-side tampering.
CREATE OR REPLACE FUNCTION deduct_gas_secure(user_id uuid, amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_bal int;
  new_bal int;
BEGIN
  -- Verify user is operating on their own data
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  -- Lock the row for update to prevent race conditions
  SELECT gas_balance INTO current_bal FROM users WHERE id = user_id FOR UPDATE;
  
  IF current_bal IS NULL THEN
     RAISE EXCEPTION 'User not found';
  END IF;

  IF current_bal < amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  new_bal := current_bal - amount;
  
  UPDATE users SET gas_balance = new_bal WHERE id = user_id;
  
  RETURN new_bal;
END;
$$;

-- 4. Create Secure RPC Function for Accuracy Update
CREATE OR REPLACE FUNCTION update_accuracy_secure(user_id uuid, new_accuracy float)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;
  
  UPDATE users SET accuracy = new_accuracy WHERE id = user_id;
END;
$$;
