const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/claude-0/escape/art/out/cards_art.html');await p.waitForTimeout(2500);
await p.pdf({path:process.argv[2],format:'A4',printBackground:true,margin:{top:0,bottom:0,left:0,right:0},preferCSSPageSize:true});await b.close()})();
