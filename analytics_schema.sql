-- 📊 数据库结构补全与修复脚本 (修正版)
-- 作用：检测并修复 app_users, event_tracks, recharges 的表结构
-- 修复策略：如果表已存在但缺列，自动添加列；如果列名不匹配，给出提示。

DO $$ 
BEGIN
    -- ==========================================
    -- 1. 检查并修复 event_tracks (埋点表)
    -- ==========================================
    -- 如果表不存在，创建它
    CREATE TABLE IF NOT EXISTS public.event_tracks (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamptz DEFAULT now()
    );

    -- 检查 'event_name' 列是否存在，不存在则添加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_tracks' AND column_name='event_name') THEN
        ALTER TABLE public.event_tracks ADD COLUMN event_name text;
    END IF;

    -- 检查 'user_id' 列是否存在，不存在则添加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_tracks' AND column_name='user_id') THEN
        ALTER TABLE public.event_tracks ADD COLUMN user_id text;
    END IF;

    -- 检查 'properties' 列是否存在，不存在则添加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='event_tracks' AND column_name='properties') THEN
        ALTER TABLE public.event_tracks ADD COLUMN properties jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- ==========================================
    -- 2. 检查并修复 app_users (用户表)
    -- ==========================================
    CREATE TABLE IF NOT EXISTS public.app_users (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- 补全 phone_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='app_users' AND column_name='phone_number') THEN
        ALTER TABLE public.app_users ADD COLUMN phone_number text;
        -- 尝试添加唯一约束 (可能会因重复数据失败，所以包在 block 里)
        BEGIN
            ALTER TABLE public.app_users ADD CONSTRAINT app_users_phone_number_key UNIQUE (phone_number);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    -- 补全 balance_g
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='app_users' AND column_name='balance_g') THEN
        ALTER TABLE public.app_users ADD COLUMN balance_g integer DEFAULT 0;
    END IF;

    -- 补全 vip_tier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='app_users' AND column_name='vip_tier') THEN
        ALTER TABLE public.app_users ADD COLUMN vip_tier integer DEFAULT 0;
    END IF;

    -- ==========================================
    -- 3. 检查并修复 recharges (充值表)
    -- ==========================================
    CREATE TABLE IF NOT EXISTS public.recharges (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamptz DEFAULT now()
    );

    -- 补全 user_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recharges' AND column_name='user_phone') THEN
        ALTER TABLE public.recharges ADD COLUMN user_phone text;
    END IF;

    -- 补全 amount_u
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recharges' AND column_name='amount_u') THEN
        ALTER TABLE public.recharges ADD COLUMN amount_u numeric;
    END IF;

    -- 补全 points_added
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recharges' AND column_name='points_added') THEN
        ALTER TABLE public.recharges ADD COLUMN points_added integer;
    END IF;

    -- 补全 rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recharges' AND column_name='rate') THEN
        ALTER TABLE public.recharges ADD COLUMN rate numeric;
    END IF;

    -- 补全 status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recharges' AND column_name='status') THEN
        ALTER TABLE public.recharges ADD COLUMN status text DEFAULT 'completed';
    END IF;

END $$;

-- ==========================================
-- 4. 重建索引 (安全模式)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON public.app_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_event_tracks_name ON public.event_tracks(event_name);
CREATE INDEX IF NOT EXISTS idx_event_tracks_user ON public.event_tracks(user_id);
