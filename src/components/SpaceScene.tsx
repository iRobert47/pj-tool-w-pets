// 原生 App 的秒喵房間：房間插畫＋逐格動作圖（網頁版用 SpaceScene.web.tsx 的骨架動畫）
import React from 'react';
import { StyleSheet, View } from 'react-native';
import RoomBackdrop from './RoomBackdrop';
import Miaomiao, { MiaomiaoAction } from './Miaomiao';

export type SpaceAct = null | 'pet' | 'notice' | 'run' | 'eat' | 'ret' | 'wand' | 'swipe';

const toAction = (a: SpaceAct): MiaomiaoAction => (a === 'pet' ? 'pet' : a === 'notice' || a === 'run' || a === 'eat' || a === 'ret' ? 'feed' : a === 'wand' || a === 'swipe' ? 'play' : 'idle');

export default function SpaceScene({ act, onPressCat }: { act: SpaceAct; onPressCat: () => void }) {
  return (
    <>
      <View style={StyleSheet.absoluteFill}><RoomBackdrop /></View>
      <View style={{ position: 'absolute', left: 48, top: '49.2%', width: 250, height: 230, justifyContent: 'flex-end', zIndex: 5 }}>
        <Miaomiao size={250} action={toAction(act)} onPress={onPressCat} />
      </View>
    </>
  );
}
