const AdmZip = require('adm-zip');
const fs = require('fs');

const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중1-1 문제은행 과학 단원별 유형명.xlsx';
const zip = new AdmZip(filePath);

// 1. styles.xml 읽기
const stylesEntry = zip.getEntry('xl/styles.xml');
if (!stylesEntry) {
  console.log('styles.xml 이 없습니다.');
  process.exit(1);
}
const stylesXml = stylesEntry.getData().toString('utf8');

// 2. fonts 및 cellXfs 파싱
const fontsMatch = stylesXml.match(/<fonts[^>]*>([\s\S]*?)<\/fonts>/);
const fontsXml = fontsMatch ? fontsMatch[1] : '';
const fontTags = fontsXml.match(/<font[^>]*>([\s\S]*?)<\/font>/g) || [];
const redFontIds = [];

fontTags.forEach((fontXml, index) => {
  const colorMatch = fontXml.match(/<color\s+[^>]*rgb="([A-F0-9]+)"/i);
  const rgb = colorMatch ? colorMatch[1] : null;
  // 빨간색 조건
  if (rgb && (rgb.endsWith('FF0000') || rgb === 'FFFF0000' || rgb === 'FF0000')) {
    redFontIds.push(index);
  }
});
console.log('빨간색 Font Ids:', redFontIds);

const cellXfsMatch = stylesXml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/);
const cellXfsXml = cellXfsMatch ? cellXfsMatch[1] : '';
const xfTags = cellXfsXml.match(/<xf[^>]*>/g) || [];
const redXfIds = [];

xfTags.forEach((xfTag, index) => {
  const fontIdMatch = xfTag.match(/fontId="(\d+)"/);
  const fontId = fontIdMatch ? parseInt(fontIdMatch[1], 10) : 0;
  if (redFontIds.includes(fontId)) {
    redXfIds.push(index);
  }
});
console.log('빨간색 스타일 xf Ids (s 속성):', redXfIds);

// 3. 첫 번째 시트의 xml 읽기 (xl/worksheets/sheet1.xml)
const sheetEntry = zip.getEntry('xl/worksheets/sheet1.xml');
if (sheetEntry) {
  const sheetXml = sheetEntry.getData().toString('utf8');
  // 셀 태그 <c r="A4" s="12" ...> 또는 <c r="A4" ...>
  // A열 셀들의 스타일 확인해보기
  const cells = sheetXml.match(/<c\s+[^>]*>/g) || [];
  console.log(`총 셀 수: ${cells.length}`);
  
  // A열(A1 ~ A50) 셀들의 s 속성 출력
  cells.forEach(cTag => {
    const rMatch = cTag.match(/r="([A-Z]+\d+)"/);
    const sMatch = cTag.match(/s="(\d+)"/);
    const r = rMatch ? rMatch[1] : '';
    const s = sMatch ? parseInt(sMatch[1], 10) : 0;
    
    if (r.startsWith('A') && redXfIds.includes(s)) {
      console.log(`빨간색 셀 발견! 셀: ${r}, 스타일 인덱스: ${s}`);
    }
  });
}
