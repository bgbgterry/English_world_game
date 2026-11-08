#!/usr/bin/env node
/**
 * enrich_gdrive_words.js
 * 讀取 Google Drive「真真/英文/單字題庫/英文單字題庫」試算表中的單字，
 * 使用 Gemini API 自動生成「中文翻譯」、「英文例句」與「例句翻譯」並回寫至雲端試算表，
 * 同時同步產生前端雲端備援快取檔 gdrive_banks.json。
 *
 * 使用範例：
 *   node enrich_gdrive_words.js --sheet 2026_spelling_bee
 *   node enrich_gdrive_words.js --sync-only
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_SPREADSHEET_ID = '1bv_OzB2UutDUxc-M1tLFnVa6OVWGW2xRl0oWlAXxieE';

function parseArgs(argv) {
  const opts = {
    spreadsheetId: process.env.GDRIVE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID,
    sheet: '2026_spelling_bee',
    batch: 10,
    forceAll: false,
    syncOnly: false,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--spreadsheet-id') opts.spreadsheetId = argv[++i];
    else if (a === '--sheet') opts.sheet = argv[++i];
    else if (a === '--batch') opts.batch = Math.max(1, parseInt(argv[++i], 10) || 10);
    else if (a === '--force') opts.forceAll = true;
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

function enrichPrompt(words) {
  return `你是台灣國小英文老師。請為下列每個英文單字提供：
- meaning：該單字最常用的繁體中文解釋，多個意思用全形分號「；」分隔。
- sentence：一句簡短、自然且適合國小學童的英文例句，例句中必須包含該單字。
- trans：該英文例句的台灣繁體中文翻譯。
每個單字回傳一筆，word 欄位必須與輸入完全相同，並保持輸入順序。

單字清單：
${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;
}

async function callGemini({ model, parts, schema, apiKey, timeoutMs = 90000, maxAttempts = 6 }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const generationConfig = {
    temperature: 0,
    responseMimeType: 'application/json',
    responseSchema: schema,
  };
  if (model.includes('3.8')) {
    generationConfig.thinkingConfig = { thinkingLevel: 'low' };
  }
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig,
  };

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
      if (res.status === 429 || res.status >= 500) {
        const wait = Math.min(45000, 6000 * Math.pow(1.8, attempt - 1));
        console.warn(`   ⏳ API 回應 ${res.status}，等待 ${Math.round(wait / 1000)} 秒後重試...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new Error(`Gemini API 錯誤 ${res.status}：${errText.slice(0, 400)}`);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const wait = Math.min(45000, 7000 * Math.pow(1.8, attempt - 1));
        console.warn(`   ⏳ 網路重試 (${err.message})，等待 ${Math.round(wait / 1000)} 秒...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

function readSheetRows(spreadsheetId, sheetName) {
  const out = execFileSync(
    'gsheets',
    ['readonly', 'read', spreadsheetId, `${sheetName}!A1:E1000`, '--json'],
    { encoding: 'utf8', shell: true }
  );
  return JSON.parse(out) || [];
}

function listAllSheets(spreadsheetId) {
  const out = execFileSync('gsheets', ['readonly', 'list-sheets', spreadsheetId, '--json'], {
    encoding: 'utf8',
    shell: true,
  });
  return JSON.parse(out) || [];
}

/** 匯出 Google Drive 試算表的所有分頁為前端雲端同步檔 gdrive_banks.json */
function syncGDriveSnapshot(spreadsheetId) {
  console.log(`\n🔄 正在從 Google Drive 試算表 (${spreadsheetId}) 同步題庫快照...`);
  const sheets = listAllSheets(spreadsheetId);
  const banks = {};

  for (const s of sheets) {
    const sheetTitle = s.title;
    const rows = readSheetRows(spreadsheetId, sheetTitle);
    if (rows.length <= 1) continue;

    // 剖析欄位：Part | 單字 | 中文翻譯 | 例句 | 例句翻譯
    const partGroups = new Map();
    const allItems = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 2) continue;
      const partName = String(row[0] || 'Part 1').trim();
      const word = String(row[1] || '').trim();
      if (!word) continue;
      const meaning = String(row[2] || '').trim() || word;
      const sentence = String(row[3] || '').trim() || `This is the word ${word}.`;
      const trans = String(row[4] || '').trim() || meaning;

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
  console.log(`✅ 已更新 gdrive_banks.json（共 ${Object.keys(banks).length} 個題庫分組）`);
  return snapshot;
}

