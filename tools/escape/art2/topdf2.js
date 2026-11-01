const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:900,height:1200}});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(3000);
const over=await p.evaluate(()=>[...document.querySelectorAll('.sheet .card:not(.bk2)')].filter(c=>{const cap=c.querySelector('.cap');return cap&&cap.scrollHeight>cap.clientHeight+1}).map(c=>c.querySelector('.no')?.innerText));
console.log('넘침:',over.join(',')||'없음');
if(process.argv[4]){const sh=await p.$$('.sheet');for(let i=0;i<sh.length;i+=2)await sh[i].screenshot({path:process.argv[4]+'_p'+(i/2+1)+'.png'});}
await p.pdf({path:process.argv[3],format:'A4',printBackground:true,margin:{top:0,bottom:0,left:0,right:0},preferCSSPageSize:true});await b.close()})();
