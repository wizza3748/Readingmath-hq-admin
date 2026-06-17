const XLSX = require('xlsx');
const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 초등 3-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const targetSheet = workbook.SheetNames.find(name => name.includes('단원'));
const sheet = workbook.Sheets[targetSheet];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- Inspecting Rows 5 to 15 for 초등 3-1 ---');
let colOffset = 0;
for (let r = 0; r < data.length; r++) {
  const row = data[r];
  if (!row) continue;
  
  const daeIdx = row.indexOf('대단원');
  if (daeIdx !== -1) {
    colOffset = daeIdx;
    continue;
  }
  
  if (row[colOffset] === '중단원' || row[colOffset + 3] === '대표유형') continue;
  if (row[colOffset] === '속성' || row[colOffset] === '대단원') continue;
  if (row.includes('유형명')) continue;

  const basicTypeName = row[colOffset + 3];
  const basicTypeNo = row[colOffset + 5];
  const interTypeName = row[colOffset + 7];
  const interTypeNo = row[colOffset + 9];
  const advTypeName = row[colOffset + 11];
  const advTypeNo = row[colOffset + 13];

  if (basicTypeNo || interTypeNo || advTypeNo) {
    console.log(
      `Row ${r+1}: ` +
      `basicTypeNo=${basicTypeNo || ''}, basicTypeName="${basicTypeName || ''}" | ` +
      `interTypeNo=${interTypeNo || ''}, interTypeName="${interTypeName || ''}" | ` +
      `advTypeNo=${advTypeNo || ''}, advTypeName="${advTypeName || ''}"`
    );
    if (r > 30) break; // 일부만 출력
  }
}
