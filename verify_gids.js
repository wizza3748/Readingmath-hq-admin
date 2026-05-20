
const https = require('https');
const http = require('http');

function fetchCSVWithRedirect(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const options = { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/csv,text/plain,*/*'
      } 
    };
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, options, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location && maxRedirects > 0) {
        res.resume();
        resolve(fetchCSVWithRedirect(res.headers.location, maxRedirects - 1));
        return;
      }
      if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ ok: true, status: res.statusCode, data: Buffer.concat(chunks).toString('utf8') }));
      } else {
        res.resume();
        resolve({ ok: false, status: res.statusCode });
      }
    }).on('error', (e) => resolve({ ok: false, status: 0, error: e.message }));
  });
}

function fetchCSV(sheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  return fetchCSVWithRedirect(url);
}

const SHEET_ID = '1K6YjmmcrKeBtgJ0rivv8cMDyg-pgz-N5eexFpVLx15I';
const GIDS_TO_TEST = [683818219, 1546606709, 536019535, 1472784627, 1429699281, 222733154];

async function main() {
  console.log('=== GID 유효성 검증 (초3-1) ===');
  for (const gid of GIDS_TO_TEST) {
    const result = await fetchCSV(SHEET_ID, gid);
    if (result.ok) {
      const lines = result.data.split('\n').slice(0, 10);
      const unitLine = lines.find(l => l.includes('단원') || l.includes('소단원'));
      console.log(`  ✓ GID ${gid} - 유효, 단원 정보: ${unitLine ? unitLine.substring(0, 100) : '없음'}`);
    } else {
      console.log(`  ✗ GID ${gid} - 실패 (${result.status})`);
    }
  }
}

main().catch(console.error);
