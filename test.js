const { chromium } = require('playwright');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, 'shopping-list.html').replace(/\\/g, '/');

let passed = 0;
let failed = 0;

function log(ok, msg) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${msg}`);
  ok ? passed++ : failed++;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(FILE);

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.fill('#itemInput', '사과');
  await page.click('button:has-text("추가")');
  const item1 = await page.locator('li span').filter({ hasText: '사과' }).count();
  log(item1 === 1, '아이템 추가: "사과" 등록됨');

  await page.fill('#itemInput', '바나나');
  await page.press('#itemInput', 'Enter');
  const item2 = await page.locator('li span').filter({ hasText: '바나나' }).count();
  log(item2 === 1, '아이템 추가: Enter키로 "바나나" 등록됨');

  await page.fill('#itemInput', '우유');
  await page.click('button:has-text("추가")');
  const totalItems = await page.locator('li').count();
  log(totalItems === 3, `아이템 추가: 총 3개 등록됨 (실제: ${totalItems}개)`);

  const checkboxes = page.locator('li input[type="checkbox"]');
  await checkboxes.nth(0).check();
  const isDone = await page.locator('li.done').count();
  log(isDone === 1, '체크 기능: 첫 번째 아이템 완료 처리됨');

  const summaryText = await page.locator('#summary').textContent();
  log(summaryText.includes('1 / 3'), `요약 카운터: "${summaryText.trim()}" (1/3 완료 표시)`);

  await checkboxes.nth(0).uncheck();
  const isDoneAfterUncheck = await page.locator('li.done').count();
  log(isDoneAfterUncheck === 0, '체크 해제: 완료 상태 해제됨');

  await checkboxes.nth(0).check();

  await page.click('#f-done');
  const doneVisible = await page.locator('li').count();
  log(doneVisible === 1, `필터 "완료": ${doneVisible}개 표시 (완료된 것만)`);

  await page.click('#f-todo');
  const todoVisible = await page.locator('li').count();
  log(todoVisible === 2, `필터 "미완료": ${todoVisible}개 표시 (미완료만)`);

  await page.click('#f-all');
  const allVisible = await page.locator('li').count();
  log(allVisible === 3, `필터 "전체": ${allVisible}개 표시 (전체)`);

  const delBtns = page.locator('li button.del');
  await delBtns.nth(1).click();
  const afterDel = await page.locator('li').count();
  log(afterDel === 2, `개별 삭제: 삭제 후 ${afterDel}개 남음`);

  const clearBtn = page.locator('.clear-btn');
  const clearVisible = await clearBtn.isVisible();
  log(clearVisible, '"완료 항목 모두 삭제" 버튼 표시됨');

  await clearBtn.click();
  const afterClear = await page.locator('li').count();
  log(afterClear === 1, `일괄 삭제: 완료 항목 삭제 후 ${afterClear}개 남음`);

  await page.reload();
  const afterReload = await page.locator('li').count();
  log(afterReload === 1, `localStorage: 새로고침 후 ${afterReload}개 유지됨`);

  const beforeEmpty = await page.locator('li').count();
  await page.fill('#itemInput', '   ');
  await page.click('button:has-text("추가")');
  const afterEmpty = await page.locator('li').count();
  log(afterEmpty === beforeEmpty, '빈 입력 방지: 공백만 입력 시 추가 안 됨');

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`총 ${passed + failed}개 테스트: ✅ ${passed}개 통과, ❌ ${failed}개 실패`);

  await page.waitForTimeout(2000);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();