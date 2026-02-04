const fs = require('fs');
const filePath = 'd:\\wizza_work\\Readingmath-hq-admin\\src\\app\\admin\\learning-history\\mockData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const line6 = lines[5];
const scienceIndex = line6.indexOf('"science":');
console.log('Science index:', scienceIndex);
if (scienceIndex !== -1) {
    console.log('Near science:', line6.substring(scienceIndex - 50, scienceIndex + 50));
}

const line5 = lines[4];
const febIndex = line5.indexOf('"2026-02"');
console.log('FEB 2026 index:', febIndex);
if (febIndex !== -1) {
    console.log('Near FEB 2026:', line5.substring(febIndex, febIndex + 500));
}
