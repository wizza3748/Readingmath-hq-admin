const fs = require('fs');

function getValidJsonObject(str) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (!inString) {
            if (char === '{') depth++;
            else if (char === '}') {
                depth--;
                if (depth === 0) return str.substring(0, i + 1);
            }
        }
    }
    return null;
}

const filePath = 'd:\\wizza_work\\Readingmath-hq-admin\\src\\app\\admin\\learning-history\\mockData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Line 5 (Monthly)
let l5 = lines[4];
let l5Json = getValidJsonObject(l5.substring(l5.indexOf('{')));
let scores = JSON.parse(l5Json);

// Line 6 (Daily)
let l6 = lines[5];
let mathPartStart = l6.indexOf('{"math":');
let mathContent = getValidJsonObject(l6.substring(mathPartStart + 8));
let detailsMath = JSON.parse(mathContent);

let sciencePartStart = l6.indexOf('"science":{');
let scienceContent = getValidJsonObject(l6.substring(sciencePartStart + 10));
let detailsScience = JSON.parse(scienceContent);

let details = { math: detailsMath, science: detailsScience };

// Add 2026-02-04 ~ 2026-02-10
const targets = ['2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07', '2026-02-08', '2026-02-09', '2026-02-10'];
const days = ['04', '05', '06', '07', '08', '09', '10'];

targets.forEach((date, i) => {
    const day = days[i];
    const mBase = 85 + (i % 3);
    const sBase = 80 + (i % 4);

    // Monthly
    for (let s = 1; s <= 10; s++) {
        const sid = String(s);
        if (!scores.math['2026-02']) scores.math['2026-02'] = {};
        if (!scores.math['2026-02'][sid]) scores.math['2026-02'][sid] = {};
        scores.math['2026-02'][sid][day] = mBase + (s % 10);

        if (!scores.science['2026-02']) scores.science['2026-02'] = {};
        if (!scores.science['2026-02'][sid]) scores.science['2026-02'][sid] = {};
        scores.science['2026-02'][sid][day] = sBase + (s % 10);
    }

    details.math[date] = {
        students: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => ({ id: String(id), s: mBase + (id % 10), c: 20, t: 25, m: 15, n: 2, ti: [1, 2] })),
        summary: { as: mBase, p: 10, ts: 20, at: 30, tt: 300, ac: 200, atq: 250, tc: 1000, ttq: 1250, art: "2.0", tr: 20 }
    };
    details.science[date] = {
        students: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => ({ id: String(id), s: sBase + (id % 10), c: 20, t: 25, m: 15, n: 2, ti: [1, 2] })),
        summary: { as: sBase, p: 10, ts: 20, at: 30, tt: 300, ac: 200, atq: 250, tc: 1000, ttq: 1250, art: "2.0", tr: 20 }
    };
});

lines[4] = 'export const MOCK_MONTHLY_SCORES = ' + JSON.stringify(scores) + ';';
lines[5] = 'export const MOCK_DAILY_DETAILS = ' + JSON.stringify(details) + ';';

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('REPAIR SUCCESSFUL: Added data up to 2026-02-10');
