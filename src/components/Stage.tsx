// 原生 App：場景插畫先用底色；children 一樣用設計稿座標（390×844）等比放大
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export const STAGE_W = 390;
export const STAGE_H = 844;

export default function Stage({ bg, children }: { html: string; bg: string; children?: React.ReactNode }) {
  const [box, setBox] = useState({ w: STAGE_W, h: STAGE_H });
  const k = box.w / STAGE_W;
  const top = box.h - STAGE_H * k;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, overflow: 'hidden' }]} pointerEvents="box-none"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top, width: STAGE_W, height: STAGE_H, transform: [{ translateX: -(STAGE_W - STAGE_W * k) / 2 }, { translateY: -(STAGE_H - STAGE_H * k) / 2 }, { scale: k }] }}>
        {children}
      </View>
    </View>
  );
}
