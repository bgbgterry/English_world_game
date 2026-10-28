const fs = require('fs');
const path = require('path');

/**
 * generate_bank_from_json.js
 * 取用 photo_to_csv.js 產出的單字表 JSON，產出週次題庫 CSV 並同步寫入遊戲 HTML
 *
 * 使用方式：
 *   node .agents/skills/generate-wordbank/scripts/generate_bank_from_json.js [json路徑] [選項]
 *   node .agents/skills/generate-wordbank/scripts/generate_bank_from_json.js wordbanks/Grade2B_recognized.json --prefix Grade2B
 */

function parseArgs(argv) {
  const opts = {
    input: null,
    prefix: null,
    outDir: process.cwd(), // 預設專案根目錄
    sync: true
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prefix') opts.prefix = argv[++i];
    else if (a === '--out') opts.outDir = path.resolve(argv[++i]);
    else if (a === '--no-sync') opts.sync = false;
    else if (!opts.input && !a.startsWith('-')) opts.input = path.resolve(a);
  }
  return opts;
}

function csvCell(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function toCSV(items) {
  const header = 'word,sentence,trans,meaning';
  const rows = items.map((it) =>
    [it.word, it.sentence, it.trans, it.meaning].map(csvCell).join(',')
  );
  return '\ufeff' + [header, ...rows].join('\r\n');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.input) {
    // 預設尋找 wordbanks 目錄下的 JSON
    const wbDir = path.join(opts.outDir, 'wordbanks');
    if (fs.existsSync(wbDir)) {
      const candidates = fs.readdirSync(wbDir).filter(f => f.endsWith('_recognized.json'));
      if (candidates.length > 0) {
        opts.input = path.join(wbDir, candidates[0]);
      }
    }
  }

  if (!opts.input || !fs.existsSync(opts.input)) {
    console.error(`❌ 找不到單字表 JSON 檔案：${opts.input || '(未指定)'}`);
    console.log('請指定 JSON 路徑，例如：node generate_bank_from_json.js wordbanks/Grade2B_recognized.json');
    process.exitCode = 1;
    return;
  }

  console.log(`📖 讀取單字表：${path.basename(opts.input)}`);
  const data = JSON.parse(fs.readFileSync(opts.input, 'utf8'));
  const sections = data.sections || [];
  const details = data.details || {};
  const prefix = opts.prefix || data.prefix || path.basename(opts.input).replace(/_recognized\.json$/i, '');

  if (sections.length === 0) {
    console.error('❌ JSON 內沒有任何 sections 區塊！');
    process.exitCode = 1;
    return;
  }

  // 整理週次與單字
  const weekBuckets = {};
  const allWordsMap = new Map();

  for (const sec of sections) {
    const w = sec.week || 0;
    if (!weekBuckets[w]) weekBuckets[w] = [];
    for (const rawWord of sec.words || []) {
      const word = String(rawWord).trim();
      const k = word.toLowerCase();
      const d = details[k] || {};

      const item = {
        word,
        sentence: d.sentence || `This is the word ${word}.`,
        trans: d.trans || `這是單字 ${word}。`,
        meaning: d.meaning || word
      };

      if (!weekBuckets[w].some(it => it.word.toLowerCase() === k)) {
        weekBuckets[w].push(item);
      }
      if (!allWordsMap.has(k)) {
        allWordsMap.set(k, item);
      }
    }
  }

  fs.mkdirSync(opts.outDir, { recursive: true });
  const written = [];

  // 產出各週 CSV
  const weekNumbers = Object.keys(weekBuckets).map(Number).sort((a, b) => a - b);
  for (const w of weekNumbers) {
    const list = weekBuckets[w];
    if (list.length === 0) continue;
    const weekStr = w > 0 ? `Week${String(w).padStart(2, '0')}` : 'Other';
    const fileName = `${prefix}_${weekStr}.csv`;
    const filePath = path.join(opts.outDir, fileName);
    fs.writeFileSync(filePath, toCSV(list), 'utf8');
    written.push({ file: fileName, count: list.length });
  }

  // 產出全部單字合集 CSV
  const allList = Array.from(allWordsMap.values());
  const allFileName = `${prefix}_All.csv`;
  const allFilePath = path.join(opts.outDir, allFileName);
  fs.writeFileSync(allFilePath, toCSV(allList), 'utf8');
  written.push({ file: allFileName, count: allList.length });

  console.log(`\n✅ 已產出題庫 CSV：`);
  written.forEach(w => console.log(`   • ${w.file}（${w.count} 字）`));

  // 自動同步至遊戲 HTML
  if (opts.sync) {
    const genCsvPath = path.join(opts.outDir, 'generate_csv.js');
    if (fs.existsSync(genCsvPath)) {
      const { syncHtmlDatabase } = require(genCsvPath);
      syncHtmlDatabase();
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { toCSV, csvCell };
