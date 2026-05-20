const fs = require('fs');

const file = 'src/lib/task-center-mock.ts';
let content = fs.readFileSync(file, 'utf8');

const t001 = `    selectedTypes: [
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-2-1-1", majorUnit: "3단원-문자와 식", minorUnit: "문자와 식 (1)",
        typeName: "문자와 식 구하기",
        problemCount: 5, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-2-1-2", majorUnit: "3단원-문자와 식", minorUnit: "문자와 식 (1)",
        typeName: "여러 가지 방법으로 문자와 식 구하기",
        problemCount: 5, maxCount: { basic: 8, intermediate: 8, advanced: 4 },
      },
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-2-2-1", majorUnit: "3단원-문자와 식", minorUnit: "문자와 식 (2)",
        typeName: "문자와 식 완성하기",
        problemCount: 5, maxCount: { basic: 2, intermediate: 8, advanced: 10 },
      },
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-3-1-1", majorUnit: "4단원-좌표평면과 그래프", minorUnit: "좌표평면과 그래프 (1)",
        typeName: "좌표평면과 그래프 구하기",
        problemCount: 5, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-3-1-2", majorUnit: "4단원-좌표평면과 그래프", minorUnit: "좌표평면과 그래프 (1)",
        typeName: "여러 가지 방법으로 좌표평면과 그래프 구하기",
        problemCount: 5, maxCount: { basic: 8, intermediate: 8, advanced: 4 },
      },
    ]`;

const t002 = `    selectedTypes: [
      {
        curriculumId: "math-초3-1", course: "초3-1",
        typeId: "mt-초3-1-0-1-1", majorUnit: "1단원-덧셈과 뺄셈", minorUnit: "덧셈과 뺄셈 (1)",
        typeName: "덧셈과 뺄셈 구하기",
        problemCount: 8, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
    ]`;

const t003 = `    selectedTypes: [
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-0-1-1", majorUnit: "1단원-소인수분해", minorUnit: "소인수분해 (1)",
        typeName: "소인수분해 구하기",
        problemCount: 5, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
    ]`;

const t004 = `    selectedTypes: [
      {
        curriculumId: "math-초3-1", course: "초3-1",
        typeId: "mt-초3-1-0-1-1", majorUnit: "1단원-덧셈과 뺄셈", minorUnit: "덧셈과 뺄셈 (1)",
        typeName: "덧셈과 뺄셈 구하기",
        problemCount: 5, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
      {
        curriculumId: "math-초3-1", course: "초3-1",
        typeId: "mt-초3-1-1-1-1", majorUnit: "2단원-평면도형", minorUnit: "평면도형 (1)",
        typeName: "평면도형 구하기",
        problemCount: 5, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
    ]`;

const t005 = `    selectedTypes: [
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-0-1-1", majorUnit: "1단원-소인수분해", minorUnit: "소인수분해 (1)",
        typeName: "소인수분해 구하기",
        problemCount: 5, maxCount: { basic: 10, intermediate: 5, advanced: 2 },
      },
      {
        curriculumId: "math-중1-1", course: "중1-1",
        typeId: "mt-중1-1-0-1-2", majorUnit: "1단원-소인수분해", minorUnit: "소인수분해 (1)",
        typeName: "여러 가지 방법으로 소인수분해 구하기",
        problemCount: 5, maxCount: { basic: 8, intermediate: 8, advanced: 4 },
      },
    ]`;

content = content.replace(/id: "task-001"[\s\S]*?selectedTypes: \[\s*[\s\S]*?\s*\]/, match => match.replace(/selectedTypes: \[\s*[\s\S]*?\s*\]/, t001));
content = content.replace(/id: "task-002"[\s\S]*?selectedTypes: \[\s*[\s\S]*?\s*\]/, match => match.replace(/selectedTypes: \[\s*[\s\S]*?\s*\]/, t002));
content = content.replace(/id: "task-003"[\s\S]*?selectedTypes: \[\s*[\s\S]*?\s*\]/, match => match.replace(/selectedTypes: \[\s*[\s\S]*?\s*\]/, t003));
content = content.replace(/id: "task-004"[\s\S]*?selectedTypes: \[\s*[\s\S]*?\s*\]/, match => match.replace(/selectedTypes: \[\s*[\s\S]*?\s*\]/, t004));
content = content.replace(/id: "task-005"[\s\S]*?selectedTypes: \[\s*[\s\S]*?\s*\]/, match => match.replace(/selectedTypes: \[\s*[\s\S]*?\s*\]/, t005));

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed INITIAL_TASKS selectedTypes to match new mock data.');
