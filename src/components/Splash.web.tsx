// 啟動畫面（網頁版）：照設計稿 00 Splash。資料載好後淡出。
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Stage from './Stage';
import { SPLASH_BG_SVG } from '../design/splash';
import { CAT_SIT_SVG } from '../design/cat';

export const SPLASH_NAME_KEY = 'splash:name';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? '晚安' : h < 11 ? '早安' : h < 18 ? '午安' : '晚安';
}

export default function Splash({ leaving }: { leaving: boolean }) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem(SPLASH_NAME_KEY).then(setName).catch(() => {}); }, []);
  const cat = CAT_SIT_SVG.replace('__CLS__', 'rig rig-si');
  const html = `${SPLASH_BG_SVG}
<div style="position:absolute;left:0;right:0;top:132px;text-align:center;padding:0 24px;color:#111111">
  <div class="spl-title" style="font-family:'Noto Serif TC',serif !important;font-size:40px;font-weight:700;letter-spacing:.04em;line-height:1.2">一起下班</div>
  <div class="spl-sub" style="font-size:12px;font-weight:600;letter-spacing:.22em;color:#8A7B66;margin-top:8px">CLOCK OUT TOGETHER</div>
  <div class="spl-sub" style="font-size:15px;color:#525252;margin-top:18px">和 Miaomiao 一起，把今天過完。</div>
</div>
<div class="dc-cat" style="position:absolute;left:50px;top:446px;width:300px;height:276px">${cat}</div>
<div style="position:absolute;left:0;right:0;bottom:48px;text-align:center;color:#111111">
  <div style="font-size:15px;font-weight:600">${greeting()}${name ? '，' + name.replace(/[<>&"]/g, '') : ''}</div>
  <div class="spl-dots" aria-hidden="true" style="display:flex;justify-content:center;gap:6px;margin-top:12px"><span></span><span></span><span></span></div>
</div>`;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, opacity: leaving ? 0 : 1, transition: 'opacity .45s ease', pointerEvents: leaving ? 'none' : 'auto' }} aria-label="載入中">
      <Stage html={html} bg="#F4E9D6" />
    </div>
  );
}
