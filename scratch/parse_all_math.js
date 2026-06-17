const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const srcDir = 'D:/wizza_work/Readingmath-hq-admin/data/task-center/math-types';
const mockFile = 'D:/wizza_work/Readingmath-hq-admin/src/lib/task-center-mock.ts';

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

// 열 인덱스를 문자(A, B, C...)로 변환하는 헬퍼 함수 (Z 이후는 AA, AB 등으로 확장 가능하지만, 오프셋이 커도 P열 이내이므로 단순 변환으로 충분합니다.)
function getColLetter(colIdx) {
  if (colIdx < 26) {
    return String.fromCharCode(65 + colIdx);
  }
  const first = String.fromCharCode(65 + Math.floor(colIdx / 26) - 1);
  const second = String.fromCharCode(65 + (colIdx % 26));
  return first + second;
}

// 빨간색 셀 추출 함수
function getRedCellsMap(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const stylesEntry = zip.getEntry('xl/styles.xml');
    if (!stylesEntry) return {};
    const stylesXml = stylesEntry.getData().toString('utf8');
    
    const fontsMatch = stylesXml.match(/<(?:[a-zA-Z0-9]+:)?fonts[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?fonts>/);
    const fontsXml = fontsMatch ? fontsMatch[1] : '';
    const fontTags = fontsXml.match(/<(?:[a-zA-Z0-9]+:)?font[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?font>/g) || [];
    const redFontIds = [];

    fontTags.forEach((fontXml, index) => {
      const colorMatch = fontXml.match(/<(?:[a-zA-Z0-9]+:)?color\s+[^>]*rgb="([A-F0-9]+)"/i);
      const rgb = colorMatch ? colorMatch[1] : null;
      if (rgb) {
        const rgbUpper = rgb.toUpperCase();
        if (rgbUpper.endsWith('FF0000') || rgbUpper === 'FFFF0000' || rgbUpper === 'FF0000') {
          redFontIds.push(index);
        }
      }
    });

    const cellXfsMatch = stylesXml.match(/<(?:[a-zA-Z0-9]+:)?cellXfs[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?cellXfs>/);
    const cellXfsXml = cellXfsMatch ? cellXfsMatch[1] : '';
    const xfTags = cellXfsXml.match(/<(?:[a-zA-Z0-9]+:)?xf[^>]*>/g) || [];
    const redXfIds = [];

    xfTags.forEach((xfTag, index) => {
      const fontIdMatch = xfTag.match(/fontId="(\d+)"/);
      const fontId = fontIdMatch ? parseInt(fontIdMatch[1], 10) : 0;
      if (redFontIds.includes(fontId)) {
        redXfIds.push(index);
      }
    });

    const workbookEntry = zip.getEntry('xl/workbook.xml');
    const workbookXml = workbookEntry.getData().toString('utf8');
    
    const sheets = [];
    const sheetRegex = /<(?:[a-zA-Z0-9]+:)?sheet\s+([^>]*)\/>/g;
    let match;
    while ((match = sheetRegex.exec(workbookXml)) !== null) {
      const attrs = match[1];
      const nameMatch = attrs.match(/name="([^"]+)"/);
      const rIdMatch = attrs.match(/r:id="([^"]+)"/);
      if (nameMatch && rIdMatch) {
        sheets.push({
          name: nameMatch[1].trim(),
          rId: rIdMatch[1]
        });
      }
    }

    const relsEntry = zip.getEntry('xl/_rels/workbook.xml.rels');
    const relsXml = relsEntry.getData().toString('utf8');
    const rels = {};
    const relRegex = /<(?:[a-zA-Z0-9]+:)?Relationship\s+([^>]*)\/>/g;
    while ((match = relRegex.exec(relsXml)) !== null) {
      const attrs = match[1];
      const idMatch = attrs.match(/Id="([^"]+)"/);
      const targetMatch = attrs.match(/Target="([^"]+)"/);
      if (idMatch && targetMatch) {
        rels[idMatch[1]] = targetMatch[1];
      }
    }

    const sheetRedCells = {};
    sheets.forEach(s => {
      const targetPath = rels[s.rId];
      const sheetEntry = zip.getEntry(`xl/${targetPath}`);
      const redCells = new Set();
      if (sheetEntry) {
        const sheetXml = sheetEntry.getData().toString('utf8');
        const cells = sheetXml.match(/<(?:[a-zA-Z0-9]+:)?c\s+[^>]*>/g) || [];
        cells.forEach(cTag => {
          const rMatch = cTag.match(/r="([A-Z]+\d+)"/);
          const sMatch = cTag.match(/s="(\d+)"/);
          if (rMatch) {
            const r = rMatch[1];
            const s = sMatch ? parseInt(sMatch[1], 10) : 0;
            if (redXfIds.includes(s)) {
              redCells.add(r);
            }
          }
        });
      }
      sheetRedCells[s.name] = redCells;
    });

    return sheetRedCells;
  } catch (e) {
    console.error('Error parsing zip for styles:', e);
    return {};
  }
}

