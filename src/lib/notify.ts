// 本機提醒：把接下來 7 天有 remind_at 的任務排成手機通知。
// 每次資料變動就整批重排，最簡單也最不會漏。
import { Platform } from 'react-native';
import { addDays, todayIso } from './dates';
import { listTasks } from './api';

// expo-notifications 官方不支援 Web。不要在 Web bundle 啟動時做頂層 native module 初始化；
// 否則 production build 可能成功，但瀏覽器 runtime 會直接白畫面。
const WEB = Platform.OS === 'web';

if (!WEB) {
  void import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }).catch((e) => console.warn('notifications init', e));
}

export async function ensurePermission(): Promise<boolean> {
  if (WEB) return false;
  const Notifications = await import('expo-notifications');
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return req.granted;
}

export async function rescheduleReminders(petName = '秒喵') {
  try {
    if (WEB || !(await ensurePermission())) return;
    const Notifications = await import('expo-notifications');
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
        : t.kind === 'timed' || t.kind === 'event'
          ? `等一下：${t.title}`
          : t.title;

      await Notifications.scheduleNotificationAsync({
        content: { title: petName, body, data: { taskId: t.id } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
        },
      });
    }
  } catch (e) {
    console.warn('rescheduleReminders', e);
  }
}
