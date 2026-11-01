const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/claude-0/escape/art/out/cards_art.html');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const out=[];const mm=3.78;
for(const c of document.querySelectorAll('.card:not(.back)')){const no=c.querySelector('.no')?.innerText||'규칙';const cap=c.querySelector('.cap');const tx=c.querySelector('.tx');
 if(!cap){continue}
 const over=cap.scrollHeight>cap.clientHeight+1;const fs=parseFloat(getComputedStyle(tx).fontSize)/mm*2.835; // pt
 const lh=parseFloat(getComputedStyle(tx).lineHeight)||fs*1.45;const lines=Math.round(tx.scrollHeight/ (parseFloat(getComputedStyle(tx).lineHeight)||parseFloat(getComputedStyle(tx).fontSize)*1.45));
 const t=c.innerText;const bad=['디벗','합쳐 볼까','(연습)','+'].filter(w=>t.includes(w));
 out.push({no,over,pt:+fs.toFixed(1),lines,bad:bad.join(',')})}return out});
for(const x of r) if(x.over||x.pt<8||x.lines>3||x.bad) console.log(JSON.stringify(x));
console.log('총',r.length);await b.close()})();
