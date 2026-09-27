// 快速新增：把一句話拆成「專案、日期、時間、是不是截止」。
// 這是手機上即時跑的簡易版；照片或一大段文字會交給 Edge Function（parse-capture）用 AI 判斷。
import { addDays, fromIso, iso, todayIso } from './dates';

export type ProjectLite = { id: string; name: string; short_name: string | null; aliases: string[]; color: string };

export type Parsed = {
  title: string;
  project: ProjectLite | null;
  date: string | null;     // YYYY-MM-DD
  dateLabel: string | null;
  time: string | null;     // HH:mm
  isDeadline: boolean;
};

const WD: Record<string, number> = { 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
const CN_NUM: Record<string, number> = { 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };

export function parseQuick(text: string, projects: ProjectLite[], today = todayIso()): Parsed {
  let rest = text.trim();
  let date: string | null = null;
  let dateLabel: string | null = null;
  let time: string | null = null;

  // 專案：比對名稱、簡稱、別名（長的先比）
  const keys: { k: string; p: ProjectLite }[] = [];
  projects.forEach((p) => [p.name, p.short_name, ...(p.aliases || [])].filter(Boolean).forEach((k) => keys.push({ k: String(k), p })));
  keys.sort((a, b) => b.k.length - a.k.length);
  const hit = keys.find(({ k }) => rest.toLowerCase().includes(k.toLowerCase()));
  const project = hit ? hit.p : null;

  // 日期
  const rel: [RegExp, number, string][] = [[/今天/, 0, '今天'], [/明天/, 1, '明天'], [/後天/, 2, '後天']];
  for (const [re, n, label] of rel) {
    if (re.test(rest)) { date = addDays(today, n); dateLabel = label; rest = rest.replace(re, ''); break; }
  }
  const wk = rest.match(/(下)?(週|星期|禮拜)([日天一二三四五六])/);
  if (!date && wk) {
    const target = WD[wk[3]];
    const t = fromIso(today);
    // 「週五」＝接下來的週五（含今天）；「下週五」＝下一週的週五
    const n = wk[1] ? target - t.getDay() + 7 : (target - t.getDay() + 7) % 7;
    date = addDays(today, n);
    dateLabel = (wk[1] ? '下週' : '週') + wk[3];
    rest = rest.replace(wk[0], '');
  }
  const md = rest.match(/(\d{1,2})\s*[\/月]\s*(\d{1,2})\s*(日|號)?/);
  if (!date && md) {
    const t = fromIso(today);
    let d = new Date(t.getFullYear(), Number(md[1]) - 1, Number(md[2]));
    if (d.getTime() < t.getTime() - 86400000 * 30) d = new Date(t.getFullYear() + 1, Number(md[1]) - 1, Number(md[2]));
    date = iso(d);
    dateLabel = `${Number(md[1])}/${Number(md[2])}`;
    rest = rest.replace(md[0], '');
  }
  if (!date && /月底/.test(rest)) {
    const t = fromIso(today);
    date = iso(new Date(t.getFullYear(), t.getMonth() + 1, 0));
    dateLabel = '月底';
    rest = rest.replace('月底', '');
  }

  // 時間：17:30、下午3點、3點半
  const hm = rest.match(/(\d{1,2})[:：](\d{2})/);
  if (hm) { time = `${hm[1].padStart(2, '0')}:${hm[2]}`; rest = rest.replace(hm[0], ''); }
  const cn = rest.match(/(早上|上午|中午|下午|晚上)?\s*(\d{1,2}|十一|十二|[一二兩三四五六七八九十])\s*點\s*(半)?/);
  if (!time && cn) {
    let h = /\d/.test(cn[2]) ? Number(cn[2]) : CN_NUM[cn[2]];
    if ((cn[1] === '下午' || cn[1] === '晚上') && h < 12) h += 12;
    time = `${String(h).padStart(2, '0')}:${cn[3] ? '30' : '00'}`;
    rest = rest.replace(cn[0], '');
  }

  const isDeadline = /前|截止|交|deadline/i.test(text);
  const title = rest.replace(/^\s*(之前|以前|前)/, '').replace(/之前|以前|前$|截止|的案子/g, '').replace(/\s+/g, ' ').trim() || text.trim();
  return { title, project, date, dateLabel, time, isDeadline };
}
