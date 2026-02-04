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
let l5Header = 'export const MOCK_MONTHLY_SCORES = ';
let l5Json = getValidJsonObject(lines[4].substring(l5Header.length));
let scores = JSON.parse(l5Json);

// Line 6 (Daily)
let l6Header = 'export const MOCK_DAILY_DETAILS = ';
let l6Body = lines[5].substring(l6Header.length);
let mathPartStart = l6Body.indexOf('{"math":');
let mathContent = getValidJsonObject(l6Body.substring(mathPartStart + 8));
let detailsMath = JSON.parse(mathContent);

let sciencePartStart = l6Body.indexOf('"science":{');
let scienceContent = getValidJsonObject(l6Body.substring(sciencePartStart + 10));
let detailsScience = JSON.parse(scienceContent);

let details = { math: detailsMath, science: detailsScience };

// Define randomized but fixed pattern for Feb 4-10
const targets = ['2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07', '2026-02-08', '2026-02-09', '2026-02-10'];
const days = ['04', '05', '06', '07', '08', '09', '10'];

targets.forEach((date, i) => {
    const day = days[i];

    for (let s = 1; s <= 10; s++) {
        const sid = String(s);
        // Probability of having data: roughly 60%
        // Deterministic: (studentId + day) % 10 < 6
        const hasData = (s + parseInt(day)) % 3 !== 0;

        if (!scores.math['2026-02']) scores.math['2026-02'] = {};
        if (!scores.math['2026-02'][sid]) scores.math['2026-02'][sid] = {};

        if (!scores.science['2026-02']) scores.science['2026-02'] = {};
        if (!scores.science['2026-02'][sid]) scores.science['2026-02'][sid] = {};

        if (hasData) {
            const mScore = 70 + (s * 3 + i * 2) % 30;
            const sScore = 70 + (s * 2 + i * 4) % 30;

            scores.math['2026-02'][sid][day] = mScore;
            scores.science['2026-02'][sid][day] = sScore;
        } else {
            scores.math['2026-02'][sid][day] = null;
            scores.science['2026-02'][sid][day] = null;
        }
    }

    // Update Daily Details only for students who have scores
    const getDailyStudents = (subj) => {
        const list = [];
        for (let s = 1; s <= 10; s++) {
            const sid = String(s);
            const score = scores[subj]['2026-02'][sid][day];
            if (score !== null) {
                list.push({ id: sid, s: score, c: Math.round(score / 4), t: 25, m: 15 + (s % 15), n: 2, ti: [1, 2] });
            }
        }
        return list;
    };

    const mStudents = getDailyStudents('math');
    if (mStudents.length > 0) {
        details.math[date] = {
            students: mStudents,
            summary: { as: 85, p: mStudents.length, ts: 20, at: 30, tt: 30 * mStudents.length, ac: 20 * mStudents.length, atq: 25 * mStudents.length, tc: 100, ttq: 125, art: "2.0", tr: 2 * mStudents.length }
        };
    } else {
        delete details.math[date];
    }

    const sStudents = getDailyStudents('science');
    if (sStudents.length > 0) {
        details.science[date] = {
            students: sStudents,
            summary: { as: 82, p: sStudents.length, ts: 20, at: 32, tt: 32 * sStudents.length, ac: 21 * sStudents.length, atq: 25 * sStudents.length, tc: 100, ttq: 125, art: "2.0", tr: 2 * sStudents.length }
        };
    } else {
        delete details.science[date];
    }
});

lines[4] = l5Header + JSON.stringify(scores) + ';';
lines[5] = l6Header + JSON.stringify(details) + ';';

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('REALISTIC REPAIR SUCCESSFUL: Added mixed data up to 2026-02-10');
