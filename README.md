# 秒喵 App（Expo + Supabase）

設計稿上的功能已經寫成可以跑的 React Native App：

| 畫面 | 功能 |
|---|---|
| 歡迎 | Email＋密碼登入；沒有帳號會直接建立 |
| 首次設定 | 你的名字 → 夥伴名字（預設「秒喵」）→ 上下班時間 |
| 今天 | 週條切換日期、秒喵一句話、**專案進度（每個品牌最近的截止）**、今天要做的事（依專案／依時段）、分類旁 ＋ 直接新增、點任務：完成／明天做／這週末／開始專注／之後再說／刪除（都能復原） |
| ＋ 新增 | 一句話自動抓專案、日期、時間、截止；拍照或貼一大段文字交給 AI 拆成多件 |
| 行事曆 | 一週行程（依日期）、日期 × 品牌截止表（依品牌）、之後再說 |
| 專案 | 每個品牌的完成比例、下一個截止；新增品牌 |
| 專注 | 單次（25／45／60，可加減）或番茄鐘（專注、休息、輪數），時間記在任務上；專注滿 20 分鐘秒喵帶回小魚乾 |
| 秒喵 | 摸摸、用小魚乾餵食、逗貓棒、改名字 |
| 提醒 | 截止前一天 9:00、當天截止前 30 分、排時間的事前 10 分，發手機通知 |

---

## 一、第一次裝起來（電腦上做一次）

