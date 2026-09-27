-- Pets Project App：第一版資料表
-- 所有資料都綁在登入的使用者（auth.users）底下，RLS 一律只看得到自己的資料。

-- ─────────────────────────────────────────────
-- 列舉型別
-- ─────────────────────────────────────────────
create type public.area as enum ('work', 'life');                         -- 工作／生活
create type public.project_status as enum ('active', 'paused', 'done', 'archived');
create type public.task_kind as enum (
  'timed',      -- 排時間：放進時間軸，有開始與結束
  'day_task',   -- 日任務：今天內完成，不用排時間
  'deadline',   -- 截止
  'milestone',  -- 里程碑 ◆
  'event',      -- 會議、約會等行程（不需要「完成」）
  'someday'     -- 之後再說（未排程）
);
create type public.focus_mode as enum ('single', 'pomodoro');
create type public.capture_source as enum ('voice', 'photo', 'text');
create type public.capture_status as enum ('pending', 'parsed', 'confirmed', 'discarded');
create type public.pet_kind as enum ('miaomiao', 'shiba');
create type public.inbox_kind as enum ('schedule', 'day_due', 'achievement', 'pet', 'focus_summary');

-- ─────────────────────────────────────────────
-- 共用：自動更新 updated_at
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- 會員資料 profiles（和 auth.users 一對一）
-- 帳號、密碼、email 驗證由 Supabase Auth 管，這裡只放 app 自己需要的資料。
-- ─────────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text check (char_length(display_name) between 1 and 12),  -- 首次設定：你的名字
  avatar_path    text,                                   -- Storage「avatars」bucket 內的路徑
  timezone       text not null default 'Asia/Taipei',
  locale         text not null default 'zh-TW',
  workday_start  time not null default '09:00',
  workday_end    time not null default '18:00',          -- 下班後工作提醒只進通知匣
  quiet_after    time default '22:00',                   -- 之後全部不跳；null = 不設安靜時段
  active_pet     public.pet_kind not null default 'miaomiao',
  onboarded_at   timestamptz,                            -- 完成首次設定的時間；null = 還沒設定
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- 新使用者註冊時自動建立 profile 和兩隻夥伴的狀態
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 名字先留空（或用註冊時帶的 display_name），由首次設定流程填入
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));

  insert into public.pet_state (user_id, pet, name) values (new.id, 'miaomiao', '秒喵'), (new.id, 'shiba', '柴柴');
  return new;
end;
$$;

-- 首次設定：一次寫入名字、夥伴名字、作息，並標記完成
create or replace function public.complete_onboarding(
  p_display_name  text,
  p_pet_name      text default '秒喵',
  p_workday_start time default '09:00',
  p_workday_end   time default '18:00',
  p_quiet         boolean default true
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_workday_end <= p_workday_start then raise exception 'workday_end must be after workday_start'; end if;

  update public.profiles
     set display_name  = trim(p_display_name),
         workday_start = p_workday_start,
         workday_end   = p_workday_end,
         quiet_after   = case when p_quiet then time '22:00' else null end,
         onboarded_at  = coalesce(onboarded_at, now())
   where id = uid;

  update public.pet_state
     set name = coalesce(nullif(trim(p_pet_name), ''), '秒喵')
   where user_id = uid and pet = 'miaomiao';
end;
$$;

-- ─────────────────────────────────────────────
-- 專案（品牌）
-- ─────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,                      -- 東琳 Salon SaaS
  short_name  text,                               -- 東琳
  aliases     text[] not null default '{}',       -- 語音／文字判斷用：東琳、DL、Salon…
  color       text not null default '#FF7A59',
  area        public.area not null default 'work',
  status      public.project_status not null default 'active',
  starts_on   date,
  due_on      date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index projects_user_idx on public.projects (user_id, status, sort_order);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 快速記下（語音／照片／文字）的原始輸入
-- ─────────────────────────────────────────────
create table public.captures (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source      public.capture_source not null,
  raw_text    text,                                -- 文字或語音轉出來的字
  media_path  text,                                -- Storage「captures」bucket 內的路徑
  status      public.capture_status not null default 'pending',
  parsed      jsonb,                               -- AI 判斷結果（卡片陣列）
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint captures_has_input check (raw_text is not null or media_path is not null)
);
create index captures_user_idx on public.captures (user_id, created_at desc);
create trigger captures_updated_at before update on public.captures
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 任務與行程：時間軸、日任務、截止、里程碑、會議都在這張
-- ─────────────────────────────────────────────
create table public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id         uuid references public.projects (id) on delete set null,
  kind               public.task_kind not null,
  area               public.area not null default 'work',
  title              text not null,
  note               text,
  due_date           date,          -- 日任務／截止／里程碑落在哪一天
  due_at             timestamptz,   -- 有明確時間的截止（例：17:30 前）
  start_at           timestamptz,   -- 排時間／行程
  end_at             timestamptz,
  all_day            boolean not null default false,
  location           text,
  estimate_min       int,
  remind_at          timestamptz,
  done_at            timestamptz,
  postponed_count    int not null default 0,       -- 週回顧「延期 N 次」
  source_capture_id  uuid references public.captures (id) on delete set null,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint tasks_timed_has_range check (
    kind not in ('timed', 'event') or all_day or (start_at is not null and end_at is not null and end_at > start_at)
  ),
  constraint tasks_dated_has_date check (
    kind not in ('day_task', 'deadline', 'milestone') or due_date is not null or due_at is not null
  ),
  constraint tasks_event_not_done check (kind <> 'event' or done_at is null)
);
create index tasks_user_due_idx   on public.tasks (user_id, due_date);
create index tasks_user_start_idx on public.tasks (user_id, start_at);
create index tasks_project_idx    on public.tasks (project_id);
create index tasks_remind_idx     on public.tasks (remind_at) where done_at is null and remind_at is not null;
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 專注紀錄（單次／番茄鐘）
-- ─────────────────────────────────────────────
create table public.focus_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id         uuid references public.tasks (id) on delete set null,     -- null = 自由專注
  project_id      uuid references public.projects (id) on delete set null,
  mode            public.focus_mode not null default 'single',
  focus_min       int not null check (focus_min between 1 and 240),         -- 單次長度，或番茄鐘每輪長度
  break_min       int check (break_min between 1 and 60),
  rounds_planned  int not null default 1 check (rounds_planned >= 1),
  rounds_done     int not null default 0,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  actual_min      int,                                                      -- 實際專注分鐘（不含休息）
  created_at      timestamptz not null default now()
);
create index focus_user_started_idx on public.focus_sessions (user_id, started_at desc);

