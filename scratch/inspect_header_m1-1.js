const XLSX = require('xlsx');
const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 중등 1-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const targetSheet = workbook.SheetNames.find(name => name.includes('단원'));
const sheet = workbook.Sheets[targetSheet];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- Printing Rows 1 to 25 for 중등 1-1 ---');
for (let r = 0; r < 25; r++) {
  const row = data[r];
  console.log(`Row ${r + 1}:`, row ? row.map(v => v !== undefined && v !== null && v !== '' ? String(v).trim() : '-') : 'empty');
}
