#!/usr/bin/env node
/**
 * enrich_gdrive_words.js
 * 讀取 Google Drive「真真/英文/單字題庫/英文單字題庫」試算表中的單字，
 * 依據範例規範：
 *   1. 必填「單字中文翻譯」（meaning）
 *   2. Part 欄位統一對應為 Week（例如 Week 1, Week 2...）
 *   3. 例句（sentence）與例句翻譯（trans）採用「小學四年級（Grade 4）」單字與文法水準
 * 支援 Gemini API 自動生成與本地精選四年級題庫字典（含斷線/忙碌備援），並回寫雲端試算表與更新 gdrive_banks.json / gdrive_banks.js。
 *
 * 使用範例：
 *   node enrich_gdrive_words.js --sheet 2026_spelling_bee
 *   node enrich_gdrive_words.js --sheet 2026_spelling_bee --force
 *   node enrich_gdrive_words.js --sync-only
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGSheetsCmd() {
  const userProfile = process.env.USERPROFILE || '';
  const candidates = [
    path.join(userProfile, '.gemini', 'antigravity', 'bin', 'gsheets.cmd'),
    path.join(userProfile, '.gemini', 'config', 'plugins', 'gsheets', 'skills', 'gsheets', 'scripts', 'gsheets.cmd')
  ];
  const pluginBinDir = path.join(userProfile, '.gemini', 'antigravity', 'plugin_data', 'gsheets', 'bin');
  if (fs.existsSync(pluginBinDir)) {
    const exes = fs.readdirSync(pluginBinDir).filter(f => f.startsWith('gsheets') && f.endsWith('.exe'));
    if (exes.length > 0) candidates.push(path.join(pluginBinDir, exes[0]));
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return `"${c}"`;
  }
  return 'gsheets';
}

const DEFAULT_SPREADSHEET_ID = '1bv_OzB2UutDUxc-M1tLFnVa6OVWGW2xRl0oWlAXxieE';
const STANDARD_HEADERS = ['Part', '單字', '中文翻譯', '例句', '例句翻譯'];

/**
 * 將 Part 欄位統一標準化為 Week 格式（Part 就是 Week）
 * 例如: "Part 1" -> "Week 1", "1" -> "Week 1", "Week 2" -> "Week 2"
 */
function normalizePartToWeek(val) {
  const s = String(val || '').trim();
  if (!s) return 'Week 1';
  const m = s.match(/^(?:part|week|wk|p|w)?\s*0*(\d+)$/i);
  if (m) return `Week ${parseInt(m[1], 10)}`;
  return s.replace(/^part\s*/i, 'Week ');
}

function parseArgs(argv) {
  const opts = {
    spreadsheetId: process.env.GDRIVE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID,
    sheet: '2026_spelling_bee',
    batch: 5,
    forceAll: false,
    forceAi: false,
    syncOnly: false,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--spreadsheet-id') opts.spreadsheetId = argv[++i];
    else if (a === '--sheet') opts.sheet = argv[++i];
    else if (a === '--batch') opts.batch = Math.max(1, parseInt(argv[++i], 10) || 5);
    else if (a === '--force') opts.forceAll = true;
    else if (a === '--force-ai') {
      opts.forceAll = true;
      opts.forceAi = true;
    }
    else if (a === '--sync-only') opts.syncOnly = true;
    else if (a === '--model') opts.model = argv[++i];
    else if (a === '-h' || a === '--help') opts.help = true;
  }
  return opts;
}

const ENRICH_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      word: { type: 'STRING' },
      meaning: { type: 'STRING' },
      sentence: { type: 'STRING' },
      trans: { type: 'STRING' },
    },
    required: ['word', 'meaning', 'sentence', 'trans'],
  },
};

/**
 * 依據範例規範（小學四年級單字與文法水準）建構 Gemini 提示詞
 */
