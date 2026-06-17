const XLSX = require('xlsx');
const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 중등 1-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const targetSheet = workbook.SheetNames.find(name => name.includes('단원'));
const sheet = workbook.Sheets[targetSheet];

const merges = sheet['!merges'] || [];
console.log('--- Merges in sheet ---');
merges.forEach(m => {
  // m.s: start (r: row, c: col), m.e: end (r: row, c: col)
  // 0-indexed
  // E열은 c = 4 (E열 인덱스 4)
  if (m.s.c <= 4 && m.e.c >= 4) {
    if (m.s.r >= 20 && m.e.r <= 50) {
      console.log(`Merge Range: Rows ${m.s.r + 1} to ${m.e.r + 1}, Cols ${m.s.c + 1} to ${m.e.c + 1}`);
    }
  }
});
