// 進入點：判斷要去 歡迎／首次設定／今天，並在資料變動時重排手機提醒
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Platform, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { CHANGED, getEntryRoute } from '../src/lib/api';
import { rescheduleReminders } from '../src/lib/notify';
import { colors } from '../src/lib/theme';

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
  }, []);
}

export default function RootLayout() {
  useWebAppMeta();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const route = async () => {
      try {
        const r = await getEntryRoute();
        if (r === 'signin') router.replace('/welcome');
        else if (r === 'onboarding') router.replace('/onboarding');
        else { router.replace('/'); rescheduleReminders(); }
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
    <SafeAreaProvider style={[styles.app, Platform.OS === 'web' && styles.webApp]}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="focus" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#1E1A17' } }} />
      </Stack>
      {!ready ? (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, width: '100%', backgroundColor: colors.bg },
  webApp: { maxWidth: 430, alignSelf: 'center', overflow: 'hidden' },
});
