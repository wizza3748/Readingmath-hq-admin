const XLSX = require('xlsx');
const filePath = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types/[리딩수학-문제은행] 초등 3-1 유형 분류표.xlsx';
const workbook = XLSX.readFile(filePath);
const targetSheets = workbook.SheetNames.filter(name => name.includes('단원'));

let excelTypeCount = 0;

targetSheets.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  let colOffset = 0;
  
  const uniqueTypes = new Set();
  
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;
    
    const daeIdx = row.indexOf('대단원');
    if (daeIdx !== -1) {
      colOffset = daeIdx;
      continue;
    }
    
    // 이 헤더 스킵 조건 없이, 단지 유형번호가 갱신되는지만 봅니다.
    const basicTypeNo = row[colOffset + 5];
    const basicProbNo = row[colOffset + 6];
    
    // 헤더행들과 구분하기 위해 basicTypeNo가 숫자 형식인지 봅니다.
    if (basicTypeNo !== undefined && basicTypeNo !== null && basicTypeNo !== '') {
      const typeNoStr = String(basicTypeNo).trim();
      if (!isNaN(Number(typeNoStr))) {
        uniqueTypes.add(`${sheetName}_${typeNoStr}`);
      }
    }
  }
  console.log(`Sheet: ${sheetName} | Excel Unique Types: ${uniqueTypes.size}`);
  excelTypeCount += uniqueTypes.size;
});

console.log('Total unique types in Excel for 초등 3-1:', excelTypeCount);
