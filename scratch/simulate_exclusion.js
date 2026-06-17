const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const srcDir = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types';
const courses = [
  { file: "[리딩수학-문제은행] 초등 3-1 유형 분류표.xlsx", c: "초3-1" },
  { file: "[리딩수학-문제은행] 초등 3-2 유형 분류표.xlsx", c: "초3-2" },
  { file: "[리딩수학-문제은행] 초등 4-1 유형 분류표.xlsx", c: "초4-1" },
  { file: "[리딩수학-문제은행] 초등 4-2 유형 분류표.xlsx", c: "초4-2" },
  { file: "[리딩수학-문제은행] 초등 5-1 유형 분류표.xlsx", c: "초5-1" },
  { file: "[리딩수학-문제은행] 초등 5-2 유형 분류표.xlsx", c: "초5-2" },
  { file: "[리딩수학-문제은행] 초등 6-1 유형 분류표.xlsx", c: "초6-1" },
  { file: "[리딩수학-문제은행] 초등 6-2 유형 분류표.xlsx", c: "초6-2" },
  { file: "[리딩수학-문제은행] 중등 1-1 유형 분류표.xlsx", c: "중1-1" },
  { file: "[리딩수학-문제은행] 중등 1-2 유형 분류표.xlsx", c: "중1-2" },
  { file: "[리딩수학-문제은행] 중등 2-1 유형 분류표.xlsx", c: "중2-1" },
  { file: "[리딩수학-문제은행] 중등 2-2 유형 분류표.xlsx", c: "중2-2" },
  { file: "[리딩수학-문제은행] 중등 3-1 유형 분류표_.xlsx", c: "중3-1" },
  { file: "[리딩수학-문제은행] 중등 3-2 유형 분류표.xlsx", c: "중3-2" }
];

const results = [];

courses.forEach((courseObj) => {
  const filePath = path.join(srcDir, courseObj.file);
  if (!fs.existsSync(filePath)) return;
  const workbook = XLSX.readFile(filePath);
  const targetSheets = workbook.SheetNames.filter(name => name.includes('단원'));

  let totalParsed = 0;
  let missingNameCount = 0;
  const missingSamples = [];

  targetSheets.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let colOffset = 0;
    let curBasicTypeNameBase = "";
    
    // 단순 파싱 카운트용 로직
    const typesMap = {};
    const typesOrder = [];

    let curBasicTypeNo = null;
    let curBasicTypeName = "";

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

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
      const basicProbNo = row[colOffset + 6];

      if (basicTypeNo !== undefined && basicTypeNo !== null && basicTypeNo !== '') {
        curBasicTypeNo = String(basicTypeNo).trim();
      }
      if (basicTypeName) {
        curBasicTypeName = String(basicTypeName).trim();
        curBasicTypeNameBase = curBasicTypeName;
      }

      if (curBasicTypeNo && basicProbNo !== undefined && basicProbNo !== null && basicProbNo !== '') {
        const typeNoStr = String(curBasicTypeNo).trim();
        if (isNaN(Number(typeNoStr))) continue;

        const typeKey = `${sheetName}_${typeNoStr}`;
        if (!typesMap[typeKey]) {
          const isMissing = !basicTypeName;
          let resolvedTypeName = curBasicTypeNameBase || "유형 " + typeNoStr;
          if (isMissing && curBasicTypeNameBase) {
            resolvedTypeName = `${curBasicTypeNameBase} - 유형 ${typeNoStr}`;
          }

          typesMap[typeKey] = {
            typeNo: typeNoStr,
            typeName: resolvedTypeName,
            isMissing
          };
          typesOrder.push(typeKey);
        }
      }
    }

    typesOrder.forEach(key => {
      const t = typesMap[key];
      totalParsed++;
      if (t.isMissing) {
        missingNameCount++;
        if (missingSamples.length < 3) {
          missingSamples.push(t.typeName);
        }
      }
    });
  });

  results.push({
    course: courseObj.c,
    totalParsed,
    missingNameCount,
    validCount: totalParsed - missingNameCount,
    samples: missingSamples
  });
});

console.log('--- Simulation Exclusion Results ---');
console.log(JSON.stringify(results, null, 2));
