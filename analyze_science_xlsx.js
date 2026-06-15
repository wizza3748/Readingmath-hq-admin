const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const srcDir = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task';
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.xlsx'));

// 중1-1 파일 2단원 시트만 상세 분석 (모든 행 포함)
const targetFile = files.find(f => f.includes('중1-1'));
const filePath = path.join(srcDir, targetFile);
const workbook = XLSX.readFile(filePath);

const sheetName = '1-1-2단원';
const ws = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log(`=== 시트: ${sheetName} (총 ${data.length}행) ===`);
data.forEach((row, i) => {
  console.log(`Row ${i + 1}:`, JSON.stringify(row));
});
