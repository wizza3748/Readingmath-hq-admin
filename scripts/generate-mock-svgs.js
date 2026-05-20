const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/images/mock');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// 4번 문항 보기 산점도
const svgQ4Passage = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff" stroke="#ccc" />
  <!-- Grid -->
  <line x1="50" y1="20" x2="50" y2="180" stroke="#eee" />
  <line x1="100" y1="20" x2="100" y2="180" stroke="#eee" />
  <line x1="150" y1="20" x2="150" y2="180" stroke="#eee" />
  <line x1="200" y1="20" x2="200" y2="180" stroke="#eee" />
  <line x1="250" y1="20" x2="250" y2="180" stroke="#eee" />
  
  <line x1="20" y1="50" x2="280" y2="50" stroke="#eee" />
  <line x1="20" y1="100" x2="280" y2="100" stroke="#eee" />
  <line x1="20" y1="150" x2="280" y2="150" stroke="#eee" />
  
  <!-- Axes -->
  <line x1="20" y1="180" x2="280" y2="180" stroke="#000" stroke-width="2" />
  <line x1="20" y1="20" x2="20" y2="180" stroke="#000" stroke-width="2" />
  
  <!-- Labels -->
  <text x="280" y="195" font-size="12" text-anchor="end">음악(점)</text>
  <text x="15" y="15" font-size="12" text-anchor="start">미술(점)</text>
  
  <!-- Points -->
  <circle cx="50" cy="150" r="3" fill="#000" />
  <circle cx="100" cy="100" r="3" fill="#000" />
  <circle cx="150" cy="50" r="3" fill="#000" />
  <circle cx="200" cy="50" r="3" fill="#000" />
  <circle cx="250" cy="30" r="3" fill="#000" />
  <circle cx="150" cy="150" r="3" fill="#000" />
  <circle cx="150" cy="100" r="3" fill="#000" />
  <circle cx="200" cy="100" r="3" fill="#000" />
  <circle cx="100" cy="50" r="3" fill="#000" />
  <circle cx="50" cy="100" r="3" fill="#000" />
</svg>`;

// 4번 문항 해설 산점도 (대각선 추가)
const svgQ4Explanation = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff" stroke="#ccc" />
  <line x1="50" y1="20" x2="50" y2="180" stroke="#eee" />
  <line x1="100" y1="20" x2="100" y2="180" stroke="#eee" />
  <line x1="150" y1="20" x2="150" y2="180" stroke="#eee" />
  <line x1="200" y1="20" x2="200" y2="180" stroke="#eee" />
  <line x1="250" y1="20" x2="250" y2="180" stroke="#eee" />
  
  <line x1="20" y1="50" x2="280" y2="50" stroke="#eee" />
  <line x1="20" y1="100" x2="280" y2="100" stroke="#eee" />
  <line x1="20" y1="150" x2="280" y2="150" stroke="#eee" />
  
  <line x1="20" y1="180" x2="280" y2="180" stroke="#000" stroke-width="2" />
  <line x1="20" y1="20" x2="20" y2="180" stroke="#000" stroke-width="2" />
  
  <text x="280" y="195" font-size="12" text-anchor="end">음악(점)</text>
  <text x="15" y="15" font-size="12" text-anchor="start">미술(점)</text>
  
  <circle cx="50" cy="150" r="3" fill="#000" />
  <circle cx="100" cy="100" r="3" fill="#000" />
  <circle cx="150" cy="50" r="3" fill="#000" />
  <circle cx="200" cy="50" r="3" fill="#000" />
  <circle cx="250" cy="30" r="3" fill="#000" />
  <circle cx="150" cy="150" r="3" fill="#000" />
  <circle cx="150" cy="100" r="3" fill="#000" />
  <circle cx="200" cy="100" r="3" fill="#000" />
  <circle cx="100" cy="50" r="3" fill="#000" />
  <circle cx="50" cy="100" r="3" fill="#000" />
  
  <!-- Diagonal line -->
  <line x1="20" y1="180" x2="220" y2="20" stroke="cyan" stroke-width="2" />
</svg>`;

