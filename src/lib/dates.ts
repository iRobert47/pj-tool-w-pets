// 日期工具：全部用手機的本地時間，字串格式 YYYY-MM-DD
export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): string {
  return iso(new Date());
}

export function addDays(s: string, n: number): string {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((fromIso(a).getTime() - fromIso(b).getTime()) / 86400000);
}

/** 以週日開頭的一週 */
export function weekOf(s: string): string[] {
  const d = fromIso(s);
  const start = addDays(s, -d.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 9/26 六 */
export function shortLabel(s: string): string {
  const d = fromIso(s);
  return `${d.getMonth() + 1}/${d.getDate()} ${WEEKDAYS[d.getDay()]}`;
}

/** 今天／明天／9/26 六 */
export function relLabel(s: string, today = todayIso()): string {
  const n = diffDays(s, today);
  if (n === 0) return '今天';
  if (n === 1) return '明天';
  if (n === -1) return '昨天';
  return shortLabel(s);
}

/** timestamptz → 本地 HH:mm */
export function hhmm(ts?: string | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 本地日期＋HH:mm → ISO timestamptz */
export function atTime(dateIso: string, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = fromIso(dateIso);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function localDateOf(ts: string): string {
  return iso(new Date(ts));
}
