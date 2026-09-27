// 09 快速記下：把語音轉出的文字、照片或亂貼的文字，判斷成可加入的卡片。
// 本機：supabase functions serve --env-file supabase/functions/.env
// 需要環境變數：ANTHROPIC_API_KEY、ANTHROPIC_MODEL
import { createClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding/base64';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Body = { source: 'voice' | 'text'; text: string } | { source: 'photo'; path: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // 用呼叫者自己的 token 建 client，RLS 照樣生效
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'not signed in' }, 401);

  const body = (await req.json()) as Body;

  // 1. 先存原始輸入
  const { data: capture, error: capErr } = await supabase
    .from('captures')
    .insert(body.source === 'photo'
      ? { source: 'photo', media_path: body.path }
      : { source: body.source, raw_text: body.text })
    .select('id')
    .single();
  if (capErr) return json({ error: capErr.message }, 400);

  // 2. 給 AI 的背景：今天日期、使用者的專案和別名
  const { data: projects } = await supabase.from('projects').select('id, name, short_name, aliases').eq('status', 'active');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const weekday = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', weekday: 'long' });

  const content: unknown[] = [];
  if (body.source === 'photo') {
    const { data: file, error } = await supabase.storage.from('captures').download(body.path);
    if (error) return json({ error: error.message }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    content.push({ type: 'image', source: { type: 'base64', media_type: file.type || 'image/jpeg', data: encodeBase64(bytes) } });
    content.push({ type: 'text', text: '請從這張照片裡找出要記下的事項。' });
  } else {
    content.push({ type: 'text', text: body.text });
  }

  // 3. 呼叫 Claude，用 tool 強制回傳固定格式
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL'),
      max_tokens: 1500,
      system: [
        `今天是 ${today}（${weekday}），時區 Asia/Taipei。`,
        '使用者會用口語、照片或沒有格式的文字交代工作與生活上的事。把每一件事拆成一張卡片。',
        '「下週三」「月底」「後天」這類說法要換成實際日期。沒有提到日期的就填 null，不要亂猜。',
        'kind：有明確交付物的大節點用 milestone；某天前要交的用 deadline；當天做完、不用排時間的用 day_task；有明確時段的用 timed。',
        '專案請對照下列清單（含別名）。確定的填 project_id；不確定的 project_id 填 null，並在 project_guess 寫你的猜測。',
        JSON.stringify(projects ?? []),
      ].join('\n'),
      tools: [{
        name: 'save_items',
        description: '回傳判斷出來的卡片',
        input_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  kind: { type: 'string', enum: ['milestone', 'deadline', 'day_task', 'timed'] },
                  title: { type: 'string' },
                  project_id: { type: ['string', 'null'] },
                  project_guess: { type: ['string', 'null'] },
                  date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
                  time: { type: ['string', 'null'], description: 'HH:mm' },
                  remind_days_before: { type: ['integer', 'null'] },
                  confidence: { type: 'number' },
                },
                required: ['kind', 'title', 'project_id', 'project_guess', 'date', 'time', 'remind_days_before', 'confidence'],
              },
            },
          },
          required: ['items'],
        },
      }],
      tool_choice: { type: 'tool', name: 'save_items' },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    await supabase.from('captures').update({ error: msg }).eq('id', capture.id);
    return json({ error: 'parse failed' }, 502);
  }

  const out = await res.json();
  const items = out.content?.find((c: { type: string }) => c.type === 'tool_use')?.input?.items ?? [];
  await supabase.from('captures').update({ status: 'parsed', parsed: items }).eq('id', capture.id);

  // 使用者在 App 裡確認後，再由前端把勾選的卡片寫進 tasks（source_capture_id = captureId）
  return json({ captureId: capture.id, items });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
