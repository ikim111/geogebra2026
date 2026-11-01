const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const L=(...a)=>console.log(...a);
for(const [w,h,n] of [[1200,800,'L'],[800,1200,'P'],[390,844,'M']]){
const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const vis=()=>p.locator('.scr.on [data-back]:visible').first();const okb=()=>p.locator('#padOk:visible, [data-ok]:visible').first();
const pad=async(sel,v)=>{await p.click(sel);for(const k of v)await p.click(`#keys button:text-is("${k}")`);await okb().click();};
const st=async(tag)=>{const g=await p.evaluate(()=>[...document.querySelectorAll('.glow')].map(e=>e.id).join(','));const m=(await p.textContent('#homeMsg')).replace(/\s+/g,' ');L(n,tag,'반짝:',g,'|',m.slice(-70));if(n==='L')await p.screenshot({path:`/tmp/claude-0/escape/rv/f_${tag}.png`});};
await p.goto('file:///home/claude/geogebra2026/escape0.html');await p.waitForTimeout(300);await st('0시작');
await p.click('#b_pen');await st('1벌점');
await p.click('#b_hid');await st('2숨은');
await pad('#b_hint','5');await vis().click();
await pad('#b_machine','5');await p.waitForTimeout(200);await p.click('.pt[data-x="2"][data-y="3"]');await p.click('#mOk');await st('3기계');
await pad('#b_code','0124');await st('4자물쇠');
await pad('#endBtn','9');L(n,'끝',await p.isVisible('#done'),await p.evaluate(()=>document.documentElement.scrollWidth),errs);
await p.close()}
await b.close()})();
