const fs = require('fs'); 
let c = fs.readFileSync('src/lib/task-center-mock.ts', 'utf8'); 

// 1. difficulty가 없는 경우 기본으로 "basic" 주입
c = c.replace(/typeName: "([^"]+)", problemCount: (\d+), maxCount/g, 'typeName: "$1", difficulty: "basic", problemCount: $2, maxCount');

// 2. importantCount가 없는 경우 주입
// 기존에 `maxCount: { basic: X, intermediate: Y, advanced: Z } }` 로 닫힌 부분을 찾아 교체
c = c.replace(/maxCount: \{ basic: (\d+), intermediate: (\d+), advanced: (\d+) \} \}/g, 'maxCount: { basic: $1, intermediate: $2, advanced: $3 }, importantCount: { basic: 5, intermediate: 2, advanced: 1 } }');

fs.writeFileSync('src/lib/task-center-mock.ts', c);
console.log("Patched");
