-- 建立用户表
create table if not exists public.app_users (
    id uuid primary key default gen_random_uuid(),
    phone_number text not null unique,
    balance_g integer not null default 300,
    created_at timestamptz not null default now(),
    last_login timestamptz
);

-- 开启安全策略
alter table public.app_users enable row level security;

create policy "allow_select_own" on public.app_users 
    for select using (auth.uid() = id); -- Note: In this simple phone-only implementation without auth.users, we might need a different policy or use the service role/anon key carefully. 
    -- The user asked for: "Web 端用户只能读取自己的余额。"
    -- But since we are not using Supabase Auth (GoTrue) with SMS OTP yet (User said "no verification code"), we are just using the table.
    -- If we use the anon key, RLS will block access unless we have a policy.
    -- For this "open" phase, maybe we allow select by phone number? Or just allow all select for now as per user's prompt "Web 端用户只能读取自己的余额" - this implies we need some identification.
    -- However, the user's prompt provided SQL says: `create policy "allow_select_all" on public.app_users for select using (true);`
    -- I will stick to the User's provided SQL in the prompt to avoid conflict, even if it's insecure.
    -- User prompt: `create policy "allow_select_all" on public.app_users for select using (true);`

-- Re-applying User's requested policies exactly:
drop policy if exists "allow_select_all" on public.app_users;
create policy "allow_select_all" on public.app_users for select using (true);

drop policy if exists "allow_rpc_updates" on public.app_users;
create policy "allow_rpc_updates" on public.app_users for all using (true); 
-- Note: 'for all' allows insert/update/delete. This is very open. But I follow instructions.

-- 建立后台捐赠处理函数 (用于管理端)
drop function if exists public.admin_process_donation(text, int);

create or replace function public.admin_process_donation(p_phone text, p_amount int, p_secret text)
returns void
language plpgsql
security definer
as $$
begin
    -- Simple security check
    if p_secret != 'MAYIJU_ADMIN_SECRET_2026' then
        raise exception 'Invalid admin secret';
    end if;

    insert into public.app_users (phone_number, balance_g)
    values (p_phone, 3000 + p_amount)
    on conflict (phone_number)
    do update set balance_g = public.app_users.balance_g + p_amount;
end;
$$;

-- 原始八卦数字集：用于存储真实/模拟牌路对应的八卦序列，供模式识别与回放
create table if not exists public.bagua_raw_sets (
    id uuid primary key default gen_random_uuid(),
    source_label text not null,
    source_type text not null default 'real', -- real / manual / mixed
    comment text,
    raw_payload jsonb not null,              -- 原始数据，如牌面编码数组、附加说明
    bagua_sequence integer[] not null,       -- 归一化后的八卦数字序列（1-8）
    created_at timestamptz not null default now()
);

alter table public.bagua_raw_sets enable row level security;
drop policy if exists "allow_read_bagua_sets" on public.bagua_raw_sets;
create policy "allow_read_bagua_sets" on public.bagua_raw_sets for select using (true);
