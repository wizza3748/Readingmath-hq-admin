const fs = require('fs');
const l6 = fs.readFileSync('d:\\wizza_work\\Readingmath-hq-admin\\src\\app\\admin\\learning-history\\mockData.ts', 'utf8').split('\n')[5];

const sStart = l6.indexOf(',"science":');
const sJsonRaw = l6.substring(sStart + 11);
const sEnd = sJsonRaw.indexOf('}}};');
const sJson = sJsonRaw.substring(0, sEnd + 3);

console.log('S JSON Length:', sJson.length);
console.log('S JSON Tail (last 100):', sJson.substring(sJson.length - 100));
console.log('S JSON Character after }:', sJsonRaw.substring(sEnd + 3, sEnd + 10));

try {
    JSON.parse(sJson);
    console.log('S valid');
} catch (e) {
    console.log('S invalid:', e.message);
    const pos = parseInt(e.message.match(/at position (\d+)/)[1]);
    console.log('Error around pos:', sJson.substring(pos - 20, pos + 20));
}
