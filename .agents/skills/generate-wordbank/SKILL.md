---
name: generate-wordbank
description: >-
  Use this skill to convert a recognized word list (JSON produced by photo_to_csv.js OCR)
  into game-ready English word bank CSV files with elementary-appropriate example sentences,
  Traditional Chinese translations, and meanings, and sync them into the English practice web game.
---

# 題庫生成 Skill (Generate Wordbank)

本技能用於將 `photo_to_csv.js` 辨識產出的單字表 JSON（例如 `wordbanks/<prefix>_recognized.json`）取用並製作成符合遊戲標準格式的週次題庫 CSV（欄位：`word,sentence,trans,meaning`），並自動同步至遊戲網頁（`index.html` 與 `Engligh_v3.html`）。

---

## 執行流程

### 步驟 1：確認辨識產出的單字表
`photo_to_csv.js` 完成影像辨識後，會產生包含週次分組的結構化 JSON：
```text
wordbanks/<prefix>_recognized.json
```
JSON 結構範例：
```json
{
  "prefix": "Grade2B",
  "sections": [
    { "week": 1, "category": "Reading", "words": ["separated", "signs", ...] },
    { "week": 1, "category": "Phonics", "words": ["cent", "pencil", ...] }
  ],
  "details": {
    "separated": {
      "sentence": "The two cats were separated by a low fence.",
      "trans": "這兩隻貓被一道低矮的柵欄分開了。",
      "meaning": "分開的；分離的"
    }
  }
}
```

---

### 步驟 2：單字例句與解釋原則（Grade 2B 適用）
若單字表中有新單字尚未填入 `details`，產生規則如下：
1. **`sentence`**：簡短、適合國小二年級學生的生活情境英文例句，且必須**原封不動包含該單字**。
2. **`trans`**：該例句的繁體中文（台灣用語習慣）翻譯。
3. **`meaning`**：最常用的繁體中文解釋，多個意思用全形分號「；」隔開。

---

### 步驟 3：產出週次 CSV 並同步至遊戲
執行本 Skill 隨附腳本：
```powershell
node .agents/skills/generate-wordbank/scripts/generate_bank_from_json.js wordbanks/Grade2B_recognized.json --prefix Grade2B
```

此腳本會自動完成：
1. **依週次輸出 CSV**：在專案根目錄產出 `<prefix>_Week01.csv`、`<prefix>_Week02.csv` ... 及 `<prefix>_All.csv`。
2. **自動去重**：確保同一週內各分類（Reading、Spelling、Phonics）出現相同單字時自動去重。
3. **寫入遊戲 HTML**：自動呼叫 `generate_csv.js` 中的 `syncHtmlDatabase()`，將題庫直接編譯進 `index.html` 與 `Engligh_v3.html` 的 `presetBanks` 中，使用者重新整理網頁即可在下拉選單中直接遊玩！
