# 🐝 真真英文練習遊戲 (English Word Game)

專為國小學童設計的現代化互動式英文單字練習遊戲。採用純前端架構（HTML5 / CSS3 / Vanilla JavaScript），開箱即用，支援 GitHub Pages 線上免安裝遊玩！

---

## 🎮 核心功能與特色

### 1. 三大核心練習模式
* **📖 學習模式**：
  * 母音以紅色（`#E53935`）、子音以藍色（`#1E88E5`）清晰標色，幫助自然發音與音節記憶。
  * 支援音節拆解間距切換、例句朗讀、例句中文翻譯與單字釋義。
* **🧩 積木模式**：
  * 字母方塊隨機重組打散，學童可點擊拼出正確單字。
  * 支援鍵盤快速操作與即時提示。
* **✍️ 聽寫模式**：
  * 隱藏單字與提示，播放標準語音，讓學童打字拼寫。
  * 自動比對答案，答錯立即標記並記錄於錯題筆記本。

### 2. 📓 錯題筆記系統 (Wrong Question Notebook)
* **永久跨題庫保存**：切換題庫或關卡時，挑戰者的錯題記錄絕不丟失。
* **錯誤軌跡追蹤**：記錄每個單字的累計錯誤次數、最後一次誤拼字串。
* **✏️ 個人記憶口訣**：挑戰者可為易錯單字填寫專屬的記憶口訣或聯想法。
* **📕 錯題特訓模式**：一鍵載入所有待複習錯題進行加強練習，答對立即移出待複習清單並獲得額外星星獎勵。

### 3. 👤 多挑戰者系統 (Challenger Profiles)
* **多學童切換**：頂部 Header 支援即時切換不同挑戰者（如「真真」、「Guest」等）。
* **Cookie 與 LocalStorage 雙重同步**：
  * 基本狀態與進度寫入 `document.cookie`（維持 365 天有效期）。
  * 完整錯題本與詳細筆記寫入 `localStorage`，兼顧規範相容性與無容量上限限制。

### 4. 📁 題庫管理與自訂匯入 (Modal)
* **多種匯入方式**：支援 CSV / JSON 檔案拖曳上傳、從 Excel 直接貼上文字表格、單筆手動新增。
* **資料庫合併 (Upsert)**：可建立為獨立自訂題庫，或直接合併覆蓋至現有題庫。
* **自訂題庫匯出與管理**：支援將自訂題庫匯出為 `.csv` 保存或隨時刪除。

---

## 📚 內建題庫一覽

| 題庫名稱 | 標題顯示 | 單字量 | 說明 |
| :--- | :--- | :---: | :--- |
| **Grade 2B (Week 1~8)** | `📘 Grade 2B - Week 1 ~ Week 8` | 每週 20~30 字 | 依週次進度規劃之國小二年級單字練習庫 |
| **Grade 2B (全部)** | `🌟 Grade 2B 全部單字` | 187 字 | Grade 2B 全 8 週獨立單字大題庫 |
| **2026 Spelling Bee** | `🐝 2026 Part 1 ~ Part 4` | 各 25 字 | 2026 年度 Spelling Bee 比賽單字分組 |
| **2026 Spelling Bee (全部)** | `🌟 2026 全部單字` | 100 字 | 2026 Spelling Bee 完整題庫 |
| **Grade 1C (原題庫)** | `📚 Grade 1C 原題庫` | 25 字 | 基礎國小一年級複習單字 |

---

## 🛠️ 開發工具鏈與自動化擴充

本專案提供完整的影像辨識與題庫自動編譯流程：

```
[單字表照片 (.jpg/.png)]
       │
       ▼  node photo_to_csv.js
[結構化單字表 (Grade2B_recognized.json)]
       │
       ▼  .agents/skills/generate-wordbank/
[週次題庫 CSV (Grade2B_Week01.csv ...)]
       │
       ▼  node generate_csv.js
[遊戲主程式 (index.html / Engligh_v3.html)]
```

### 1. 照片文字辨識工具 (`photo_to_csv.js`)
* 專注透過 Google Gemini Vision API（預設 `gemini-3.8-flash`）辨識照片上的單字表。
* 輸出格式：`wordbanks/<prefix>_recognized.json` 與易讀純文字清單 `wordbanks/<prefix>_wordlist.txt`。
* 執行指令：
  ```powershell
  $env:GEMINI_API_KEY="你的Gemini金鑰"
  node photo_to_csv.js .\2B_word_list --prefix Grade2B
  ```

### 2. 題庫生成 Skill (`generate-wordbank`)
* 位於 `.agents/skills/generate-wordbank/`。
* 取用辨識產出的單字表 JSON，自動配對國小二年級程度的例句、中文翻譯與單字解釋。
* 執行隨附腳本一鍵產出週次 CSV 並同步至遊戲：
  ```powershell
  node .agents/skills/generate-wordbank/scripts/generate_bank_from_json.js wordbanks/Grade2B_recognized.json --prefix Grade2B
  ```

### 3. 題庫編譯與同步工具 (`generate_csv.js`)
* 自動掃描專案目錄下的所有 `.csv` 檔案，自動轉譯為 JavaScript 物件並同步注入 `index.html` 與 `Engligh_v3.html` 中的 `presetBanks`。
* 執行指令：
  ```powershell
  node generate_csv.js
  ```

---

## 📂 專案檔案結構

```text
English_world_game/
├── index.html               # 遊戲主程式（GitHub Pages 入口頁面）
├── Engligh_v3.html          # 開發主程式備份
├── generate_csv.js          # CSV 題庫掃描與 HTML 內嵌編譯腳本
├── Grade2B_Week01~08.csv    # Grade 2B 各週題庫 CSV
├── Grade2B_All.csv          # Grade 2B 全題庫 CSV
├── 2026_Spelling_Bee_*.csv  # 2026 Spelling Bee 比賽題庫 CSV
├── .gitignore               # Git 忽略設定（排除本機工具、暫存檔與照片）
├── README.md                # 專案說明與更新規範文件
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions 自動部署腳本
└── .agents/
    └── skills/
        └── generate-wordbank/ # 專案專屬題庫轉換技能 (Skill)
            ├── SKILL.md
            └── scripts/
                └── generate_bank_from_json.js
```

---

## 🚀 部署與上線 (GitHub Pages)

本專案已設定 GitHub Actions 自動化部署：
1. 當推送程式碼至 GitHub 遠端儲存庫 `bgbgterry/English_world_game` 的 `main` 分支時，`.github/workflows/deploy.yml` 會自動觸發建置與部署。
2. 靜態網頁可透過 GitHub Pages 提供的網址直接在平板、電腦或手機上開啟遊玩。

---

## 📋 專案協作與更新規範

> [!IMPORTANT]
> **更新守則**：在這個專案中，**每次更新程式碼、新增功能或調整題庫時，均必須同步提供並更新此 `README.md` 說明文件**，確保專案說明與最新程式碼狀態保持一致！
