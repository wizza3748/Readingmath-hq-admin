const fs = require('fs');

const stylesPath = 'd:/wizza_work/Readingmath-hq-admin/xlsx_extracted/xl/styles.xml';
if (fs.existsSync(stylesPath)) {
  const stylesXml = fs.readFileSync(stylesPath, 'utf8');
  
  const fontsMatch = stylesXml.match(/<fonts[^>]*>([\s\S]*?)<\/fonts>/);
  const fontsXml = fontsMatch ? fontsMatch[1] : '';
  const fontTags = fontsXml.match(/<font[^>]*>([\s\S]*?)<\/font>/g) || [];
  
  console.log(`Total fonts: ${fontTags.length}`);
  fontTags.forEach((fontXml, index) => {
    const colorMatch = fontXml.match(/<color\s+[^>]*rgb="([A-F0-9]+)"/i);
    const rgb = colorMatch ? colorMatch[1] : null;
    console.log(`Font ${index}: rgb=${rgb}, fontXml=${fontXml.trim().substring(0, 100)}...`);
  });
} else {
  console.log("styles.xml not found");
}
