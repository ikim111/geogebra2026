const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1368,height:912}});
await p.goto('file:///home/claude/geogebra2026/escape1.html');await p.waitForTimeout(300);await p.click('#startBtn');
await p.click('#b_pen');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/escape/review/undo1.png',clip:{x:780,y:180,width:540,height:420}});
const a=await p.evaluate(()=>__S.pen);await p.click('#undoPen');await p.waitForTimeout(300);
await p.screenshot({path:'/tmp/claude-0/escape/review/undo2.png',clip:{x:780,y:180,width:540,height:420}});
console.log(a,await p.evaluate(()=>[__S.pen,__S.penMs]),await p.textContent('#timer'));await b.close()})();
