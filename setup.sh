#!/usr/bin/env bash
# 第一次安裝：自動抓跟 Expo Go 相容的版本
set -e
if [ ! -f supabase/config.toml ]; then
  echo "▸ 建立 Supabase 設定（supabase init）"
  supabase init --force || npx supabase init --force
fi
echo "▸ 安裝 Expo"
npm install expo@latest
echo "▸ 安裝 App 需要的套件（版本由 expo install 自動配對）"
npx expo install react react-native expo-router expo-linking expo-constants expo-status-bar \
  react-native-screens react-native-safe-area-context react-native-svg \
  @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill \
  expo-notifications expo-image-picker expo-keep-awake \
  react-dom react-native-web @expo/metro-runtime
npx expo install -- --save-dev typescript @types/react
[ -f .env ] || cp .env.example .env
echo ""
echo "✓ 安裝完成。下一步："
echo "  1. npm run db:start      （要先開 Docker）"
echo "  2. 把印出來的 API URL 和 anon key 填進 .env（URL 要改成電腦的區網 IP）"
echo "  3. npm run db:reset"
echo "  4. npm start，用手機掃 QR code"
