const fs = require('fs');

const filePath = 'd:\\wizza_work\\Readingmath-hq-admin\\src\\app\\admin\\learning-history\\mockData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// --- REPAIR LINE 5 ---
let line5 = lines[4];
const line5Header = 'export const MOCK_MONTHLY_SCORES = ';
let line5Json = line5.substring(line5.indexOf('{'), line5.lastIndexOf('}') + 1);
let scores = JSON.parse(line5Json);

// --- REPAIR LINE 6 ---
let line6 = lines[5];
const line6Header = 'export const MOCK_DAILY_DETAILS = ';
// We know science is the second part. Let's find the last occurrences of closing braces.
// We expect science to end with }}};
const validEnd6 = line6.indexOf('}}}}};'); // Based on previous observation there was garbage after the first one
let line6Json = line6.substring(line6.indexOf('{'), validEnd6 + 5);
let details;
try {
    details = JSON.parse(line6Json);
} catch (e) {
    console.log('Soft parse failed, trying science-based split');
    const scienceStart = line6.indexOf('"science":{');
    const mathPart = line6.substring(line6.indexOf('{'), scienceStart).trim().replace(/,$/, '');
    const sciencePart = line6.substring(scienceStart, line6.indexOf('}}};', scienceStart) + 3);
    details = {
        math: JSON.parse(mathPart + '}'),
        science: JSON.parse('{' + sciencePart + '}')
    };
}

// --- ADD DATA ---
const targetDates = ['2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07', '2026-02-08', '2026-02-09', '2026-02-10'];
const targetDays = ['04', '05', '06', '07', '08', '09', '10'];

targetDates.forEach((date, index) => {
    const day = targetDays[index];
    const baseMath = 85 + (index % 5);
    const baseSci = 80 + (index % 7);

    // Monthly
    for (let i = 1; i <= 5; i++) {
        const sid = String(i);
        if (!scores.math['2026-02']) scores.math['2026-02'] = {};
        if (!scores.math['2026-02'][sid]) scores.math['2026-02'][sid] = {};
        scores.math['2026-02'][sid][day] = baseMath + i;

        if (!scores.science['2026-02']) scores.science['2026-02'] = {};
        if (!scores.science['2026-02'][sid]) scores.science['2026-02'][sid] = {};
        scores.science['2026-02'][sid][day] = baseSci + i;
    }

    // Daily
    details.math[date] = {
        "students": [
            { "id": "1", "s": baseMath + 1, "c": 23, "t": 25, "m": 18, "n": 2, "ti": [3, 4] },
            { "id": "2", "s": baseMath + 2, "c": 24, "t": 25, "m": 21, "n": 2, "ti": [4, 5] },
            { "id": "3", "s": baseMath + 3, "c": 21, "t": 25, "m": 23, "n": 2, "ti": [5, 6] },
            { "id": "4", "s": baseMath + 4, "c": 19, "t": 25, "m": 25, "n": 2, "ti": [6, 7] },
            { "id": "5", "s": baseMath + 5, "c": 20, "t": 25, "m": 28, "n": 2, "ti": [7, 8] }
        ],
        "summary": { "as": baseMath, "p": 5, "ts": 10, "at": 30, "tt": 150, "ac": 21, "atq": 25, "tc": 105, "ttq": 125, "art": "2.0", "tr": 10 }
    };

    details.science[date] = {
        "students": [
            { "id": "1", "s": baseSci + 1, "c": 24, "t": 25, "m": 20, "n": 2, "ti": [1, 2] },
            { "id": "2", "s": baseSci + 2, "c": 22, "t": 25, "m": 23, "n": 2, "ti": [2, 3] },
            { "id": "3", "s": baseSci + 3, "c": 23, "t": 25, "m": 25, "n": 2, "ti": [3, 4] },
            { "id": "4", "s": baseSci + 4, "c": 21, "t": 25, "m": 27, "n": 2, "ti": [4, 5] },
            { "id": "5", "s": baseSci + 5, "c": 22, "t": 25, "m": 30, "n": 2, "ti": [5, 6] }
        ],
        "summary": { "as": baseSci, "p": 5, "ts": 9, "at": 32, "tt": 160, "ac": 22, "atq": 25, "tc": 110, "ttq": 125, "art": "2.0", "tr": 10 }
    };
});

lines[4] = line5Header + JSON.stringify(scores) + ';';
lines[5] = line6Header + JSON.stringify(details) + ';';

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Final repair and update complete.');
