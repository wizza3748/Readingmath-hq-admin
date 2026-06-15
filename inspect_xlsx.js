const XLSX = require('xlsx');
const path = require('path');

const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중1-1 문제은행 과학 단원별 유형명.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// 1행부터 25행까지 데이터를 출력
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
for (let i = 0; i < Math.min(data.length, 30); i++) {
  console.log(`Row ${i + 1}:`, data[i]);
}
