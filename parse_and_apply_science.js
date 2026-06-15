const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const srcDir = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task';
const mockFile = 'd:/wizza_work/Readingmath-hq-admin/src/lib/task-center-mock.ts';

const courses = [
  { file: "중1-1 문제은행 과학 단원별 유형명.xlsx", c: "중1-1" },
  { file: "중2-1 문제은행 과학 단원별 유형명.xlsx", c: "중2-1" },
  { file: "중3-1 문제은행 과학 단원별 유형명.xlsx", c: "중3-1" }
];

// 파일별 빨간색 셀 정보를 미리 구하는 함수
function getRedCellsMap(filePath) {
  try {
    const zip = new AdmZip(filePath);
    
    // 1. styles.xml 파싱 (접두사 대응)
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

    // 2. workbook.xml 및 rels 파싱 (접두사 대응)
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

    // 3. 각 시트별 빨간색 셀 Set 구축 (접두사 대응)
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

// 유형번호 셀에서 교과서 정보를 추출하는 함수
function parseTextbook(val) {
  if (!val) return "기타";
  let str = String(val).trim();
  
  // 화살표가 있는 경우 최종 변경된 우측의 값을 사용 (예: "4(완)→4(오)")
  if (str.includes("→")) {
    const parts = str.split("→");
    str = parts[parts.length - 1].trim();
  }
  
  if (str.includes("오+완")) return "오투+완자";
  if (str.includes("기타")) return "기타";
  
  const hasOh = str.includes("오");
  const hasWan = str.includes("완");
  
  if (hasOh && hasWan) return "오투+완자";
  if (hasOh) return "오투";
  if (hasWan) return "완자";
  
  return "기타";
}

// 셀이 중단원 헤더인지 확인 (예: "(1) 생물의 구성", "(2) 생물의 다양성")
function isMinorUnitHeader(row) {
  if (!row || row.length === 0) return false;
  const firstCell = row[0];
  if (!firstCell) return false;
  const str = String(firstCell).trim();
  return /^\(\d+\)/.test(str);
}

// 셀이 유형 헤더 행인지 확인 ("유형 번호", "기본 유형" 등)
function isTypeHeader(row) {
  if (!row || row.length === 0) return false;
  const str = String(row[0] || '').trim();
  return str === '유형 번호';
}

// 참조사항 행인지 확인 (파싱 중단 조건)
function isNoteRow(row) {
  if (!row || row.length === 0) return false;
  const str = String(row[0] || '').trim();
  return str === '참조사항' || str.startsWith('참조') || str.includes('(오) :');
}

// 셀 내용이 비어있거나 null인지 확인
function isEmpty(val) {
  return val === undefined || val === null || String(val).trim() === '';
}

try {
  const curricula = courses.map(courseObj => {
    const filePath = path.join(srcDir, courseObj.file);
    const workbook = XLSX.readFile(filePath);
    const types = [];

    // 스타일 매핑 생성 (빨간색 글씨 셀 목록 확보)
    const redCellsMap = getRedCellsMap(filePath);

    workbook.SheetNames.forEach((sheetName, sheetIdx) => {
      const ws = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (data.length < 2) return;

      // 1행: 대단원명 (예: "중1-1학기 1단원 과학과 인류의 지속가능한 삶")
      // 학기 부분을 정규식으로 제거 (예: "1단원 과학과 인류의 지속가능한 삶")
      const rawMajorUnit = data[0] && data[0][0] ? String(data[0][0]).trim() : `대단원 ${sheetIdx + 1}`;
      const majorUnitRaw = rawMajorUnit.replace(/^중\d-\d학기\s*/, '').replace(/\s+/g, ' ');

      // 이 시트의 빨간색 셀 목록
      const redCells = redCellsMap[sheetName.trim()] || new Set();

      let currentMinorUnit = '';
      let inDataSection = false;

      for (let r = 1; r < data.length; r++) {
        const row = data[r];

        // 참조사항 행 -> 파싱 중단
        if (isNoteRow(row)) break;

        // 중단원 헤더 행 감지
        if (isMinorUnitHeader(row)) {
          currentMinorUnit = String(row[0]).trim();
          inDataSection = false;
          continue;
        }

        // 유형 헤더 행 감지 -> 다음 행부터 데이터
        if (isTypeHeader(row)) {
          inDataSection = true;
          continue;
        }

        // 빈 행 -> 데이터 섹션 종료
        if (!row || row.every(cell => isEmpty(cell))) {
          inDataSection = false;
          continue;
        }

        // 데이터 행 파싱
        if (inDataSection && currentMinorUnit) {
          const rowNum = r + 1; // 엑셀의 실제 행 번호 (1-based)

          // 1. 기본 유형 (컬럼 0: 번호, 1: 이름)
          if (!isEmpty(row[1])) {
            const typeName = String(row[1]).trim()
              .replace(/\r\n→\s*/g, ' → ') // 개행 처리
              .replace(/\r\n/g, ' ')
              .replace(/\n/g, ' ');
            const tb = parseTextbook(row[0]);
            
            // A열 번호 셀(A{rowNum})의 빨간색 여부 체크
            const isImportant = redCells.has(`A${rowNum}`);
            const importantCount = isImportant ? { basic: 2, intermediate: 0, advanced: 0 } : { basic: 0, intermediate: 0, advanced: 0 };

            const typeObj = {
              id: `sc-${courseObj.c}-s${sheetIdx}-r${r}-basic`,
              majorUnit: majorUnitRaw,
              minorUnit: currentMinorUnit,
              typeName,
              difficultyCount: { basic: 10, intermediate: 0, advanced: 0 },
              importantCount,
              textbook: tb
            };
            if (Math.random() < 0.8) {
              typeObj.videoUrl = "https://youtu.be/s1G_j-KW_Tk?si=xk0d4ppedI3wgil5";
            }

            types.push(typeObj);
          }

          // 2. 실력 유형 (컬럼 2: 번호, 3: 이름)
          if (!isEmpty(row[3])) {
            const typeName = String(row[3]).trim()
              .replace(/\r\n→\s*/g, ' → ')
              .replace(/\r\n/g, ' ')
              .replace(/\n/g, ' ');
            const tb = parseTextbook(row[2]);

            // C열 번호 셀(C{rowNum})의 빨간색 여부 체크
            const isImportant = redCells.has(`C${rowNum}`);
            const importantCount = isImportant ? { basic: 0, intermediate: 2, advanced: 0 } : { basic: 0, intermediate: 0, advanced: 0 };

            const typeObj = {
              id: `sc-${courseObj.c}-s${sheetIdx}-r${r}-skill`,
              majorUnit: majorUnitRaw,
              minorUnit: currentMinorUnit,
              typeName,
              difficultyCount: { basic: 0, intermediate: 10, advanced: 0 },
              importantCount,
              textbook: tb
            };
            if (Math.random() < 0.8) {
              typeObj.videoUrl = "https://youtu.be/s1G_j-KW_Tk?si=xk0d4ppedI3wgil5";
            }

            types.push(typeObj);
          }

          // 3. 심화 유형 (컬럼 4: 번호, 5: 이름)
          if (!isEmpty(row[5])) {
            const typeName = String(row[5]).trim()
              .replace(/\r\n→\s*/g, ' → ')
              .replace(/\r\n/g, ' ')
              .replace(/\n/g, ' ');
            const tb = parseTextbook(row[4]);

            // E열 번호 셀(E{rowNum})의 빨간색 여부 체크
            const isImportant = redCells.has(`E${rowNum}`);
            const importantCount = isImportant ? { basic: 0, intermediate: 0, advanced: 2 } : { basic: 0, intermediate: 0, advanced: 0 };

            const typeObj = {
              id: `sc-${courseObj.c}-s${sheetIdx}-r${r}-adv`,
              majorUnit: majorUnitRaw,
              minorUnit: currentMinorUnit,
              typeName,
              difficultyCount: { basic: 0, intermediate: 0, advanced: 10 },
              importantCount,
              textbook: tb
            };
            if (Math.random() < 0.8) {
              typeObj.videoUrl = "https://youtu.be/s1G_j-KW_Tk?si=xk0d4ppedI3wgil5";
            }

            types.push(typeObj);
          }
        }
      }
    });

    return {
      id: `sci-${courseObj.c}`,
      subject: "science",
      course: courseObj.c,
      types
    };
  });

  // 파싱 결과 간단 검증
  curricula.forEach(c => {
    console.log(`\n=== ${c.course} ===`);
    const minorUnits = [...new Set(c.types.map(t => `${t.majorUnit} / ${t.minorUnit}`))];
    minorUnits.forEach(u => console.log('  -', u));
    console.log(`  총 유형 수: ${c.types.length}`);
    const impTypes = c.types.filter(t => t.importantCount.basic > 0 || t.importantCount.intermediate > 0 || t.importantCount.advanced > 0);
    console.log(`  중요 유형 수: ${impTypes.length}`);
  });

  // task-center-mock.ts 업데이트
  let content = fs.readFileSync(mockFile, 'utf8');
  const startMarker = 'export const SCIENCE_CURRICULA: Curriculum[] = [';
  const endMarker = 'export const SAMPLE_CLASSES';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker, startIndex);

  if (startIndex === -1 || endIndex === -1) {
    console.error('SCIENCE_CURRICULA 경계를 찾지 못했습니다.');
    process.exit(1);
  }

  const newDataString = 'export const SCIENCE_CURRICULA: Curriculum[] = ' + JSON.stringify(curricula, null, 2) + ';\n\n';
  content = content.substring(0, startIndex) + newDataString + content.substring(endIndex);

  fs.writeFileSync(mockFile, content, 'utf8');

  // import 구문 보정 (getStoredClasses, getStoredStudents 누락 방지)
  try {
    let finalContent = fs.readFileSync(mockFile, 'utf8');
    const importTeacher = 'import { getStoredClasses } from "./teacher-mock";';
    const importStudent = 'import { getStoredStudents } from "./student-mock";';
    
    // 중간에 껴있을지 모르는 import 구문 제거
    finalContent = finalContent.replace(new RegExp(importTeacher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n', 'g'), '');
    finalContent = finalContent.replace(new RegExp(importStudent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n', 'g'), '');
    finalContent = finalContent.replace(new RegExp(importTeacher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    finalContent = finalContent.replace(new RegExp(importStudent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    
    // 파일 최상단에 import 추가
    const importsToAdd = `${importTeacher}\n${importStudent}\n`;
    finalContent = importsToAdd + finalContent;
    fs.writeFileSync(mockFile, finalContent, 'utf8');
    console.log('✅ import 구문을 파일 최상단으로 이동 완료!');
  } catch (err) {
    console.error('import 보정 중 오류:', err);
  }

  console.log('\n✅ 과학 커리큘럼 데이터 업데이트 완료!');

} catch (e) {
  console.error('오류 발생:', e);
}
