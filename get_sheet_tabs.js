
const https = require('https');
const http = require('http');
const fs = require('fs');

function fetchWithRedirect(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    };
    protocol.get(url, options, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location && maxRedirects > 0) {
        resolve(fetchWithRedirect(res.headers.location, maxRedirects - 1));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// CSV로 각 탭 데이터를 가져오는 함수
async function fetchCSV(sheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const result = await fetchWithRedirect(url);
  return result.body;
}

// 구글 시트 공개 HTML에서 탭 정보 추출
async function getSheetTabs(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  const result = await fetchWithRedirect(url);
  const html = result.body;
  
  // 탭 정보 추출 시도 - 구글 시트 HTML 구조에서
  const tabMatches = [];
  
  // 패턴 1: data-sheet-id 속성
  const pattern1 = /data-sheet-id="(\d+)"[^>]*>([^<]+)</g;
  let m;
  while ((m = pattern1.exec(html)) !== null) {
    tabMatches.push({ gid: m[1], name: m[2].trim() });
  }
  
  // 패턴 2: JSON 데이터에서
  const pattern2 = /"sheetId":(\d+),"title":"([^"]+)"/g;
  while ((m = pattern2.exec(html)) !== null) {
    tabMatches.push({ gid: m[1], name: m[2] });
  }
  
  return { html: html.substring(0, 500), tabs: tabMatches };
}

// 스프레드시트 목록
const SPREADSHEETS = [
  { id: '1K6YjmmcrKeBtgJ0rivv8cMDyg-pgz-N5eexFpVLx15I', course: '초3-1' },
  { id: '1FlQ0zcjH_x78osyXPegay_iapxjkx0_cZgyqQ6Z9Fyk', course: '초3-2' },
  { id: '1CgZOQ6Qb_uXUCj-2i8ZUP5tuj1ukokI35Etrc-8EN4g', course: '초4-1' },
  { id: '12VRiRJX1aAw7hXFT76H1-jgLTlHTnsw2kXMIQMoJYzY', course: '초4-2' },
  { id: '1u1Am6-fRx98fpqldlW8hXySMZp-5eMxfIGQm8_yRweA', course: '초5-1' },
  { id: '1GdQVmkPZxO1yRZZGRqXkdM2edJFZsKC2S7sS94A5d8Q', course: '초5-2' },
  { id: '1pXLFmAHwhxU-znjdlQ51m7mEOQxvSmMe2hnoBPpciiA', course: '초6-1' },
  { id: '1RL4Szka_IwaXOFDol7eq4IS-Fqm0PEQaXtvKKiQmV5I', course: '초6-2' },
];

async function main() {
  // 초3-1 첫 번째 탭 샘플 테스트
  console.log('=== 샘플 테스트: 초3-1, gid=683818219 ===');
  const csv = await fetchCSV('1K6YjmmcrKeBtgJ0rivv8cMDyg-pgz-N5eexFpVLx15I', '683818219');
  console.log('CSV 첫 30줄:');
  csv.split('\n').slice(0, 30).forEach((line, i) => console.log(`${i+1}: ${line}`));
  
  // HTML에서 탭 정보 추출 시도
  console.log('\n=== HTML에서 탭 정보 추출 시도 ===');
  const tabInfo = await getSheetTabs('1K6YjmmcrKeBtgJ0rivv8cMDyg-pgz-N5eexFpVLx15I');
  console.log('HTML preview:', tabInfo.html);
  console.log('Found tabs:', JSON.stringify(tabInfo.tabs.slice(0, 20), null, 2));
}

main().catch(console.error);
