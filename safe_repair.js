const fs = require('fs');
const filePath = 'd:\\wizza_work\\Readingmath-hq-admin\\src\\app\\admin\\learning-history\\mockData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Line 5 Fix
let l5 = lines[4];
let l5j = l5.substring(l5.indexOf('{'), l5.lastIndexOf('}') + 1);
let scores = JSON.parse(l5j);

// Line 6 Fix
let l6 = lines[5];
const mathPartStart = l6.indexOf('{"math":');
const sciPartStart = l6.indexOf(',"science":');
const mathJson = l6.substring(mathPartStart + 8, sciPartStart) + '}';
const sciJsonRaw = l6.substring(sciPartStart + 11);
const sciEnd = sciJsonRaw.indexOf('}}};');
const sciJson = sciJsonRaw.substring(0, sciEnd + 3);

let details = {
    math: JSON.parse(mathJson),
    science: JSON.parse(sciJson)
};

// Add 7 days of data
const targets = ['2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07', '2026-02-08', '2026-02-09', '2026-02-10'];
const days = ['04', '05', '06', '07', '08', '09', '10'];

targets.forEach((date, i) => {
    const day = days[i];
    const mBase = 85;
    const sBase = 80;

    for (let s = 1; s <= 5; s++) {
        const sid = String(s);
        if (!scores.math['2026-02']) scores.math['2026-02'] = {};
        if (!scores.math['2026-02'][sid]) scores.math['2026-02'][sid] = {};
        scores.math['2026-02'][sid][day] = mBase + s;
        if (!scores.science['2026-02']) scores.science['2026-02'] = {};
        if (!scores.science['2026-02'][sid]) scores.science['2026-02'][sid] = {};
        scores.science['2026-02'][sid][day] = sBase + s;
    }

    details.math[date] = {
        students: [1, 2, 3, 4, 5].map(id => ({ id: String(id), s: mBase + id, c: 20, t: 25, m: 15 + id, n: 2, ti: [1, 2] })),
        summary: { as: mBase, p: 5, ts: 10, at: 30, tt: 150, ac: 100, atq: 125, tc: 500, ttq: 625, art: "2.0", tr: 10 }
    };
    details.science[date] = {
        students: [1, 2, 3, 4, 5].map(id => ({ id: String(id), s: sBase + id, c: 20, t: 25, m: 15 + id, n: 2, ti: [1, 2] })),
        summary: { as: sBase, p: 5, ts: 10, at: 30, tt: 150, ac: 100, atq: 125, tc: 500, ttq: 625, art: "2.0", tr: 10 }
    };
});

lines[4] = 'export const MOCK_MONTHLY_SCORES = ' + JSON.stringify(scores) + ';';
lines[5] = 'export const MOCK_DAILY_DETAILS = ' + JSON.stringify(details) + ';';

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('REPAIRED AND UPDATED FEB 4-10');
