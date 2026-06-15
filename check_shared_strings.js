const fs = require('fs');

// sharedStrings.xml 직접 파싱
const xml = fs.readFileSync('d:/wizza_work/Readingmath-hq-admin/xlsx_extracted/xl/sharedStrings.xml', 'utf8');

// si 태그들 추출
const siMatches = xml.match(/<si>[\s\S]*?<\/si>/g) || [];
console.log(`총 shared string 수: ${siMatches.length}`);

// rich text (rPr 포함) 찾기
const richText = siMatches.filter(s => s.includes('<rPr>') || s.includes('<r>'));
console.log(`Rich text 수: ${richText.length}`);
richText.slice(0, 5).forEach((s, i) => {
  console.log(`\n--- Rich text ${i + 1} ---`);
  console.log(s.substring(0, 500));
});

// 모든 font color 리스트
const colorMatches = xml.match(/rgb="[A-F0-9]+"/gi) || [];
console.log('\n색상들:', [...new Set(colorMatches)]);
