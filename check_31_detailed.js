const AdmZip = require('adm-zip');

const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중3-1 문제은행 과학 단원별 유형명.xlsx';
const zip = new AdmZip(filePath);

// styles.xml 파싱
const stylesEntry = zip.getEntry('xl/styles.xml');
const stylesXml = stylesEntry.getData().toString('utf8');

const fontsMatch = stylesXml.match(/<(?:[a-zA-Z0-9]+:)?fonts[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?fonts>/);
const fontsXml = fontsMatch ? fontsMatch[1] : '';
const fontTags = fontsXml.match(/<(?:[a-zA-Z0-9]+:)?font[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?font>/g) || [];
const redFontIds = [];

fontTags.forEach((fontXml, index) => {
  const colorMatch = fontXml.match(/<(?:[a-zA-Z0-9]+:)?color\s+[^>]*rgb="([A-F0-9]+)"/i);
  const rgb = colorMatch ? colorMatch[1] : null;
  console.log(`Font ${index}: rgb=${rgb}`);
  if (rgb && (rgb.endsWith('FF0000') || rgb === 'FFFF0000' || rgb === 'FF0000')) {
    redFontIds.push(index);
  }
});
console.log('Red Font Ids:', redFontIds);

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
console.log('Red Xf Ids:', redXfIds);

// workbook sheets 매핑
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
console.log('Sheets in workbook.xml:', sheets);

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

sheets.forEach(s => {
  const targetPath = rels[s.rId];
  const sheetEntry = zip.getEntry(`xl/${targetPath}`);
  if (sheetEntry) {
    const sheetXml = sheetEntry.getData().toString('utf8');
    const cells = sheetXml.match(/<(?:[a-zA-Z0-9]+:)?c\s+[^>]*>/g) || [];
    let redCount = 0;
    cells.forEach(cTag => {
      const rMatch = cTag.match(/r="([A-Z]+\d+)"/);
      const sMatch = cTag.match(/s="(\d+)"/);
      if (rMatch) {
        const r = rMatch[1];
        const s = sMatch ? parseInt(sMatch[1], 10) : 0;
        if (redXfIds.includes(s)) {
          redCount++;
        }
      }
    });
    console.log(`Sheet "${s.name}" (file: xl/${targetPath}) - Found red cells: ${redCount}`);
  }
});
