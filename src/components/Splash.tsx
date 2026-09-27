// 啟動畫面（原生）：米色底＋秒喵。原生另有 app.json 的 splash，這裡只銜接資料載入。
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Cat from './Cat';

export const SPLASH_NAME_KEY = 'splash:name';

export default function Splash({ leaving }: { leaving: boolean }) {
  if (leaving) return null;
  return (
    <View style={s.wrap}>
      <Text style={s.title}>一起下班</Text>
      <Text style={s.sub}>和 Miaomiao 一起，把今天過完。</Text>
      <Cat size={260} />
      <ActivityIndicator color="#111111" style={{ marginTop: 24 }} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F4E9D6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '700', color: '#111111' },
  sub: { fontSize: 15, color: '#525252', marginTop: 12, marginBottom: 30 },
});
