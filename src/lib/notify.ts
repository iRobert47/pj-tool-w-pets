// 本機提醒：把接下來 7 天有 remind_at 的任務排成手機通知。
// 每次資料變動就整批重排，最簡單也最不會漏。
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, todayIso } from './dates';
import { listTasks } from './api';

// 網頁版（加到主畫面）沒有本機排程通知，這些函式在網頁上直接略過
const WEB = Platform.OS === 'web';

if (!WEB) Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  if (WEB) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: '提醒', importance: Notifications.AndroidImportance.DEFAULT });
  }
  return req.granted;
}

export async function rescheduleReminders(petName = '秒喵') {
  try {
    if (!(await ensurePermission())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const today = todayIso();
    const tasks = await listTasks(today, addDays(today, 7));
    const now = Date.now();
    for (const t of tasks) {
      if (!t.remind_at || t.done_at) continue;
      const when = new Date(t.remind_at);
      if (when.getTime() <= now) continue;
      const body = t.kind === 'deadline' || t.kind === 'milestone'
        ? `截止：${t.title}`
        : t.kind === 'timed' || t.kind === 'event' ? `等一下：${t.title}` : t.title;
      await Notifications.scheduleNotificationAsync({
        content: { title: petName, body, data: { taskId: t.id } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  } catch (e) {
    console.warn('rescheduleReminders', e);
  }
}
