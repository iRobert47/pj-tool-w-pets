// 所有讀寫資料庫的函式。畫面只呼叫這裡，不直接碰 supabase。
import { DeviceEventEmitter } from 'react-native';
import { supabase } from './supabase';
import { addDays, atTime, localDateOf, todayIso } from './dates';
import type { ProjectLite } from './parse';

export type Kind = 'timed' | 'day_task' | 'deadline' | 'milestone' | 'event' | 'someday';
export type Project = ProjectLite & { area: 'work' | 'life'; status: string; sort_order: number; due_on: string | null };
export type Task = {
  id: string;
  project_id: string | null;
  kind: Kind;
  area: 'work' | 'life';
  title: string;
  note: string | null;
  due_date: string | null;
  due_at: string | null;
  start_at: string | null;
  end_at: string | null;
  remind_at: string | null;
  done_at: string | null;
  location: string | null;
  postponed_count: number;
};

/** 任何寫入後通知畫面重新讀取 */
export const CHANGED = 'pets:data-changed';
const changed = () => DeviceEventEmitter.emit(CHANGED);

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ─── 會員 ─────────────────────────────────────
export async function getEntryRoute(): Promise<'signin' | 'onboarding' | 'ready'> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 'signin';
  const { data } = await supabase.from('profiles').select('onboarded_at').eq('id', session.user.id).single();
  return data?.onboarded_at ? 'ready' : 'onboarding';
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return must(await supabase.from('profiles').select('*').eq('id', user.id).single()) as {
    id: string; display_name: string | null; workday_start: string; workday_end: string; quiet_after: string | null; active_pet: string;
  };
}

export async function completeOnboarding(input: { displayName: string; petName: string; workdayStart: string; workdayEnd: string; quiet: boolean }) {
  must(await supabase.rpc('complete_onboarding', {
    p_display_name: input.displayName,
    p_pet_name: input.petName,
    p_workday_start: input.workdayStart,
    p_workday_end: input.workdayEnd,
    p_quiet: input.quiet,
  }));
  changed();
}

// ─── 專案 ─────────────────────────────────────
export async function listProjects(): Promise<Project[]> {
  return must(await supabase.from('projects').select('id, name, short_name, aliases, color, area, status, sort_order, due_on').neq('status', 'archived').order('sort_order')) as Project[];
}

export async function addProject(name: string, color: string, area: 'work' | 'life' = 'work') {
  must(await supabase.from('projects').insert({ name, short_name: name, color, area }));
  changed();
}

// ─── 任務 ─────────────────────────────────────
const TASK_COLS = 'id, project_id, kind, area, title, note, due_date, due_at, start_at, end_at, remind_at, done_at, location, postponed_count';

/** 取一段日期內的所有任務（有截止日或有開始時間的） */
export async function listTasks(from: string, to: string): Promise<Task[]> {
  const fromTs = atTime(from, '00:00');
  const toTs = atTime(addDays(to, 1), '00:00');
  return must(await supabase
    .from('tasks')
    .select(TASK_COLS)
    .or(`and(due_date.gte.${from},due_date.lte.${to}),and(start_at.gte.${fromTs},start_at.lt.${toTs})`)
    .order('start_at', { ascending: true, nullsFirst: false })) as Task[];
}

export async function listSomeday(): Promise<Task[]> {
  return must(await supabase.from('tasks').select(TASK_COLS).eq('kind', 'someday').is('done_at', null).order('created_at')) as Task[];
}

/** 某個任務屬於哪一天 */
export function taskDay(t: Task): string | null {
  if (t.start_at) return localDateOf(t.start_at);
  return t.due_date;
}

export type NewTask = {
  title: string;
  projectId: string | null;
  area?: 'work' | 'life';
  date?: string | null;     // 做的日子或截止日
  time?: string | null;     // HH:mm
  isDeadline?: boolean;
  minutes?: number;
};

export async function addTask(n: NewTask) {
  const date = n.date ?? todayIso();
  let row: Record<string, unknown> = { title: n.title, project_id: n.projectId, area: n.area ?? 'work' };
  if (n.isDeadline) {
    row = { ...row, kind: 'deadline', due_date: date, due_at: n.time ? atTime(date, n.time) : null };
    // 截止前一天早上 9 點提醒；當天的截止提前 30 分
    row.remind_at = date === todayIso() && n.time
      ? new Date(new Date(atTime(date, n.time)).getTime() - 30 * 60000).toISOString()
      : atTime(addDays(date, -1), '09:00');
  } else if (n.time) {
    const start = atTime(date, n.time);
    row = { ...row, kind: 'timed', start_at: start, end_at: new Date(new Date(start).getTime() + (n.minutes ?? 30) * 60000).toISOString(), remind_at: new Date(new Date(start).getTime() - 10 * 60000).toISOString() };
  } else {
    row = { ...row, kind: 'day_task', due_date: date };
  }
  const saved = must(await supabase.from('tasks').insert(row).select(TASK_COLS).single()) as Task;
  changed();
  return saved;
}

export async function setDone(t: Task, done: boolean) {
  must(await supabase.from('tasks').update({ done_at: done ? new Date().toISOString() : null }).eq('id', t.id));
  changed();
}

/** 移到某一天（保留原本的時間） */
export async function moveTask(t: Task, toDate: string) {
  const patch: Record<string, unknown> = { postponed_count: (t.postponed_count ?? 0) + 1 };
  if (t.start_at) {
    const shift = new Date(atTime(toDate, '00:00')).getTime() - new Date(atTime(localDateOf(t.start_at), '00:00')).getTime();
    patch.start_at = new Date(new Date(t.start_at).getTime() + shift).toISOString();
    if (t.end_at) patch.end_at = new Date(new Date(t.end_at).getTime() + shift).toISOString();
  } else {
    patch.due_date = toDate;
    if (t.kind === 'someday') patch.kind = 'day_task';
  }
  must(await supabase.from('tasks').update(patch).eq('id', t.id));
  changed();
}

