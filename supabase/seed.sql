-- 本機開發用假資料：`supabase db reset` 會重跑這個檔案。
-- 登入帳號：dev@pets.local ／ 密碼：devpass123
-- 日期都用 current_date 推算，不管哪天 reset 都是「今天」的畫面。

do $$
declare
  uid   uuid := '00000000-0000-0000-0000-000000000001';
  p_dl  uuid := gen_random_uuid();
  p_ymt uuid := gen_random_uuid();
  p_pet uuid := gen_random_uuid();
  p_life uuid := gen_random_uuid();
  t_ux  uuid := gen_random_uuid();
  tz    text := 'Asia/Taipei';
  d     date := current_date;
begin
  -- 開發帳號（觸發器會自動建立 profile 與 pet_state）
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'dev@pets.local', extensions.crypt('devpass123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Robert"}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, 'email',
          jsonb_build_object('sub', uid::text, 'email', 'dev@pets.local', 'email_verified', true),
          now(), now(), now());

  -- 開發帳號直接視為已完成首次設定；要測設定流程時：
  -- update public.profiles set onboarded_at = null where id = '00000000-0000-0000-0000-000000000001';
  update public.profiles set onboarded_at = now() where id = uid;

  -- 專案
  insert into public.projects (id, user_id, name, short_name, aliases, color, area, starts_on, due_on, sort_order) values
    (p_dl,   uid, '東琳 Salon SaaS',        '東琳',     '{東琳,DL,Salon}',   '#FF7A59', 'work', d - 30, d + 40, 0),
    (p_ymt,  uid, 'YMT Digital Experience', 'YMT',      '{YMT,ymt}',          '#5B7FA6', 'work', d - 20, d + 30, 1),
    (p_pet,  uid, 'Pets Project App',       'Pets App', '{Pets,秒喵,Miaomiao}', '#7FA578', 'work', d - 10, d + 60, 2),
    (p_life, uid, '生活',                   '生活',     '{}',                 '#8E6FA8', 'life', null,   null,   3);

  -- 今天的時間軸
  insert into public.tasks (id, user_id, project_id, kind, area, title, note, start_at, end_at, estimate_min) values
    (t_ux, uid, p_ymt, 'timed', 'work', '完成 UX flow', '提案最後一頁',
      (d + time '10:00') at time zone tz, (d + time '10:45') at time zone tz, 45);
  insert into public.tasks (user_id, project_id, kind, area, title, start_at, end_at, location) values
    (uid, p_ymt,  'event', 'work', 'YMT 提案會議', (d + time '11:00') at time zone tz, (d + time '12:00') at time zone tz, 'Google Meet'),
    (uid, p_life, 'event', 'life', '午餐・和 Amy',  (d + time '12:00') at time zone tz, (d + time '13:00') at time zone tz, null);
  insert into public.tasks (user_id, project_id, kind, area, title, start_at, end_at, estimate_min) values
    (uid, p_dl,  'timed', 'work', 'Tenant onboarding 設定', (d + time '14:00') at time zone tz, (d + time '15:00') at time zone tz, 60),
    (uid, p_ymt, 'timed', 'work', '準備週五簡報',          (d + time '16:30') at time zone tz, (d + time '17:15') at time zone tz, 45);

  -- 日任務
  insert into public.tasks (user_id, project_id, kind, area, title, due_date, due_at, remind_at) values
    (uid, p_dl,   'day_task', 'work', '回覆東琳報價信', d, (d + time '17:30') at time zone tz, (d + time '17:00') at time zone tz),
    (uid, p_life, 'day_task', 'life', '訂週五家庭聚餐', d, null, null),
    (uid, p_ymt,  'day_task', 'work', '確認 YMT 合約',  d, null, null);

  -- 截止與里程碑（專案進度）
  insert into public.tasks (user_id, project_id, kind, area, title, due_date) values
    (uid, p_dl,   'deadline',  'work', '商家 onboarding flow', d + 4),
    (uid, p_dl,   'milestone', 'work', 'UX Prototype',         d + 6),
    (uid, p_ymt,  'deadline',  'work', '週五簡報',             d + 1),
    (uid, p_ymt,  'milestone', 'work', 'IA proposal',          d + 9),
    (uid, p_pet,  'deadline',  'work', '檢查動畫',             d + 2),
    (uid, p_pet,  'milestone', 'work', 'Today prototype',      d + 14),
    (uid, p_life, 'deadline',  'life', '繳卡費',               d + 7);

  -- 之後再說
  insert into public.tasks (user_id, project_id, kind, area, title) values
    (uid, p_pet, 'someday', 'work', 'Miaomiao 動畫系統：串 3 個反應');

  -- 專注紀錄（週回顧用）
  insert into public.focus_sessions (user_id, task_id, project_id, mode, focus_min, break_min, rounds_planned, rounds_done, started_at, ended_at, actual_min) values
    (uid, null, p_dl,  'pomodoro', 25, 5, 4, 4, (d - 2 + time '19:00') at time zone tz, (d - 2 + time '20:55') at time zone tz, 100),
    (uid, t_ux, p_ymt, 'single',   45, null, 1, 1, (d - 1 + time '10:00') at time zone tz, (d - 1 + time '10:45') at time zone tz, 45),
    (uid, null, p_pet, 'single',   30, null, 1, 1, (d - 1 + time '15:00') at time zone tz, (d - 1 + time '15:30') at time zone tz, 30);

  -- 房間道具與通知匣
  insert into public.pet_items (user_id, kind, label, qty, meta) values
    (uid, 'fish', '小魚乾', 2, '{}'),
    (uid, 'scratcher_part', '貓抓柱零件', 8, '{"target":10}');
  insert into public.inbox_items (user_id, kind, title, body) values
    (uid, 'schedule',    '11:00 YMT 提案會議', '還有 50 分鐘'),
    (uid, 'achievement', '連續 14 天', 'Miaomiao 伸了個懶腰');
end;
$$;
