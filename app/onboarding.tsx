// 00b 首次設定：你的名字 → 夥伴的名字（預設秒喵）→ 上下班時間
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../src/lib/theme';
import { completeOnboarding } from '../src/lib/api';
import { rescheduleReminders } from '../src/lib/notify';
import Cat from '../src/components/Cat';
import { Button, Chip } from '../src/components/ui';

const IDEAS = ['秒喵', '小墨', '煤球', '芝麻'];
const hm = (h: number) => `${String(Math.floor(h / 2)).padStart(2, '0')}:${h % 2 ? '30' : '00'}`;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [pet, setPet] = useState('秒喵');
  const [ws, setWs] = useState(18);
  const [we, setWe] = useState(36);
  const [quiet, setQuiet] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function finish() {
    setBusy(true); setErr(null);
    try {
      await completeOnboarding({ displayName: name.trim(), petName: pet.trim() || '秒喵', workdayStart: hm(ws), workdayEnd: hm(we), quiet });
      rescheduleReminders(pet.trim() || '秒喵');
      router.replace('/');
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.top}>
        {step > 1 ? <Pressable onPress={() => setStep(step - 1)} hitSlop={10}><Text style={s.back}>‹</Text></Pressable> : <View style={{ width: 20 }} />}
        <View style={s.bars}>{[1, 2, 3].map((n) => <View key={n} style={[s.bar, { backgroundColor: n <= step ? colors.ink : colors.line }]} />)}</View>
      </View>

      <View style={s.body}>
        {step === 1 ? (
          <>
            <Text style={s.h1}>怎麼稱呼你？</Text>
            <Text style={s.p}>{pet}之後會這樣叫你，隨時可以改。</Text>
            <TextInput value={name} onChangeText={(v) => setName(v.slice(0, 12))} placeholder="例如：Robert" placeholderTextColor={colors.muted} autoFocus style={s.input} />
            <View style={s.preview}>
              <Cat size={110} />
              <View style={s.bubble}><Text style={s.bubbleText}>早安，{name.trim() || '你'}。{'\n'}今天想先做哪一件？</Text></View>
            </View>
          </>
        ) : step === 2 ? (
          <>
            <Text style={s.h1}>幫你的夥伴取個名字</Text>
            <Text style={s.p}>牠預設叫秒喵。之後在房間裡也能改。</Text>
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Cat size={170} />
              <View style={s.tag}><Text style={s.tagText}>{pet.trim() || '秒喵'}</Text></View>
            </View>
            <TextInput value={pet} onChangeText={(v) => setPet(v.slice(0, 8))} style={s.input} />
            <View style={s.chips}>{IDEAS.map((i) => <Chip key={i} label={i} active={pet === i} onPress={() => setPet(i)} />)}</View>
          </>
        ) : (
          <>
            <Text style={s.h1}>你通常幾點上下班？</Text>
            <Text style={s.p}>下班後，工作提醒只收進通知，{pet}不會跳出來打擾你。</Text>
            <View style={s.card}>
              {([['上班', ws, setWs, 10, we - 1], ['下班', we, setWe, ws + 1, 46]] as const).map(([label, v, set, min, max]) => (
                <View key={label} style={s.timeRow}>
                  <Text style={s.timeLabel}>{label}</Text>
                  <Pressable onPress={() => set(Math.max(min, v - 1))} style={s.step}><Text style={s.stepText}>−</Text></Pressable>
                  <Text style={s.time}>{hm(v)}</Text>
                  <Pressable onPress={() => set(Math.min(max, v + 1))} style={s.step}><Text style={s.stepText}>+</Text></Pressable>
                </View>
              ))}
              <View style={[s.timeRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}><Text style={s.timeLabel}>22:00 後全部安靜</Text><Text style={s.small}>連生活提醒也不跳</Text></View>
                <Switch value={quiet} onValueChange={setQuiet} />
              </View>
            </View>
          </>
        )}
        {err ? <Text style={s.err}>{err}</Text> : null}
      </View>

      <View style={s.foot}>
        {step === 1 ? <Button label="下一步" onPress={() => setStep(2)} disabled={!name.trim()} /> : null}
        {step === 2 ? <Button label={`就叫牠「${pet.trim() || '秒喵'}」`} onPress={() => setStep(3)} /> : null}
        {step === 3 ? <Button label="完成" onPress={finish} loading={busy} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 60, paddingHorizontal: 20 },
  back: { fontSize: 28, color: colors.ink2, width: 20 },
  bars: { flex: 1, flexDirection: 'row', gap: 6, paddingRight: 32 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },
  h1: { fontSize: 26, fontWeight: '700', color: colors.ink },
  p: { fontSize: 15, color: colors.ink2, marginTop: 8, lineHeight: 22 },
  input: { height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#FFFFFF', paddingHorizontal: 18, fontSize: 18, fontWeight: '600', color: colors.ink, marginTop: 22 },
  preview: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 40 },
  bubble: { flex: 1, backgroundColor: colors.card, borderRadius: 16, borderBottomLeftRadius: 4, padding: 14, marginBottom: 40 },
  bubbleText: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  tag: { marginTop: -4, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.line, transform: [{ rotate: '-3deg' }] },
  tagText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  card: { marginTop: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF' },
  timeRow: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 10 },
  timeLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  small: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  step: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, color: colors.ink },
  time: { width: 70, textAlign: 'center', fontSize: 20, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  err: { color: colors.due, marginTop: 12 },
  foot: { padding: 24, paddingBottom: 40 },
});
