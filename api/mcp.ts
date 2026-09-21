import { createMcpHandler } from 'mcp-handler';
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';

// Vercel preview trigger: ChatGPT pet companion prototype
const RESOURCE_URI = 'ui://pj-pet/companion-v1.html';
const LOTTIE_PAGE_URL =
  'https://lottiefiles.com/free-animation/black-cat-3OBQxyPyXe';
const LOTTIE_OEMBED_URL =
  'https://embed.lottiefiles.com/oembed?url=' +
  encodeURIComponent(LOTTIE_PAGE_URL);
const FALLBACK_PREVIEW =
  'https://assets-v2.lottiefiles.com/a/7ea04694-1182-11ee-a98e-1362e8508d70/TB9Ub8h2gy.png';

async function getAnimationMarkup() {
  try {
    const response = await fetch(LOTTIE_OEMBED_URL, {
      headers: {
        accept: 'application/json',
        'user-agent': 'pj-tool-w-pets/1.0',
      },
    });

    if (!response.ok) throw new Error('Lottie oEmbed unavailable');
    const payload = await response.json();
    const html = typeof payload?.html === 'string' ? payload.html : '';
    const match = html.match(/src=["']([^"']+)["']/i);

    if (match?.[1]) {
      return `<iframe
        title="秒喵 Black Cat animation"
        src="${match[1]}"
        style="width:100%;height:100%;border:0;background:transparent;pointer-events:none"
        allow="autoplay"
      ></iframe>`;
    }
  } catch {
    // Use the official LottieFiles preview below.
  }

  return `<img
    src="${FALLBACK_PREVIEW}"
    alt="秒喵黑貓動畫預覽"
    style="width:78%;height:78%;object-fit:contain;filter:drop-shadow(0 16px 20px rgba(20,24,22,.12));animation:float 3.6s ease-in-out infinite"
  />`;
}

