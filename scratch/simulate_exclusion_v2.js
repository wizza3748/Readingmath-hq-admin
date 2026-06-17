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

courses.forEach((courseObj) => {
  const filePath = path.join(srcDir, courseObj.file);
  if (!fs.existsSync(filePath)) return;
  const workbook = XLSX.readFile(filePath);
  const targetSheets = workbook.SheetNames.filter(name => name.includes('단원'));

  let totalParsed = 0;
  let basicSum = 0;
  let interSum = 0;
  let advSum = 0;

  targetSheets.forEach((sheetName, sheetIdx) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let colOffset = 0;
    let majorUnit = "";
    let minorUnit = "";
    let curBasicTypeNameBase = "";

    const typesMap = {};
    const typesOrder = [];

    const excludedBasicTypeNos = new Set();
    const excludedInterTypeNos = new Set();
    const excludedAdvTypeNos = new Set();

    let curBasicTypeNo = null;
    let curInterTypeNo = null;
    let curAdvTypeNo = null;

    let curBasicTypeName = "";
    let curInterTypeName = "";
    let curAdvTypeName = "";

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

      const interTypeName = row[colOffset + 7];
      const interTypeNo = row[colOffset + 9];
      const interProbNo = row[colOffset + 10];

      const advTypeName = row[colOffset + 11];
      const advTypeNo = row[colOffset + 13];
      const advProbNo = row[colOffset + 14];

      // 수정된 로직 반영: basicTypeName이 없을 때에만 실력/심화도 제외하도록 세팅
      if (basicTypeNo !== undefined && basicTypeNo !== null && basicTypeNo !== '') {
        const typeNoStr = String(basicTypeNo).trim();
        curBasicTypeNo = typeNoStr;
        if (!basicTypeName) excludedBasicTypeNos.add(typeNoStr);
      }
      if (interTypeNo !== undefined && interTypeNo !== null && interTypeNo !== '') {
        const typeNoStr = String(interTypeNo).trim();
        curInterTypeNo = typeNoStr;
        if (!basicTypeName) excludedInterTypeNos.add(typeNoStr); // basicTypeName 기준으로 변경
      }
      if (advTypeNo !== undefined && advTypeNo !== null && advTypeNo !== '') {
        const typeNoStr = String(advTypeNo).trim();
        curAdvTypeNo = typeNoStr;
        if (!basicTypeName) excludedAdvTypeNos.add(typeNoStr); // basicTypeName 기준으로 변경
      }

      if (basicTypeName) {
        curBasicTypeName = String(basicTypeName).trim();
        curBasicTypeNameBase = curBasicTypeName;
      }
      if (interTypeName) curInterTypeName = String(interTypeName).trim();
      if (advTypeName) curAdvTypeName = String(advTypeName).trim();

      const processProb = (typeNo, typeName, probNo, colIdx, diffKey) => {
        if (typeNo && probNo !== undefined && probNo !== null && probNo !== '') {
          const typeNoStr = String(typeNo).trim();
          if (isNaN(Number(typeNoStr))) return;
          
          if (diffKey === 'basic' && excludedBasicTypeNos.has(typeNoStr)) return;
          if (diffKey === 'intermediate' && excludedInterTypeNos.has(typeNoStr)) return;
          if (diffKey === 'advanced' && excludedAdvTypeNos.has(typeNoStr)) return;

          const typeKey = `${minorUnit || sheetName}_${typeNoStr}`;
          if (!typesMap[typeKey]) {
            let resolvedTypeName = curBasicTypeNameBase || "유형 " + typeNoStr;
            if (!basicTypeName && curBasicTypeNameBase) {
              resolvedTypeName = `${curBasicTypeNameBase} - 유형 ${typeNoStr}`;
            }
            typesMap[typeKey] = {
              typeNo: typeNoStr,
              typeName: resolvedTypeName,
              difficultyCount: { basic: 0, intermediate: 0, advanced: 0 }
            };
            typesOrder.push(typeKey);
          }
          typesMap[typeKey].difficultyCount[diffKey]++;
        }
      };

      processProb(curBasicTypeNo, curBasicTypeName, basicProbNo, colOffset + 6, 'basic');
      processProb(curInterTypeNo, curInterTypeName, interProbNo, colOffset + 10, 'intermediate');
      processProb(curAdvTypeNo, curAdvTypeName, advProbNo, colOffset + 14, 'advanced');
    }

    typesOrder.forEach(key => {
      const t = typesMap[key];
      totalParsed++;
      basicSum += t.difficultyCount.basic;
      interSum += t.difficultyCount.intermediate;
      advSum += t.difficultyCount.advanced;
    });
  });

  console.log(`[${courseObj.c}] Types: ${totalParsed} | BasicProbs: ${basicSum}, InterProbs: ${interSum}, AdvProbs: ${advSum}`);
});
