const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('1. http://localhost:9002/admin/task-center/status 페이지 접속 중...');
  await page.goto('http://localhost:9002/admin/task-center/status');
  await page.waitForTimeout(3000); // hydration 대기

  // 월별 매트릭스 화면 검증
  const matrixScroll = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    };
  });

  const matrixWDiff = Math.abs(matrixScroll.scrollWidth - matrixScroll.clientWidth);
  const matrixHDiff = Math.abs(matrixScroll.scrollHeight - matrixScroll.clientHeight);

  console.log(`[월별 매트릭스] scrollWidth: ${matrixScroll.scrollWidth}, clientWidth: ${matrixScroll.clientWidth} (차이: ${matrixWDiff}px)`);
  console.log(`[월별 매트릭스] scrollHeight: ${matrixScroll.scrollHeight}, clientHeight: ${matrixScroll.clientHeight} (차이: ${matrixHDiff}px)`);
  console.log(`[월별 매트릭스 가로 스크롤 제거 검증]: ${matrixWDiff <= 2 ? '통과 (<= 2px)' : '실패 (> 2px)'}`);
  console.log(`[월별 매트릭스 세로 스크롤 제거 검증]: ${matrixHDiff <= 2 ? '통과 (<= 2px)' : '실패 (> 2px)'}`);

  console.log('\n2. 6월 3일(과제 결과 존재) 날짜 컬럼을 클릭하여 상세 모드로 전환 시도...');
  const dateButtons = await page.$$('button[title="일별 과제 현황 보기"]');
  let dateButton = null;
  for (const btn of dateButtons) {
    const text = await btn.evaluate(el => el.innerText);
    if (text.includes('\n3') && !text.includes('\n30')) {
      dateButton = btn;
      break;
    }
  }

  if (dateButton) {
    await dateButton.click();
    console.log('3일 날짜 버튼 클릭 완료. 상세 모드 렌더링 대기...');
    await page.waitForTimeout(2000);

    // 상세 모드 화면 검증
    const detailScroll = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      };
    });

    const detailWDiff = Math.abs(detailScroll.scrollWidth - detailScroll.clientWidth);
    const detailHDiff = Math.abs(detailScroll.scrollHeight - detailScroll.clientHeight);

    console.log(`[상세 모드] scrollWidth: ${detailScroll.scrollWidth}, clientWidth: ${detailScroll.clientWidth} (차이: ${detailWDiff}px)`);
    console.log(`[상세 모드] scrollHeight: ${detailScroll.scrollHeight}, clientHeight: ${detailScroll.clientHeight} (차이: ${detailHDiff}px)`);
    console.log(`[상세 모드 가로 스크롤 제거 검증]: ${detailWDiff <= 2 ? '통과 (<= 2px)' : '실패 (> 2px)'}`);
    console.log(`[상세 모드 세로 스크롤 제거 검증]: ${detailHDiff <= 2 ? '통과 (<= 2px)' : '실패 (> 2px)'}`);

    // 유형 결과 보기 버튼(Search 돋보기 아이콘 버튼) 찾아서 클릭
    console.log('\n3. 유형 결과 보기 돋보기 아이콘 버튼 클릭하여 모달 팝업 검증...');
    const searchBtn = await page.$('button[title="유형 결과 보기"]');
    if (searchBtn) {
      await searchBtn.click();
      console.log('돋보기 버튼 클릭 완료. 유형 결과 모달 렌더링 대기...');
      await page.waitForTimeout(2000);

      // 모달 표시 여부 검증
      const hasModal = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        return bodyText.includes('유형 결과');
      });
      console.log(`[유형 결과 모달 노출 검증]: ${hasModal ? '통과 (성공)' : '실패'}`);
    } else {
      console.log('오류: "유형 결과 보기" 돋보기 아이콘 버튼을 찾을 수 없습니다.');
    }
  } else {
    console.log('오류: 날짜 컬럼 버튼("일별 과제 현황 보기" 중 3일)을 찾을 수 없습니다.');
  }

  await browser.close();
}

run().catch(err => {
  console.error('검증 중 오류 발생:', err);
  process.exit(1);
});
