// 網頁版秒喵：直接使用設計稿的 SVG 骨架與 CSS 動畫（尾巴、眨眼、耳朵、呼吸、呼嚕）
import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { CAT_SIT_SVG } from '../design/cat';

export default function Cat({ size = 120, onPress, happy = false, mood }: {
  size?: number; onPress?: () => void; happy?: boolean; mood?: 'purr' | 'alert' | 'sleep';
}) {
  const [purr, setPurr] = useState(false);
  useEffect(() => {
    if (!happy) return;
    setPurr(true);
    const t = setTimeout(() => setPurr(false), 1600);
    return () => clearTimeout(t);
  }, [happy]);
  const state = purr ? 'purr' : mood ?? '';
  const h = Math.round((size * 1080) / 1174);
  const html = CAT_SIT_SVG.replace('__CLS__', `rig rig-si ${state}`);
  const el = <div className="dc-cat" style={{ width: size, height: h }} dangerouslySetInnerHTML={{ __html: html }} />;
  if (!onPress) return el;
  return (
    <Pressable onPress={onPress} accessibilityLabel="摸摸秒喵" style={{ width: size, height: h }}>
      {el}
    </Pressable>
  );
}
