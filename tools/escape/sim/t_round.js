// 2·3회 화면 끝까지 풀기 + 오답 + 화면 크기 점검: node t_round.js 2
const {chromium}=require('playwright');const N=process.argv[2];
const PLAN={2:[['mach','37',{dial:8}],['mach','59',{dial:9}],['mach','27',{pt:[8,6]}],['mach','18',{dial:13}],['code','83','1810'],['code','48','3012']],
            3:[['code','52','1214'],['mach','36',{wh:24}],['mach','28',{cnt:19}],['mach','45',{dial:21}],['code','57','1516'],['code','75','2025'],['mach','49',{pick:['4','8','12','16','20','7','14']}]]};
const WRONG={2:[['mach','37',{dial:4},'풍덩'],['code','1215','9칸'],['mach','27',{pt:[4,6]},'꺾어'],['mach','18',{dial:17},'더했'],['mach','59',{dial:13},'그림자'],['code','3112','2배'],['code','0012','나머지 각']],
             3:[['mach','36',{wh:16},'4 × 4'],['mach','28',{cnt:38},'1/2'],['mach','45',{dial:12},'다른 경우'],['mach','49',{pick:['4','8','12','16','20']},'7의 배수'],['mach','49',{pick:['4','9']},'아닌 카드']]};
(async()=>{const b=await chromium.launch();let bad=0;const T=(n,ok,i='')=>{console.log(ok?'✅':'❌',n,i);if(!ok)bad++};
for(const [w,h,tag] of [[1368,912,'Surface'],[390,844,'폰'],[800,1280,'세로']]){
const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const okb=()=>p.locator('#padOk:visible, [data-ok]:visible').first();const back=()=>p.locator('.scr.on [data-back]:visible').first().click();
const pad=async(sel,v)=>{await p.click(sel);for(const k of v)await p.click(`#keys button:text-is("${k}")`);await okb().click();};
const mach=async(n,a)=>{await pad('#b_machine',n);await p.waitForTimeout(120);
  if(a.pt)await p.click(`.pt[data-x="${a.pt[0]}"][data-y="${a.pt[1]}"]`);
  if(a.dial!==undefined){for(const k of String(a.dial))await p.click(`#mKeys button:text-is("${k}")`);}
  if(a.pick)for(const k of a.pick)await p.click(`.pk[data-k="${k}"]`);
  if(a.cnt!==undefined){for(let i=0;i<Math.floor(a.cnt/5);i++)await p.click('[data-c="5"]');for(let i=0;i<a.cnt%5;i++)await p.click('[data-c="1"]');}
  if(a.wh!==undefined){const d=String(a.wh).padStart(2,'0');for(let i=0;i<d.length;i++)for(let j=0;j<+d[i];j++)await p.click(`[data-wi="${i}"][data-wd="1"]`);}
  await p.click('#mOk');};
await p.goto(`file:///home/claude/geogebra2026/escape${N}.html`);await p.waitForTimeout(300);await p.click('#startBtn');
for(const wr of WRONG[N]){ if(wr[0]==='code'){await pad('#b_code',wr[1]);T(tag+' 오답 '+wr[1],(await p.textContent('#padMsg')).includes(wr[2]));await back();}
  else {await mach(wr[1],wr[2]);T(tag+' 오답 기계'+wr[1],(await p.textContent('#mMsg')).includes(wr[3]),(await p.textContent('#mMsg')).slice(0,40));await back();} }
if(tag==='Surface'){await pad('#b_machine',N==2?'59':'45');await p.waitForTimeout(150);T('단위 표시',/m|가지/.test(await p.textContent('#mSl')),await p.textContent('#mSl'));
  await p.click('#mOk');T('빈 답은 벌점 없이 안내',(await p.textContent('#mMsg')).includes('먼저'));
  for(const k of '9999')await p.click(`#mKeys button:text-is("${k}")`);T('자리 수 제한',(await p.textContent('#mSl')).replace(/\D/g,'').length<=3,await p.textContent('#mSl'));
  await p.screenshot({path:`/tmp/claude-0/escape/review/r${N}_dial.png`});await back();}
{const pn=N==2?'46':'90';await pad('#b_pen',pn);await p.waitForTimeout(100);T(tag+' 벌점 카드별 안내',(await p.textContent('#homeMsg').catch(()=>'')||await p.textContent('body')).includes('2분'));
 await pad('#b_pen','11');T(tag+' 벌점 아닌 번호',(await p.textContent('#padMsg')).includes('아니에요'));await back();}
for(const st of PLAN[N]){ if(st[0]==='code')await pad('#b_code',st[2]); else await mach(st[1],st[2]);
  T(tag+' 풀기 '+st[1],(await p.textContent('#homeMsg')).includes('펼치기'),(await p.textContent('#homeMsg')).slice(0,30));}
for(const n of Object.keys(await p.evaluate(()=>window.EG.hints))){await pad('#b_hint',n);const m=await p.textContent('#padMsg');if(m.includes('힌트가 없어요'))T('힌트 '+n,false);await back();}
if(String(await p.evaluate(()=>window.EG.endCard))!=='99'){await pad('#endBtn','99');T(tag+' 찍은 99는 벌점',(await p.textContent('#padMsg')).includes('1분'));await p.locator('#pad [data-back]:visible').first().click();}
await pad('#endBtn',String(await p.evaluate(()=>window.EG.endCard)));T(tag+' 탈출',await p.isVisible('#done'));
T(tag+' 가로 넘침 없음',(await p.evaluate(()=>document.documentElement.scrollWidth))<=w);T(tag+' 오류 없음',!errs.length,errs.join('|'));await p.close();}
console.log('틀림',bad);await b.close()})();
