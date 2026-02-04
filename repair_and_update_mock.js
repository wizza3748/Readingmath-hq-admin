const fs = require('fs');

const filePath = 'd:\\wizza_work\\Readingmath-hq-admin\\src\\app\\admin\\learning-history\\mockData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// --- REPAIR AND PARSE LINE 5 (MOCK_MONTHLY_SCORES) ---
let line5Raw = lines[4].trim();
if (!line5Raw.endsWith(';')) line5Raw += ';';
const line5Json = line5Raw.replace('export const MOCK_MONTHLY_SCORES = ', '').replace(/;$/, '');
let scores;
try {
    scores = JSON.parse(line5Json);
} catch (e) {
    console.error('Line 5 Parse Error:', e.message);
    // If it's broken, we might need more aggressive cleanup, but line 5 was reported valid.
    scores = JSON.parse(line5Json);
}

// --- REPAIR AND PARSE LINE 6 (MOCK_DAILY_DETAILS) ---
let line6Raw = lines[5].trim();
// Aggressive cleanup: Find the last valid '}}};'
const lastValidIdx = line6Raw.lastIndexOf('}}};');
if (lastValidIdx !== -1) {
    line6Raw = line6Raw.substring(0, lastValidIdx + 4);
}
const line6Json = line6Raw.replace('export const MOCK_DAILY_DETAILS = ', '').replace(/;$/, '');
let details;
try {
    details = JSON.parse(line6Json);
} catch (e) {
    console.error('Line 6 is broken, attempting to fix...', e.message);
    // Try to find where science ends and garbage starts
    const sciEnd = line6Raw.lastIndexOf('}}};');
    const fixedJson = line6Raw.substring(0, sciEnd + 3).replace('export const MOCK_DAILY_DETAILS = ', '');
    details = JSON.parse(fixedJson);
}

// --- GENERATE DATA FOR FEB 4 - FEB 10 ---
const targetDates = ['2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07', '2026-02-08', '2026-02-09', '2026-02-10'];
const targetDays = ['04', '05', '06', '07', '08', '09', '10'];

targetDates.forEach((date, index) => {
    const day = targetDays[index];

    // Update Monthly Scores
    const baseMath = 85 + (index % 5);
    const baseSci = 80 + (index % 7);

    for (let i = 1; i <= 5; i++) {
        if (!scores.math['2026-02']) scores.math['2026-02'] = {};
        if (!scores.math['2026-02'][i]) scores.math['2026-02'][i] = {};
        scores.math['2026-02'][i][day] = baseMath + i;

        if (!scores.science['2026-02']) scores.science['2026-02'] = {};
        if (!scores.science['2026-02'][i]) scores.science['2026-02'][i] = {};
        scores.science['2026-02'][i][day] = baseSci + i;
    }

    // Update Daily Details
    const mathEntry = {
        "students": [
            { "id": "1", "s": baseMath + 1, "c": 23, "t": 25, "m": 18, "n": 2, "ti": [3, 4] },
            { "id": "2", "s": baseMath + 2, "c": 24, "t": 25, "m": 21, "n": 2, "ti": [4, 5] },
            { "id": "3", "s": baseMath + 3, "c": 21, "t": 25, "m": 23, "n": 2, "ti": [5, 6] }
        ],
        "summary": { "as": baseMath, "p": 3, "ts": 10, "at": 30, "tt": 90, "ac": 21, "atq": 25, "tc": 63, "ttq": 75, "art": "2.0", "tr": 6 }
    };

    const scienceEntry = {
        "students": [
            { "id": "1", "s": baseSci + 1, "c": 24, "t": 25, "m": 20, "n": 2, "ti": [1, 2] },
            { "id": "2", "s": baseSci + 2, "c": 22, "t": 25, "m": 23, "n": 2, "ti": [2, 3] }
        ],
        "summary": { "as": baseSci, "p": 2, "ts": 9, "at": 32, "tt": 64, "ac": 22, "atq": 25, "tc": 44, "ttq": 50, "art": "2.0", "tr": 4 }
    };

    details.math[date] = mathEntry;
    details.science[date] = scienceEntry;
});

// --- WRITE BACK ---
lines[4] = 'export const MOCK_MONTHLY_SCORES = ' + JSON.stringify(scores) + ';';
lines[5] = 'export const MOCK_DAILY_DETAILS = ' + JSON.stringify(details) + ';';

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Successfully repaired and updated mockData.ts for dates up to 2026-02-10');
