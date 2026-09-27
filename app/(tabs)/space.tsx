// 04 秒喵的房間：摸摸、餵小魚乾（專注換來的）、改名字
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/lib/theme';
import { feedCat, fishCount, getPet, petCat, renamePet } from '../../src/lib/api';
import { useData } from '../../src/lib/useData';
import Cat from '../../src/components/Cat';
import { supabase } from '../../src/lib/supabase';

const ROOM = '#F4EDE2', FLOOR = '#E9DFD0';

export default function Space() {
  const insets = useSafeAreaInsets();
  const { data } = useData(async () => ({ pet: await getPet(), fish: await fishCount() }), []);
  const [say, setSay] = useState<string | null>(null);
  const [happy, setHappy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const pet = data?.pet;

  function react(line: string) {
    setSay(line); setHappy(true);
    setTimeout(() => setHappy(false), 900);
    setTimeout(() => setSay(null), 2600);
  }

  const mood = !pet ? '' : pet.fullness < 30 ? '肚子有點餓' : pet.affection > 80 ? '很黏你' : '心情不錯';

  return (
    <View style={[s.screen, { paddingTop: insets.top + 8 }]}>
      <View style={s.head}>
        {editing ? (
          <View style={s.editRow}>
            <TextInput value={name} onChangeText={setName} autoFocus maxLength={8} style={s.nameInput} />
            <Pressable onPress={async () => { if (pet && name.trim()) await renamePet(pet, name); setEditing(false); }}><Text style={s.save}>儲存</Text></Pressable>
          </View>
        ) : (
          <Pressable onPress={() => { setName(pet?.name ?? ''); setEditing(true); }}>
            <Text style={s.name}>{pet?.name ?? '秒喵'} <Text style={s.edit}>改名</Text></Text>
            <Text style={s.sub}>{mood}・飽足 {pet?.fullness ?? '-'}・親密 {pet?.affection ?? '-'}</Text>
          </Pressable>
        )}
        <Pressable onPress={() => Alert.alert('登出？', '', [{ text: '取消' }, { text: '登出', style: 'destructive', onPress: () => supabase.auth.signOut() }])} hitSlop={10}>
          <Text style={s.logout}>登出</Text>
        </Pressable>
      </View>

      <View style={s.room}>
        <View style={s.window}><View style={s.windowBar} /><View style={[s.windowBar, { transform: [{ rotate: '90deg' }] }]} /></View>
        <View style={s.floor} />
        {say ? <View style={s.bubble}><Text style={s.bubbleText}>{say}</Text></View> : null}
        <View style={s.cat}>
          <Cat size={210} happy={happy} onPress={async () => { react('呼嚕呼嚕～'); if (pet) await petCat(pet); }} />
        </View>
      </View>

      <View style={s.tray}>
        <Pressable style={s.act} onPress={async () => { react('呼嚕呼嚕～'); if (pet) await petCat(pet); }}>
          <Text style={s.actIcon}>✋</Text><Text style={s.actText}>摸摸</Text>
        </Pressable>
        <Pressable style={s.act} onPress={async () => {
          if (!pet) return;
          const ok = await feedCat(pet);
          react(ok ? '好吃！謝謝你～' : '魚乾吃完了，專注 20 分鐘就會再有。');
        }}>
          <Text style={s.actIcon}>🐟</Text><Text style={s.actText}>餵食 ×{data?.fish ?? 0}</Text>
        </Pressable>
        <Pressable style={s.act} onPress={() => react('（撲過去！）')}>
          <Text style={s.actIcon}>〰</Text><Text style={s.actText}>逗貓棒</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ROOM },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20 },
  name: { fontSize: 24, fontWeight: '700', color: colors.ink },
  edit: { fontSize: 13, fontWeight: '400', color: colors.ink3 },
  sub: { fontSize: 13, color: colors.ink2, marginTop: 2 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameInput: { height: 40, minWidth: 140, borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 12, fontSize: 18, color: colors.ink },
  save: { fontSize: 15, fontWeight: '700', color: colors.ink },
  logout: { fontSize: 13, color: colors.ink3, marginTop: 6 },
  room: { flex: 1, marginTop: 10 },
  window: { position: 'absolute', right: 30, top: 30, width: 110, height: 130, borderRadius: 10, backgroundColor: '#DCEAF3', borderWidth: 6, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  windowBar: { position: 'absolute', width: 4, height: '100%', backgroundColor: '#FFFFFF' },
  floor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', backgroundColor: FLOOR },
  cat: { position: 'absolute', left: 0, right: 0, bottom: '20%', alignItems: 'center' },
  bubble: { position: 'absolute', left: 30, right: 30, top: 190, alignItems: 'center' },
  bubbleText: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, fontSize: 15, fontWeight: '600', color: colors.ink, overflow: 'hidden' },
  tray: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingBottom: 110, paddingTop: 12, backgroundColor: FLOOR },
  act: { width: 96, height: 72, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actIcon: { fontSize: 20 },
  actText: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
