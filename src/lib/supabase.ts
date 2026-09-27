// React Native（Expo）連 Supabase 的共用 client
// 需要：npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
// 型別可用 `npm run db:types` 產生到 src/lib/database.types.ts

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();

// Vercel / Web 若尚未設定正式 Supabase，不能讓 createClient 在模組載入時直接拋錯，
// 否則 React 還沒 render 就會變成整頁白畫面。
export const isSupabaseConfigured = Boolean(rawUrl && rawKey);
const url = rawUrl || 'https://placeholder.supabase.co';
const key = rawKey || 'placeholder-anon-key';

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// App 在前景時才自動更新登入 token
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
