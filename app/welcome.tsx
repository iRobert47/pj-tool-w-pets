// 00 歡迎／登入：Email＋密碼（沒有帳號會直接幫你建立）
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [showEmail, setShowEmail] = useState(false);

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
        <Text style={s.kicker}>PETS PROJECT</Text>
        <Text style={s.h1}>你好，我是 Miaomiao。</Text>
        <Text style={s.p}>把事情一件一件完成，{'\n'}也把我們的房間慢慢填滿。</Text>
      </View>
      <View style={s.form}>
        {!showEmail ? <>
          <Pressable style={s.apple} onPress={() => Alert.alert('Apple 登入', '目前測試版請先使用 Email 登入。')}><Text style={s.appleText}>●　使用 Apple 繼續</Text></Pressable>
          <Pressable style={s.emailButton} onPress={() => setShowEmail(true)}><Text style={s.emailButtonText}>使用 Email 繼續</Text></Pressable>
        </> : <>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholderTextColor={colors.muted} style={s.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="密碼（至少 6 碼）" secureTextEntry autoComplete="password" placeholderTextColor={colors.muted} style={s.input} />
          {msg ? <Text style={s.msg}>{msg}</Text> : null}
          <Button label="登入／建立帳號" onPress={go} loading={busy} disabled={!email.includes('@') || password.length < 6} />
          <Pressable onPress={() => setShowEmail(false)}><Text style={s.back}>返回其他登入方式</Text></Pressable>
        </>}
        <Text style={s.foot}>資料存在你自己的帳號，只有你看得到</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  top: { alignItems: 'center', paddingTop: 88 },
  kicker: { color: '#9B8567', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 10 },
  h1: { fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 10 },
  p: { fontSize: 15, color: colors.ink2, marginTop: 8, textAlign: 'center', lineHeight: 23 },
  form: { padding: 24, gap: 10, paddingBottom: 44 },
  apple: { height: 54, borderRadius: 27, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  appleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  emailButton: { height: 54, borderRadius: 27, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  emailButtonText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  input: { height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16, fontSize: 16, color: colors.ink, backgroundColor: '#FFFFFF' },
  msg: { color: colors.due, fontSize: 13, lineHeight: 19 },
  back: { color: colors.ink3, fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  foot: { fontSize: 12, color: colors.ink3, textAlign: 'center', marginTop: 4 },
});
