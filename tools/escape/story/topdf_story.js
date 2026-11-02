// 이야기 카드 PDF + 글 넘침 검사 (2026-11-02)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+require('path').resolve(process.argv[2]));await p.waitForTimeout(2000);
const o=await p.evaluate(()=>[...document.querySelectorAll('.box')].map(r=>r.scrollHeight>r.clientHeight+1));
console.log('글 넘침:', o.some(Boolean)?'❌ '+JSON.stringify(o):'없음');
await p.pdf({path:process.argv[3],format:'A4',printBackground:true,margin:{top:0,bottom:0,left:0,right:0},preferCSSPageSize:true});await b.close()})();
