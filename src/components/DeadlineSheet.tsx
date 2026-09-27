// 專案進度：新增或編輯一個截止／里程碑
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';
import { addDays, fromIso, hhmm, iso, relLabel, todayIso } from '../lib/dates';
import type { Project, Task } from '../lib/api';

export type DeadlineDraft = { title: string; date: string; time: string | null; milestone: boolean };

/** 「10/15」「10月15日」→ YYYY-MM-DD（過了很久的日期算明年） */
function parseDate(text: string, today: string): string | null {
  const m = text.match(/(\d{1,2})\s*[\/月.-]\s*(\d{1,2})/);
  if (!m) return null;
  const t = fromIso(today);
  let d = new Date(t.getFullYear(), Number(m[1]) - 1, Number(m[2]));
  if (isNaN(d.getTime())) return null;
  if (d.getTime() < t.getTime() - 30 * 86400000) d = new Date(t.getFullYear() + 1, Number(m[1]) - 1, Number(m[2]));
  return iso(d);
}

export default function DeadlineSheet({ open, project, task, onClose, onSave, onDelete }: {
  open: boolean;
  project: Project | null;
  task: Task | null;                 // null = 新增
  onClose: () => void;
  onSave: (d: DeadlineDraft) => void;
  onDelete?: () => void;
}) {
  const today = todayIso();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [dateText, setDateText] = useState('');
  const [time, setTime] = useState('');
  const [milestone, setMilestone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? '');
    setDate(task?.due_date ?? addDays(today, 1));
    setDateText('');
    setTime(task?.due_at ? hhmm(task.due_at) : '');
    setMilestone(task?.kind === 'milestone');
  }, [open, task, today]);

  const nextMon = addDays(today, ((8 - fromIso(today).getDay()) % 7) || 7);   // 下一個週一
  const quick: [string, string][] = [['今天', today], ['明天', addDays(today, 1)], ['後天', addDays(today, 2)], ['下週一', nextMon], ['一週後', addDays(today, 7)]];
  const timeOk = !time || /^\d{1,2}:\d{2}$/.test(time.trim());
  const canSave = title.trim().length > 0 && timeOk;

  function save() {
    if (!canSave) return;
    const t = time.trim();
    onSave({ title: title.trim(), date, time: t ? t.padStart(5, '0') : null, milestone });
  }

  return (
    <Modal transparent visible={open} animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.dim} onPress={onClose} accessibilityLabel="關閉" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.grab} />
          <View style={s.meta}>
            <View style={[s.dot, { backgroundColor: project?.color ?? colors.muted }]} />
            <Text style={s.metaText}>{project?.name ?? '專案'}</Text>
          </View>
          <Text style={s.h}>{task ? '編輯截止' : '新增截止'}</Text>

          <TextInput value={title} onChangeText={setTitle} placeholder="要交什麼？例如：UX Prototype" placeholderTextColor={colors.muted} style={s.input} autoFocus={!task} returnKeyType="done" onSubmitEditing={save} />

          <View style={s.kindRow} accessibilityRole="radiogroup">
            {([[false, '截止'], [true, '◆ 里程碑']] as const).map(([m, label]) => (
              <Pressable key={label} onPress={() => setMilestone(m)} style={[s.kind, milestone === m && s.kindOn]} accessibilityRole="radio" accessibilityState={{ selected: milestone === m }}>
                <Text style={[s.kindText, milestone === m && { color: '#FFFFFF' }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>日期・{relLabel(date)}</Text>
          <View style={s.chips}>
            {quick.map(([label, d]) => (
              <Pressable key={label} onPress={() => { setDate(d); setDateText(''); }} style={[s.chip, date === d && !dateText && s.chipOn]}>
                <Text style={[s.chipText, date === d && !dateText && { color: '#FFFFFF' }]}>{label}</Text>
              </Pressable>
            ))}
            <TextInput
              value={dateText}
              onChangeText={(v) => { setDateText(v); const d = parseDate(v, today); if (d) setDate(d); }}
              placeholder="或 10/15" placeholderTextColor={colors.muted} style={[s.chip, s.dateInput]} keyboardType="numbers-and-punctuation"
            />
          </View>

          <Text style={s.label}>幾點前（可不填）</Text>
          <TextInput value={time} onChangeText={setTime} placeholder="例如 17:30" placeholderTextColor={colors.muted} style={[s.input, !timeOk && { borderColor: colors.due }]} keyboardType="numbers-and-punctuation" />

          <View style={s.actions}>
            {task && onDelete ? (
              <Pressable onPress={onDelete} style={s.del}><Text style={s.delText}>刪除</Text></Pressable>
            ) : <View />}
            <Pressable onPress={save} style={[s.save, !canSave && { opacity: 0.35 }]}><Text style={s.saveText}>{task ? '儲存' : '加入'}</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,17,17,0.32)' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D8D8D8', alignSelf: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontSize: 12, color: colors.ink3 },
  h: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 4 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 16, color: colors.ink, marginTop: 12 },
  kindRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  kind: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.card, justifyContent: 'center' },
  kindOn: { backgroundColor: colors.ink },
  kindText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  label: { fontSize: 12, fontWeight: '700', color: colors.ink3, marginTop: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.card, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  dateInput: { width: 86, fontSize: 13, color: colors.ink },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  del: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  delText: { color: colors.due, fontSize: 15, fontWeight: '600' },
  save: { height: 48, minWidth: 120, paddingHorizontal: 22, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