function enrichPrompt(words) {
  return `你是台灣專業的國小四年級（Grade 4）英文老師。請參考以下範例規範，為清單中的每個英文單字提供「單字中文翻譯」、「英文例句」與「例句翻譯」：

【撰寫規範】
1. meaning（單字中文翻譯）：
   - 必須提供該單字最常用、準確的台灣繁體中文翻譯（不可留空，也不可填入英文）。
   - 若有多個常見字義，請以全形分號「；」分隔（例如：「分開的；分離的」、「標誌；手勢」、「體育場；運動場」）。
   - 若為特定用法、單位或不規則變化，可加上括號補充（例如：「（棒球）局；回合」、「分（貨幣單位）」、「老鼠（mouse的複數）」、「教導（teach 的過去式）」）。
2. sentence（英文例句）：
   - 必須符合「小學四年級（Grade 4）」的單字量與文法水準（長度約 7～12 個英文單字）。
   - 句型自然生動、語境完整具體，可適度運用形容詞、副詞、介系詞片語、連接詞（如 before / because / when / while）、簡單被動語態或不定詞片語，讓學生能從語境理解單字用法。
   - 嚴禁使用 "This is the word..." 等無意義模板句，且例句中必須包含該單字。
3. trans（例句翻譯）：
   - 提供該英文例句對應之自然、道地的台灣繁體中文翻譯。

【標準參考範例（Grade 4 水準）】
- separated -> meaning: "分開的；分離的", sentence: "The two cats were separated by a low fence.", trans: "這兩隻貓被一道低矮的柵欄分開了。"
- signs -> meaning: "標誌；手勢", sentence: "Look at the road signs before crossing the street.", trans: "過馬路前請看路標。"
- stadium -> meaning: "體育場；運動場", sentence: "We watched an exciting baseball game in the stadium.", trans: "我們在體育場看了一場刺激的棒球賽。"
- excited -> meaning: "興奮的；激動的", sentence: "The children were excited to visit the zoo.", trans: "孩子們要去動物園玩感到很興奮。"
- settled -> meaning: "安頓；安居", sentence: "The bird settled comfortably on the branch.", trans: "小鳥舒服地停在樹枝上安頓下來。"
- innings -> meaning: "（棒球）局；回合", sentence: "The baseball game lasted for nine innings.", trans: "這場棒球賽進行了九局。"
- mind -> meaning: "頭腦；介意；心意", sentence: "Please keep the teacher's advice in mind.", trans: "請把老師的叮嚀記在心上。"
- smack -> meaning: "掌摑；拍擊；重擊", sentence: "He gave the ball a loud smack with his bat.", trans: "他用球棒重重地擊打了球一下。"
- fence -> meaning: "柵欄；圍欄", sentence: "The white fence surrounds the green garden.", trans: "白色的柵欄圍繞著綠色的花園。"
- calf -> meaning: "小牛；幼崽", sentence: "The baby calf stayed close to its mother cow.", trans: "小牛緊緊跟在母牛媽媽身邊。"
- cot -> meaning: "輕便小床；行軍床", sentence: "The toddler took a sweet nap on the folding cot.", trans: "幼兒在折疊小床上香甜地睡了午覺。"
- coat -> meaning: "外套；大衣", sentence: "Put on a warm coat because it is cold outside.", trans: "穿上一件暖和的外套，因為外面很冷。"

每個單字回傳一筆，word 欄位必須與輸入完全相同，並保持輸入順序。

單字清單：
${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;
}

/**
 * 載入專案內建的小學四年級水準精選字典（供快速補齊與 API 忙碌時的可靠備援）
 */
function loadCuratedGrade4Dict() {
  const dict = new Map();

  // 1. 從 generate_csv.js 載入精選題庫
  try {
    const genCsvPath = path.join(__dirname, 'generate_csv.js');
    if (fs.existsSync(genCsvPath)) {
      const { defaultData = [], allWords = [] } = require('./generate_csv.js');
      for (const item of [...defaultData, ...allWords]) {
        if (item && item.word && item.meaning && item.sentence && item.trans) {
          dict.set(item.word.trim().toLowerCase(), {
            meaning: item.meaning.trim(),
            sentence: item.sentence.trim(),
            trans: item.trans.trim(),
          });
        }
      }
    }
  } catch (e) {}

  // 2. 從 wordbanks/Grade2B_recognized.json 載入範例題庫
  try {
    const g2bPath = path.join(__dirname, 'wordbanks', 'Grade2B_recognized.json');
    if (fs.existsSync(g2bPath)) {
      const g2b = JSON.parse(fs.readFileSync(g2bPath, 'utf8'));
      if (g2b && g2b.details) {
        for (const [k, v] of Object.entries(g2b.details)) {
          if (v && v.meaning && v.sentence && v.trans) {
            dict.set(k.trim().toLowerCase(), {
              meaning: v.meaning.trim(),
              sentence: v.sentence.trim(),
              trans: v.trans.trim(),
            });
          }
        }
      }
    }
  } catch (e) {}

  return dict;
}

async function callGemini({ model, parts, schema, apiKey, timeoutMs = 120000, maxAttempts = 6 }) {
  const candidateModels = [
    model,
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro',
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let currentModelIdx = 0;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const curModel = candidateModels[currentModelIdx] || candidateModels[0];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${curModel}:generateContent?key=${apiKey}`;
    const generationConfig = {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: schema,
    };

    if (curModel.includes('3.8') || curModel.includes('3.')) {
      generationConfig.thinkingConfig = { thinkingLevel: 'LOW' };
    }

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig,
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (res.ok) {
        const json = await res.json();
        const text =
          json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
        if (!text) throw new Error('Gemini 沒有回傳內容');
        return JSON.parse(text);
      }

      const errText = await res.text();
      if (res.status === 400 && body.generationConfig?.thinkingConfig) {
        delete body.generationConfig.thinkingConfig;
        continue;
      }
      if (res.status === 404) {
        if (currentModelIdx + 1 < candidateModels.length) {
          currentModelIdx++;
          console.warn(
            `   ⚠️ 模型 [${curModel}] 回應 404（模型停用或不存在），自動切換至備援模型 [${candidateModels[currentModelIdx]}]...`
          );
          continue;
        }
      }
      if (res.status === 429 || res.status >= 500) {
        if (attempt >= 2 && currentModelIdx + 1 < candidateModels.length) {
          currentModelIdx++;
          console.warn(
            `   ⚠️ 模型 [${curModel}] 回應 ${res.status}（伺服器忙碌），自動切換至備援模型 [${candidateModels[currentModelIdx]}]...`
          );
        }
        const wait = Math.min(25000, 3000 * Math.pow(1.4, attempt - 1));
        console.warn(`   ⏳ 模型 [${curModel}] 伺服器忙碌 (${res.status})，等待 ${Math.round(wait / 1000)} 秒後自動重試（第 ${attempt}/${maxAttempts} 次）...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new Error(`Gemini API 錯誤 ${res.status}：${errText.slice(0, 400)}`);
    } catch (err) {
      lastError = err;
      const isNetworkOrTimeout =
        err.name === 'AbortError' ||
        /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|aborted|network/i.test(err.message);

      if (isNetworkOrTimeout && attempt < maxAttempts) {
        if (attempt >= 2 && currentModelIdx + 1 < candidateModels.length) {
          currentModelIdx++;
          console.warn(
            `   ⚠️ 模型 [${curModel}] 回應逾時或瞬斷 (${err.message})，自動切換至備援模型 [${candidateModels[currentModelIdx]}]...`
          );
        }
        const wait = Math.min(25000, 3000 * Math.pow(1.4, attempt - 1));
        console.warn(`   ⏳ 網路瞬斷或逾時 (${err.message})，等待 ${Math.round(wait / 1000)} 秒後自動重試...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (attempt >= maxAttempts) throw lastError;
      throw err;
    }
  }
  throw lastError;
}

