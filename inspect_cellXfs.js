const fs = require('fs');

const stylesPath = 'd:/wizza_work/Readingmath-hq-admin/xlsx_extracted/xl/styles.xml';
if (fs.existsSync(stylesPath)) {
  const stylesXml = fs.readFileSync(stylesPath, 'utf8');
  
  const cellXfsMatch = stylesXml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/);
  const cellXfsXml = cellXfsMatch ? cellXfsMatch[1] : '';
  const xfTags = cellXfsXml.match(/<xf[^>]*>/g) || [];
  
  console.log(`Total cellXfs: ${xfTags.length}`);
  xfTags.forEach((xfTag, index) => {
    const fontIdMatch = xfTag.match(/fontId="(\d+)"/);
    const fontId = fontIdMatch ? parseInt(fontIdMatch[1], 10) : 0;
    if (fontId === 4) {
      console.log(`cellXf ${index} has fontId=4: ${xfTag}`);
    }
  });
} else {
  console.log("styles.xml not found");
}
