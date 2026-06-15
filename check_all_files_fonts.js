const AdmZip = require('adm-zip');
const path = require('path');

const srcDir = 'd:/wizza_work/Readingmath-hq-admin/data/task-center/science-task';
const files = [
  "중1-1 문제은행 과학 단원별 유형명.xlsx",
  "중2-1 문제은행 과학 단원별 유형명.xlsx",
  "중3-1 문제은행 과학 단원별 유형명.xlsx"
];

files.forEach(f => {
  console.log(`\n================== ${f} ==================`);
  const filePath = path.join(srcDir, f);
  const zip = new AdmZip(filePath);
  const stylesEntry = zip.getEntry('xl/styles.xml');
  if (!stylesEntry) {
    console.log('No styles.xml');
    return;
  }
  const stylesXml = stylesEntry.getData().toString('utf8');
  
  const fontsMatch = stylesXml.match(/<fonts[^>]*>([\s\S]*?)<\/fonts>/);
  const fontsXml = fontsMatch ? fontsMatch[1] : '';
  const fontTags = fontsXml.match(/<font[^>]*>([\s\S]*?)<\/font>/g) || [];
  
  const colors = [];
  fontTags.forEach((fontXml, index) => {
    const colorMatch = fontXml.match(/<color\s+[^>]*rgb="([A-F0-9]+)"/i);
    const rgb = colorMatch ? colorMatch[1] : null;
    if (rgb) {
      colors.push({ index, rgb });
    }
  });
  console.log('Fonts and Colors:', colors);
});
