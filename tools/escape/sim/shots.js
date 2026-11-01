const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1200,height:800}});
const D='/tmp/claude-0/escape/shots/';let i=0;const shot=async t=>{i++;await p.waitForTimeout(250);await p.screenshot({path:`${D}${String(i).padStart(2,'0')}_${t}.png`})};
const vis=()=>p.locator('.scr.on [data-back]:visible').first();const okb=()=>p.locator('#padOk:visible, [data-ok]:visible').first();
const keys=async v=>{for(const k of v)await p.click(`#keys button:text-is("${k}")`)};
// 연습
await p.goto('file:///home/claude/geogebra2026/escape0.html');await shot('연습_시작');
await p.click('#b_pen');await shot('연습_함정');
await p.click('#b_hid');await shot('연습_숨은번호');
await p.click('#b_hint');await keys('5');await shot('연습_힌트_숫자판');await okb().click();await shot('연습_힌트_결과');await vis().click();
await p.click('#b_machine');await keys('5');await okb().click();await p.click('.pt[data-x="3"][data-y="2"]');await p.click('#mOk');await shot('연습_기계_오답');
await p.click('.pt[data-x="2"][data-y="3"]');await p.click('#mOk');await shot('연습_기계_정답');
await p.click('#b_code');await keys('0124');await shot('연습_자물쇠_숫자판');await okb().click();await shot('연습_자물쇠_정답');
await p.click('#endBtn');await keys('9');await okb().click();await shot('연습_끝');
// 1회
await p.goto('file:///home/claude/geogebra2026/escape1.html');await shot('1회_첫화면');
await p.click('#startBtn');await shot('1회_시작');
await p.click('#b_machine');await keys('52');await okb().click();await shot('1회_기계52_지도');await p.click('.pt[data-x="3"][data-y="5"]');await p.click('#mOk');await shot('1회_기계52_정답');
await p.click('#b_code');await keys('2242');await okb().click();await shot('1회_자물쇠_오답');await vis().click();
await p.click('#b_code');await keys('3242');await okb().click();
await p.click('#b_hint');await keys('94');await okb().click();await shot('1회_힌트');await vis().click();
await p.click('#b_machine');await keys('44');await okb().click();for(let k=0;k<9;k++)await p.click('[data-w="dA"][data-d="10"]');for(let k=0;k<6;k++)await p.click('[data-w="dM"][data-d="1"]');await shot('1회_기계44_도르래');await p.click('#mOk');
await p.click('#b_machine');await keys('73');await okb().click();for(let k=0;k<7;k++)await p.click('[data-d="10"]');await shot('1회_기계73_나침반');await p.click('#mOk');
await p.click('#b_pen');await shot('1회_벌점');
await p.click('#b_machine');await keys('3');await okb().click();await p.click('.pt[data-x="2"][data-y="2"]');await p.click('#mOk');await shot('1회_기계3_오답');
await p.click('.pt[data-x="4"][data-y="3"]');await p.click('#mOk');
await p.click('#b_code');await keys('2000');await okb().click();
await p.click('#endBtn');await keys('99');await okb().click();await shot('1회_결과');
// 세로 2장
await p.setViewportSize({width:800,height:1200});await p.goto('file:///home/claude/geogebra2026/escape0.html');await shot('세로_연습');
await p.goto('file:///home/claude/geogebra2026/escape1.html');await p.click('#startBtn');await p.click('#b_code');await keys('94');await shot('세로_1회_숫자판');
await b.close()})();
