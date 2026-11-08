# 🐝 真真英文練習遊戲 (English Word Game)

專為國小學童設計的現代化互動式英文單字練習遊戲。採用純前端架構（HTML5 / CSS3 / Vanilla JavaScript），結合 **Google Drive 雲端試算表動態題庫系統**，支援 GitHub Pages 線上免安裝遊玩！

---

## 🎮 核心功能與特色

### 1. ☁️ Google Drive 雲端動態題庫架構
* **全面移除靜態內建題庫與次級 Level 選單**：遊戲主程式（`index.html` 與 `Engligh_v3.html`）不再寫死單字資料，全面改由 Google Drive 中的「**`真真 -> 英文 -> 單字題庫 -> 英文單字題庫`**」雲端試算表動態取得題庫，並直接依試算表內的 `Part` / `Week` 分組載入單字（移除多餘的「全部單字」與「Level」次級選單）。
* **三層智慧載入與離線快取 (`CloudBankLoader`)**：
  1. **Google Sheets 即時直連**：當試算表開啟「知道連結的任何人可檢視」或「發布到網路」時，網頁開啟或點擊「🔄 立即從雲端重新同步」即可直接從 Google Drive 拉取最新單字。
  2. **雲端同步快照 (`gdrive_banks.json`)**：自動從 Google Drive 試算表同步產出雲端快照，確保未登入狀態下依然 100% 順暢載入所有雲端題庫。
  3. **瀏覽器離線快取 (`localStorage`)**：自動快取最近一次載入的雲端題庫，無網路環境也能隨時練習。

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

| 雲端工作表 (Tab) | Part / 週次分組 | 單字量 | 說明 |
| :--- | :--- | :---: | :--- |
| **`2026_spelling_bee`** | `Part 1` ~ `Part 4` | 各 25 字（共 100 字） | 2026 Spelling Bee 單字表，依 Part 順序排列並由 Gemini 生成中文翻譯與例句 |
| **`Grade_2B`** | `Week 1` ~ `Week 8` | 每週 20~30 字（共 187 字） | 國小二年級每週進度單字題庫 |
| **`Grade_1C`** | `Part 1` | 25 字 | 國小一年級基礎複習題庫 |

### 試算表標準欄位格式
| A 欄 (`Part`) | B 欄 (`單字`) | C 欄 (`中文翻譯`) | D 欄 (`例句`) | E 欄 (`例句翻譯`) |
| :---: | :---: | :--- | :--- | :--- |
| `Part 1` | `aboard` | 在船（飛機、車）上 | All passengers are now aboard the plane. | 所有乘客現在都登機了。 |

---

## 🛠️ 開發工具鏈與自動化擴充

本專案提供從「單字照片辨識」→「上傳 Google Drive」→「Gemini 生成翻譯與例句」→「網頁遊戲動態讀取」的完整自動化工具鏈：

```
[單字表照片 (.jpg/.png)]
       │
       ▼  1. node photo_to_csv.js (Gemini Vision OCR + 依 Part 排序上傳)
[Google Drive：真真/英文/單字題庫/英文單字題庫 (2026_spelling_bee)]
       │
       ▼  2. node enrich_gdrive_words.js (Gemini 自動生成中文翻譯與例句並回寫雲端)
[完整雲端題庫 + gdrive_banks.json 同步快照]
       │
       ▼  3. CloudBankLoader 動態載入
[遊戲主程式 (index.html / Engligh_v3.html)]
```

### 1. 照片文字辨識並上傳 Google Drive (`photo_to_csv.js`)
* 透過 Google Gemini Vision API（預設 `gemini-3.8-flash`）辨識照片上的單字，自動依 Part 順序排列並寫入 Google Drive 的 `英文單字題庫` 試算表。
* 執行指令：
  ```powershell
  $env:GEMINI_API_KEY="你的Gemini金鑰"
  node photo_to_csv.js .\2026_spelling_bee.jpg --prefix 2026_spelling_bee --sheet 2026_spelling_bee --upload
  ```

### 2. Gemini 自動生成雲端題庫中文翻譯與例句 (`enrich_gdrive_words.js`)
* 讀取 Google Drive 試算表中尚未填寫中文翻譯或例句的單字，批次呼叫 Gemini API 生成國小學童適用的解釋與例句，直接寫回 Google 試算表並更新 `gdrive_banks.json`。
* 執行指令：
  ```powershell
  # 為指定工作表生成缺漏的中文翻譯與例句並回寫雲端
  node enrich_gdrive_words.js --sheet 2026_spelling_bee

  # 若已在 Google 試算表手動編輯單字，僅同步最新快照至專案
  node enrich_gdrive_words.js --sync-only
  ```

### 3. 雲端題庫 Skill (`generate-wordbank`)
* 位於 `.agents/skills/generate-wordbank/SKILL.md`，提供 AI 助手標準化的雲端題庫上傳、Gemini 補齊與同步工作流指引。

---

## 📂 專案檔案結構

```text
English_world_game/
├── index.html               # 遊戲主程式（GitHub Pages 入口頁面，動態載入 Google Drive 題庫）
├── Engligh_v3.html          # 開發主程式同步版本
├── gdrive_banks.json        # 從 Google Drive 試算表同步之雲端題庫快照
├── enrich_gdrive_words.js   # Gemini 雲端試算表翻譯/例句生成與同步腳本
├── generate_csv.js          # 題庫轉換與雲端快照同步輔助模組
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
2. 若希望在 Google 試算表直接修改文字後，網頁連重新部署都不需要就能即時生效，只需在 Google Drive 將「`英文單字題庫`」共用設定改為「**知道連結的任何人 → 檢視者**」，遊戲前端即會進入 `🟢 Google Drive 即時連線` 模式！

---

## 📋 專案協作與更新規範

> [!IMPORTANT]
> **更新守則**：在這個專案中，**每次更新程式碼、新增功能或調整題庫時，均必須同步提供並更新此 `README.md` 說明文件**，確保專案說明與最新程式碼狀態保持 100% 同步！
