import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../src/lib/theme';
import { feedCat, fishCount, getPet, petCat, renamePet } from '../../src/lib/api';
import { useData } from '../../src/lib/useData';
import Miaomiao, { MiaomiaoAction } from '../../src/components/Miaomiao';
import RoomBackdrop from '../../src/components/RoomBackdrop';

type IconName = 'back' | 'switch' | 'hand' | 'fish' | 'wand' | 'memory' | 'collection' | 'decorate' | 'quest';

const ICONS: Record<IconName, string> = {
  back: 'M15 6l-6 6 6 6',
  switch: 'M7 7h11l-3-3M17 17H6l3 3',
  hand: 'M8 11V7a1.5 1.5 0 013 0v4-1.5-6a1.5 1.5 0 013 0v6-1-5a1.5 1.5 0 013 0v6l1-3a1.5 1.5 0 013 1v6c0 4-3 7-7 7h-1c-4 0-7-3-7-7v-4a1.5 1.5 0 013 0v2',
  fish: 'M4 12c3-5 8-7 13-4l3-3v14l-3-3c-5 3-10 1-13-4Zm7 0h.01',
  wand: 'M5 19 16 8M14 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1ZM17 15l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z',
  memory: 'M4 7h16v12H4zM8 7l2-3h4l2 3M8 12h8M8 15h5',
  collection: 'M6 4h12v16l-6-3-6 3z',
  decorate: 'M4 20h16M7 20v-8h10v8M9 12V6h6v6M12 3v3',
  quest: 'M5 5h14v14H5zM8 9h8M8 13h5',
};

function Icon({ name, size = 22, color = '#25221D' }: { name: IconName; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d={ICONS[name]} />
    </Svg>
  );
}

