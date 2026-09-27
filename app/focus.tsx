// 05 專注：單次或番茄鐘；時間記在選的那件事上。用「開始時間」算剩餘，App 切到背景也不會跑掉。
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Cat from '../src/components/Cat';
import Stage from '../src/components/Stage';
import { FOCUS_BG_SVG } from '../src/design/focusScene';
import { endFocus, focusMinutes, listTasks, startFocus, taskDay } from '../src/lib/api';
import { todayIso, weekOf } from '../src/lib/dates';
import { useData } from '../src/lib/useData';

const DARK = '#211D19', CREAM = '#F3E6CF', TEXT = '#F6EBD9', DIM = '#B5AA99';
const OFF_B = 'rgba(255,255,255,0.30)', OFF_BG = 'rgba(255,255,255,0.08)';

type Stage = 'ready' | 'focus' | 'rest' | 'done';

export default function Focus() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ taskId?: string; title?: string; projectId?: string }>();
  const today = todayIso();
  const { data } = useData(async () => {
    const [tasks, todayMin, weekMin] = await Promise.all([listTasks(today, today), focusMinutes(today), focusMinutes(weekOf(today)[0])]);
    return { tasks: tasks.filter((t) => taskDay(t) === today && t.kind !== 'event' && !t.done_at), todayMin, weekMin };
  }, [], 'focus');

  const [target, setTarget] = useState<{ id: string | null; title: string; projectId: string | null }>(
    params.taskId ? { id: params.taskId, title: params.title ?? '', projectId: params.projectId || null } : { id: null, title: '自由專注', projectId: null },
  );
  const [mode, setMode] = useState<'single' | 'pomodoro'>('single');
  const [single, setSingle] = useState(45);
  const [pf, setPf] = useState(25);
  const [pb, setPb] = useState(5);
  const [pr, setPr] = useState(4);
  const [stage, setStage] = useState<Stage>('ready');
  const [round, setRound] = useState(1);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [focusedMin, setFocusedMin] = useState(0);
  const sessionId = useRef<string | null>(null);
  const segStart = useRef(0);
  const notifId = useRef<string | null>(null);
  const focusedRef = useRef(0);
  const [box, setBox] = useState({ w: 390, h: 844 });
  const [controlsBottom, setControlsBottom] = useState(470);
  const [bottomTop, setBottomTop] = useState(760);

  const planMin = mode === 'single' ? single : pf;
  const total = stage === 'rest' ? pb * 60 : planMin * 60;
  const left = stage === 'ready' ? total : Math.max(0, Math.round((endsAt - now) / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    const sub = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(t); sub.remove(); };
  }, []);

  // 時間到自動進下一段
  useEffect(() => {
    if ((stage === 'focus' || stage === 'rest') && left === 0) finishSegment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, stage]);

  async function schedule(sec: number, body: string) {
    if (Platform.OS === 'web') return;
    if (notifId.current) await Notifications.cancelScheduledNotificationAsync(notifId.current).catch(() => {});
    notifId.current = await Notifications.scheduleNotificationAsync({
      content: { title: '秒喵', body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, sec) },
    }).catch(() => null);
  }

  async function start() {
    sessionId.current = await startFocus({ mode, focusMin: planMin, breakMin: mode === 'pomodoro' ? pb : undefined, rounds: mode === 'pomodoro' ? pr : 1, taskId: target.id, projectId: target.projectId }).catch(() => null);
    beginFocus(1);
  }

  function beginFocus(r: number) {
    setRound(r);
    segStart.current = Date.now();
    setEndsAt(Date.now() + planMin * 60000);
    setStage('focus');
    schedule(planMin * 60, mode === 'pomodoro' ? `第 ${r} 輪結束，休息一下` : '專注時間到了，做得好');
  }

  function addFocused() {
    const m = Math.round((Date.now() - segStart.current) / 60000);
    focusedRef.current += m;
    setFocusedMin(focusedRef.current);
    return m;
  }

  async function finishSegment() {
    if (stage === 'focus') {
      addFocused();
      if (mode === 'pomodoro' && round < pr) {
        setEndsAt(Date.now() + pb * 60000);
        setStage('rest');
        schedule(pb * 60, `休息結束，準備第 ${round + 1} 輪`);
        return;
      }
      await wrapUp(round);
    } else if (stage === 'rest') {
      beginFocus(round + 1);
    }
  }

  async function wrapUp(rounds: number) {
    if (notifId.current && Platform.OS !== 'web') Notifications.cancelScheduledNotificationAsync(notifId.current).catch(() => {});
    setStage('done');
    if (sessionId.current) await endFocus(sessionId.current, focusedRef.current, rounds).catch(() => {});
  }

  async function stopEarly() {
    const m = stage === 'focus' ? addFocused() : 0;
    await wrapUp(stage === 'rest' ? round : round - 1 + (m > 0 ? 1 : 0));
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const pct = stage === 'ready' ? 0 : 1 - left / total;
  const pomoAll = pr * pf + (pr - 1) * pb;
  const targets = useMemo(() => [
    ...(data?.tasks ?? []).slice(0, 3).map((t) => ({ id: t.id as string | null, title: t.title, projectId: t.project_id })),
    { id: null, title: '自由專注', projectId: null },
  ], [data]);

  const cycle = <T,>(arr: T[], v: T) => arr[(arr.indexOf(v) + 1) % arr.length];
  const pill = (on: boolean) => [s.pill, on ? { backgroundColor: CREAM, borderColor: CREAM } : { backgroundColor: OFF_BG, borderColor: OFF_B }];
  const pillText = (on: boolean) => [s.pillText, { color: on ? DARK : '#EFE7DA' }];

  // 設計稿的場景：窗外下雨、檯燈、地毯；專注時檯燈亮起
  const lamp = stage === 'focus' ? { glow: '0.32', cone: '1', shade: '#F5CB8E' } : stage === 'rest' ? { glow: '0.22', cone: '0.7', shade: '#F5CB8E' } : { glow: '0.1', cone: '0.2', shade: '#B89A74' };
  const sceneHtml = FOCUS_BG_SVG.replace(/__GLOW__/g, lamp.glow).replace(/__CONE__/g, lamp.cone).replace(/__SHADE__/g, lamp.shade);

  // 秒喵和坐墊放在「控制區」和「底部按鈕」之間：手機畫面較矮（例如瀏覽器有網址列）時自動縮小，不會壓到時間和按鈕
  const k = box.w / 390;
  const designBottom = box.h - (844 - 708) * k;            // 設計稿坐墊底部的位置
  const compact = box.h < 760;                              // 瀏覽器有網址列、或較矮的手機
  const catBottom = compact ? bottomTop - 6 : Math.min(designBottom, bottomTop - 6);
  const room = catBottom - (controlsBottom + 10);
  const sc = Math.max(0.4, Math.min(1, room / (214 * k)));
  const u = k * sc;                                         // 設計稿 1px 在畫面上的大小
  const gw = 234 * u, gh = 214 * u;
  const gl = 205 * k - gw / 2, gt = catBottom - gh;
  const showBubble = sc > 0.82 && (stage === 'ready' || stage === 'rest');

  return (
    <View style={[s.screen, { paddingTop: insets.top + 6 }]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Stage html={sceneHtml} bg={DARK} />
      <View pointerEvents="none" style={{ position: 'absolute', left: gl, top: gt, width: gw, height: gh }}>
        <View style={{ position: 'absolute', left: 17 * u, top: 199 * u, width: 200 * u, height: 14 * u, borderRadius: 7 * u, backgroundColor: 'rgba(21,17,14,0.6)' }} />
        <View style={{ position: 'absolute', left: 16 * u, top: 164 * u, width: 202 * u, height: 42 * u, borderRadius: 21 * u, backgroundColor: '#F1ECE3', borderWidth: Math.max(1, 3 * u), borderColor: '#D9CFBF' }} />
        <View style={{ position: 'absolute', left: 0, top: 0 }}>
          <Cat size={gw} happy={stage === 'done'} mood={stage === 'focus' ? 'purr' : undefined} />
        </View>
      </View>
      {showBubble ? (
        <View pointerEvents="none" style={[s.bubble, { left: gl + 62 * u, top: gt + 6 * u }]}>
          <Text style={s.bubbleText}>{stage === 'ready' ? '準備好就開始，\n我先跳上去坐好。' : '起來走走、喝口水，\n我也伸個懶腰。'}</Text>
        </View>
      ) : null}
      <View style={s.top}>
        {stage === 'ready' || stage === 'done' ? <Pressable onPress={() => router.back()} hitSlop={10}><Text style={s.back}>‹ 返回</Text></Pressable> : <View />}
      </View>

      <View style={{ alignItems: 'center' }} onLayout={(e) => setControlsBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        {stage === 'ready' ? (
          <>
            <Text style={[s.small, compact && { marginTop: 6 }]}>要專注在什麼？</Text>
            <View style={s.wrap}>
              {targets.map((t) => {
                const on = t.id === target.id && t.title === target.title;
                return <Pressable key={(t.id ?? 'free') + t.title} onPress={() => setTarget(t)} style={pill(on)}><Text style={pillText(on)} numberOfLines={1}>{t.title}</Text></Pressable>;
              })}
            </View>
          </>
        ) : stage !== 'done' ? (
          <>
            <Text style={[s.small, compact && { marginTop: 6 }]}>{stage === 'rest' ? '休息一下' : target.id ? '專注中' : '自由專注'}</Text>
            <Text style={s.taskTitle}>{target.title}</Text>
          </>
        ) : null}

        {stage !== 'done' ? (
          <Text style={[s.clock, compact && s.clockCompact, stage === 'rest' && { color: '#B9D3B2' }]}>{mm}:{ss}</Text>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={s.doneTitle}>專注了 {focusedMin} 分鐘</Text>
            <Text style={s.doneSub}>{focusedMin >= 20 ? '秒喵趁你忙的時候，叼回一條小魚乾。' : '短短的也算數，下次再多一點。'}</Text>
          </View>
        )}

        {stage === 'ready' ? (
          <>
            <View style={s.seg}>
              {(['single', 'pomodoro'] as const).map((m) => (
                <Pressable key={m} onPress={() => setMode(m)} style={[s.segItem, mode === m && { backgroundColor: CREAM }]}>
                  <Text style={[s.segText, { color: mode === m ? DARK : '#EFE7DA' }]}>{m === 'single' ? '單次' : '番茄鐘'}</Text>
                </Pressable>
              ))}
            </View>
            {mode === 'single' ? (
              <View style={s.row}>
                {[25, 45, 60].map((m) => <Pressable key={m} onPress={() => setSingle(m)} style={pill(single === m)}><Text style={pillText(single === m)}>{m} 分</Text></Pressable>)}
                <Pressable onPress={() => setSingle(Math.max(5, single - 5))} style={pill(false)}><Text style={pillText(false)}>−</Text></Pressable>
                <Pressable onPress={() => setSingle(Math.min(180, single + 5))} style={pill(false)}><Text style={pillText(false)}>+</Text></Pressable>
              </View>
            ) : (
              <View style={s.row}>
                <Pressable onPress={() => setPf(cycle([25, 30, 50], pf))} style={pill(false)}><Text style={pillText(false)}>專注 {pf} 分</Text></Pressable>
                <Pressable onPress={() => setPb(cycle([5, 10], pb))} style={pill(false)}><Text style={pillText(false)}>休息 {pb} 分</Text></Pressable>
                <Pressable onPress={() => setPr(cycle([2, 3, 4, 6], pr))} style={pill(false)}><Text style={pillText(false)}>{pr} 輪</Text></Pressable>
              </View>
            )}
            <Text style={s.note}>
              {mode === 'pomodoro' ? `${pr} 輪共 ${Math.floor(pomoAll / 60) ? Math.floor(pomoAll / 60) + ' 小時 ' : ''}${pomoAll % 60} 分` : `今天已專注 ${data?.todayMin ?? 0} 分・本週 ${((data?.weekMin ?? 0) / 60).toFixed(1)} 小時`}
            </Text>
          </>
        ) : stage !== 'done' ? (
          <>
            <View style={s.bar}><View style={[s.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: stage === 'rest' ? '#8FB786' : '#E9A45F' }]} /></View>
            {mode === 'pomodoro' ? <Text style={s.note}>{stage === 'rest' ? `第 ${round} 輪完成・休息中` : `第 ${round} / ${pr} 輪`}</Text> : null}
          </>
        ) : null}

      </View>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 20 }]} onLayout={(e) => setBottomTop(e.nativeEvent.layout.y)}>
        {stage === 'ready' ? <Pressable onPress={start} style={s.primary}><Text style={s.primaryText}>開始專注</Text></Pressable> : null}
        {stage === 'focus' ? <Pressable onLongPress={stopEarly} delayLongPress={700} style={s.secondary}><Text style={s.secondaryText}>長按結束</Text></Pressable> : null}
        {stage === 'rest' ? (
          <>
            <Pressable onPress={() => beginFocus(round + 1)} style={s.primary}><Text style={s.primaryText}>開始第 {round + 1} 輪</Text></Pressable>
            <Pressable onPress={stopEarly} hitSlop={8}><Text style={s.link}>先到這裡</Text></Pressable>
          </>
        ) : null}
        {stage === 'done' ? <Pressable onPress={() => router.back()} style={s.primary}><Text style={s.primaryText}>回到今天</Text></Pressable> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  clockCompact: { fontSize: 64, marginTop: 8, letterSpacing: -1 },
  bubble: { position: 'absolute', maxWidth: 170, backgroundColor: '#F3E9D8', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { color: '#211D19', fontSize: 14, fontWeight: '500', lineHeight: 21 },
  screen: { flex: 1, backgroundColor: DARK },
  top: { height: 44, paddingHorizontal: 16, justifyContent: 'center' },
  back: { color: DIM, fontSize: 15 },
  small: { color: DIM, fontSize: 13, marginTop: 20 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 16, marginTop: 8 },
  taskTitle: { color: TEXT, fontSize: 18, fontWeight: '600', marginTop: 4, paddingHorizontal: 24, textAlign: 'center' },
  clock: { color: TEXT, fontSize: 88, fontWeight: '200', letterSpacing: -2, marginTop: 20, fontVariant: ['tabular-nums'] },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.10)', marginTop: 16 },
  segItem: { height: 30, paddingHorizontal: 16, borderRadius: 15, justifyContent: 'center' },
  segText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12, paddingHorizontal: 16 },
  pill: { height: 38, minWidth: 44, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center', maxWidth: 200 },
  pillText: { fontSize: 14, fontWeight: '600' },
  note: { color: DIM, fontSize: 12, marginTop: 14 },
  bar: { width: 180, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 22, overflow: 'hidden' },
  barFill: { height: 3 },
  doneTitle: { color: TEXT, fontSize: 28, fontWeight: '600' },
  doneSub: { color: DIM, fontSize: 15, marginTop: 10, textAlign: 'center', paddingHorizontal: 30, lineHeight: 22 },
  bottom: { marginTop: 'auto', alignItems: 'center', gap: 10, paddingTop: 10 },
  primary: { width: 240, height: 56, borderRadius: 28, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: DARK, fontSize: 17, fontWeight: '600' },
  secondary: { width: 240, height: 52, borderRadius: 26, borderWidth: 1, borderColor: OFF_B, backgroundColor: OFF_BG, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: TEXT, fontSize: 15 },
  link: { color: DIM, fontSize: 14, textDecorationLine: 'underline' },
});
