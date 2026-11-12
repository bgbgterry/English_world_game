# 🐝 真真英文練習遊戲 (English Word Game)

專為國小學童設計的現代化互動式英文單字練習遊戲。採用純前端架構（HTML5 / CSS3 / Vanilla JavaScript），結合 **Google Drive 雲端試算表動態題庫系統**，支援 GitHub Pages 線上免安裝遊玩與本機直接雙擊開啟！

---

## 🎮 核心功能與特色

### 1. ☁️ Google Drive 雲端動態題庫架構
* **全面移除靜態內建題庫與次級 Level 選單**：遊戲主程式（`index.html` 與 `Engligh_v3.html`）不再寫死單字資料，全面改由 Google Drive 中的「**`真真 -> 英文 -> 單字題庫 -> 英文單字題庫`**」雲端試算表動態取得題庫，並直接依試算表內的 `Part` / `Week` 分組載入單字。
* **零 CORS 限制之 JSONP 即時直連與四層容錯載入 (`CloudBankLoader`)**：
  1. **Google Sheets JSONP 即時直連（線上與本機 `file:///` 皆全面支援）**：採用動態 Script 注入（JSONP）技術，突破瀏覽器對本地檔案協定（`file:///`）的 CORS 限制。無論是雙擊本機 HTML 還是造訪 GitHub Pages，都能即時直連 Google Drive 試算表載入最新單字。
  2. **本機獨立快照腳本 (`gdrive_banks.js`)**：若無網路或未連線時，本機自動載入快照變數 `window.GDRIVE_BANKS_SNAPSHOT`，即使完全斷網也能離線遊玩。
  3. **雲端同步快照 (`gdrive_banks.json`)**：專案定期從 Google Drive 同步產出快照，供 GitHub Pages 備援載入。
  4. **瀏覽器離線快取 (`localStorage`)**：自動快取最近一次載入的雲端題庫，強化容錯與載入速度。

### 2. 三大核心練習模式
* **📖 學習模式**：
  * 母音以紅色（`#E53935`）、子音以藍色（`#1E88E5`）清晰標色，幫助自然發音與音節記憶。
  * 支援音節拆解間距切換、例句朗讀、例句中文翻譯與單字釋義。
* **🧩 積木模式**：
  * 字母方塊隨機重組打散，學童可點擊拼出正確單字。
  * 支援鍵盤快速操作與即時提示。
* **✍️ 聽寫模式**：
  * 隱藏單字與提示，播放標準語音，讓學童打字拼寫。
  * 自動比對答案，答錯立即標記並記錄於錯題筆記本。

### 3. 📓 錯題筆記系統 (Wrong Question Notebook)
* **永久跨題庫保存**：切換題庫或關卡時，挑戰者的錯題記錄絕不丟失。
* **錯誤軌跡追蹤**：記錄每個單字的累計錯誤次數、最後一次誤拼字串。
* **✏️ 個人記憶口訣**：挑戰者可為易錯單字填寫專屬的記憶口訣或聯想法。
* **📕 錯題特訓模式**：一鍵載入所有待複習錯題進行加強練習，答對立即移出待複習清單並獲得額外星星獎勵。

### 4. 👤 多挑戰者系統 (Challenger Profiles)
* **多學童切換**：頂部 Header 支援即時切換不同挑戰者（如「真真」、「Guest」等）。
* **Cookie 與 LocalStorage 雙重同步**：
  * 基本狀態與進度寫入 `document.cookie`（維持 365 天有效期）。
  * 完整錯題本與詳細筆記寫入 `localStorage`，兼顧規範相容性與無容量上限限制。

### 5. 📁 題庫管理與雲端同步面板 (Modal)
* **雲端同步控制列**：在「📁 題庫管理 / 載入」視窗中可直接檢視 Google Drive 連線狀態、一鍵重新同步雲端題庫、開啟雲端試算表或自訂試算表 ID 與分頁名稱。
* **多元匯入與匯出**：仍完整保留本地 CSV / JSON 檔案拖曳上傳、Excel 文字快速貼上、單筆新增與匯出功能。