export async function updateTask(id: string, patch: Partial<Task>) {
  must(await supabase.from('tasks').update(patch).eq('id', id));
  changed();
}

export async function deleteTask(t: Task) {
  must(await supabase.from('tasks').delete().eq('id', t.id));
  changed();
}

export async function restoreTask(t: Task) {
  must(await supabase.from('tasks').insert(t));
  changed();
}

// ─── 專注 ─────────────────────────────────────
export async function startFocus(input: { mode: 'single' | 'pomodoro'; focusMin: number; breakMin?: number; rounds?: number; taskId?: string | null; projectId?: string | null }) {
  const row = must(await supabase.from('focus_sessions').insert({
    mode: input.mode, focus_min: input.focusMin, break_min: input.breakMin ?? null,
    rounds_planned: input.rounds ?? 1, task_id: input.taskId ?? null, project_id: input.projectId ?? null,
  }).select('id').single()) as { id: string };
  return row.id;
}

export async function endFocus(id: string, actualMin: number, roundsDone: number) {
  must(await supabase.from('focus_sessions').update({ ended_at: new Date().toISOString(), actual_min: actualMin, rounds_done: roundsDone }).eq('id', id));
  // 專注滿 20 分鐘，秒喵帶回一條小魚乾
  if (actualMin >= 20) {
    must(await supabase.from('pet_items').insert({ kind: 'fish', label: '小魚乾', focus_session_id: id }));
  }
  changed();
}

export async function focusMinutes(sinceIso: string): Promise<number> {
  const rows = must(await supabase.from('focus_sessions').select('actual_min').gte('started_at', atTime(sinceIso, '00:00'))) as { actual_min: number | null }[];
  return rows.reduce((a, r) => a + (r.actual_min ?? 0), 0);
}

// ─── 夥伴 ─────────────────────────────────────
export type Pet = { pet: 'miaomiao' | 'shiba'; name: string; fullness: number; affection: number; last_fed_at: string | null };

export async function getPet(): Promise<Pet | null> {
  const rows = must(await supabase.from('pet_state').select('pet, name, fullness, affection, last_fed_at').eq('pet', 'miaomiao')) as Pet[];
  return rows[0] ?? null;
}

export async function fishCount(): Promise<number> {
  const rows = must(await supabase.from('pet_items').select('qty').eq('kind', 'fish')) as { qty: number }[];
  return rows.reduce((a, r) => a + r.qty, 0);
}

export async function petCat(p: Pet) {
  const { data: { user } } = await supabase.auth.getUser();
  must(await supabase.from('pet_state').update({ affection: Math.min(100, p.affection + 2), last_played_at: new Date().toISOString() }).eq('user_id', user!.id).eq('pet', p.pet));
  changed();
}

/** 用掉一條小魚乾餵牠 */
export async function feedCat(p: Pet): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const fish = must(await supabase.from('pet_items').select('id, qty').eq('kind', 'fish').order('received_at').limit(1)) as { id: string; qty: number }[];
  if (!fish.length) return false;
  const f = fish[0];
  if (f.qty > 1) must(await supabase.from('pet_items').update({ qty: f.qty - 1 }).eq('id', f.id));
  else must(await supabase.from('pet_items').delete().eq('id', f.id));
  must(await supabase.from('pet_state').update({ fullness: Math.min(100, p.fullness + 20), last_fed_at: new Date().toISOString() }).eq('user_id', user!.id).eq('pet', p.pet));
  changed();
  return true;
}

export async function renamePet(p: Pet, name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  must(await supabase.from('pet_state').update({ name: name.trim() }).eq('user_id', user!.id).eq('pet', p.pet));
  changed();
}

// ─── 快速記下（照片／一大段文字 → AI） ─────────────
export type AiItem = {
  kind: 'milestone' | 'deadline' | 'day_task' | 'timed';
  title: string; project_id: string | null; project_guess: string | null;
  date: string | null; time: string | null; remind_days_before: number | null; confidence: number;
};

export async function parseWithAi(input: { source: 'text' | 'voice'; text: string } | { source: 'photo'; path: string }) {
  const { data, error } = await supabase.functions.invoke('parse-capture', { body: input });
  if (error) throw new Error(error.message);
  return data as { captureId: string; items: AiItem[] };
}

export async function uploadPhoto(uri: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  const path = `${user!.id}/${Date.now()}.jpg`;
  const buf = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('captures').upload(path, buf, { contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
  return path;
}

export async function saveAiItems(items: AiItem[], captureId: string) {
  const rows = items.map((it) => {
    const date = it.date ?? todayIso();
    const base = { title: it.title, project_id: it.project_id, source_capture_id: captureId };
    if (it.kind === 'timed' && it.time) {
      const start = atTime(date, it.time);
      return { ...base, kind: 'timed', start_at: start, end_at: new Date(new Date(start).getTime() + 30 * 60000).toISOString() };
    }
    if (it.kind === 'day_task') return { ...base, kind: 'day_task', due_date: date };
    return {
      ...base, kind: it.kind, due_date: date, due_at: it.time ? atTime(date, it.time) : null,
      remind_at: atTime(addDays(date, -(it.remind_days_before ?? 1)), '09:00'),
    };
  });
  must(await supabase.from('tasks').insert(rows));
  must(await supabase.from('captures').update({ status: 'confirmed' }).eq('id', captureId));
  changed();
}
