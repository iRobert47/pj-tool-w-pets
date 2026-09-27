// ＋ 快速新增：一句話自動抓專案／日期／時間；拍照或貼一大段文字交給 AI 判斷
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../src/lib/theme';
import { parseQuick } from '../src/lib/parse';
import { AiItem, addTask, listProjects, parseWithAi, saveAiItems, uploadPhoto } from '../src/lib/api';
import { useData } from '../src/lib/useData';
import { relLabel } from '../src/lib/dates';
import { Button, Chip } from '../src/components/ui';

const KIND_LABEL: Record<AiItem['kind'], string> = { milestone: '◆ 里程碑', deadline: '截止', day_task: '日任務', timed: '排時間' };

export default function Add() {
  const { data: projects } = useData(listProjects, [], 'projects-list');
  const [text, setText] = useState('');
  const [pickedProject, setPickedProject] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<{ captureId: string; items: (AiItem & { on: boolean })[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const p = useMemo(() => parseQuick(text, projects ?? []), [text, projects]);
  const project = pickedProject ? (projects ?? []).find((x) => x.id === pickedProject) ?? null : p.project;
  const long = text.length > 40 || text.includes('\n');

  async function save() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addTask({ title: p.title, projectId: project?.id ?? null, date: p.date, time: p.time, isDeadline: p.isDeadline });
      router.back();
    } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  }

  async function runAi(input: Parameters<typeof parseWithAi>[0]) {
    setBusy(true); setErr(null);
    try {
      const r = await parseWithAi(input);
      setAi({ captureId: r.captureId, items: r.items.map((i) => ({ ...i, on: true })) });
    } catch (e) {
      setErr('AI 判斷失敗：' + (e instanceof Error ? e.message : String(e)) + '\n（確認 Edge Function 有在跑，且設定了 ANTHROPIC_API_KEY）');
    } finally { setBusy(false); }
  }

  async function photo(fromCamera: boolean) {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    setBusy(true);
    try { await runAi({ source: 'photo', path: await uploadPhoto(res.assets[0].uri) }); } catch (e) { setErr(String(e)); setBusy(false); }
  }

  async function saveAi() {
    if (!ai) return;
    setBusy(true);
    try { await saveAiItems(ai.items.filter((i) => i.on), ai.captureId); router.back(); } catch (e) { setErr(String(e)); } finally { setBusy(false); }
  }

  const nameOf = (id: string | null) => (projects ?? []).find((x) => x.id === id);

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.head}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={s.cancel}>取消</Text></Pressable>
        <Text style={s.headTitle}>新增</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {!ai ? (
          <>
            <Text style={s.hint}>一句話就好，日期、時間、專案會自動抓。語音可以用鍵盤上的麥克風。</Text>
            <View style={s.inputWrap}>
              <TextInput
                autoFocus multiline value={text} onChangeText={setText}
                placeholder="例：週五前交東琳報價 17:30" placeholderTextColor={colors.muted}
                style={s.input}
              />
            </View>
            <View style={s.tools}>
              <Pressable style={s.tool} onPress={() => photo(true)}><Text style={s.toolText}>拍照</Text></Pressable>
              <Pressable style={s.tool} onPress={() => photo(false)}><Text style={s.toolText}>從相簿</Text></Pressable>
              {long ? <Pressable style={[s.tool, { backgroundColor: colors.ink }]} onPress={() => runAi({ source: 'text', text })}><Text style={[s.toolText, { color: '#FFFFFF' }]}>交給 AI 拆成多件</Text></Pressable> : null}
            </View>

            {text.trim() && !long ? (
              <View style={{ marginTop: 16 }}>
                <Text style={s.label}>會加入成</Text>
                <View style={s.preview}>
                  <Text style={s.previewTitle}>{p.title}</Text>
                  <View style={s.chips}>
                    {p.date ? <Chip label={(p.isDeadline ? '截止 ' : '') + relLabel(p.date)} bg="#FFFFFF" style={s.outline} /> : <Chip label="今天" bg="#FFFFFF" style={s.outline} />}
                    {p.time ? <Chip label={p.time + (p.isDeadline ? ' 前' : '')} bg="#FFFFFF" style={s.outline} /> : null}
                    {p.isDeadline ? <Chip label="前一天提醒" bg="#FFFFFF" style={s.outline} /> : null}
                  </View>
                </View>
                <Text style={[s.label, { marginTop: 14 }]}>專案{p.project && !pickedProject ? '（自動判斷）' : ''}</Text>
                <View style={s.chips}>
                  {(projects ?? []).map((x) => (
                    <Chip key={x.id} label={x.short_name || x.name} color={x.color} active={project?.id === x.id} onPress={() => setPickedProject(project?.id === x.id ? '' : x.id)} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={s.hint}>我整理出 {ai.items.length} 件，勾掉不要的再加入。</Text>
            {ai.items.map((it, i) => {
              const pj = nameOf(it.project_id);
              return (
                <Pressable key={i} onPress={() => setAi({ ...ai, items: ai.items.map((x, j) => (j === i ? { ...x, on: !x.on } : x)) })} style={[s.aiCard, !it.on && { opacity: 0.4 }]}>
                  <Text style={s.aiKind}>{KIND_LABEL[it.kind]}</Text>
                  <Text style={s.previewTitle}>{it.title}</Text>
                  <View style={s.chips}>
                    {pj ? <Chip label={pj.short_name || pj.name} color={pj.color} /> : <Chip label={'? ' + (it.project_guess ?? '哪個專案')} bg="#FFFFFF" style={[s.outline, { borderStyle: 'dashed' }]} />}
                    {it.date ? <Chip label={relLabel(it.date) + (it.time ? ' ' + it.time : '')} bg="#FFFFFF" style={s.outline} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
        {busy ? <ActivityIndicator style={{ marginTop: 20 }} color={colors.ink} /> : null}
        {err ? <Text style={s.err}>{err}</Text> : null}
      </ScrollView>

      <View style={s.footer}>
        {ai ? <Button label={`加入 ${ai.items.filter((i) => i.on).length} 件`} onPress={saveAi} loading={busy} />
          : <Button label={p.date ? `加入到 ${relLabel(p.date)}` : '加入到今天'} onPress={save} disabled={!text.trim() || long} loading={busy} />}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  cancel: { fontSize: 15, color: colors.ink2, width: 40 },
  headTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 13, color: colors.ink2, marginBottom: 10, lineHeight: 19 },
  inputWrap: { borderRadius: 16, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10 },
  input: { fontSize: 17, color: colors.ink, minHeight: 60, textAlignVertical: 'top' },
  tools: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  tool: { height: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.card, justifyContent: 'center' },
  toolText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  label: { fontSize: 12, fontWeight: '700', color: colors.ink3, marginBottom: 6 },
  preview: { borderRadius: 14, backgroundColor: colors.card, padding: 12 },
  previewTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  outline: { borderWidth: 1, borderColor: '#D4D4D4' },
  aiCard: { borderRadius: 14, backgroundColor: colors.card, padding: 12, marginBottom: 8 },
  aiKind: { fontSize: 11, fontWeight: '700', color: colors.ink3, marginBottom: 2 },
  err: { color: colors.due, marginTop: 12, fontSize: 13, lineHeight: 19 },
  footer: { padding: 16, paddingBottom: 34, borderTopWidth: 1, borderTopColor: colors.line },
});