const allCurricula = [];

courses.forEach((courseObj) => {
  const filePath = path.join(srcDir, courseObj.file);
  console.log(`Processing: ${courseObj.c} -> ${courseObj.file}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    return;
  }

  const redCellsMap = getRedCellsMap(filePath);
  const workbook = XLSX.readFile(filePath);
  
  // '단원'이 포함된 시트만 필터링
  const targetSheets = workbook.SheetNames.filter(name => name.includes('단원'));
  const courseTypes = [];

  targetSheets.forEach((sheetName, sheetIdx) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const redCells = redCellsMap[sheetName] || new Set();

    let majorUnit = "";
    let minorUnit = "";
    let colOffset = 0; // 동적 컬럼 오프셋

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
    let curBasicTypeNameBase = ""; // 누락 시 결합용 베이스 이름 트래커

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;

      // 대단원 체크 및 오프셋 탐색
      const daeIdx = row.indexOf('대단원');
      if (daeIdx !== -1) {
        colOffset = daeIdx; // '대단원' 문자가 있는 열의 인덱스를 오프셋으로 설정
        if (row[colOffset + 1]) {
          majorUnit = String(row[colOffset + 1]).trim();
        }
        continue;
      }

      // 소단원 체크
      const soIndex = row.indexOf('소단원');
      if (soIndex !== -1 && row[soIndex + 1]) {
        minorUnit = String(row[soIndex + 1]).trim();
        continue;
      }

      // 헤더행 패스
      if (row[colOffset] === '중단원' || row[colOffset + 3] === '대표유형') continue;
      if (row.includes('유형명')) continue;

      // 기본, 실력, 심화 정보 추출
      const basicTypeName = row[colOffset + 3];
      const basicTypeNo = row[colOffset + 5];
      const basicProbNo = row[colOffset + 6];

      const interTypeName = row[colOffset + 7];
      const interTypeNo = row[colOffset + 9];
      const interProbNo = row[colOffset + 10];

      const advTypeName = row[colOffset + 11];
      const advTypeNo = row[colOffset + 13];
      const advProbNo = row[colOffset + 14];

      if (basicTypeNo !== undefined && basicTypeNo !== null && basicTypeNo !== '') {
        const typeNoStr = String(basicTypeNo).trim();
        curBasicTypeNo = typeNoStr;
        if (!basicTypeName) {
          excludedBasicTypeNos.add(typeNoStr);
        }
      }
      if (interTypeNo !== undefined && interTypeNo !== null && interTypeNo !== '') {
        const typeNoStr = String(interTypeNo).trim();
        curInterTypeNo = typeNoStr;
        if (!basicTypeName) {
          excludedInterTypeNos.add(typeNoStr);
        }
      }
      if (advTypeNo !== undefined && advTypeNo !== null && advTypeNo !== '') {
        const typeNoStr = String(advTypeNo).trim();
        curAdvTypeNo = typeNoStr;
        if (!basicTypeName) {
          excludedAdvTypeNos.add(typeNoStr);
        }
      }

      if (basicTypeName) {
        curBasicTypeName = String(basicTypeName).trim();
        curBasicTypeNameBase = curBasicTypeName; // 유형명 베이스 업데이트
      }
      if (interTypeName) curInterTypeName = String(interTypeName).trim();
      if (advTypeName) curAdvTypeName = String(advTypeName).trim();

      const processProb = (typeNo, typeName, probNo, colIdx, diffKey) => {
        if (typeNo && probNo !== undefined && probNo !== null && probNo !== '') {
          const typeNoStr = String(typeNo).trim();
          if (isNaN(Number(typeNoStr))) return; // 숫자가 아닌 유형번호 방지
          
          if (diffKey === 'basic' && excludedBasicTypeNos.has(typeNoStr)) return;
          if (diffKey === 'intermediate' && excludedInterTypeNos.has(typeNoStr)) return;
          if (diffKey === 'advanced' && excludedAdvTypeNos.has(typeNoStr)) return;

          const typeKey = `${minorUnit}_${typeNoStr}`;
          if (!typesMap[typeKey]) {
            let resolvedTypeName = curBasicTypeNameBase || "유형 " + typeNoStr;
            if (!basicTypeName && curBasicTypeNameBase) {
              resolvedTypeName = `${curBasicTypeNameBase} - 유형 ${typeNoStr}`;
            }

            typesMap[typeKey] = {
              typeNo: typeNoStr,
              typeName: resolvedTypeName,
              majorUnit,
              minorUnit,
              difficultyCount: { basic: 0, intermediate: 0, advanced: 0 },
              importantCount: { basic: 0, intermediate: 0, advanced: 0 }
            };
            typesOrder.push(typeKey);
          }
          typesMap[typeKey].difficultyCount[diffKey]++;
          
          // 빨간색 셀 확인
          const colLetter = getColLetter(colIdx);
          const cellRef = `${colLetter}${r + 1}`;
          if (redCells.has(cellRef)) {
            typesMap[typeKey].importantCount[diffKey]++;
          }
        }
      };

      processProb(curBasicTypeNo, curBasicTypeName, basicProbNo, colOffset + 6, 'basic');
      processProb(curInterTypeNo, curInterTypeName, interProbNo, colOffset + 10, 'intermediate');
      processProb(curAdvTypeNo, curAdvTypeName, advProbNo, colOffset + 14, 'advanced');
    }

    // typesOrder 순서대로 해당 시트(단원)의 유형 데이터를 courseTypes에 푸시
    typesOrder.forEach((key, idx) => {
      const t = typesMap[key];
      const typeId = `mt-${courseObj.c}-${sheetIdx}-${idx}`;
      courseTypes.push({
        id: typeId,
        majorUnit: t.majorUnit,
        minorUnit: t.minorUnit,
        typeName: t.typeName,
        difficultyCount: t.difficultyCount,
        importantCount: t.importantCount,
        videoUrl: "https://youtu.be/8cuQVowUw6U?si=M_-nYwgtGemwdgH3",
        sampleQuestion: "다음 식을 계산하여 값을 구하시오.\n\n$$ 124 + 352 = \\Box $$"
      });
    });
  });

  allCurricula.push({
    id: `math-${courseObj.c}`,
    subject: "math",
    course: courseObj.c,
    types: courseTypes
  });
  console.log(`Finished ${courseObj.c}: Parsed ${courseTypes.length} types.`);
});

// src/lib/task-center-mock.ts 업데이트
if (fs.existsSync(mockFile)) {
  let content = fs.readFileSync(mockFile, 'utf8');
  
  const startStr = 'export const MATH_CURRICULA: Curriculum[] = [';
  const endStr = 'export const SCIENCE_CURRICULA: Curriculum[] = [';
  
  const startIndex = content.indexOf(startStr);
  const endIndex = content.indexOf(endStr);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const formattedData = 'export const MATH_CURRICULA: Curriculum[] = ' + JSON.stringify(allCurricula, null, 2) + ';';
    const newContent = content.substring(0, startIndex) + formattedData + '\n\n' + content.substring(endIndex);
    fs.writeFileSync(mockFile, newContent, 'utf8');
    console.log("\n>>> Successfully updated MATH_CURRICULA in task-center-mock.ts <<<");
  } else {
    console.error("Could not find MATH_CURRICULA start/end markers in mock file!");
  }
} else {
  console.error(`Mock file does not exist: ${mockFile}`);
}
