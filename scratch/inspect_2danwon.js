const XLSX = require('xlsx');
const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 중등 1-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['2단원 정수와 유리수'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- Printing Rows 1 to 35 for 2단원 정수와 유리수 ---');
for (let r = 0; r < 35; r++) {
  const row = data[r];
  console.log(`Row ${r + 1}:`, row ? row.map(v => v !== undefined && v !== null && v !== '' ? String(v).trim() : '-') : 'empty');
}
