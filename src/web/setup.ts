// 網頁版一次性設定：字體（DM Sans＋Noto Sans TC）、設計稿的動畫 CSS、禁止縮放。
// 加到主畫面用的 meta 在 app/_layout.tsx 的 useWebAppMeta。
// 只在瀏覽器執行；原生 App 不會用到。
import { DESIGN_CSS } from '../design/css';

let done = false;

export function setupWeb() {
  if (done || typeof document === 'undefined') return;
  done = true;
  const head = document.head;
  const add = (tag: string, attrs: Record<string, string>, text?: string) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text) el.textContent = text;
    head.appendChild(el);
    return el;
  };

  document.title = '秒喵';
  document.documentElement.lang = 'zh-Hant';
  add('link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' });
  add('link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' });
  add('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,200;9..40,400;9..40,500;9..40,600;9..40,700&family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap' });
  // 讓網頁版像 App：不能縮放、沒有點擊灰框、不會整頁回彈
  const vp = document.querySelector('meta[name="viewport"]');
  const vpContent = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no';
  if (vp) vp.setAttribute('content', vpContent); else add('meta', { name: 'viewport', content: vpContent });

  add('style', {}, `
body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
div, span, input, textarea, button { font-family: 'DM Sans', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif !important; }
input, textarea { outline: none; }
.dc-stage { position: absolute; left: 0; top: 0; width: 390px; height: 844px; transform-origin: 0 0; pointer-events: none; }
.dc-stage .dc-hit { pointer-events: auto; }
.dc-cat svg { display: block; overflow: visible; }
@media (prefers-reduced-motion: reduce) { .rig *, .dc-stage * { animation: none !important; } }
${DESIGN_CSS}
`);
}
