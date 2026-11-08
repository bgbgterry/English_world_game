---
name: generate-wordbank
description: >-
  Use this skill to upload recognized word lists (from photo_to_csv.js OCR) to the Google Drive
  spreadsheet (真真/英文/單字題庫/英文單字題庫), generate Chinese translations and example sentences
  using Gemini, and synchronize the cloud word banks with the English practice web game.
---

# 雲端題庫生成與同步 Skill (Generate & Sync Google Drive Wordbank)

本技能用於將 `photo_to_csv.js` 辨識產出的單字表依 Part 順序上傳至 Google Drive「`真真 -> 英文 -> 單字題庫 -> 英文單字題庫`」（Spreadsheet ID: `1bv_OzB2UutDUxc-M1tLFnVa6OVWGW2xRl0oWlAXxieE`），並透過 Gemini 自動生成「中文翻譯」、「英文例句」與「例句翻譯」，供網頁遊戲動態載入遊玩。

---

## 執行流程

### 步驟 1：照片辨識並上傳至 Google Drive 試算表
執行 `photo_to_csv.js` 辨識單字照片並自動依 Part 順序寫入 Google Drive 試算表的指定工作表（例如 `2026_spelling_bee`）：
```powershell
$env:GEMINI_API_KEY="你的Gemini金鑰"
node photo_to_csv.js .\2026_spelling_bee.jpg --prefix 2026_spelling_bee --sheet 2026_spelling_bee --upload
```

### 步驟 2：使用 Gemini 生成中文翻譯與例句並回寫雲端
執行 `enrich_gdrive_words.js` 讀取雲端試算表工作表，針對尚未填寫翻譯或例句的單字呼叫 Gemini 生成並寫回 Google Drive，同時更新前端雲端同步檔 `gdrive_banks.json`：
```powershell
node enrich_gdrive_words.js --sheet 2026_spelling_bee
```

### 步驟 3：僅同步雲端試算表最新內容至專案快照
若已在 Google Drive 試算表上手動修改單字或例句，可執行：
```powershell
node enrich_gdrive_words.js --sync-only
```