function readSheetRows(spreadsheetId, sheetName) {
  const gsheetsCmd = getGSheetsCmd();
  const out = execSync(`${gsheetsCmd} readonly read ${spreadsheetId} "${sheetName}!A1:E1000" --json`, {
    encoding: 'utf8'
  });
  return JSON.parse(out) || [];
}

function listAllSheets(spreadsheetId) {
  const gsheetsCmd = getGSheetsCmd();
  const out = execSync(`${gsheetsCmd} readonly list-sheets ${spreadsheetId} --json`, {
    encoding: 'utf8'
  });
  return JSON.parse(out) || [];
}

function isValidMeaning(meaning, word) {
  const m = String(meaning || '').trim();
  if (!m) return false;
  if (m.toLowerCase() === String(word || '').trim().toLowerCase()) return false;
  if (m.toLowerCase() === 'part' || m.toLowerCase() === 'week') return false;
  return true;
}

function isValidSentence(sentence) {
  const s = String(sentence || '').trim();
  if (!s) return false;
  if (/^This is the word\b/i.test(s)) return false;
  return true;
}

function isValidTrans(trans, word) {
  const t = String(trans || '').trim();
  if (!t) return false;
  if (t.toLowerCase() === String(word || '').trim().toLowerCase()) return false;
  return true;
}

