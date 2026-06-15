const AdmZip = require('adm-zip');

const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중1-1 문제은행 과학 단원별 유형명.xlsx';
const zip = new AdmZip(filePath);

// 1. workbook.xml 읽기
const workbookEntry = zip.getEntry('xl/workbook.xml');
const workbookXml = workbookEntry.getData().toString('utf8');

// sheets 매핑
// <sheet name="1-1-1단원" sheetId="1" r:id="rId1"/>
const sheets = [];
const sheetRegex = /<sheet\s+([^>]*)\/>/g;
let match;
while ((match = sheetRegex.exec(workbookXml)) !== null) {
  const attrs = match[1];
  const nameMatch = attrs.match(/name="([^"]+)"/);
  const sheetIdMatch = attrs.match(/sheetId="(\d+)"/);
  const rIdMatch = attrs.match(/r:id="([^"]+)"/);
  
  if (nameMatch && rIdMatch) {
    sheets.push({
      name: nameMatch[1],
      sheetId: sheetIdMatch ? sheetIdMatch[1] : '',
      rId: rIdMatch[1]
    });
  }
}

// 2. workbook.xml.rels 읽기
const relsEntry = zip.getEntry('xl/_rels/workbook.xml.rels');
const relsXml = relsEntry.getData().toString('utf8');

const rels = {};
const relRegex = /<Relationship\s+([^>]*)\/>/g;
while ((match = relRegex.exec(relsXml)) !== null) {
  const attrs = match[1];
  const idMatch = attrs.match(/Id="([^"]+)"/);
  const targetMatch = attrs.match(/Target="([^"]+)"/);
  if (idMatch && targetMatch) {
    rels[idMatch[1]] = targetMatch[1];
  }
}

// 3. 결합하여 최종 파일 매핑 확인
sheets.forEach(s => {
  const targetPath = rels[s.rId];
  // Target은 보통 "worksheets/sheet1.xml" 처럼 되어 있음
  console.log(`시트명: "${s.name}" -> 파일 경로: "xl/${targetPath}"`);
});