---

## ☁️ Google Drive 雲端題庫一覽

雲端試算表路徑：**`我的雲端硬碟 / 真真 / 英文 / 單字題庫 / 英文單字題庫`**  
（Spreadsheet ID: `1bv_OzB2UutDUxc-M1tLFnVa6OVWGW2xRl0oWlAXxieE`）

| 雲端工作表 (Tab) | Part（即 Week 分組） | 單字量 | 說明 |
| :--- | :--- | :---: | :--- |
| **`2026_spelling_bee`** | `Week 1` ~ `Week 4` | 各 25 字（共 100 字） | 2026 Spelling Bee 單字表，提供完整中文翻譯與小學四年級（Grade 4）水準例句，Part 欄位統一對應為 Week |
| **`Grade_2B`** | `Week 1` ~ `Week 8` | 每週 20~30 字（共 187 字） | 國小二年級每週進度單字題庫（含完整中文翻譯與四年級水準例句） |
| **`Grade_1C`** | `Week 1` | 25 字 | 國小一年級基礎複習題庫 |

### 試算表標準欄位格式（Part 即 Week，例句符合小學四年級單字與文法水準）
| A 欄 (`Part`) | B 欄 (`單字`) | C 欄 (`中文翻譯`) | D 欄 (`例句`) | E 欄 (`例句翻譯`) |
| :---: | :---: | :--- | :--- | :--- |
| `Week 1` | `separated` | 分開的；分離的 | The two cats were separated by a low fence. | 這兩隻貓被一道低矮的柵欄分開了。 |
| `Week 1` | `aboard` | 在船（飛機、車）上 | All passengers are now aboard the plane. | 所有乘客現在都登機了。 |

---

## 🛠️ 開發工具鏈與自動化擴充

本專案提供**三合一整合工具**，一鍵完成「單字照片辨識」→「生成單字中文翻譯與小學四年級（Grade 4）例句」→「上傳 Google Drive」→「同步網頁快照」：

```
[單字表照片 (.jpg/.png)]
       │
       ▼  一鍵執行 node photo_to_csv.js
┌──────────────────────────────────────────────────────────┐
│ 步驟 1：Gemini Vision OCR 辨識單字表（Part 統一轉為 Week）   │
│ 步驟 2：自動提供單字中文翻譯、小學四年級水準英文例句與翻譯     │
│ 步驟 3：自動批次寫入 Google Drive 試算表並產出本地同步快照    │
└──────────────────────────────────────────────────────────┘
       │
       ▼  即時自動更新
[Google Drive：真真/英文/單字題庫/英文單字題庫 + gdrive_banks.js/json]
       │
       ▼  CloudBankLoader 動態直連載入（支援本機 file:// 與線上）
[遊戲主程式 (index.html / Engligh_v3.html)]
```

### 1. 三合一自動化腳本 (`photo_to_csv.js`)
* **整合流程**：
  1. **OCR 辨識**：辨識照片單字，將 `Part` 統一標準化為 `Week 1`、`Week 2`...，並支援快取斷點續傳（若已辨識過自動沿用，節省時間與額度）。
  2. **四年級水準智慧擴充**：提供必填之「單字中文翻譯」（多義以 `；` 分隔）、符合「小學四年級（Grade 4）」單字與文法水準的英文例句及例句中文翻譯（內建精選四年級字典並結合 Gemini API 自動生成）。
  3. **Google Sheets 上傳與同步**：直接寫入 Google Drive 試算表指定分頁（A~E 欄完整格式化），並自動更新 `gdrive_banks.json` 與 `gdrive_banks.js`。
* **執行指令範例**：
  ```powershell
  # 設定 Gemini API Key
  $env:GEMINI_API_KEY="你的Gemini金鑰"

  # 一鍵執行完整三合一流程（辨識 2026_spelling_bee.jpg、生成中文與例句、上傳工作表）
  node photo_to_csv.js .\2026_spelling_bee.jpg --sheet 2026_spelling_bee
  ```
