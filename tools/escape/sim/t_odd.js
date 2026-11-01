const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1200,height:800}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));let bad=0;
const T=(name,ok,info='')=>{console.log((ok?'✅':'❌'),name,info);if(!ok)bad++;};
const okb=()=>p.locator('#padOk:visible, [data-ok]:visible').first();
const back=()=>p.locator('.scr.on [data-back]:visible').first().click();
const pad=async(sel,v)=>{await p.click(sel);for(const k of v)await p.click(`#keys button:text-is("${k}")`);await okb().click();};
const pm=async()=>(await p.textContent('#padMsg')).replace(/\s+/g,' ');
const hm=async()=>(await p.textContent('#homeMsg')).replace(/\s+/g,' ');
const mm=async()=>(await p.textContent('#mMsg')).replace(/\s+/g,' ');
const S=()=>p.evaluate(()=>({...__S}));
const U='file:///home/claude/geogebra2026/';
await p.goto(U+'escape1.html');await p.waitForTimeout(300);
// 시작 전 버튼
await p.click('#b_code');T('시작 전 자물쇠 막힘',(await hm()).includes('항해 시작'));
await p.click('#startBtn');
await pad('#b_code','12');T('3자리 자물쇠: 벌점 없이 안내',(await pm()).includes('4자리')&&(await S()).wrong===0);
await back();
await pad('#b_code','4242');T('4242 이유 안내',(await pm()).includes('마름모'),'wrong='+(await S()).wrong);
await back();
await pad('#b_hint','27');T('27 힌트→시작 1단계',(await pm()).includes('그림 속'));await back();
await pad('#b_hint','0');T('0 힌트 2단계',(await pm()).includes('27과 파랑 23'));await back();
await pad('#b_hint','23');T('23 힌트 정답',(await pm()).includes('정답')&&(await pm()).includes('50'));T('힌트 수 4',(await S()).hint===4,(await S()).hint);await back();
await pad('#b_hint','23');T('더 없음 안내',(await pm()).includes('모두 봤어요'));T('힌트 수 그대로',(await S()).hint===4);await back();
await pad('#b_hint','77');T('힌트 없는 번호',(await pm()).includes('힌트가 없어요'));await back();
await pad('#b_machine','99');T('기계 아닌 번호',(await pm()).includes('기계(초록)'));await back();
await pad('#b_machine','52');await p.waitForTimeout(150);await p.click('#mOk');T('점 안 고르고 확인',(await mm()).includes('먼저 점'));
await p.click('.pt[data-x="1"][data-y="1"]');await p.click('#mOk');T('52 오답',(await mm()).includes('평행하지')&&(await S()).wrong===2);await back();
await p.click('#b_pen');T('벌점 +1',(await S()).pen===1);
await pad('#b_machine','44');await p.waitForTimeout(150);for(let i=0;i<7;i++)await p.click('[data-w="dA"][data-d="10"]');await p.click('#mOk');T('44 70° 안내',(await mm()).includes('밑각'));await back();
await pad('#b_machine','73');await p.waitForTimeout(150);for(let i=0;i<4;i++)await p.click('[data-d="10"]');await p.click('#mOk');T('73 40° 안내',(await mm()).includes('꼭지각'));
for(let i=0;i<5;i++)await p.click('[data-d="-10"]');T('다이얼 0 아래로 → 350',(await p.textContent('#dval')).includes('350'));await back();
await pad('#endBtn','98');T('틀린 탈출 번호',(await pm()).includes('아직 끝이'));await back();
// 멈춤 + 새로고침
await p.click('#pauseBtn');const t1=await p.textContent('#timer');await p.waitForTimeout(2200);const t2=await p.textContent('#timer');T('멈춤 중 시간 그대로',t1===t2,t1);
await pad('#b_code','3242');await p.waitForTimeout(1300);
const before=await S();await p.reload();await p.waitForTimeout(500);const after=await S();
T('새로고침: 기록 유지',after.pen===before.pen&&after.wrong===before.wrong&&after.hint===before.hint&&after.solved[94]===1,JSON.stringify([after.pen,after.wrong,after.hint]));
T('새로고침: 멈춤 유지',!after.running&&(await p.textContent('#pauseBtn'))==='▶');
T('새로고침: 시작 버튼 숨김',!(await p.isVisible('#startBtn'))&&(await p.isVisible('#endBtn')));
T('새로고침: 시간 유지',(await p.textContent('#timer'))===t2,await p.textContent('#timer'));
T('이어하기 안내',(await hm()).includes('이어서'));
await p.click('#pauseBtn');await p.waitForTimeout(2200);const t3=await p.textContent('#timer');T('다시 흐름',t3!==t2,t3);
await p.waitForTimeout(1200);await p.reload();await p.waitForTimeout(500);const t4=await p.textContent('#timer');T('흐르는 중 새로고침: 시간 이어짐',Math.abs(parseInt(t4.split(':')[1])-parseInt(t3.split(':')[1]))<=3,t3+'→'+t4);
T('흐르는 중 새로고침: 계속 흐름',(await S()).running);
// 숨은 번호 (94 풀었으니 58 안내)
await p.click('#b_hid');T('숨은 번호 58 안내',(await hm()).includes('58'));
// 처음부터 다시 (두 번 눌러야)
await p.reload();await p.waitForTimeout(400);await p.click('#resetGame');T('처음부터: 한 번 누르면 확인',(await p.textContent('#resetGame')).includes('한 번 더')&&(await S()).begun);
await p.click('#resetGame');await p.waitForTimeout(600);T('처음부터: 두 번 누르면 초기화',(await p.isVisible('#startBtn'))&&(await p.textContent('#timer'))==='45:00');
// 끝까지 풀고 저장 지움
await p.click('#startBtn');await pad('#endBtn','99');await p.waitForTimeout(300);
T('끝나면 저장 지움',await p.evaluate(()=>localStorage.getItem('escape:'+location.pathname.replace(/\.html$/,''))===null));
await p.reload();await p.waitForTimeout(400);T('끝난 뒤 새로고침: 새 게임',await p.isVisible('#startBtn'));
// 시간 초과
await p.click('#startBtn');await p.evaluate(()=>{__S.acc=46*60000});await p.waitForTimeout(400);T('시간 초과 + 표시',(await p.textContent('#timer')).startsWith('+'),await p.textContent('#timer'));
await pad('#endBtn','99');T('시간 초과 별 1개',(await p.innerHTML('#stars')).startsWith('★<em>'));
// 3시간 지난 저장은 버림
await p.evaluate(()=>localStorage.setItem('escape:'+location.pathname.replace(/\.html$/,''),JSON.stringify({t:Date.now()-4*3600000,acc:1,pen:5})));await p.reload();await p.waitForTimeout(400);T('오래된 기록 버림',(await S()).pen===0&&await p.isVisible('#startBtn'));
// 연습
await p.goto(U+'escape0.html');await p.waitForTimeout(300);
await pad('#b_machine','52');T('연습에서 다른 기계',(await pm()).includes('5번'));await back();
await p.click('#b_pen');await p.click('#b_hid');await p.waitForTimeout(1300);await p.reload();await p.waitForTimeout(400);
const g=await p.evaluate(()=>Object.keys(__got).join(','));T('연습 새로고침: 배지 유지',g.includes('pen')&&g.includes('hid'),g);
T('연습 새로고침: 다음 버튼 반짝',await p.evaluate(()=>document.getElementById('b_machine').classList.contains('glow')));
await pad('#b_hint','10');await back();await pad('#b_hint','10');await back();await pad('#b_hint','10');T('연습 10 힌트 3단계',(await pm()).includes('30번'));T('연습 힌트는 안 셈',(await S()).hint===0);await back();
await pad('#b_code','0124');await pad('#endBtn','9');T('연습 끝',await p.isVisible('#done'));
T('연습 끝나면 저장 지움',await p.evaluate(()=>localStorage.getItem('escape:'+location.pathname.replace(/\.html$/,''))===null));
await p.click('a.startbtn');await p.waitForTimeout(400);T('연습 → 1회로',p.url().endsWith('escape1.html')&&await p.isVisible('#startBtn'));
T('자바스크립트 오류 없음',errs.length===0,errs.join('|'));
console.log('틀림',bad);await b.close()})();
