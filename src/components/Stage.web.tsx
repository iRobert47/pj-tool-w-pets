// 網頁版：把設計稿 390×844 的場景（SVG）等比放大到畫面寬，貼齊底部。
// children 用設計稿座標擺放（例如秒喵 left 88 / top 494），位置會跟設計稿一模一樣。
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export const STAGE_W = 390;
export const STAGE_H = 844;

export default function Stage({ html, bg, children }: { html: string; bg: string; children?: React.ReactNode }) {
  const [box, setBox] = useState({ w: STAGE_W, h: STAGE_H });
  const k = box.w / STAGE_W;
  const top = box.h - STAGE_H * k;
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: bg, overflow: 'hidden' }]}
      pointerEvents="box-none"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top, width: STAGE_W, height: STAGE_H, transform: [{ translateX: -(STAGE_W - STAGE_W * k) / 2 }, { translateY: -(STAGE_H - STAGE_H * k) / 2 }, { scale: k }] }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, height: STAGE_H, pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: html }} />
        {children}
      </View>
    </View>
  );
}