/** 匯出 Google Drive 試算表的所有分頁為前端雲端同步檔 gdrive_banks.json 與 gdrive_banks.js */
function syncGDriveSnapshot(spreadsheetId) {
  console.log(`\n🔄 正在從 Google Drive 試算表 (${spreadsheetId}) 同步題庫快照...`);
  const sheets = listAllSheets(spreadsheetId);
  const curatedDict = loadCuratedGrade4Dict();
  const banks = {};

  for (const s of sheets) {
    const sheetTitle = s.title;
    const rows = readSheetRows(spreadsheetId, sheetTitle);
    if (rows.length <= 1) continue;

    // 剖析欄位：Part (即 Week) | 單字 | 中文翻譯 | 例句 | 例句翻譯
    const partGroups = new Map();
    const allItems = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 2) continue;
      const partName = normalizePartToWeek(row[0] || 'Week 1');
      const word = String(row[1] || '').trim();
      if (!word) continue;

      const fallback = curatedDict.get(word.toLowerCase()) || {};
      const rawMeaning = String(row[2] || '').trim();
      const rawSentence = String(row[3] || '').trim();
      const rawTrans = String(row[4] || '').trim();

      const meaning = isValidMeaning(rawMeaning, word) ? rawMeaning : (fallback.meaning || word);
      const sentence = isValidSentence(rawSentence) ? rawSentence : (fallback.sentence || `This is the word ${word}.`);
      const trans = isValidTrans(rawTrans, word) ? rawTrans : (fallback.trans || meaning);

      const item = { word, meaning, sentence, trans, part: partName };
      allItems.push(item);

      if (!partGroups.has(partName)) partGroups.set(partName, []);
      partGroups.get(partName).push(item);
    }

    if (allItems.length === 0) continue;

    const icon = sheetTitle.toLowerCase().includes('spelling_bee') ? '🐝' : '📘';
    for (const [partName, items] of partGroups.entries()) {
      const bankKey = `${sheetTitle}__${partName.replace(/\s+/g, '_')}`;
      banks[bankKey] = {
        name: `${icon} ${sheetTitle} - ${partName} (${items.length}字)`,
        sheet: sheetTitle,
        part: partName,
        data: items,
      };
    }
  }

  const snapshot = {
    spreadsheetId,
    updatedAt: new Date().toISOString(),
    sheets: sheets.map((s) => s.title),
    banks,
  };

  const outPath = path.join(__dirname, 'gdrive_banks.json');
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');

  // 同時輸出 gdrive_banks.js（供本機 file:// 雙擊開啟時免受 CORS 限制直接載入）
  const jsOutPath = path.join(__dirname, 'gdrive_banks.js');
  const jsContent = `// Google Drive 雲端題庫本機快照（供本機直接開啟 HTML 時載入）\nwindow.GDRIVE_BANKS_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)};\n`;
  fs.writeFileSync(jsOutPath, jsContent, 'utf8');

  console.log(`✅ 已更新 gdrive_banks.json 與 gdrive_banks.js（共 ${Object.keys(banks).length} 個題庫分組）`);
  return snapshot;
}

function writeSheetRows(spreadsheetId, sheetName, rows, batchFile) {
  fs.writeFileSync(
    batchFile,
    JSON.stringify(
      [
        { op: 'clear', range: `${sheetName}!A1:E1000` },
        { op: 'write', range: `${sheetName}!A1`, data: rows },
      ],
      null,
      2
    ),
    'utf8'
  );
  const gsheetsCmd = getGSheetsCmd();
  execSync(`${gsheetsCmd} mutate batch ${spreadsheetId} -f "${batchFile}"`, {
    stdio: 'inherit',
  });

  // 自動套用範例表格樣式（藍底白字粗體表頭 #4FC3F7、凍結首列、自動欄寬）
  try {
    const sheets = listAllSheets(spreadsheetId);
    const targetSheet = sheets.find((s) => s.title === sheetName);
    if (targetSheet && typeof targetSheet.id === 'number') {
      execSync(
        `${gsheetsCmd} mutate format ${spreadsheetId} --sheet-id ${targetSheet.id} --start-row 0 --end-row 1 --start-col 0 --end-col 5 --bold --bg-color "#4FC3F7" --fg-color "#FFFFFF"`,
        { stdio: 'ignore' }
      );
      execSync(
        `${gsheetsCmd} mutate freeze ${spreadsheetId} --sheet-id ${targetSheet.id} --rows 1 --cols 0`,
        { stdio: 'ignore' }
      );
      execSync(
        `${gsheetsCmd} mutate autosize ${spreadsheetId} --sheet-id ${targetSheet.id} --start-col 0 --end-col 5`,
        { stdio: 'ignore' }
      );
    }
  } catch (e) {}
}

