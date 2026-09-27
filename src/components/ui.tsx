import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors } from '../lib/theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

export function Button({ label, onPress, kind = 'primary', disabled, loading, style }: {
  label: string; onPress?: () => void; kind?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const bg = kind === 'primary' ? colors.ink : kind === 'secondary' ? colors.card : 'transparent';
  const fg = kind === 'primary' ? '#FFFFFF' : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.8 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Chip({ label, color, bg, onPress, active, style, textStyle }: {
  label: string; color?: string; bg?: string; onPress?: () => void; active?: boolean; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[s.chip, { backgroundColor: active ? colors.ink : bg ?? colors.card }, style]}
    >
      {color ? <View style={[s.dot, { backgroundColor: color }]} /> : null}
      <Text style={[s.chipText, { color: active ? '#FFFFFF' : colors.ink }, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}{sub ? <Text style={s.sectionSub}>  {sub}</Text> : null}</Text>
      {right}
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View style={s.seg}>
      {options.map(([v, label]) => (
        <Pressable key={v} onPress={() => onChange(v)} style={[s.segItem, value === v && s.segOn]} accessibilityRole="radio" accessibilityState={{ selected: value === v }}>
          <Text style={[s.segText, { color: value === v ? colors.ink : colors.ink3 }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnText: { fontSize: 16, fontWeight: '600' },
  chip: { height: 30, borderRadius: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 13, fontWeight: '600' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sectionSub: { fontSize: 12, fontWeight: '400', color: colors.ink3 },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 10, backgroundColor: colors.card },
  segItem: { height: 30, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  segOn: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segText: { fontSize: 12.5, fontWeight: '600' },
});
