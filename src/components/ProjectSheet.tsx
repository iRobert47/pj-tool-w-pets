// 新增專案（品牌）：名稱＋顏色，從首頁「專案進度」或專案頁都能開
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';

export const PROJECT_PALETTE = ['#FF7A59', '#5B7FA6', '#7FA578', '#8E6FA8', '#E0A526', '#3AA5A0', '#D9669A'];

export default function ProjectSheet({ open, used = [], onClose, onSave }: {
  open: boolean;
  used?: string[];                       // 已經用過的顏色，預設挑一個還沒用的
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_PALETTE[0]);
  useEffect(() => {
    if (!open) return;
    setName('');
    setColor(PROJECT_PALETTE.find((c) => !used.includes(c)) ?? PROJECT_PALETTE[0]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const ok = name.trim().length > 0;
  const save = () => { if (ok) onSave(name.trim(), color); };

  return (
    <Modal transparent visible={open} animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.dim} onPress={onClose} accessibilityLabel="關閉" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.grab} />
          <Text style={s.h}>新增專案</Text>
          <TextInput value={name} onChangeText={setName} placeholder="品牌／專案名稱，例如：東琳" placeholderTextColor={colors.muted} style={s.input} autoFocus returnKeyType="done" onSubmitEditing={save} />
          <Text style={s.label}>顏色</Text>
          <View style={s.palette}>
            {PROJECT_PALETTE.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={[s.swatch, { backgroundColor: c }, color === c && s.swatchOn]} accessibilityLabel={`顏色 ${c}`} />
            ))}
          </View>
          <View style={s.actions}>
            <Pressable onPress={onClose} style={s.cancel}><Text style={s.cancelText}>取消</Text></Pressable>
            <Pressable onPress={save} style={[s.save, !ok && { opacity: 0.35 }]}><Text style={s.saveText}>建立</Text></Pressable>
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
  h: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 14 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 16, color: colors.ink, marginTop: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.ink3, marginTop: 16 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16 },
  swatchOn: { borderWidth: 3, borderColor: colors.ink },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 },
  cancel: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  cancelText: { color: colors.ink2, fontSize: 15, fontWeight: '600' },
  save: { height: 48, minWidth: 120, paddingHorizontal: 22, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
