// 進入點：判斷要去 歡迎／首次設定／今天，並在資料變動時重排手機提醒
import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, Platform, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHANGED, getEntryRoute, getProfile } from '../src/lib/api';
import { rescheduleReminders } from '../src/lib/notify';
import { colors } from '../src/lib/theme';
import { setupWeb } from '../src/web/setup';
import NoticeHost from '../src/components/NoticeHost';
import Splash, { SPLASH_NAME_KEY } from '../src/components/Splash';

// 網頁版：先載入字體與設計稿動畫 CSS（在第一次畫面出來前）
if (Platform.OS === 'web') setupWeb();

// 網頁版：加到 iPhone 主畫面時，像 App 一樣全螢幕打開
function useWebAppMeta() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const add = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    };
    document.title = '秒喵';
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'apple-mobile-web-app-title', content: '秒喵' });
    add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
    add('meta', { name: 'theme-color', content: '#FFFFFF' });
    add('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' });
    add('link', { rel: 'manifest', href: '/manifest.json' });
    const style = document.createElement('style');
    style.textContent = `
      html, body, #root { min-height: 100%; background: #EEECE8; }
      body { margin: 0; overscroll-behavior: none; }
      * { -webkit-tap-highlight-color: transparent; }
      [role="button"], button, a { cursor: pointer; }
      @media (prefers-reduced-motion: no-preference) {
        [role="button"], button, a { transition: opacity 140ms ease, filter 140ms ease; }
        [role="button"]:active, button:active, a:active { opacity: .72; filter: brightness(.98); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

export default function RootLayout() {
  useWebAppMeta();
  const [ready, setReady] = useState(false);
  // 啟動畫面至少停 3.5 秒（讓標題和秒喵的動畫跑完），資料好了再淡出
  const [minShown, setMinShown] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMinShown(true), 3500); return () => clearTimeout(t); }, []);
  const leaving = ready && minShown;
  useEffect(() => { if (!leaving) return; const t = setTimeout(() => setSplashGone(true), 500); return () => clearTimeout(t); }, [leaving]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const route = async () => {
      try {
        const r = await getEntryRoute();
        // 只在需要時才跳轉；已登入就留在原本的網址（重新整理不會被帶回今天）
        const path = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.pathname : '';
        const atAuth = path.startsWith('/welcome') || path.startsWith('/onboarding');
        if (r === 'signin') router.replace('/welcome');
        else if (r === 'onboarding') router.replace('/onboarding');
        else {
          if (Platform.OS !== 'web' || atAuth) router.replace('/');
          rescheduleReminders();
          // 記住名字，下次啟動畫面可以說「早安，○○」
          getProfile().then((p) => p?.display_name && AsyncStorage.setItem(SPLASH_NAME_KEY, p.display_name)).catch(() => {});
        }
      } catch {
        router.replace('/welcome');
      } finally {
        setReady(true);
      }
    };
    const first = setTimeout(route, 0); // 等導覽器掛好再跳轉
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/welcome');
    });
    // 資料變動後 2 秒內整批重排提醒（避免連續操作時一直重排）
    const ch = DeviceEventEmitter.addListener(CHANGED, () => {
      clearTimeout(timer);
      timer = setTimeout(() => rescheduleReminders(), 2000);
    });
    return () => { clearTimeout(first); sub.subscription.unsubscribe(); ch.remove(); clearTimeout(timer); };
  }, []);

  return (
    <SafeAreaProvider style={styles.provider}>
      <View style={[styles.app, Platform.OS === 'web' && styles.webApp]}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="add" options={{ presentation: 'modal' }} />
          <Stack.Screen name="focus" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#1E1A17' } }} />
        </Stack>
        <NoticeHost />
        {!splashGone ? <Splash leaving={leaving} /> : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: { flex: 1, backgroundColor: '#EEECE8' },
  app: { flex: 1, width: '100%', backgroundColor: colors.bg },
  webApp: { maxWidth: 430, alignSelf: 'center', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
});
