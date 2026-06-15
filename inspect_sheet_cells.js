const fs = require('fs');

const sheetPath = 'd:/wizza_work/Readingmath-hq-admin/xlsx_extracted/xl/worksheets/sheet1.xml';
if (fs.existsSync(sheetPath)) {
  const sheetXml = fs.readFileSync(sheetPath, 'utf8');
  
  const cells = sheetXml.match(/<c[^>]*>([\s\S]*?)<\/c>|<c[^>]*\/>/g) || [];
  console.log(`Total cells in sheet1: ${cells.length}`);
  
  const targetStyles = [12, 13, 29];
  cells.forEach(cTag => {
    const rMatch = cTag.match(/r="([A-Z]+\d+)"/);
    const sMatch = cTag.match(/s="(\d+)"/);
    if (rMatch) {
      const r = rMatch[1];
      const s = sMatch ? parseInt(sMatch[1], 10) : 0;
      if (targetStyles.includes(s)) {
        console.log(`Cell ${r} has style s=${s} (Red Font)`);
      }
    }
  });
} else {
  console.log("sheet1.xml not found");
}
