const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const L=(...a)=>console.log(...a);
for(const [w,h,n] of [[1200,800,'L'],[800,1200,'P'],[390,844,'M']]){
const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const vis=()=>p.locator('.scr.on [data-back]:visible').first();const okb=()=>p.locator('#padOk:visible, [data-ok]:visible').first();
const pad=async(sel,v)=>{await p.click(sel);for(const k of v)await p.click(`#keys button:text-is("${k}")`);await okb().click();};
const msg=async()=>(await p.textContent('#homeMsg')).replace(/\s+/g,' ').slice(0,80);const got=async()=>Object.keys(await p.evaluate(()=>__got)).join(',');
await p.goto('file:///home/claude/geogebra2026/escape0.html');await p.waitForTimeout(300);
if(n==='L')await p.screenshot({path:'/tmp/claude-0/escape/rv/c_p1.png'});
await p.click('#b_pen');L(n,'벌점',await msg(),await got());
await p.click('#b_hid');L(n,'숨은',await msg());
await pad('#b_hint','5');await vis().click();L(n,'힌트',await got());
await pad('#b_machine','5');await p.waitForTimeout(200);await p.click('.pt[data-x="2"][data-y="3"]');await p.click('#mOk');L(n,'기계',await msg(),await got());
if(n==='L')await p.screenshot({path:'/tmp/claude-0/escape/rv/c_p2.png'});
await pad('#b_code','0124');L(n,'자물쇠',await msg(),await got());
await pad('#endBtn','9');L(n,'끝',await p.isVisible('#done'),(await p.textContent('#resTb')).replace(/\s+/g,' '));
if(n==='L')await p.screenshot({path:'/tmp/claude-0/escape/rv/c_p3.png'});
L(n,'넘침',await p.evaluate(()=>document.documentElement.scrollWidth),errs);
await p.goto('file:///home/claude/geogebra2026/escape1.html');await p.waitForTimeout(300);await p.click('#startBtn');
await pad('#b_machine','52');await p.waitForTimeout(200);await p.click('.pt[data-x="3"][data-y="5"]');await p.click('#mOk');
await pad('#b_code','3242');await pad('#b_machine','44');await p.waitForTimeout(200);for(let i=0;i<9;i++)await p.click('[data-w="dA"][data-d="10"]');for(let i=0;i<6;i++)await p.click('[data-w="dM"][data-d="1"]');await p.click('#mOk');
await pad('#b_machine','73');await p.waitForTimeout(200);for(let i=0;i<7;i++)await p.click('[data-d="10"]');await p.click('#mOk');
await pad('#b_machine','3');await p.waitForTimeout(200);await p.click('.pt[data-x="4"][data-y="3"]');await p.click('#mOk');
await pad('#b_code','2000');await pad('#endBtn','99');L(n,'1회 결과',(await p.textContent('#resTb')).replace(/\s+/g,' '),await p.evaluate(()=>document.documentElement.scrollWidth),errs);
await p.goto('file:///home/claude/geogebra2026/escape1-k7q2m.html');await p.waitForTimeout(500);L(n,'옛 주소 →',p.url().split('/').pop());
await p.close()}
await b.close()})();
