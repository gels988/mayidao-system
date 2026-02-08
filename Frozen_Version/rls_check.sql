-- 🛡️ WebVersion1 - 最终版 RLS 权限配置 (修正版)
-- 适用表结构: app_users, event_tracks, recharges (全部复数)

-- 1. 安全启用 RLS
DO $$ 
BEGIN
    -- 用户表
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_users') THEN
        ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- 埋点表
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_tracks') THEN
        ALTER TABLE public.event_tracks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- 充值表 (仅匹配 recharges)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recharges') THEN
        ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. 清理旧策略 (避免冲突)
DROP POLICY IF EXISTS "app_users_anon_access" ON public.app_users;
DROP POLICY IF EXISTS "event_tracks_anon_insert" ON public.event_tracks;
DROP POLICY IF EXISTS "recharges_anon_insert" ON public.recharges;
-- 清理可能存在的单数表策略垃圾数据
DROP POLICY IF EXISTS "recharge_anon_insert" ON public.recharges; 

-- 3. 创建新策略：允许前端(anon)直接读写

-- 用户表：允许读写所有数据（登录、注册、扣费）
CREATE POLICY "app_users_anon_access" 
ON public.app_users FOR ALL TO anon 
USING (true) WITH CHECK (true);

-- 埋点表：允许插入数据
CREATE POLICY "event_tracks_anon_insert" 
ON public.event_tracks FOR INSERT TO anon 
WITH CHECK (true);

-- 充值表：允许插入数据
CREATE POLICY "recharges_anon_insert" 
ON public.recharges FOR INSERT TO anon 
WITH CHECK (true);

-- 4. 验证结果
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('app_users', 'event_tracks', 'recharges');