export default function Space() {
  const insets = useSafeAreaInsets();
  const { data, reload } = useData(async () => ({ pet: await getPet(), fish: await fishCount() }), []);
  const [say, setSay] = useState('今天忙了好久，我想出去晃晃。');
  const [action, setAction] = useState<MiaomiaoAction>('idle');
  const [actionKey, setActionKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const bubble = useRef(new Animated.Value(1)).current;
  const pet = data?.pet;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bubble, { toValue: 0, duration: 1600, useNativeDriver: true }),
      Animated.timing(bubble, { toValue: 1, duration: 1600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bubble]);

  function speak(line: string) {
    setSay(line);
  }

  function play(next: Exclude<MiaomiaoAction, 'idle'>, line: string) {
    setAction(next);
    setActionKey((key) => key + 1);
    speak(line);
  }

  async function petMiaomiao() {
    play('pet', '呼嚕呼嚕～再摸一下。');
    if (pet) {
      await petCat(pet);
      reload();
    }
  }

  async function feedMiaomiao() {
    if (!pet) return;
    const ok = await feedCat(pet);
    play('feed', ok ? '好吃！今天也有被好好照顧。' : '小魚乾吃完了，專注 20 分鐘就會再有。');
    reload();
  }

  return (
    <View style={s.screen}>
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />
      <View style={StyleSheet.absoluteFill}><RoomBackdrop /></View>

      <View style={[s.header, { top: insets.top + 8 }]}>
        <Pressable style={s.roundButton} onPress={() => router.back()} accessibilityLabel="返回">
          <Icon name="back" />
        </Pressable>
        <Pressable style={s.identity} onPress={() => { setName(pet?.name ?? 'Miaomiao'); setEditing(true); }}>
          <Text style={s.petName}>{pet?.name || 'Miaomiao'}</Text>
          <Text style={s.days}>相伴 142 天</Text>
        </Pressable>
        <Pressable style={s.partnerSwitch} onPress={() => Alert.alert('切換夥伴', '目前只有 Miaomiao 在房間裡。')}>
          <Icon name="switch" size={17} />
          <Text style={s.switchText}>切換</Text>
        </Pressable>
      </View>

      <Pressable style={[s.questPill, { top: insets.top + 62 }]} onPress={() => Alert.alert('任務牆', '有 2 張任務卡可以領取。')}>
        <Icon name="quest" size={16} color="#6F5A3E" />
        <Text style={s.questText}>任務牆</Text>
        <View style={s.questBadge}><Text style={s.questBadgeText}>2</Text></View>
        <Text style={s.questHint}>張可以領取</Text>
      </Pressable>

      <Animated.View style={[s.bubble, { transform: [{ translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}>
        <Text style={s.bubbleText}>{say}</Text>
        <Pressable style={s.outButton} onPress={() => speak('我出去探險一下，很快就回來！')}>
          <Text style={s.outButtonText}>讓牠出門</Text>
        </Pressable>
        <View style={s.bubbleTail} />
      </Animated.View>

      <View style={s.catStage}>
        <Miaomiao size={250} action={action} actionKey={actionKey} onActionComplete={() => setAction('idle')} onPress={petMiaomiao} />
      </View>

      <View style={s.focusPill}>
        <View style={s.focusDot} />
        <Text style={s.focusLabel}>專注</Text>
        <Text style={s.focusValue}>8/10</Text>
      </View>

      <View style={[s.actionsWrap, { bottom: Math.max(insets.bottom, 16) + 66 }]}>
        <View style={s.actions}>
          <Action icon="hand" label="摸摸" onPress={petMiaomiao} />
          <View style={s.actionDivider} />
          <Action icon="fish" label="餵食" count={`×${data?.fish ?? 0}`} onPress={feedMiaomiao} />
          <View style={s.actionDivider} />
          <Action icon="wand" label="逗貓棒" onPress={() => play('play', '這次一定抓得到！')} />
        </View>
      </View>

      <View style={[s.roomNav, { bottom: Math.max(insets.bottom, 14) }]}>
        <RoomNav icon="memory" label="回憶" onPress={() => Alert.alert('回憶', '一起生活的片段會收藏在這裡。')} />
        <RoomNav icon="collection" label="收藏" onPress={() => Alert.alert('收藏', 'Miaomiao 帶回來的收藏品。')} />
        <RoomNav icon="decorate" label="佈置" onPress={() => Alert.alert('佈置', '房間佈置功能準備中。')} />
        <RoomNav icon="quest" label="任務牆" onPress={() => Alert.alert('任務牆', '有 2 張任務卡可以領取。')} />
      </View>

      {editing ? (
        <View style={s.renameScrim}>
          <View style={s.renameCard}>
            <Text style={s.renameTitle}>幫夥伴改名字</Text>
            <TextInput value={name} onChangeText={setName} autoFocus maxLength={12} style={s.nameInput} />
            <View style={s.renameActions}>
              <Pressable onPress={() => setEditing(false)}><Text style={s.cancel}>取消</Text></Pressable>
              <Pressable style={s.saveButton} onPress={async () => { if (pet && name.trim()) { await renamePet(pet, name.trim()); reload(); } setEditing(false); }}><Text style={s.save}>儲存</Text></Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Action({ icon, label, count, onPress }: { icon: IconName; label: string; count?: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [s.action, pressed && s.pressed]} onPress={onPress}>
      <Icon name={icon} size={22} />
      <Text style={s.actionText}>{label}</Text>
      {count ? <Text style={s.actionCount}>{count}</Text> : null}
    </Pressable>
  );
}

function RoomNav({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [s.roomNavItem, pressed && s.pressed]} onPress={onPress}>
      <Icon name={icon} size={21} color="#756B5C" />
      <Text style={s.roomNavText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5ECDC', overflow: 'hidden' },
  header: { position: 'absolute', left: 18, right: 18, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 8 },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.78)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(220,205,181,0.85)' },
  identity: { position: 'absolute', left: 72, right: 72, alignItems: 'center' },
  petName: { color: '#25221D', fontSize: 17, lineHeight: 21, fontWeight: '700' },
  days: { marginTop: 2, color: '#8B7E6B', fontSize: 10.5, fontWeight: '500' },
  partnerSwitch: { height: 34, paddingHorizontal: 11, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: 'rgba(220,205,181,0.85)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  switchText: { color: '#3C372F', fontSize: 11, fontWeight: '600' },
  questPill: { position: 'absolute', right: 16, height: 32, paddingLeft: 10, paddingRight: 8, borderRadius: 16, backgroundColor: 'rgba(255,250,239,0.88)', borderWidth: 1, borderColor: '#E4D4BA', flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 7 },
  questText: { color: '#6F5A3E', fontSize: 10.5, fontWeight: '700' },
  questBadge: { minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#EF8354', alignItems: 'center', justifyContent: 'center' },
  questBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  questHint: { color: '#8B7E6B', fontSize: 9.5 },
  bubble: { position: 'absolute', right: 18, top: '37.7%', width: 202, minHeight: 96, borderRadius: 22, padding: 15, backgroundColor: 'rgba(255,255,255,0.94)', zIndex: 6, shadowColor: '#806B4C', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  bubbleText: { paddingRight: 2, color: '#302C26', fontSize: 13.5, lineHeight: 20, fontWeight: '600' },
  outButton: { alignSelf: 'flex-start', marginTop: 9, height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#26231F', justifyContent: 'center' },
  outButtonText: { color: '#FFF', fontSize: 10.5, fontWeight: '700' },
  bubbleTail: { position: 'absolute', left: 19, bottom: -8, width: 17, height: 17, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }] },
  catStage: { position: 'absolute', left: 48, top: '49.2%', width: 250, height: 230, justifyContent: 'flex-end', zIndex: 5 },
  focusPill: { position: 'absolute', right: 24, bottom: 184, height: 32, paddingHorizontal: 11, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: '#E2D3BC', flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 6 },
  focusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF8354' },
  focusLabel: { color: '#7A6D5B', fontSize: 10.5 },
  focusValue: { color: '#3D372F', fontSize: 11, fontWeight: '700' },
  actionsWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 8 },
  actions: { width: 320, height: 66, paddingHorizontal: 10, borderRadius: 33, backgroundColor: 'rgba(255,255,255,0.93)', flexDirection: 'row', alignItems: 'center', shadowColor: '#6C5B43', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  action: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', gap: 2 },
  actionText: { color: '#3C372F', fontSize: 10.5, fontWeight: '700' },
  actionCount: { position: 'absolute', top: 4, right: 12, color: '#8B7E6B', fontSize: 9.5, fontWeight: '700' },
  actionDivider: { width: 1, height: 30, backgroundColor: '#E9E0D2' },
  roomNav: { position: 'absolute', left: 30, right: 30, height: 48, flexDirection: 'row', justifyContent: 'space-between', zIndex: 8 },
  roomNavItem: { width: 66, alignItems: 'center', justifyContent: 'center', gap: 4 },
  roomNavText: { color: '#756B5C', fontSize: 9.5, fontWeight: '600' },
  pressed: { opacity: 0.6, transform: [{ scale: 0.96 }] },
  renameScrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(29,25,20,0.28)', alignItems: 'center', justifyContent: 'center', zIndex: 20, paddingHorizontal: 28 },
  renameCard: { width: '100%', padding: 22, borderRadius: 24, backgroundColor: '#FFFDF9' },
  renameTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginBottom: 14 },
  nameInput: { height: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#F4EFE6', color: colors.ink, fontSize: 16 },
  renameActions: { marginTop: 18, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 18 },
  cancel: { color: colors.ink3, fontSize: 14, fontWeight: '600' },
  saveButton: { height: 38, paddingHorizontal: 18, borderRadius: 19, backgroundColor: '#27231E', justifyContent: 'center' },
  save: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
