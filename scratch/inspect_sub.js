const XLSX = require('xlsx');
const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 중등 1-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const targetSheet = workbook.SheetNames.find(name => name.includes('단원'));
const sheet = workbook.Sheets[targetSheet];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Sheet Name:', targetSheet);
for (let r = 0; r < data.length; r++) {
  const row = data[r];
  if (!row) continue;
  const rowStr = JSON.stringify(row);
  if (rowStr.includes('거듭제곱의 대소 관계')) {
    // 찾은 행 주변 15줄 출력
    const start = Math.max(0, r - 2);
    const end = Math.min(data.length - 1, r + 20);
    for (let i = start; i <= end; i++) {
      console.log(`Row ${i + 1}:`, data[i]);
    }
    break;
  }
}
