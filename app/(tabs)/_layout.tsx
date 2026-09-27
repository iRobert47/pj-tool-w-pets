// 底部導覽：今天、行事曆、＋、專案、秒喵（五等分，＋ 在正中間）
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../src/lib/theme';

const icon = {
  index: (c: ColorValue) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx={12} cy={12} r={4} /><Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </Svg>
  ),
  calendar: (c: ColorValue) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Rect x={3.5} y={5} width={17} height={15} rx={3} /><Path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  ),
  projects: (c: ColorValue) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round">
      <Path d="M4 7.5l8-4 8 4-8 4-8-4z" /><Path d="M4 12l8 4 8-4M4 16.5l8 4 8-4" />
    </Svg>
  ),
  space: (c: ColorValue) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={c}>
      <Path d="M5 4l3.5 4h7L19 4l1 8c0 4.4-3.6 8-8 8s-8-3.6-8-8l1-8z" />
    </Svg>
  ),
};

export default function TabsLayout() {
  // 底部導覽列的高度要加上 iPhone 底部橫條的安全區，否則圖示下的文字會被切掉
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line, height: 64 + Math.max(insets.bottom, 8), paddingTop: 6, paddingBottom: Math.max(insets.bottom, 8) },
        sceneStyle: { backgroundColor: colors.bg },
        // 中文字（Noto Sans TC）比英文高，行高不給足會被切掉下緣
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', lineHeight: 16, height: 16, marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '今天', tabBarIcon: ({ color }) => icon.index(color) }} />
      <Tabs.Screen name="calendar" options={{ title: '行事曆', tabBarIcon: ({ color }) => icon.calendar(color) }} />
      <Tabs.Screen
        name="new"
        options={{
          title: '',
          tabBarButton: () => <PlusButton />,
        }}
      />
      <Tabs.Screen name="projects" options={{ title: '專案', tabBarIcon: ({ color }) => icon.projects(color) }} />
      <Tabs.Screen name="space" options={{ title: '秒喵', tabBarIcon: ({ color }) => icon.space(color) }} />
    </Tabs>
  );
}

// 中間的 ＋：在「專案」頁按，直接開「新增專案」；其他頁開「新增事項」（進去後都能切換）
function PlusButton() {
  const path = usePathname();
  const onProjects = path.startsWith('/projects');
  return (
    <View style={s.plusWrap}>
      <Pressable onPress={() => router.push(onProjects ? { pathname: '/add', params: { mode: 'project' } } : '/add')} style={s.plus} accessibilityLabel={onProjects ? '新增專案' : '新增'}>
        <Text style={s.plusText}>+</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  plusWrap: { flex: 1, alignItems: 'center' },
  plus: { width: 54, height: 54, borderRadius: 27, marginTop: -6, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  plusText: { color: '#FFFFFF', fontSize: 28, lineHeight: 30, fontWeight: '400' },
});
