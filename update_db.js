/**
 * update_db.js
 * 快速將工作區內的 CSV 檔案轉換並同步寫入 index.html 與 Engligh_v3.html 的預設題庫 (presetBanks) 中。
 * 執行方式：node update_db.js
 */
const { syncHtmlDatabase } = require('./generate_csv.js');

console.log('🔄 正在掃描目錄下的 CSV 題庫並更新 HTML 預設資料庫...');
syncHtmlDatabase();
console.log('✅ 資料庫同步完成！');