async function enrichGoogleSheet({
  spreadsheetId = DEFAULT_SPREADSHEET_ID,
  sheetName = '2026_spelling_bee',
  apiKey,
  model = 'gemini-3.8-flash',
  batchSize = 10,
  forceAll = false,
}) {
  console.log(`\n📖 讀取 Google Drive 試算表 [${sheetName}]...`);
  const rows = readSheetRows(spreadsheetId, sheetName);
  if (rows.length <= 1) {
    console.log(`⚠️ 工作表 [${sheetName}] 尚無單字資料。`);
    return;
  }

  // 確保表頭包含 5 欄
  rows[0] = ['Part', '單字', '中文翻譯', '例句', '例句翻譯'];

  // 找出尚未填入中文翻譯或例句的列
  const pendingIndices = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const word = String(r?.[1] || '').trim();
    if (!word) continue;
    const hasMeaning = String(r?.[2] || '').trim().length > 0;
    const hasSentence = String(r?.[3] || '').trim().length > 0;
    if (forceAll || !hasMeaning || !hasSentence) {
      pendingIndices.push(i);
    }
  }

  if (pendingIndices.length === 0) {
    console.log(`✅ 工作表 [${sheetName}] 的所有單字 (${rows.length - 1} 字) 皆已包含中文翻譯與例句！`);
    syncGDriveSnapshot(spreadsheetId);
    return;
  }

  if (!apiKey) {
    throw new Error('找不到 GEMINI_API_KEY，無法呼叫 Gemini 產生中文翻譯與例句。');
  }

  console.log(`✍️  發現 ${pendingIndices.length} 個單字待生成中文翻譯與例句...`);
  const outDir = path.join(__dirname, 'wordbanks');
  fs.mkdirSync(outDir, { recursive: true });
  const batchFile = path.join(outDir, `${sheetName}_enrich_batch.json`);

  for (let p = 0; p < pendingIndices.length; p += batchSize) {
    const slice = pendingIndices.slice(p, p + batchSize);
    const words = slice.map((idx) => String(rows[idx][1]).trim());
    console.log(`   🤖 Gemini 生成中：${p + 1}–${p + slice.length} / ${pendingIndices.length} (${words.join(', ')})`);

    const enriched = await callGemini({
      model,
      apiKey,
      schema: ENRICH_SCHEMA,
      parts: [{ text: enrichPrompt(words) }],
    });

    const map = new Map();
    for (const item of enriched || []) {
      if (item && item.word) {
        map.set(item.word.trim().toLowerCase(), item);
      }
    }

    for (const rowIdx of slice) {
      const w = String(rows[rowIdx][1]).trim();
      const info = map.get(w.toLowerCase());
      if (info) {
        rows[rowIdx][2] = info.meaning || rows[rowIdx][2] || '';
        rows[rowIdx][3] = info.sentence || rows[rowIdx][3] || '';
        rows[rowIdx][4] = info.trans || rows[rowIdx][4] || '';
      }
    }

    // 每一批完成後立即回寫至 Google Sheets（斷點保存）
    fs.writeFileSync(
      batchFile,
      JSON.stringify([{ op: 'write', range: `${sheetName}!A1`, data: rows }], null, 2),
      'utf8'
    );
    execFileSync('gsheets', ['mutate', 'batch', spreadsheetId, '-f', batchFile], {
      stdio: 'inherit',
      shell: true,
    });

    if (p + batchSize < pendingIndices.length) {
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
✨ enrich_gdrive_words.js - 使用 Gemini 為 Google Drive 題庫生成中文翻譯與例句

使用方式：
  node enrich_gdrive_words.js [選項]

選項：
  --sheet <工作表名稱>     目標工作表（預設: 2026_spelling_bee）
  --spreadsheet-id <ID>    Google 試算表 ID
  --batch <數量>           每批次處理單字數（預設: 10）
  --force                  強制重新生成所有單字的翻譯與例句
  --sync-only              僅從 Google Drive 同步更新 gdrive_banks.json 快照
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
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ ' + err.message);
    process.exitCode = 1;
  });
}

module.exports = { enrichGoogleSheet, syncGDriveSnapshot };
