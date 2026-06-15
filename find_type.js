const XLSX = require('xlsx');
const path = require('path');

const srcDir = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task';
const file = "중1-1 문제은행 과학 단원별 유형명.xlsx";
const filePath = path.join(srcDir, file);
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  const ws = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  data.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell && String(cell).includes("탐구 단계별 특징")) {
        console.log(`Sheet: ${sheetName}, Row: ${r + 1}, Col: ${c}, Cell Value: ${cell}`);
        console.log(`Entire Row:`, row);
      }
    });
  });
});
