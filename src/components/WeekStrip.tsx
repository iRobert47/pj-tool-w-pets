import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { WEEKDAYS, fromIso, todayIso, weekOf } from '../lib/dates';

/** 上方週條：點日期切換；每天下面最多 3 個點＝那天的任務（用專案色） */
export default function WeekStrip({ selected, onSelect, dots }: {
  selected: string; onSelect: (d: string) => void; dots: Record<string, string[]>;
}) {
  const today = todayIso();
  return (
    <View style={s.row} accessibilityRole="tablist">
      {weekOf(selected).map((d) => {
        const sel = d === selected;
        const isToday = d === today;
        const past = d < today;
        return (
          <Pressable key={d} onPress={() => onSelect(d)} style={s.cell} accessibilityRole="tab" accessibilityState={{ selected: sel }} accessibilityLabel={`${fromIso(d).getMonth() + 1} 月 ${fromIso(d).getDate()} 日`}>
            <Text style={[s.wd, { color: sel ? colors.ink : colors.muted }]}>{WEEKDAYS[fromIso(d).getDay()]}</Text>
            <View style={[s.num, sel && { backgroundColor: colors.ink }, !sel && isToday && { borderWidth: 1.5, borderColor: colors.ink }]}>
              <Text style={[s.numText, { color: sel ? '#FFFFFF' : past ? colors.muted : colors.ink }]}>{fromIso(d).getDate()}</Text>
            </View>
            <View style={s.dots}>
              {(dots[d] ?? []).slice(0, 3).map((c, i) => <View key={i} style={[s.dot, { backgroundColor: c }]} />)}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10 },
  cell: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 2 },
  wd: { fontSize: 11 },
  num: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 15, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, height: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