需要：Mac 或 Windows、[Node.js 20 以上](https://nodejs.org)、[Docker Desktop](https://www.docker.com/products/docker-desktop/)、Supabase CLI（Mac：`brew install supabase/tap/supabase`）。

```bash
cd pets-app
npm run setup          # 安裝套件、建立 .env
npm run db:start       # 啟動本機 Supabase（第一次會下載，要等幾分鐘）
```

`db:start` 會印出 `API URL` 和 `anon key`。打開 `.env` 填進去：

```
EXPO_PUBLIC_SUPABASE_URL=http://192.168.x.x:54321   ← 用電腦的區網 IP，不要用 localhost
EXPO_PUBLIC_SUPABASE_KEY=貼上 anon key
```

電腦的區網 IP：Mac 在終端機打 `ipconfig getifaddr en0`；Windows 打 `ipconfig` 看「IPv4 位址」。

```bash
npm run db:reset       # 建資料表＋灌測試資料
```

---

## 二、在手機上用（開發中，最快）

1. 手機裝 **Expo Go**（App Store／Google Play 搜尋 Expo Go）。
2. 手機和電腦連**同一個 Wi-Fi**。
3. 電腦執行 `npm start`，畫面會出現 QR code。
4. iPhone 用相機掃；Android 用 Expo Go 裡的「Scan QR code」掃。
5. 登入：
   - 想先看有資料的樣子：`dev@pets.local`／`devpass123`
   - 要自己正式用：輸入你的 Email 和密碼，會直接建立新帳號並進入首次設定

改程式碼，手機上會自動更新。

**限制**：電腦要開著、同一個 Wi-Fi。出門在外連不到。

---

## 三、不開電腦也能天天用

要兩件事：資料庫搬上雲端，再把 App 打包成手機上的正式 App。

### 1. 資料庫搬到 Supabase 雲端（免費方案就夠）

1. 到 [supabase.com](https://supabase.com) 建一個專案，區域選 Tokyo 或 Singapore。
2. Authentication → Sign In / Providers → Email：個人使用可以把 **Confirm email** 關掉，註冊就不用收信。
3. 電腦執行：
   ```bash
   supabase link --project-ref 你的專案ID
   supabase db push                          # 建資料表（測試資料不會上去）
   supabase functions deploy parse-capture   # 照片／長文字的 AI 判斷，不用可以跳過
   supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=...
   ```
4. `.env` 換成雲端的 Project URL 和 anon key（Settings → API）。

### 2. 打包成 App

```bash
npm install -g eas-cli
eas login              # 免費的 Expo 帳號
eas init
```

**Android（免費）**

```bash
eas build -p android --profile preview
```

完成後給你一個下載連結，手機打開、下載 APK、允許安裝，就有「秒喵」App 了。

**iPhone（兩種）**

- **Apple Developer Program（US$99／年）**：`eas build -p ios --profile preview`，跟著指示登記手機，裝好就能一直用；之後也能上 TestFlight。
- **免費但要常重裝**：Mac 裝 Xcode，手機接上電腦，執行 `npx expo run:ios --device`。用免費 Apple ID 簽的 App 7 天後會失效，要再裝一次。

---

## 四、日常開發會用到的指令

| 做什麼 | 指令 |
|---|---|
| 啟動本機資料庫 | `npm run db:start` |
| 資料表還原成乾淨＋測試資料 | `npm run db:reset` |
| 啟動 App | `npm start`（手機不同網路時用 `npm run start:tunnel`，但本機資料庫仍要同網路） |
| 產生資料表型別 | `npm run db:types` |
| 本機跑 AI 判斷 | 複製 `supabase/functions/.env.example` 成 `.env` 填 key，再 `npm run fn:serve` |
| 打開資料庫後台 | http://localhost:54323 |

## 五、檔案

```
app/                  畫面（Expo Router，一個檔案一個畫面）
  (tabs)/index.tsx      今天
  (tabs)/calendar.tsx   行事曆
  (tabs)/projects.tsx   專案
  (tabs)/space.tsx      秒喵
  add.tsx               ＋ 新增
  focus.tsx             專注
  welcome.tsx / onboarding.tsx
src/lib/              資料與工具：api.ts（所有資料庫讀寫）、parse.ts（一句話判斷）、notify.ts（手機提醒）、theme.ts（W 白紙配色）
src/components/       秒喵 SVG、週條、專案進度、任務列、任務選單
supabase/             資料表 migration、測試資料、AI 判斷的 Edge Function
```

## 已知限制（第一版）

- 語音輸入先用鍵盤上的麥克風（iOS／Android 都有），還沒有 App 內錄音。
- 秒喵只有呼吸和跳一下的動畫；設計稿裡走路、出門、叼魚的動畫之後再接。
- 柴柴、任務牆、週回顧、通知匣、裝飾房間還沒做進 App。
- 重複任務、桌面小工具還沒有。

---

## 六、iPhone 免費安裝（不用付 Apple 年費）

用免費 Apple ID 簽名，App 會裝在你的 iPhone 上、不用開電腦也能用，但**每 7 天要重裝一次**（資料在雲端，不會不見）。

### 事前準備（只做一次）

1. **資料庫搬上雲端**：照「三、1.」把 Supabase 建在雲端，`.env` 換成雲端網址和 key。否則離開家裡 Wi-Fi 就連不到資料。
2. Mac 從 App Store 安裝 **Xcode**，打開一次同意授權。
3. Xcode → Settings → Accounts → 左下角 ＋ → Apple ID，登入你的 Apple ID（會出現「Personal Team」）。
4. iPhone 用線接上 Mac，手機上按「信任這台電腦」。
5. iPhone：設定 → 隱私權與安全性 → **開發者模式** → 打開，手機會重開機。

### 安裝

```bash
cd miaomiao-app
npx expo prebuild -p ios          # 產生 ios 資料夾（第一次）
open ios/*.xcworkspace
```

在 Xcode：左邊點最上面的專案 → Signing & Capabilities → Team 選你的「Personal Team」。
如果 Bundle Identifier 顯示已被使用，改成 `com.你的名字.miaomiao` 之類不會重複的名字。

回到終端機：

```bash
npx expo run:ios --device --configuration Release
```

選你的 iPhone，裝好後第一次打開會說「未受信任的開發者」：
iPhone 設定 → 一般 → VPN 與裝置管理 → 你的 Apple ID → 信任。

用 **Release** 是關鍵：這樣 App 內含全部程式，不用連著電腦也能開。

### 7 天後打不開了

手機接上 Mac，再跑一次 `npx expo run:ios --device --configuration Release` 就好，資料都還在。

### 免費帳號的限制

- 7 天到期要重裝。
- 不能收遠端推播；但本 App 的提醒是手機本機排程的，**照樣會響**。
- 同時最多 3 個自己簽的 App。

---

## 七、不裝 Xcode：做成網頁版，加到 iPhone 主畫面（免費、不會過期）

不用 Xcode、不用更新 macOS、不用 Apple 年費。App 會變成一個網址，用 Safari「加入主畫面」後，桌面上會有秒喵的圖示，點開是全螢幕，跟 App 一樣。

**代價**：App 關著的時候不會跳提醒通知（iPhone 的網頁 App 不能自己排通知）。打開 App 時畫面上的提醒照常顯示。

### 步驟

1. **資料庫搬上雲端**（照「三、1.」）。網頁版一定要用雲端的 Supabase，本機的連不到。
2. `.env` 換成雲端的網址和 key。
3. 打包網頁：
   ```bash
   npm run build:web        # 產生 dist 資料夾
   ```
4. 放上網路（免費）：打開 https://app.netlify.com/drop ，把整個 `dist` 資料夾拖進去，會拿到一個網址（例如 `xxx.netlify.app`）。之後更新就再 build 一次、再拖一次。
5. iPhone 用 **Safari** 打開那個網址 → 下方分享按鈕 → **加入主畫面**。

之後就從主畫面的秒喵圖示打開。

### 在電腦上先看網頁版

```bash
npm run web
```
