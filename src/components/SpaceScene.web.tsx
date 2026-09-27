// 網頁版秒喵房間：設計稿的房間＋秒喵骨架動畫（摸摸會呼嚕、餵食會跑過去吃、逗貓棒會盯著撲）
import React from 'react';
import { Pressable } from 'react-native';
import Stage from './Stage';
import { SPACE_CUSHION, SPACE_EAT, SPACE_FISH, SPACE_HEARTS, SPACE_ROOM_SVG, SPACE_SIT, SPACE_STAND, SPACE_SWIPE, SPACE_WAND } from '../design/spaceScene';

export type SpaceAct = null | 'pet' | 'notice' | 'run' | 'eat' | 'ret' | 'wand' | 'swipe';

export default function SpaceScene({ act, onPressCat }: { act: SpaceAct; onPressCat: () => void }) {
  const away = act === 'run' || act === 'eat' || act === 'ret' || act === 'swipe';
  const sitCls = 'rig rig-si' + (act === 'pet' ? ' purr' : '') + (act === 'notice' ? ' alert' : '') + (act === 'wand' ? ' track' : '');
  let html = SPACE_ROOM_SVG;
  if (away) html += SPACE_CUSHION;
  if (act === 'notice' || act === 'run') html += SPACE_FISH;
  if (!away) html += SPACE_SIT.replace('__SITCLS__', sitCls);
  if (act === 'run' || act === 'ret') html += SPACE_STAND.replace('__MOVECLS__', act === 'run' ? 'sp-run' : 'sp-back').replace('__FLIPCLS__', act === 'ret' ? 'mm-flip' : '');
  if (act === 'eat') html += SPACE_EAT;
  if (act === 'swipe') html += SPACE_SWIPE;
  if (act === 'wand' || act === 'swipe') html += SPACE_WAND.replace('__WANDCLS__', act === 'swipe' ? 'sp-wand jerk' : 'sp-wand');
  if (act === 'pet') html += SPACE_HEARTS;
  return (
    <Stage html={html} bg="#F5ECDC">
      <Pressable onPress={onPressCat} accessibilityLabel="摸摸秒喵" style={{ position: 'absolute', left: 70, top: 420, width: 250, height: 230 }} />
    </Stage>
  );
}
