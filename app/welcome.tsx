// 00 歡迎／登入：Email＋密碼（沒有帳號會直接幫你建立）
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/lib/theme';
import { supabase } from '../src/lib/supabase';
import { getEntryRoute } from '../src/lib/api';
import Cat from '../src/components/Cat';
import { Button } from '../src/components/ui';

export default function Welcome() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    setBusy(true); setMsg(null);
    try {
      let { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error && /invalid/i.test(error.message)) {
        const up = await supabase.auth.signUp({ email: email.trim(), password });
        error = up.error;
        if (!error && !up.data.session) { setMsg('已寄出確認信，點信裡的連結後再回來登入。'); return; }
      }
      if (error) { setMsg(error.message); return; }
      const next = await getEntryRoute();
      router.replace(next === 'onboarding' ? '/onboarding' : '/');
    } catch (e) {
      setMsg('連不到伺服器：' + String(e) + '\n請確認 .env 的網址，以及手機和電腦在同一個 Wi-Fi。');
    } finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.top}>
        <Cat size={200} />
        <Text style={s.h1}>你好，我是秒喵。</Text>
        <Text style={s.p}>以後我會待在你的桌邊，{'\n'}陪你把工作一件一件做完。</Text>
      </View>
      <View style={s.form}>
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholderTextColor={colors.muted} style={s.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="密碼（至少 6 碼）" secureTextEntry autoComplete="password" placeholderTextColor={colors.muted} style={s.input} />
        {msg ? <Text style={s.msg}>{msg}</Text> : null}
        <Button label="登入／建立帳號" onPress={go} loading={busy} disabled={!email.includes('@') || password.length < 6} />
        <Text style={s.foot}>資料存在你自己的帳號，只有你看得到</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  top: { alignItems: 'center', paddingTop: 110 },
  h1: { fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 20 },
  p: { fontSize: 15, color: colors.ink2, marginTop: 8, textAlign: 'center', lineHeight: 23 },
  form: { padding: 24, gap: 10, paddingBottom: 44 },
  input: { height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16, fontSize: 16, color: colors.ink, backgroundColor: '#FFFFFF' },
  msg: { color: colors.due, fontSize: 13, lineHeight: 19 },
  foot: { fontSize: 12, color: colors.ink3, textAlign: 'center', marginTop: 4 },
});
