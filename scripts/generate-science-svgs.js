const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/images/mock');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function getFunnel() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="100%" height="100%">
  <rect width="200" height="300" fill="#f8f9fa"/>
  <path d="M70,50 L130,50 L130,120 L110,180 L110,230 L90,230 L90,180 L70,120 Z" fill="none" stroke="#2c3e50" stroke-width="3"/>
  <path d="M72,120 L128,120 L110,175 L90,175 Z" fill="#ffd700" opacity="0.6"/>
  <path d="M90,175 L110,175 L110,210 L90,210 Z" fill="#3498db" opacity="0.6"/>
  <text x="140" y="140" font-family="sans-serif" font-size="20" fill="#333" font-weight="bold">A</text>
  <text x="140" y="195" font-family="sans-serif" font-size="20" fill="#333" font-weight="bold">B</text>
  <rect x="85" y="30" width="30" height="20" fill="#bdc3c7" rx="5"/>
  <text x="140" y="45" font-family="sans-serif" font-size="16" fill="#333">마개</text>
  <circle cx="100" cy="220" r="15" fill="#e74c3c" opacity="0.8"/>
  <rect x="70" y="215" width="60" height="10" fill="#c0392b"/>
  <text x="140" y="225" font-family="sans-serif" font-size="16" fill="#333">꼭지</text>
</svg>`;
}

function getPieChart() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="100%" height="100%">
  <rect width="300" height="200" fill="#ffffff"/>
  <circle cx="100" cy="100" r="80" fill="#a4c639"/>
  <path d="M100,100 L100,20 A80,80 0 0,0 20,100 Z" fill="#5cacee"/>
  <path d="M100,100 L20,100 A80,80 0 0,0 100,180 Z" fill="#ff7f50"/>
  <path d="M100,100 L100,180 A80,80 0 0,0 180,100 Z" fill="#a4c639"/>
  
  <text x="140" y="80" font-family="sans-serif" font-size="20" font-weight="bold" fill="#333">(가)</text>
  <text x="145" y="105" font-family="sans-serif" font-size="16" font-weight="bold" fill="#333">51 %</text>
  
  <text x="75" y="150" font-family="sans-serif" font-size="16" font-weight="bold" fill="#333">(나)</text>
  <text x="75" y="170" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">12 %</text>
  
  <text x="35" y="125" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">11 %</text>
  <text x="35" y="85" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">5 %</text>
  <text x="50" y="55" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">5 %</text>
  <text x="90" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#333">16 %</text>
  <circle cx="100" cy="100" r="25" fill="#ffffff"/>
</svg>`;
}

function getGraph() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 250" width="100%" height="100%">
  <rect width="300" height="250" fill="#ffffff"/>
  <line x1="50" y1="200" x2="280" y2="200" stroke="#333" stroke-width="2"/>
  <line x1="50" y1="20" x2="50" y2="200" stroke="#333" stroke-width="2"/>
  <text x="150" y="235" font-family="sans-serif" font-size="14" fill="#333" font-weight="bold">구리의 질량(g)</text>
  <text x="25" y="130" font-family="sans-serif" font-size="14" fill="#333" font-weight="bold" transform="rotate(-90 25 130)">산소의 질량(g)</text>
  
  <!-- Y axis ticks -->
  <line x1="45" y1="164" x2="55" y2="164" stroke="#333"/>
  <line x1="45" y1="128" x2="55" y2="128" stroke="#333"/>
  <line x1="45" y1="92" x2="55" y2="92" stroke="#333"/>
  <line x1="45" y1="56" x2="55" y2="56" stroke="#333"/>
  <text x="35" y="169" font-family="sans-serif" font-size="12">1</text>
  <text x="35" y="133" font-family="sans-serif" font-size="12">2</text>
  <text x="35" y="97" font-family="sans-serif" font-size="12">3</text>
  <text x="35" y="61" font-family="sans-serif" font-size="12">4</text>
  
  <!-- X axis ticks -->
  <line x1="94" y1="195" x2="94" y2="205" stroke="#333"/>
  <line x1="138" y1="195" x2="138" y2="205" stroke="#333"/>
  <line x1="182" y1="195" x2="182" y2="205" stroke="#333"/>
  <line x1="226" y1="195" x2="226" y2="205" stroke="#333"/>
  <line x1="270" y1="195" x2="270" y2="205" stroke="#333"/>
  <text x="90" y="220" font-family="sans-serif" font-size="12">4</text>
  <text x="134" y="220" font-family="sans-serif" font-size="12">8</text>
  <text x="175" y="220" font-family="sans-serif" font-size="12">12</text>
  <text x="219" y="220" font-family="sans-serif" font-size="12">16</text>
  <text x="263" y="220" font-family="sans-serif" font-size="12">20</text>
  
  <text x="35" y="215" font-family="sans-serif" font-size="12">0</text>
  
  <!-- Data Line -->
  <line x1="50" y1="200" x2="270" y2="20" stroke="#e74c3c" stroke-width="3"/>
