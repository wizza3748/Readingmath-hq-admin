const XLSX = require('xlsx');
const path = require('path');
const AdmZip = require('adm-zip');

const filePath = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task/중1-1 문제은행 과학 단원별 유형명.xlsx';

function getRedCellsMap(filePath) {
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
}

const redCellsMap = getRedCellsMap(filePath);
const workbook = XLSX.readFile(filePath);

const sheetName = '1-1-1단원';
const ws = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
const redCells = redCellsMap[sheetName.trim()] || new Set();

console.log('--- Printing Rows 4 to 20 ---');
for (let r = 3; r < 20; r++) {
  const row = data[r];
  if (!row) continue;
  const rowNum = r + 1;
  
  const basicNo = row[0] || '';
  const basicName = row[1] || '';
  const skillNo = row[2] || '';
  const skillName = row[3] || '';
  const advNo = row[4] || '';
  const advName = row[5] || '';
  
  const basicRed = redCells.has(`A${rowNum}`);
  const skillRed = redCells.has(`C${rowNum}`);
  const advRed = redCells.has(`E${rowNum}`);
  
  console.log(`Row ${rowNum}:`);
  console.log(`  B: [${basicNo}] "${basicName}" (Red=${basicRed})`);
  console.log(`  S: [${skillNo}] "${skillName}" (Red=${skillRed})`);
  console.log(`  A: [${advNo}] "${advName}" (Red=${advRed})`);
}