* **常用選項說明**：
  * `--sheet <名稱>`：指定上傳之工作表名稱（若不存在會自動建立）。
  * `--prefix <名稱>`：中繼暫存檔前綴（預設同工作表名稱）。
  * `--batch <數量>`：Gemini 每批次生成單字數（預設已優化為 5 字，產生快速且穩定不超時）。
  * `--model <模型>`：指定 Gemini 模型（預設 `gemini-3.8-flash`，具備 503 壅塞或 404 自動切換至 `gemini-3.5-flash-lite` / `gemini-3.1-flash-lite` / `gemini-3.1-pro` 之多模型備援機制）。
  * `--part-size <數量>`：無週次標記時每個 Part 的單字數（預設 25 字）。
  * `--force-ocr`：強制重新 OCR 辨識（忽略先前暫存快取）。
  * `--no-enrich`：僅辨識單字，不上傳中文翻譯與例句。
  * `--no-upload`：僅在本地完成辨識與生成，不上傳 Google Drive。

### 2. Google 試算表補齊與同步工具 (`enrich_gdrive_words.js`)
* 自動將工作表 `Part` 欄位標準化為 `Week`（例如 `Part 1` → `Week 1`），並確保每個單字均提供完整的「單字中文翻譯」以及符合「小學四年級（Grade 4）單字與文法水準」的「英文例句」與「例句翻譯」：
  ```powershell
  # 掃描指定試算表，自動正規化 Week 並補齊缺漏的單字中文翻譯與四年級水準例句
  node enrich_gdrive_words.js --sheet 2026_spelling_bee

  # 強制重新檢視並更新整張工作表所有單字之中文翻譯與四年級例句
  node enrich_gdrive_words.js --sheet 2026_spelling_bee --force

  # 若已在 Google 試算表手動修改單字，僅同步最新快照至專案（產生 gdrive_banks.json 與 gdrive_banks.js）
  node enrich_gdrive_words.js --sync-only
  ```

### 3. 雲端題庫 Skill (`generate-wordbank`)
* 位於 `.agents/skills/generate-wordbank/SKILL.md`，提供 AI 助手標準化的雲端題庫上傳、Gemini 補齊與同步工作流指引。

---

## 📂 專案檔案結構

```text
English_world_game/
├── index.html               # 遊戲主程式（GitHub Pages 入口頁面，支援 JSONP 即時動態連線）
├── Engligh_v3.html          # 開發主程式同步版本
├── gdrive_banks.js          # 本機免 CORS 限制之題庫快照腳本（供 file:/// 直接雙擊開啟）
├── gdrive_banks.json        # Google Drive 試算表題庫備援快照
├── enrich_gdrive_words.js   # 試算表同步與例句補齊輔助模組
├── generate_csv.js          # 題庫資料格式轉換模組
├── .gitignore               # Git 忽略設定（保護本機 photo_to_csv.js、暫存檔與照片）
├── AGENTS.md                # AI 協作與 README 強制更新準則
├── README.md                # 專案說明與更新規範文件
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions 自動部署腳本
└── .agents/
    └── skills/
        └── generate-wordbank/ # 專案專屬雲端題庫生成與同步技能 (Skill)
            ├── SKILL.md
            └── scripts/
                └── generate_bank_from_json.js
```

---

## 🚀 部署與上線 (GitHub Pages)

1. 當推送程式碼至 GitHub 遠端儲存庫 `bgbgterry/English_world_game` 的 `main` 分支時，`.github/workflows/deploy.yml` 會自動觸發建置與部署。
2. 試算表已設定為「**知道連結的任何人 → 檢視者**」，遊戲前端透過 JSONP / GViz 協定即時直連，因此**在 Google 試算表修改任何單字，網頁端點擊「🔄 立即從雲端重新同步」即可立刻生效**，無需重新 build 或部署！

---

## 📋 專案協作與更新規範

> [!IMPORTANT]
> **更新守則**：在這個專案中，**每次更新程式碼、新增功能或調整題庫時，均必須同步提供並更新此 `README.md` 說明文件**，確保專案說明與最新程式碼狀態保持 100% 同步！
