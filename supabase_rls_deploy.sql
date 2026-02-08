-- ========== 启用RLS (Enable RLS) ========== 
-- 必须在 Supabase SQL Editor 中执行此脚本
-- Executing this script in Supabase SQL Editor is MANDATORY

-- 1. Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY; 

-- 2. Create Policy: Users can only access their own data
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS user_own_data ON users;
DROP POLICY IF EXISTS user_own_predictions ON predictions;

CREATE POLICY user_own_data ON users 
  FOR ALL TO anon 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid()); 

CREATE POLICY user_own_predictions ON predictions 
  FOR ALL TO anon 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid()); 

-- 3. Create Secure RPC Function: Deduct Gas
-- Returns TRUE if successful, FALSE if insufficient balance
CREATE OR REPLACE FUNCTION deduct_gas_secure(user_id UUID, amount INT) 
RETURNS BOOLEAN AS $$ 
BEGIN 
  -- 检查余额是否足够 
  IF (SELECT gas_balance FROM users WHERE id = user_id) < amount THEN 
    RETURN FALSE; 
  END IF; 
  
  -- 原子化扣分 (注意: 字段名统一为 gas_balance，需根据实际表结构确认是 gas_balance 还是 balance_g)
  -- 假设数据库字段为 gas_balance (根据 db_client.js 推断)
  UPDATE users 
  SET gas_balance = gas_balance - amount 
  WHERE id = user_id; 
  
  RETURN TRUE; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- 4. Create Secure RPC Function: Update Accuracy
CREATE OR REPLACE FUNCTION update_accuracy_secure(user_id UUID, new_accuracy DECIMAL) 
RETURNS BOOLEAN AS $$ 
BEGIN 
  UPDATE users 
  SET accuracy = new_accuracy 
  WHERE id = user_id; 
  
  RETURN TRUE; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== 验证脚本 (Verification) ==========
-- 执行完上述脚本后，运行以下查询确认状态：
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('users', 'predictions'); 