async function enrichGoogleSheet({
  spreadsheetId = DEFAULT_SPREADSHEET_ID,
  sheetName = '2026_spelling_bee',
  apiKey,
  model = 'gemini-3.8-flash',
  batchSize = 5,
  forceAll = false,
  forceAi = false,
}) {
  console.log(`\n📖 讀取 Google Drive 試算表 [${sheetName}]...`);
  const rows = readSheetRows(spreadsheetId, sheetName);
  if (rows.length <= 1) {
    console.log(`⚠️ 工作表 [${sheetName}] 尚無單字資料。`);
    return;
  }

  const outDir = path.join(__dirname, 'wordbanks');
  fs.mkdirSync(outDir, { recursive: true });
  const batchFile = path.join(outDir, `${sheetName}_enrich_batch.json`);
  const curatedDict = loadCuratedGrade4Dict();

  let hasStructuralOrDictUpdate = false;

  // 1. 確保表頭嚴格為：Part | 單字 | 中文翻譯 | 例句 | 例句翻譯
  const currentHeader = rows[0] || [];
  if (STANDARD_HEADERS.some((h, idx) => String(currentHeader[idx] || '').trim() !== h)) {
    rows[0] = [...STANDARD_HEADERS];
    hasStructuralOrDictUpdate = true;
  }

  // 2. 將 Part 欄位統一轉換為 Week 格式（Part 就是 Week），並檢查待補齊之單字
  const pendingAiIndices = [];
  let filledByCuratedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const word = String(r[1] || '').trim();
    if (!word) continue;

    // Part 就是 Week：將 "Part 1" 等統一轉為 "Week 1"
    const normalizedWeek = normalizePartToWeek(r[0]);
    if (String(r[0] || '').trim() !== normalizedWeek) {
      r[0] = normalizedWeek;
      hasStructuralOrDictUpdate = true;
    }

    const curMeaning = String(r[2] || '').trim();
    const curSentence = String(r[3] || '').trim();
    const curTrans = String(r[4] || '').trim();

    const needsEnrich =
      forceAll ||
      !isValidMeaning(curMeaning, word) ||
      !isValidSentence(curSentence) ||
      !isValidTrans(curTrans, word);

    if (!needsEnrich) continue;

    // 優先檢查本地小學四年級精選字典（若未指定 --force-ai）
    const curated = curatedDict.get(word.toLowerCase());
    if (!forceAi && curated) {
      r[2] = curated.meaning;
      r[3] = curated.sentence;
      r[4] = curated.trans;
      rows[i] = r;
      filledByCuratedCount++;
      hasStructuralOrDictUpdate = true;
    } else {
      pendingAiIndices.push(i);
    }
  }

  if (filledByCuratedCount > 0) {
    console.log(`✨ 已套用小學四年級（Grade 4）標準題庫完成 ${filledByCuratedCount} 個單字的中文翻譯與例句！`);
  }

  // 若無需呼叫 AI，但表頭、Week 欄位或本地字典已有更新，立即寫回 Google Sheets
  if (pendingAiIndices.length === 0) {
    if (hasStructuralOrDictUpdate) {
      console.log(`☁️ 正在將更新後的完整資料寫回 Google Drive 工作表 [${sheetName}]...`);
      writeSheetRows(spreadsheetId, sheetName, rows, batchFile);
      console.log(`🎉 工作表 [${sheetName}] 已全數更新完成！`);
    } else {
      console.log(`✅ 工作表 [${sheetName}] 的所有單字 (${rows.length - 1} 字) 皆已包含完整中文翻譯與四年級例句！`);
    }
    syncGDriveSnapshot(spreadsheetId);
    return;
  }

  // 3. 針對尚待生成的單字呼叫 Gemini API（若 API 未設定或失敗，以精選字典兜底）
  if (!apiKey) {
    // 檢查是否所有 pendingAiIndices 都能由 curatedDict 兜底
    let unresolved = 0;
    for (const idx of pendingAiIndices) {
      const w = String(rows[idx][1] || '').trim();
      const curated = curatedDict.get(w.toLowerCase());
      if (curated) {
        rows[idx][2] = curated.meaning;
        rows[idx][3] = curated.sentence;
        rows[idx][4] = curated.trans;
        hasStructuralOrDictUpdate = true;
      } else {
        unresolved++;
      }
    }
    if (hasStructuralOrDictUpdate) {
      writeSheetRows(spreadsheetId, sheetName, rows, batchFile);
      syncGDriveSnapshot(spreadsheetId);
    }
    if (unresolved > 0) {
      throw new Error(`尚有 ${unresolved} 個新單字需要生成，但找不到 GEMINI_API_KEY。請先設定 $env:GEMINI_API_KEY。`);
    }
    return;
  }

  console.log(`✍️  發現 ${pendingAiIndices.length} 個單字待透過 Gemini 生成小學四年級水準之中文翻譯與例句...`);

  for (let p = 0; p < pendingAiIndices.length; p += batchSize) {
    const slice = pendingAiIndices.slice(p, p + batchSize);
    const words = slice.map((idx) => String(rows[idx][1]).trim());
    console.log(`   🤖 Gemini 生成中：${p + 1}–${p + slice.length} / ${pendingAiIndices.length} (${words.join(', ')})`);

    let enriched = null;
    try {
      enriched = await callGemini({
        model,
        apiKey,
        schema: ENRICH_SCHEMA,
        parts: [{ text: enrichPrompt(words) }],
      });
    } catch (err) {
      console.warn(`   ⚠️ Gemini 批次生成失敗 (${err.message})，嘗試使用內建四年級字典備援...`);
    }

    const map = new Map();
    for (const item of enriched || []) {
      if (item && item.word) {
        map.set(item.word.trim().toLowerCase(), item);
      }
    }

    for (const rowIdx of slice) {
      const w = String(rows[rowIdx][1]).trim();
      const info = map.get(w.toLowerCase()) || curatedDict.get(w.toLowerCase());
      if (info) {
        rows[rowIdx][2] = info.meaning || rows[rowIdx][2] || '';
        rows[rowIdx][3] = info.sentence || rows[rowIdx][3] || '';
        rows[rowIdx][4] = info.trans || rows[rowIdx][4] || '';
      }
    }

    // 每一批完成後立即回寫至 Google Sheets（斷點保存）
    writeSheetRows(spreadsheetId, sheetName, rows, batchFile);

    if (p + batchSize < pendingAiIndices.length) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  console.log(`🎉 工作表 [${sheetName}] 的中文翻譯與例句已全數回寫至 Google Drive！`);
  syncGDriveSnapshot(spreadsheetId);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(`
✨ enrich_gdrive_words.js - 為 Google Drive 題庫補齊單字中文翻譯、Week 分組與小學四年級例句

使用方式：
  node enrich_gdrive_words.js [選項]

選項：
  --sheet <工作表名稱>     目標工作表（預設: 2026_spelling_bee）
  --spreadsheet-id <ID>    Google 試算表 ID
  --batch <數量>           每批次處理單字數（預設: 5）
  --force                  強制重新檢視並更新所有單字的中文翻譯與四年級例句
  --force-ai               強制全部重新呼叫 Gemini API 生成
  --sync-only              僅從 Google Drive 同步更新 gdrive_banks.json 與 gdrive_banks.js 快照
`);
    return;
  }

  if (opts.syncOnly) {
    syncGDriveSnapshot(opts.spreadsheetId);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  await enrichGoogleSheet({
    spreadsheetId: opts.spreadsheetId,
    sheetName: opts.sheet,
    apiKey,
    model: opts.model,
    batchSize: opts.batch,
    forceAll: opts.forceAll,
    forceAi: opts.forceAi,
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ ' + err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  enrichGoogleSheet,
  syncGDriveSnapshot,
  normalizePartToWeek,
  enrichPrompt,
  loadCuratedGrade4Dict,
};