-- ─────────────────────────────────────────────
-- 夥伴狀態與房間道具
-- ─────────────────────────────────────────────
create table public.pet_state (
  user_id         uuid not null references auth.users (id) on delete cascade,
  pet             public.pet_kind not null,
  name            text not null check (char_length(name) between 1 and 8),  -- 預設：秒喵／柴柴
  fullness        int not null default 70 check (fullness between 0 and 100),
  affection       int not null default 50 check (affection between 0 and 100),
  last_fed_at     timestamptz,
  last_played_at  timestamptz,
  adopted_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, pet)
);
create trigger pet_state_updated_at before update on public.pet_state
  for each row execute function public.set_updated_at();

create table public.pet_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind         text not null,                -- fish / scratcher_part / photo / decor …
  label        text not null,
  qty          int not null default 1,
  meta         jsonb not null default '{}',  -- 例：拍立得的照片路徑、零件進度
  placed       boolean not null default false,
  received_at  timestamptz not null default now(),
  focus_session_id uuid references public.focus_sessions (id) on delete set null
);
create index pet_items_user_idx on public.pet_items (user_id, received_at desc);

-- 註冊觸發器要等 pet_state 建好才掛
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- 任務牆（每日／成就）
-- ─────────────────────────────────────────────
create table public.quests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key         text not null,               -- daily_focus_3 / streak_7 …
  title       text not null,
  for_date    date,                        -- 每日任務的日期；成就為 null
  progress    int not null default 0,
  target      int not null default 1,
  reward      jsonb not null default '{}',
  completed_at timestamptz,
  claimed_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, key, for_date)
);

-- ─────────────────────────────────────────────
-- 通知匣
-- ─────────────────────────────────────────────
create table public.inbox_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        public.inbox_kind not null,
  title       text not null,
  body        text,
  payload     jsonb not null default '{}',   -- 例：{ "task_id": "…" } 讓「去看看」能跳轉
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index inbox_user_idx on public.inbox_items (user_id, created_at desc);

-- ─────────────────────────────────────────────
-- 週回顧：每個專案每週專注分鐘
-- ─────────────────────────────────────────────
create view public.weekly_focus_by_project
with (security_invoker = true) as
select
  f.user_id,
  date_trunc('week', f.started_at at time zone 'Asia/Taipei')::date as week_start,  -- 先固定台灣時區
  f.project_id,
  sum(coalesce(f.actual_min, 0))::int     as minutes,
  count(*)::int                           as sessions
from public.focus_sessions f
group by 1, 2, 3;

-- ─────────────────────────────────────────────
-- RLS：每張表都只能存取自己的資料
-- ─────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.projects       enable row level security;
alter table public.captures       enable row level security;
alter table public.tasks          enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.pet_state      enable row level security;
alter table public.pet_items      enable row level security;
alter table public.quests         enable row level security;
alter table public.inbox_items    enable row level security;

create policy "own profile: read"   on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile: update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own rows" on public.projects       for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.captures       for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.tasks          for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.focus_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.pet_items      for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.quests         for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.inbox_items    for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own pets: read"   on public.pet_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "own pets: update" on public.pet_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────
-- Storage：頭像與快速記下的照片／語音（私有，路徑第一層是 user id）
--   avatars/<user_id>/avatar.jpg
--   captures/<user_id>/<capture_id>.jpg
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false), ('captures', 'captures', false)
on conflict (id) do nothing;

create policy "own files: read" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'captures') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own files: upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'captures') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own files: update" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'captures') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own files: delete" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'captures') and (storage.foldername(name))[1] = (select auth.uid())::text);
