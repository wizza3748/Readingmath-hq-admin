const XLSX = require('xlsx');

const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 중등 1-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const range = XLSX.utils.decode_range(sheet['!ref']);

console.log('--- Scanning E (TypeName) and G (TypeNo) for each row ---');
for (let r = 5; r <= range.e.r; r++) {
  const eCell = sheet[XLSX.utils.encode_cell({ r, c: 4 })]; // E열
  const gCell = sheet[XLSX.utils.encode_cell({ r, c: 6 })]; // G열
  const hCell = sheet[XLSX.utils.encode_cell({ r, c: 7 })]; // H열
  
  const eVal = eCell ? eCell.v : undefined;
  const gVal = gCell ? gCell.v : undefined;
  const hVal = hCell ? hCell.v : undefined;
  
  if (eVal !== undefined || gVal !== undefined || hVal !== undefined) {
    console.log(`Row ${r + 1}: E(TypeName)="${eVal || ''}", G(TypeNo)="${gVal || ''}", H(ProbNo)="${hVal || ''}"`);
  }
}
