-- Supabase RPC Function Update
-- 请在 Supabase SQL Editor 中运行此脚本以加固后端权限

CREATE OR REPLACE FUNCTION admin_top_up(p_phone text, p_amount int, p_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance int;
  -- ⚠️ 必须与 AdminTool_Snippet.cs 中的 ADMIN_SECRET 保持一致
  v_admin_secret text := 'MAYIJU_ADMIN_SECRET_2026'; 
BEGIN
  -- 1. 权限校验 (Security Check)
  IF p_secret != v_admin_secret THEN
    RAISE EXCEPTION 'Unauthorized: Invalid Admin Secret';
  END IF;

  -- 2. 查找用户 (Find User)
  SELECT id, balance_g INTO v_user_id, v_current_balance
  FROM app_users
  WHERE phone_number = p_phone;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_phone;
  END IF;

  -- 3. 更新余额 (Update Balance)
  UPDATE app_users
  SET balance_g = v_current_balance + p_amount
  WHERE id = v_user_id;

  -- 4. 审计日志 (Audit Log)
  -- 记录到 recharges 表，amount_u=0 标识为管理员手动调整
  INSERT INTO recharges (user_phone, amount_u, points_added, rate, created_at)
  VALUES (p_phone, 0, p_amount, 0, now());

END;
$$;