// 5번 문항 보기 표
const svgQ5Table = `<svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff" />
  <rect x="10" y="10" width="380" height="60" fill="none" stroke="#000" />
  <line x1="10" y1="30" x2="390" y2="30" stroke="#000" />
  <line x1="10" y1="50" x2="390" y2="50" stroke="#000" />
  
  <line x1="60" y1="10" x2="60" y2="70" stroke="#000" />
  <line x1="100" y1="10" x2="100" y2="70" stroke="#000" />
  <line x1="140" y1="10" x2="140" y2="70" stroke="#000" />
  <line x1="180" y1="10" x2="180" y2="70" stroke="#000" />
  <line x1="220" y1="10" x2="220" y2="70" stroke="#000" />
  <line x1="260" y1="10" x2="260" y2="70" stroke="#000" />
  <line x1="300" y1="10" x2="300" y2="70" stroke="#000" />
  <line x1="340" y1="10" x2="340" y2="70" stroke="#000" />
  
  <!-- Headers -->
  <text x="35" y="24" font-size="11" font-weight="bold" text-anchor="middle">학생</text>
  <text x="80" y="24" font-size="11" text-anchor="middle">A</text>
  <text x="120" y="24" font-size="11" text-anchor="middle">B</text>
  <text x="160" y="24" font-size="11" text-anchor="middle">C</text>
  <text x="200" y="24" font-size="11" text-anchor="middle">D</text>
  <text x="240" y="24" font-size="11" text-anchor="middle">E</text>
  <text x="280" y="24" font-size="11" text-anchor="middle">F</text>
  <text x="320" y="24" font-size="11" text-anchor="middle">G</text>
  <text x="365" y="24" font-size="11" text-anchor="middle">H</text>
  
  <!-- Row 1: x (2점 슛) -->
  <text x="35" y="44" font-size="11" text-anchor="middle">2점 슛(x)</text>
  <text x="80" y="44" font-size="11" text-anchor="middle">5</text>
  <text x="120" y="44" font-size="11" text-anchor="middle">2</text>
  <text x="160" y="44" font-size="11" text-anchor="middle">4</text>
  <text x="200" y="44" font-size="11" text-anchor="middle">3</text>
  <text x="240" y="44" font-size="11" text-anchor="middle">4</text>
  <text x="280" y="44" font-size="11" text-anchor="middle">5</text>
  <text x="320" y="44" font-size="11" text-anchor="middle">4</text>
  <text x="365" y="44" font-size="11" text-anchor="middle">2</text>
  
  <!-- Row 2: y (3점 슛) -->
  <text x="35" y="64" font-size="11" text-anchor="middle">3점 슛(y)</text>
  <text x="80" y="64" font-size="11" text-anchor="middle">4</text>
  <text x="120" y="64" font-size="11" text-anchor="middle">2</text>
  <text x="160" y="64" font-size="11" text-anchor="middle">3</text>
  <text x="200" y="64" font-size="11" text-anchor="middle">3</text>
  <text x="240" y="64" font-size="11" text-anchor="middle">5</text>
  <text x="280" y="64" font-size="11" text-anchor="middle">5</text>
  <text x="320" y="64" font-size="11" text-anchor="middle">3</text>
  <text x="365" y="64" font-size="11" text-anchor="middle">3</text>
</svg>`;

// Helper function for Choice Scatter Plots
function getScatterPlot(points) {
  let inner = `
  <line x1="25" y1="130" x2="135" y2="130" stroke="#000" stroke-width="1.5" />
  <line x1="25" y1="20" x2="25" y2="130" stroke="#000" stroke-width="1.5" />
  <!-- Grid -->`;
  for(let i=1; i<=5; i++) {
    inner += `<line x1="${25 + i*20}" y1="20" x2="${25 + i*20}" y2="130" stroke="#eee" />`;
    inner += `<line x1="25" y1="${130 - i*20}" x2="135" y2="${130 - i*20}" stroke="#eee" />`;
    inner += `<text x="${25 + i*20}" y="145" font-size="9" text-anchor="middle">${i}</text>`;
    inner += `<text x="15" y="${133 - i*20}" font-size="9" text-anchor="end">${i}</text>`;
  }
  
  points.forEach(p => {
    inner += `<circle cx="${25 + p[0]*20}" cy="${130 - p[1]*20}" r="3.5" fill="#000" />`;
  });
  
  return `<svg width="150" height="160" viewBox="0 0 150 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#fff" />
    ${inner}
  </svg>`;
}

// Data: (5, 4), (2, 2), (4, 3), (3, 3), (4, 5), (5, 5), (4, 3), (2, 3) 
const pointsCorrect = [[5,4], [2,2], [4,3], [3,3], [4,5], [5,5], [4,3], [2,3]];
const pointsW1 = [[4,5], [2,2], [3,4], [3,3], [5,4], [5,5], [3,4], [3,2]];
const pointsW2 = [[5,4], [1,2], [4,3], [3,2], [4,5], [5,5], [4,3], [2,3]];
const pointsW3 = [[5,4], [2,2], [4,4], [3,3], [4,5], [5,5], [4,4], [2,3]];
const pointsW4 = [[5,4], [2,2], [4,3], [3,3], [4,4], [5,5], [4,3], [2,3]];

fs.writeFileSync(path.join(dir, 'math-q4-passage.svg'), svgQ4Passage);
fs.writeFileSync(path.join(dir, 'math-q4-explanation.svg'), svgQ4Explanation);
fs.writeFileSync(path.join(dir, 'math-q5-table.svg'), svgQ5Table);
fs.writeFileSync(path.join(dir, 'math-q5-choice1.svg'), getScatterPlot(pointsW1));
fs.writeFileSync(path.join(dir, 'math-q5-choice2.svg'), getScatterPlot(pointsCorrect));
fs.writeFileSync(path.join(dir, 'math-q5-choice3.svg'), getScatterPlot(pointsW2));
fs.writeFileSync(path.join(dir, 'math-q5-choice4.svg'), getScatterPlot(pointsW3));
fs.writeFileSync(path.join(dir, 'math-q5-choice5.svg'), getScatterPlot(pointsW4));

console.log('Mock SVGs generated successfully.');