</svg>`;
}

function getMolecules() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" width="100%" height="100%">
  <rect width="500" height="200" fill="#ffffff"/>
  
  <!-- Box 1 (Hydrogen) -->
  <rect x="20" y="50" width="60" height="60" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
  <circle cx="40" cy="80" r="10" fill="#fff59d"/>
  <text x="35" y="85" font-family="sans-serif" font-size="12">H</text>
  <circle cx="60" cy="80" r="10" fill="#fff59d"/>
  <text x="55" y="85" font-family="sans-serif" font-size="12">H</text>
  
  <!-- Box 2 (Hydrogen) -->
  <rect x="80" y="50" width="60" height="60" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
  <circle cx="100" cy="80" r="10" fill="#fff59d"/>
  <text x="95" y="85" font-family="sans-serif" font-size="12">H</text>
  <circle cx="120" cy="80" r="10" fill="#fff59d"/>
  <text x="115" y="85" font-family="sans-serif" font-size="12">H</text>
  
  <text x="80" y="140" font-family="sans-serif" font-size="18" font-weight="bold" fill="#333">수소</text>
  
  <text x="160" y="90" font-family="sans-serif" font-size="30" font-weight="bold" fill="#3498db">+</text>
  
  <!-- Box 3 (Oxygen) -->
  <rect x="200" y="50" width="60" height="60" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
  <circle cx="220" cy="80" r="12" fill="#ef9a9a"/>
  <text x="214" y="85" font-family="sans-serif" font-size="12">O</text>
  <circle cx="240" cy="80" r="12" fill="#ef9a9a"/>
  <text x="234" y="85" font-family="sans-serif" font-size="12">O</text>
  
  <text x="210" y="140" font-family="sans-serif" font-size="18" font-weight="bold" fill="#333">산소</text>
  
  <path d="M 280 80 L 320 80 L 320 70 L 340 85 L 320 100 L 320 90 L 280 90 Z" fill="#e74c3c"/>
  
  <!-- Box 4 (Water) -->
  <rect x="360" y="50" width="60" height="60" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
  <circle cx="390" cy="80" r="12" fill="#ef9a9a"/>
  <text x="384" y="85" font-family="sans-serif" font-size="12">O</text>
  <circle cx="372" cy="70" r="8" fill="#fff59d"/>
  <text x="368" y="74" font-family="sans-serif" font-size="10">H</text>
  <circle cx="408" cy="70" r="8" fill="#fff59d"/>
  <text x="404" y="74" font-family="sans-serif" font-size="10">H</text>
  
  <!-- Box 5 (Water) -->
  <rect x="420" y="50" width="60" height="60" fill="#e0f7fa" stroke="#b2ebf2" stroke-width="2"/>
  <circle cx="450" cy="80" r="12" fill="#ef9a9a"/>
  <text x="444" y="85" font-family="sans-serif" font-size="12">O</text>
  <circle cx="432" cy="70" r="8" fill="#fff59d"/>
  <text x="428" y="74" font-family="sans-serif" font-size="10">H</text>
  <circle cx="468" cy="70" r="8" fill="#fff59d"/>
  <text x="464" y="74" font-family="sans-serif" font-size="10">H</text>
  
  <text x="400" y="140" font-family="sans-serif" font-size="18" font-weight="bold" fill="#333">수증기</text>
</svg>`;
}

fs.writeFileSync(path.join(outDir, 'science-q7-funnel.svg'), getFunnel());
fs.writeFileSync(path.join(outDir, 'science-q8-piechart.svg'), getPieChart());
fs.writeFileSync(path.join(outDir, 'science-q9-graph.svg'), getGraph());
fs.writeFileSync(path.join(outDir, 'science-q10-molecules.svg'), getMolecules());

console.log('Science SVG mock images generated successfully!');