function getWidgetHtml(animationMarkup: string) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #181c1b;
      background: transparent;
    }
    .shell {
      width: 100%;
      max-width: 390px;
      margin: 0 auto;
      padding: 10px;
    }
    .status {
      width: max-content;
      margin: 0 auto 8px;
      padding: 7px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.94);
      border: 1px solid #ecefeb;
      color: #564338;
      font-size: 12px;
      font-weight: 650;
      box-shadow: 0 4px 14px rgba(44,48,46,.05);
    }
    .status::before {
      content: "";
      display: inline-block;
      width: 7px;
      height: 7px;
      margin-right: 7px;
      border-radius: 50%;
      background: #106c47;
    }
    .stage {
      position: relative;
      height: 300px;
      overflow: hidden;
      border: 1px solid #e5e8e4;
      border-radius: 30px;
      background:
        radial-gradient(circle at 50% 28%, #fff 0%, #f7faf7 48%, #eff3ef 100%);
      box-shadow: 0 20px 48px -32px rgba(24,28,27,.55);
    }
    .stage::before {
      content: "";
      position: absolute;
      left: 18%;
      right: 18%;
      bottom: 12%;
      height: 17%;
      border-radius: 50%;
      background: rgba(0,0,0,.07);
      filter: blur(16px);
    }
    .pet {
      position: absolute;
      inset: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .35s ease;
    }
    .name {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.86);
      backdrop-filter: blur(10px);
      font-size: 11px;
      font-weight: 700;
    }
    .feedback {
      position: absolute;
      left: 50%;
      bottom: 14px;
      transform: translateX(-50%) translateY(8px);
      opacity: 0;
      padding: 7px 11px;
      white-space: nowrap;
      border-radius: 999px;
      background: rgba(24,28,27,.9);
      color: white;
      font-size: 11px;
      font-weight: 650;
      transition: .22s ease;
    }
    .feedback.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .controls {
      display: flex;
      width: max-content;
      margin: 10px auto 0;
      gap: 4px;
      padding: 4px;
      border: 1px solid #e8ebe7;
      border-radius: 999px;
      background: rgba(255,255,255,.95);
      box-shadow: 0 4px 16px rgba(44,48,46,.05);
    }
    button {
      border: 0;
      border-radius: 999px;
      padding: 8px 12px;
      background: transparent;
      color: #6d716e;
      font: inherit;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }
    button.active {
      background: #181c1b;
      color: white;
    }
    .credit {
      margin-top: 7px;
      text-align: center;
      color: #8d918e;
      font-size: 9px;
    }
    @keyframes float {
      0%,100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-5px) scale(1.012); }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="status" id="status">今天也待在你身邊</div>
    <section class="stage">
      <div class="name">秒喵 · Lv.9</div>
      <div class="pet" id="pet">${animationMarkup}</div>
      <div class="feedback" id="feedback">呼嚕聲變大了一點</div>
    </section>

    <div class="controls" aria-label="秒喵互動">
      <button class="active" data-action="pet">摸摸</button>
      <button data-action="play">陪玩</button>
      <button data-action="treat">零食</button>
    </div>

    <div class="credit">Animation: Sara Proffit · LottieFiles</div>
  </main>

  <script>
    const buttons = [...document.querySelectorAll('button[data-action]')];
    const pet = document.getElementById('pet');
    const status = document.getElementById('status');
    const feedback = document.getElementById('feedback');
    let timer;

    const messages = {
      pet: ['呼嚕聲變大了一點', '今天也待在你身邊'],
      play: ['注意力被你吸引了', '想跟你玩一下'],
      treat: ['吃得很滿足', '正在期待下一口']
    };

    for (const button of buttons) {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        buttons.forEach((item) => item.classList.toggle('active', item === button));

        if (action === 'play') {
          pet.style.transform = 'translateY(-4px) scale(1.04) rotate(-1deg)';
        } else if (action === 'treat') {
          pet.style.transform = 'translateY(5px) scale(.97)';
        } else {
          pet.style.transform = 'translateY(0) scale(1.015)';
        }

        feedback.textContent = messages[action][0];
        status.textContent = messages[action][1];
        feedback.classList.add('show');
        clearTimeout(timer);
        timer = setTimeout(() => {
          feedback.classList.remove('show');
          pet.style.transform = '';
        }, 1100);
      });
    }
  </script>
</body>
</html>`;
}

const handler = createMcpHandler(
  (server) => {
    registerAppTool(
      server,
      'show_pet_companion',
      {
        title: 'Show Pet Companion',
        description:
          'Open the PJ productivity companion pet experience with 秒喵, a black cat companion.',
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
        _meta: {
          ui: { resourceUri: RESOURCE_URI },
        },
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: 'Opened 秒喵, the PJ productivity companion.',
          },
        ],
        structuredContent: {
          pet: {
            name: '秒喵',
            species: 'black cat',
            level: 9,
            mood: 'calm',
          },
        },
      })
    );

    registerAppResource(
      server,
      'PJ Pet Companion',
      RESOURCE_URI,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => {
        const animationMarkup = await getAnimationMarkup();

        return {
          contents: [
            {
              uri: RESOURCE_URI,
              mimeType: RESOURCE_MIME_TYPE,
              text: getWidgetHtml(animationMarkup),
              _meta: {
                ui: {
                  prefersBorder: false,
                  csp: {
                    frameDomains: [
                      'https://embed.lottiefiles.com',
                      'https://lottiefiles.com',
                    ],
                    resourceDomains: [
                      'https://assets-v2.lottiefiles.com',
                    ],
                  },
                },
              },
            },
          ],
        };
      }
    );
  },
  {
    serverInfo: {
      name: 'pj-tool-w-pets',
      version: '0.1.0',
    },
    instructions:
      'Use show_pet_companion when the user wants to open or interact with their PJ productivity pet companion.',
  }
);

export default {
  fetch(request: Request) {
    return handler(request);
  },
};
