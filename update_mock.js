const fs = require('fs');

const filePath = 'd:\\wizza_work\\Readingmath-hq-admin\\src\\app\\admin\\learning-history\\mockData.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Update line 5: MOCK_MONTHLY_SCORES
// We want to update day 04 for students 1-5 in both math and science for 2026-02
let line5 = lines[4];

const updateScores = (sectionName, scores) => {
    const sectionStart = line5.indexOf('"' + sectionName + '":');
    const sectionEnd = sectionName === 'math' ? line5.indexOf('"science":') : line5.length;
    let section = line5.substring(sectionStart, sectionEnd);

    const febStart = section.indexOf('"2026-02":');
    const febEnd = section.indexOf('}', febStart + 1000); // Rough estimate for month object end
    let feb = section.substring(febStart, febEnd + 1);

    for (const [studentId, score] of Object.entries(scores)) {
        const studentSearch = '"' + studentId + '":{';
        const studentStart = feb.indexOf(studentSearch);
        if (studentStart !== -1) {
            feb = feb.replace(new RegExp('(' + studentSearch.replace(/"/g, '\\"') + '[^}]*)"04":null'), '$1"04":' + score);
        }
    }

    line5 = line5.substring(0, sectionStart) + section.substring(0, febStart) + feb + section.substring(febEnd + 1) + line5.substring(sectionEnd);
};

updateScores('math', { "1": 92, "2": 95, "3": 82, "4": 65, "5": 93 });
updateScores('science', { "1": 98, "2": 88, "3": 93, "4": 63, "5": 97 });
lines[4] = line5;

// Update line 6: MOCK_DAILY_DETAILS
let line6 = lines[5];

const mathDetails = {
    "students": [
        { "id": "1", "s": 92, "c": 23, "t": 25, "m": 18, "n": 2, "ti": [3, 4] },
        { "id": "2", "s": 95, "c": 24, "t": 25, "m": 21, "n": 2, "ti": [4, 5] },
        { "id": "3", "s": 82, "c": 21, "t": 25, "m": 23, "n": 2, "ti": [5, 6] },
        { "id": "4", "s": 65, "c": 16, "t": 25, "m": 27, "n": 2, "ti": [6, 7] },
        { "id": "5", "s": 93, "c": 23, "t": 25, "m": 30, "n": 2, "ti": [7, 8] }
    ],
    "summary": { "as": 85, "p": 5, "ts": 10, "at": 30, "tt": 150, "ac": 21, "atq": 25, "tc": 107, "ttq": 125, "art": "2.0", "tr": 10 }
};

const scienceDetails = {
    "students": [
        { "id": "1", "s": 98, "c": 24, "t": 25, "m": 20, "n": 2, "ti": [1, 2] },
        { "id": "2", "s": 88, "c": 22, "t": 25, "m": 23, "n": 2, "ti": [2, 3] },
        { "id": "3", "s": 93, "c": 23, "t": 25, "m": 25, "n": 2, "ti": [3, 4] },
        { "id": "4", "s": 63, "c": 16, "t": 25, "m": 28, "n": 2, "ti": [4, 5] },
        { "id": "5", "s": 97, "c": 24, "t": 25, "m": 31, "n": 2, "ti": [5, 6] }
    ],
    "summary": { "as": 88, "p": 5, "ts": 9, "at": 32, "tt": 160, "ac": 22, "atq": 25, "tc": 109, "ttq": 125, "art": "2.0", "tr": 10 }
};

// Insert before the end of math section
line6 = line6.replace(',"science":', ',"2026-02-04":' + JSON.stringify(mathDetails) + ',"science":');
// Insert before the end of line 6 (overall object closing)
line6 = line6.replace('}}};', '},"2026-02-04":' + JSON.stringify(scienceDetails) + '}}};');

lines[5] = line6;

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Successfully updated mockData.ts');
