const fs = require('fs');
let c = fs.readFileSync('src/lib/task-center-mock.ts', 'utf8');
c = c.replace(/problemCount:\s*(\d+),\s*maxCount:\s*\{\s*basic:\s*(\d+),\s*intermediate:\s*(\d+),\s*advanced:\s*(\d+)\s*\},\s*\}/g, 'difficulty: "basic", problemCount: $1, maxCount: { basic: $2, intermediate: $3, advanced: $4 }, importantCount: { basic: 5, intermediate: 2, advanced: 1 } }');
fs.writeFileSync('src/lib/task-center-mock.ts', c);
console.log("Patched multi-line");
