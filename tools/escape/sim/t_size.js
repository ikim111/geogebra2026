const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const U='file:///home/claude/geogebra2026/';
for(const [w,h,n] of [[1200,800,'L'],[800,1280,'P'],[390,844,'M'],[1368,912,'Surface']]){
 const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();
 const chk=async(tag)=>{const r=await p.evaluate(()=>{const o=[];for(const e of document.querySelectorAll('.scr.on button, .scr.on a, .scr.on .pt')){const s=e.getBoundingClientRect();if(!s.width)continue;if(e.classList.contains('pt'))continue;
   if(s.height<44-0.5||s.width<44-0.5)o.push((e.textContent||e.id).trim().slice(0,12)+' '+Math.round(s.width)+'x'+Math.round(s.height));
   if(s.right>innerWidth+1||s.left<-1)o.push('밖으로:'+(e.textContent||'').trim().slice(0,10));}
   const sw=document.documentElement.scrollWidth;return {o,sw,sh:document.documentElement.scrollHeight}});
   console.log(n,tag,r.sw>w?'❌가로넘침'+r.sw:'', r.o.join(' | ')||'ok', 'h='+r.sh);};
 const pad=async(sel,v)=>{await p.click(sel);for(const k of v)await p.click(`#keys button:text-is("${k}")`);await p.locator('#padOk:visible, [data-ok]:visible').first().click();};
 await p.goto(U+'escape1.html');await p.waitForTimeout(300);await chk('첫화면');
 await p.click('#startBtn');await chk('시작');
 await pad('#b_hint','0');await chk('힌트');await p.locator('.scr.on [data-back]:visible').first().click();
 await pad('#b_code','12');await chk('자물쇠');await p.locator('.scr.on [data-back]:visible').first().click();
 for(const m of ['52','44','73','3']){await pad('#b_machine',m);await p.waitForTimeout(150);await chk('기계'+m);await p.locator('.scr.on [data-back]:visible').first().click();}
 await p.waitForTimeout(1200);await p.reload();await p.waitForTimeout(400);await chk('이어하기');
 if(n==='M'||n==='Surface')await p.screenshot({path:`/tmp/claude-0/escape/shots/R_${n}_이어하기.png`});
 await pad('#endBtn','99');await chk('결과');
 await p.goto(U+'escape0.html');await p.waitForTimeout(300);await chk('연습첫');
 await pad('#b_machine','5');await p.waitForTimeout(150);await chk('연습기계');await p.locator('.scr.on [data-back]:visible').first().click();
 await pad('#b_code','0124');await pad('#endBtn','9');await chk('연습끝');
 await ctx.close();}
await b.close()})();
