const XLSX = require('xlsx');
const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 중등 1-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const targetSheet = workbook.SheetNames.find(name => name.includes('단원'));
const sheet = workbook.Sheets[targetSheet];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Row | E (basicTypeName) | F (basicTypeNo) | G (basicProbNo) | H (interTypeName) | I (interTypeNo) | J (interProbNo) | K (advTypeName) | L (advTypeNo) | M (advProbNo)');
console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------');
for (let r = 23; r <= 44; r++) {
  const row = data[r];
  if (!row) {
    console.log(`Row ${r+1} | empty`);
    continue;
  }
  const parts = [];
  // colOffset이 0이라고 가정할 때 E열은 3, F열은 4, G열은 5 등
  // 실제 parse_all_math.js의 오프셋을 반영하여 row[colOffset + X]를 출력합니다.
  const colOffset = 0;
  const valOrDash = (v) => v !== undefined && v !== null && v !== '' ? String(v).trim() : '-';
  
  console.log(
    `Row ${r+1} | ` +
    `E:${valOrDash(row[colOffset + 3])} | ` + // colOffset + 3 -> E열 (유형명)
    `F:${valOrDash(row[colOffset + 4])} | ` + // colOffset + 4 -> G열
    `G:${valOrDash(row[colOffset + 5])} | ` + // colOffset + 5 -> G열
    `H:${valOrDash(row[colOffset + 6])} | ` +
    `I:${valOrDash(row[colOffset + 7])} | ` +
    `J:${valOrDash(row[colOffset + 8])} | ` +
    `K:${valOrDash(row[colOffset + 9])} | ` +
    `L:${valOrDash(row[colOffset + 10])} | ` +
    `M:${valOrDash(row[colOffset + 11])} | ` +
    `N:${valOrDash(row[colOffset + 12])} | ` +
    `O:${valOrDash(row[colOffset + 13])} | ` +
    `P:${valOrDash(row[colOffset + 14])}`
  );
}
