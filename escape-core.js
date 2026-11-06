/* 🧭 붉은 나침반 방탈출 — 모둠 디벗 공통 엔진 (2026-11-01)
   각 회차 페이지는 window.EG(설정)를 먼저 정의하고 이 파일을 불러온다.
   EG = { mode:'practice'|'main', ep, title, limitMin, kinds:{번호:'R'|'B'|'G'|'Gr'|'Y'|'P'},
          codes:{카드:{code, ok:결과}}, wrongCodes:{입력:이유}, hints:{카드:[1단계,2단계]},
          mach:{카드:{t,s,type:'grid'|'img'|'dial'|'dial2',..., check()}}, hidden:(S)=>문장, endCard,
          reflect, next:{url,label}, steps:[...] (연습만) }
   결과 형식 r = {ok:true|false, msg, open:[번호], clear:[번호]} */
(function(){
const G = window.EG;
const P = G.mode === 'practice';
if(P) document.body.classList.add('practice'); else document.body.classList.add('nostart');

/* ---------- 화면 뼈대 ---------- */
const BTN = [['p','hint','💡','힌트',50.0,9.0], ['y','code','🔒','자물쇠',89.0,37.3], ['g','machine','⚙️','기계',74.1,83.2], ['r','pen','⏳','벌점',25.9,83.2], ['','hid','🔍','숨은 번호',11.0,37.3]];
const ring = BTN.map(([c,m,i,t,x,y])=>`<button class="btn ${c}" style="left:${x}%;top:${y}%" data-act="${m}" id="b_${m}"><i>${i}</i><span>${t}</span></button>`).join('');
const ttl = `<div class="ep">${G.series||"붉은 나침반"} · ${G.ep}</div><div class="nm">${G.title}</div>`;
document.body.insertAdjacentHTML('afterbegin', `
<div class="scr on" id="home">
  <div class="ttl top serif">${ttl}</div>
  <div class="rg"><div class="brass"></div>
    <div class="face"><div class="tl">${P?'연습':'남은 시간'}</div><div id="timer" class="mono">${P?'∞':''}</div>
      ${P?'<div class="paused-note">연습은 시간이 안 흘러요</div>':'<button class="pp" id="pauseBtn" aria-label="멈춤">❚❚</button>'}</div>
    ${ring}</div>
  <div class="side">
    <div class="ttl serif" style="margin-bottom:${P?12:26}px">${ttl}</div>
    ${P?'<div class="badges" id="badges"></div><div class="sc" id="homeMsg">'+(G.intro||'')+'</div><button class="startbtn" id="endBtn" style="margin-top:14px">🏁 탈출 (마지막 카드 번호)</button>':
      `<div class="sc" id="homeMsg">${G.prologue?'<div class="prolog">📜 '+G.prologue+'</div>':''}모둠이 모두 모이면 <b>항해 시작</b>을 누르세요.<small>누르는 순간 시간이 흘러요. 처음이면 <a href="${G.practiceUrl||'escape0.html'}" style="color:#7a1d10;font-weight:900">연습부터 →</a></small></div>
       <button class="startbtn" id="startBtn">⚓ 항해 시작</button>
       <div class="stat"><div>벌점<b class="mono" id="sPen">0</b></div><div>틀린 답<b class="mono" id="sWrong">0</b></div><div>힌트<b class="mono" id="sHint">0</b></div></div>
       <button class="startbtn" id="endBtn" style="display:none">🏁 탈출 (마지막 카드 번호)</button>
       <button class="snd" id="sndBtn">♪ 파도 소리 꺼짐</button>`}
  </div>
</div>
<div class="scr pane" id="pad">
  <div class="leftcol">
    <div class="hdr"><span class="t serif" id="padTitle"></span><span class="tm mono" id="padTm"></span></div>
    <div class="sub" id="padSub"></div>
    <div class="lock"><div class="slots" id="slots"></div></div>
    <div class="ab hdr-l"><button class="close" data-back>닫기</button><button class="okb" id="padOk">열어 보기</button></div>
    <div class="sc pm" id="padMsg" style="display:none"></div>
  </div>
  <div><div class="kp" id="keys"></div>
    <div class="ab hdr-p"><button class="close" data-back>닫기</button><button class="okb" data-ok>열어 보기</button></div></div>
</div>
<div class="scr pane" id="mach">
  <div class="leftcol" style="width:min(380px,92vw)">
    <div class="hdr"><span class="t serif" id="mTitle"></span><span class="tm mono" id="mTm"></span></div>
    <div class="sub" id="mSub"></div>
    <div class="ab"><button class="close" data-back>닫기</button><button class="okb" id="mOk">확인</button></div>
    <div class="sc pm" id="mMsg" style="display:none"></div>
  </div>
  <div class="machbox" id="mBody"></div>
</div>
<div class="scr" id="done">
  <div class="ttl serif" style="text-align:center;margin-bottom:26px"><div class="ep">${G.series||"붉은 나침반"} · ${G.ep}</div><div class="nm">${P?'훈련 끝!':'탈출 성공!'}</div></div>
  <div class="res"><div class="seal serif">${P?'수료':'탈출'}</div><h2 class="serif">${P?'훈련 일지':'항해 일지'}</h2><div class="st" id="stars"></div><div id="resTb"></div></div>
  ${G.epilogue?`<div class="sc prolog-end" style="width:min(560px,100%);margin-top:20px">📜 ${G.epilogue}</div>`:''}
  <div class="sc" style="width:min(560px,100%);margin-top:20px">${G.reflect||''}</div>
  ${G.next?`<a class="startbtn" style="display:block;width:min(560px,100%);text-align:center;line-height:64px;text-decoration:none" href="${G.next.url}">${G.next.label}</a>`:''}
</div>
<div class="note">테스트용 · 기록은 이 디벗 안에만 잠깐 남아요</div>`);

const $ = id => document.getElementById(id);
const S = {start:null, acc:0, running:false, begun:P, pen:0, hint:0, wrong:0, penMs:0, wrongMs:0, solved:{}, hintLv:{}, seen:[]};
const KEY='escape:'+location.pathname.replace(/\.html$/,''); let saveOff=false;
const LIMIT = (G.limitMin||45)*60000;
const elapsed = ()=> S.acc + (S.running ? Date.now()-S.start : 0) + S.penMs + S.wrongMs;
function fmtLeft(ms){ const r=LIMIT-ms, a=Math.abs(r), m=Math.floor(a/60000), s=Math.floor(a%60000/1000); return (r<0?'+':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }
function tick(){ if(P){ $('padTm').textContent='연습'; $('mTm').textContent='연습'; return; }
  const e=elapsed(), t=fmtLeft(e); $('timer').textContent=t; $('timer').classList.toggle('over', e>LIMIT); $('padTm').textContent=t; $('mTm').textContent=t;
  $('sPen').textContent=S.pen; $('sWrong').textContent=S.wrong; $('sHint').textContent=S.hint; }
setInterval(tick, 250); tick();
function flash(){ const t=$('timer'); t.classList.remove('pen'); void t.offsetWidth; t.classList.add('pen'); }
function lose(kind, m){ m=m||1; if(P) return `<span class="lost">⏳ 본게임이면 ${m}분 잃어요</span> (연습이라 괜찮아요)`;
  if(kind==='pen'){ S.penMs+=60000*m; S.pen++; } else { S.wrongMs+=60000; S.wrong++; } flash(); return `<span class="lost">⏳ ${m}분 잃음</span>`; }
function show(id){ ['home','pad','mach','done'].forEach(x=> $(x).classList.toggle('on', x===id)); }

/* 카드와 같은 모양의 번호 */
const chip = n => `<span class="chip ${(G.kinds||{})[n]||'G'}${/[가-힣]/.test(n)?' kr':''}"><i>${n}</i></span>`;
const dz = list => `<span class="dz">${list.map(n=>`<span>${n}</span>`).join('')}</span>`;
function resultHTML(r){
  let h = r.msg || '';
  const row = [];
  if(r.open && r.open.length) row.push(`<b>펼치기</b>${r.open.map(chip).join('')}`);
  if(r.clear && r.clear.length){ if(row.length) row.push('<span class="sp"></span>'); row.push(`<b>치우기</b>${dz(r.clear)}`); }
  if(r.lose) row.push(r.lose);
  if(row.length) h += `<div class="row2">${row.join('')}</div>`;
  return h;
}
/* 첫 화면 알림: 본게임은 말풍선, 연습은 지금 단계 카드 아래 */
let flow=0;
function guideHTML(){ if(!P||!G.flow) return ''; const st=G.flow[flow]; return st&&st.say ? `<div class="guide">🧭 훈련관: ${st.say}</div>` : ''; }
function homeSay(cls, html){
  const m=$('homeMsg'); m.className='sc'+(cls?' '+cls:''); m.innerHTML=html+guideHTML(); }
function sub(el, cls, html){ const m=$(el); m.className='sc pm'+(cls?' '+cls:''); m.innerHTML=html; m.style.display=''; }

/* ---------- 숫자판 ---------- */
let padMode='', buf='';
const PT = {machine:['⚙️ 기계','초록 카드의 번호를 넣고 열어 보기를 누르세요.',2], code:['🔒 자물쇠','4자리 비밀번호를 넣으세요.',4],
  hint:['💡 힌트','막힌 카드의 번호를 넣으세요.'+(G.zeroHint?' (시작 카드는 0)':''),2], end:['🏁 탈출','마지막 카드의 번호를 넣으세요.',2],
  pen:['⏳ 벌점','펼친 벌점 카드의 번호를 넣으세요.',2]};
function paint(){ const n = padMode==='code' ? 4 : Math.max(PT[padMode][2], buf.length); let h='';
  if(padMode!=='code'){ $('slots').innerHTML=`<div class="sl wide mono${buf?'':' e'}">${buf||'<span class=ph>번호</span>'}</div>`; return; } for(let i=0;i<n;i++){ const c = buf[i]; h += `<div class="sl mono${c===undefined?' e':''}">${c===undefined?'·':c}</div>`; } $('slots').innerHTML=h; }
function openPad(mode){ if(!S.begun){ homeSay('info','먼저 <b>항해 시작</b>을 누르세요.'); return; }
  padMode=mode; buf=''; $('padMsg').style.display='none'; const T=PT[mode]; $('padTitle').textContent=T[0]; $('padSub').textContent=T[1];
  if(mode==='hint' && S.seen.length) sub('padMsg','info','📜 지금까지 본 힌트<small>'+S.seen.map(h=>`${h[0]}번 ${h[1]===3?'정답':h[1]+'단계'}: ${h[2]}`).join('<br>')+'</small>');
  paint(); show('pad'); }
['1','2','3','4','5','6','7','8','9','지움','0','⌫'].forEach(k=>{ const b=document.createElement('button'); b.className='k'+(k.length>1||k==='⌫'?' s':''); b.textContent=k;
  b.setAttribute('aria-label', k==='⌫'?'한 글자 지우기':k==='지움'?'모두 지우기':k);
  b.onclick=()=>{ if(k==='지움') buf=''; else if(k==='⌫') buf=buf.slice(0,-1); else if(buf.length<PT[padMode][2]) buf+=k; paint(); }; $('keys').appendChild(b); });
document.querySelectorAll('[data-back]').forEach(b=> b.onclick=()=>show('home'));
document.querySelector('[data-ok]').onclick=()=> $('padOk').click();
function win(r){ homeSay('ok', resultHTML(r)); show('home'); }
$('padOk').onclick=()=>{
  const v=buf; if(!v) return;
  if(padMode==='code'){
    if(v.length<4){ sub('padMsg','info','자물쇠는 네 칸을 모두 채워야 열려요.'); return; }
    const hit = Object.entries(G.codes||{}).find(([n,c])=> c.code===v);
    if(hit){ S.solved[hit[0]]=1; emit('code', hit[0]); win(hit[1].ok); return; }
    const why = (G.wrongCodes||{})[v] || '이 비밀번호로 열리는 자물쇠가 없어요.';
    sub('padMsg','no', resultHTML({msg:why, lose:lose('wrong')})); buf=''; paint(); return; }
  if(padMode==='machine'){ openMach(+v); return; }
  if(padMode==='hint'){
    const n0=+v, n=(G.hintSame&&n0 in G.hintSame)?G.hintSame[n0]:n0, h=(G.hints||{})[n];
    if(!h){ sub('padMsg','info','그 카드에는 힌트가 없어요. 다른 카드 번호를 넣어 보세요.'); return; }
    const lv=S.hintLv[n]||0, L=h.length;
    if(lv>=L){ sub('padMsg','info','이 카드의 힌트를 모두 봤어요.<br>'+h.map((x,i)=>(i===2?'정답: ':(i+1)+'단계: ')+x).join('<br>')); return; }
    S.hintLv[n]=lv+1; if(!P) S.hint += (lv===2 ? 2 : 1); S.seen.push([n,lv+1,h[lv]]); emit('hint', n);
    const head = lv===2 ? '🗝 정답' : (G.hintBy||'🏮 등대지기 할머니');
    const more = lv+1<L ? '<small>같은 번호를 한 번 더 넣으면 '+(lv+1===2?'<b>정답</b>이 나와요. 정답은 힌트 2번으로 세요.':'다음 힌트가 나와요.')+(P?'':' 힌트를 많이 쓰면 별이 줄어요.')+'</small>' : '';
    sub('padMsg','info', head+': "'+h[lv]+'"'+more); return; }
  if(padMode==='pen'){ const pc=(G.pens||{})[v];
    if(G.pens && !pc){ sub('padMsg','info','그 번호는 벌점 카드가 아니에요. 카드 위의 번호를 다시 보세요.'); buf=''; paint(); return; }
    const m=(pc&&pc.m)||1; emit('pen', v); show('home');
    homeSay('no', resultHTML({msg:((pc&&pc.msg)||G.penMsg||'')+'<br>그 <b>벌점 카드만</b> 치우세요. 합쳤던 카드는 그대로 둬요.', lose:lose('pen', m)})+(P?'':'<small><a href="#" id="undoPen" style="color:#7a1d10;font-weight:900">잘못 넣었어요 · 되돌리기</a></small>'));
    const u=$('undoPen'); if(u) u.onclick=e=>{ e.preventDefault(); if(S.pen>0){ S.pen--; S.penMs-=60000*m; } homeSay('info',`벌점을 되돌렸어요. ${m}분이 다시 돌아왔어요.`); tick(); }; return; }
  if(padMode==='end'){ if(+v===+G.endCard){ emit('end'); finish(); } else { sub('padMsg','no', resultHTML({msg:'아직 끝이 아니에요! 마지막 카드의 번호를 넣으세요.', lose:lose('wrong')})); buf=''; paint(); } }
};

/* ---------- 기계 ---------- */
let mState=null;
function gridSvg(M){ const u=46, ox=34, oy=M.ymax*u+36, W=M.xmax*u+74, H=oy+30;
  let s=`<svg class="grid" viewBox="0 0 ${W} ${H}">`;
  if(M.river!=null){ const ry=oy-M.river*u; s+=`<rect x="0" y="0" width="${W}" height="${ry-6}" fill="#7fbfe3"/><path d="M0,${ry-6} q${W/8},-8 ${W/4},0 t${W/4},0 t${W/4},0 t${W/4},0 V${ry+4} H0Z" fill="#a8d4ee"/><rect x="0" y="${ry-4}" width="${W}" height="8" fill="#d9c08a"/><rect x="0" y="${ry+4}" width="${W}" height="${H-ry}" fill="#f3dfae"/><text x="${W-60}" y="${Math.max(24,ry-18)}" font-size="20" font-weight="900" fill="#1f5f8a">강</text><text x="${W-104}" y="${ry+24}" font-size="14" font-weight="800" fill="#7a1d10">강가 길</text>`; }
  if(M.boat) s+=`<g transform="translate(${ox-6},${oy+4})"><path d="M-22,-6 h30 l-6,10 h-18z" fill="#8d5a2b" stroke="#3b2a12" stroke-width="1.5"/><line x1="0" y1="-6" x2="0" y2="-34" stroke="#5d4037" stroke-width="4"/></g>`;
  for(let i=0;i<=M.xmax;i++) s+=`<line x1="${ox+i*u}" y1="${oy}" x2="${ox+i*u}" y2="${oy-M.ymax*u}" stroke="#c7ad7a"/><text x="${ox+i*u-4}" y="${oy+20}" font-size="14" fill="#5a4116">${i}</text>`;
  for(let j=0;j<=M.ymax;j++) s+=`<line x1="${ox}" y1="${oy-j*u}" x2="${ox+M.xmax*u}" y2="${oy-j*u}" stroke="#c7ad7a"/><text x="${ox-22}" y="${oy-j*u+5}" font-size="14" fill="#5a4116">${j}</text>`;
  if(M.poly) s+=`<polyline points="${M.poly.map(p=>(ox+p[0]*u)+','+(oy-p[1]*u)).join(' ')}" fill="rgba(122,29,16,.08)" stroke="#7a1d10" stroke-width="3"/>`;
  for(const [nm,[x,y]] of Object.entries(M.pts||{})) s+=`<circle cx="${ox+x*u}" cy="${oy-y*u}" r="9" fill="#7a1d10"/><text x="${ox+x*u+11}" y="${oy-y*u-11}" font-size="19" font-weight="900" fill="#3b2a12">${nm}</text>`;
  for(let i=0;i<=M.xmax;i++) for(let j=0;j<=M.ymax;j++) s+=`<circle class="pt" data-x="${i}" data-y="${j}" cx="${ox+i*u}" cy="${oy-j*u}" r="20" fill="transparent" style="cursor:pointer"/>`;
  return s+`<circle id="pick" r="12" fill="#1565c0" opacity="0" stroke="#fff" stroke-width="3" pointer-events="none"/></svg>`; }
function imgSvg(M){ const xs=M.xs, ys=M.ys;
  let s=`<svg class="grid" viewBox="0 0 100 100"><image href="${M.img}" x="0" y="0" width="100" height="100"/>`;
  xs.forEach((x,i)=> s+=`<circle cx="${x}" cy="${ys[0]+3.4}" r="2.6" fill="#fbf3dc" opacity=".92"/><text x="${x}" y="${ys[0]+4.7}" text-anchor="middle" font-size="3.6" font-weight="800" fill="#5a3a12">${i}</text>`);
  ys.forEach((y,j)=>{ if(j) s+=`<circle cx="${xs[0]-3.6}" cy="${y}" r="2.6" fill="#fbf3dc" opacity=".92"/><text x="${xs[0]-3.6}" y="${y+1.3}" text-anchor="middle" font-size="3.6" font-weight="800" fill="#5a3a12">${j}</text>`; });
  xs.forEach((x,i)=> ys.forEach((y,j)=>{ s+=`<circle cx="${x}" cy="${y}" r=".8" fill="#5a3a12" opacity=".6"/><circle class="pt" data-x="${i}" data-y="${j}" cx="${x}" cy="${y}" r="5" fill="transparent" style="cursor:pointer"/>`; }));
  return s+'<circle id="pick" r="2.6" fill="#1565c0" opacity="0" stroke="#fff" stroke-width=".8" pointer-events="none"/></svg>'; }
function openMach(n){ const M=(G.mach||{})[n];
  if(!M){ sub('padMsg','no', P?'연습에서 쓰는 기계 카드는 5번이에요.':'그 번호는 기계(초록) 카드가 아니에요.'); return; }
  mState={n, x:null, y:null, a:0, m:0}; $('mTitle').textContent='⚙️ '+n+'. '+M.t; $('mSub').textContent=M.s; $('mMsg').style.display='none';
  if(M.type==='grid' || M.type==='img'){ $('mBody').innerHTML = M.type==='img' ? imgSvg(M) : gridSvg(M);
    $('mBody').querySelectorAll('.pt').forEach(c=> c.onclick=()=>{ mState.x=+c.dataset.x; mState.y=+c.dataset.y; const p=$('pick'); p.setAttribute('cx',c.getAttribute('cx')); p.setAttribute('cy',c.getAttribute('cy')); p.setAttribute('opacity','1'); $('mSub').textContent=`고른 점: (${mState.x}, ${mState.y})`; }); }
  else if(M.type==='dial2'){
    const one=(id,lab,unit)=>`<div style="text-align:center"><div class="sub" style="margin:0 0 8px">${lab}</div><div class="lock" style="display:inline-block"><div class="slots"><div class="sl mono" id="${id}" style="width:auto;padding:0 14px;min-width:120px">0${unit}</div></div></div><div class="drow" style="margin-top:12px;justify-content:center">${[-10,-1,1,10].filter(d=>unit==='°'||Math.abs(d)==1).map(d=>`<button class="k" data-w="${id}" data-d="${d}">${d>0?'+':'−'}${Math.abs(d)}</button>`).join('')}</div></div>`;
    $('mBody').innerHTML=`<div style="display:flex;flex-direction:column;gap:26px">${one('dA',M.l1,'°')}${one('dM',M.l2,'m')}</div>`;
    $('mBody').querySelectorAll('[data-w]').forEach(b=> b.onclick=()=>{ const d=+b.dataset.d; if(b.dataset.w==='dA'){ mState.a=(mState.a+d+360)%360; $('dA').textContent=mState.a+'°'; } else { mState.m=Math.max(0,Math.min(30,mState.m+d)); $('dM').textContent=mState.m+'m'; } }); }
  /* 2026-11-02 손으로 만지는 기계(선생님 요청, Unlock 기계처럼): pick=칸 눌러 켜기, count=개수 넣고 빼기, wheels=숫자 바퀴 돌리기 */
  else if(M.type==='pick'){ mState.sel=new Set();
    const C=M.cols, head=M.colHead?`<div class="pkh"></div>${M.colHead.map(h=>`<div class="pkh">${h}</div>`).join('')}`:'';
    let cells=''; M.items.forEach((it,i)=>{ if(M.rowHead && i%C===0) cells+=`<div class="pkh">${M.rowHead[i/C]}</div>`; cells+=`<button class="pk" data-k="${it.k}">${it.l||''}</button>`; });
    $('mBody').innerHTML=`<div class="pkwrap"><div class="pkin">${M.top?`<div class="pktop">${M.top}</div>`:''}<div class="pkgrid" style="grid-template-columns:${M.rowHead?'auto ':''}repeat(${C},1fr)">${head}${cells}</div></div></div><div class="pkn" id="pkn">${M.cnt||'켠 칸'} 0개</div>`;
    $('mBody').querySelectorAll('.pk').forEach(b=> b.onclick=()=>{ const k=b.dataset.k; if(mState.sel.has(k)){ mState.sel.delete(k); b.classList.remove('on'); } else { mState.sel.add(k); b.classList.add('on'); } $('pkn').textContent=(M.cnt||'켠 칸')+' '+mState.sel.size+'개'; }); }
  else if(M.type==='count'){ mState.a=0;
    const upd=()=>{ $('cntv').innerHTML=M.show(mState.a); };
    $('mBody').innerHTML=`<div class="cnt"><div class="cntv" id="cntv"></div><div class="drow">${(M.steps||[-5,-1,1,5]).map(d=>`<button class="k" data-c="${d}">${d>0?'+':'−'}${Math.abs(d)}</button>`).join('')}</div></div>`;
    $('mBody').querySelectorAll('[data-c]').forEach(b=> b.onclick=()=>{ mState.a=Math.max(0,Math.min(M.max||99,mState.a+(+b.dataset.c))); upd(); }); upd(); }
  else if(M.type==='wheels'){ const D=M.digits||2; mState.w=Array(D).fill(0);
    const upd=()=>{ mState.w.forEach((v,i)=> $('wh'+i).textContent=v); mState.a=+mState.w.join(''); };
    $('mBody').innerHTML=`<div class="whs">${mState.w.map((v,i)=>`<div class="wh"><button class="k" data-wi="${i}" data-wd="1" aria-label="올리기">▲</button><div class="whv mono" id="wh${i}">0</div><button class="k" data-wi="${i}" data-wd="-1" aria-label="내리기">▼</button></div>`).join('')}</div>${M.cap?`<div class="pkn">${M.cap}</div>`:''}`;
    $('mBody').querySelectorAll('[data-wi]').forEach(b=> b.onclick=()=>{ const i=+b.dataset.wi; mState.w[i]=(mState.w[i]+(+b.dataset.wd)+10)%10; upd(); }); upd(); }
  else if(M.unit){ const D=String(M.max||99).length; mState.buf='';
    const pnt=()=>{ $('mSl').innerHTML=`<div class="sl wide mono${mState.buf?'':' e'}">${mState.buf||'<span class=ph>답</span>'}</div><div class="un">${M.unit}</div>`; mState.a=parseInt(mState.buf||'0'); };
    $('mBody').innerHTML=`<div class="mnum"><div class="lock"><div class="slots" id="mSl"></div></div><div class="kp" id="mKeys"></div></div>`;
    ['1','2','3','4','5','6','7','8','9','지움','0','⌫'].forEach(k=>{ const b=document.createElement('button'); b.className='k'+(k.length>1||k==='⌫'?' s':''); b.textContent=k;
      b.onclick=()=>{ if(k==='지움') mState.buf=''; else if(k==='⌫') mState.buf=mState.buf.slice(0,-1); else if(mState.buf.length<D) mState.buf+=k; pnt(); }; $('mKeys').appendChild(b); }); pnt(); }
  else { $('mBody').innerHTML=`<div class="dial${M.unit?' nu':''}"><div class="dialface"><div class="dialin">${M.unit?'':'<div class="needle" id="needle"></div>'}<div id="dval" class="mono">0${M.unit||'°'}</div></div></div><div class="drow"><button class="k" data-d="-10">−10</button><button class="k" data-d="-1">−1</button><button class="k" data-d="1">+1</button><button class="k" data-d="10">+10</button></div></div>`;
    const upd=()=>{ $('dval').innerHTML=mState.a+(M.unit?'<small>'+M.unit+'</small>':'°'); if(!M.unit) $('needle').style.transform=`rotate(${mState.a}deg)`; }; upd();
    $('mBody').querySelectorAll('[data-d]').forEach(b=> b.onclick=()=>{ const d=+b.dataset.d; mState.a = M.unit ? Math.max(0,Math.min(M.max||99, mState.a+d)) : (mState.a+d+360)%360; upd(); }); }
  show('mach'); }
$('mOk').onclick=()=>{ const M=G.mach[mState.n]; let r;
  if(M.type==='dial2') r=M.check(mState.a, mState.m);
  else if(M.type==='pick'){ if(!mState.sel.size){ sub('mMsg','info','먼저 칸을 눌러 켜세요.'); return; } r=M.check([...mState.sel]); }
  else if(M.type==='count'||M.type==='wheels') r=M.check(mState.a);
  else if(M.type==='grid' || M.type==='img'){ if(mState.x===null){ sub('mMsg','info','먼저 점을 하나 고르세요.'); return; } r=M.check(mState.x, mState.y); }
  else { if(M.unit && !mState.buf){ sub('mMsg','info','먼저 숫자를 넣으세요.'); return; } r=M.check(mState.a); }
  if(r.ok){ S.solved[mState.n]=1; emit('mach', mState.n); win(r); }
  else sub('mMsg','no', resultHTML({msg:r.msg, lose:lose('wrong')})); };

/* ---------- 첫 화면 버튼 ---------- */
document.querySelectorAll('[data-act]').forEach(b=> b.onclick=()=>{
  const a=b.dataset.act;
  if(a==='hint'||a==='code'||a==='machine'||a==='pen') return openPad(a);
  if(!S.begun){ homeSay('info','먼저 <b>항해 시작</b>을 누르세요.'); return; }
  if(a==='hid'){ emit('hid'); homeSay('info','🔍 '+G.hidden(S)); }
});
if(!P){
  $('startBtn').onclick=()=>{ S.begun=true; document.body.classList.remove('nostart'); S.start=Date.now(); S.running=true; $('startBtn').style.display='none'; $('endBtn').style.display='';
    homeSay('info', resultHTML({msg:G.startMsg||'<b>시작</b> 카드를 펼치세요.', open:['시작']})); };

  $('pauseBtn').onclick=()=>{ if(!S.begun) return; if(S.running){ S.acc+=Date.now()-S.start; S.running=false; $('pauseBtn').textContent='▶'; } else { S.start=Date.now(); S.running=true; $('pauseBtn').textContent='❚❚'; } };
  let AC=null, gain=null;
  $('sndBtn').onclick=()=>{
    if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); const len=AC.sampleRate*4, bf=AC.createBuffer(1,len,AC.sampleRate), d=bf.getChannelData(0); let last=0; for(let i=0;i<len;i++){ last=(last+0.02*(Math.random()*2-1))/1.02; d[i]=last*3; }
      const src=AC.createBufferSource(); src.buffer=bf; src.loop=true; const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=600; gain=AC.createGain(); gain.gain.value=0;
      const lfo=AC.createOscillator(), lg=AC.createGain(); lfo.frequency.value=0.12; lg.gain.value=0.18; lfo.connect(lg).connect(gain.gain); src.connect(f).connect(gain).connect(AC.destination); src.start(); lfo.start(); gain._on=false; }
    gain._on=!gain._on; gain.gain.setTargetAtTime(gain._on?0.25:0, AC.currentTime, .3); if(!gain._on) setTimeout(()=>{ if(!gain._on) AC.suspend(); },1200); else AC.resume();
    $('sndBtn').textContent = gain._on ? '♪ 파도 소리 켜짐' : '♪ 파도 소리 꺼짐'; };
}
$('endBtn').onclick=()=> openPad('end');
document.addEventListener('keydown', e=>{ if(e.key==='Escape') show('home'); });

/* ---------- 연습: 배울 것 체크리스트 (순서 자유, 카드와 화면을 오가며) ---------- */
const got={};
function paintBadges(){ if(!P) return; $('badges').innerHTML=G.badges.map(b=>`<span class="bd${got[b.k]?' on':''}">${got[b.k]?'✔':b.i} ${b.name}</span>`).join(''); }
function setFlow(n){ if(!G.flow||n<=flow) return; flow=n; glowNow(); }
function glowNow(){ document.querySelectorAll('.btn,#endBtn').forEach(b=> b.classList.remove('glow')); const st=G.flow&&G.flow[flow]; ((st&&st.glow)||[]).forEach(id=>{ const b=id==='end'?$('endBtn'):$('b_'+id); if(b) b.classList.add('glow'); }); }
function emit(ev, arg){ if(!P) return; if(G.flowOn){ const t=G.flowOn(ev,arg); if(t!=null) setFlow(t); } let n=0;
  G.badges.forEach(b=>{ if(!got[b.k] && b.on(ev, arg, got)){ got[b.k]=1; n++; } });
  if(n) paintBadges(); }
paintBadges(); if(P){ glowNow(); homeSay('', G.intro||''); }

/* ---------- 결과 ---------- */
function finish(){
  saveOff=true; try{ localStorage.removeItem(KEY); }catch(e){}
  if(S.running){ S.acc+=Date.now()-S.start; S.running=false; }
  const f=x=>Math.floor(x/60000)+'분 '+String(Math.floor(x%60000/1000)).padStart(2,'0')+'초';
  if(P){ $('stars').innerHTML='★★★★★'; $('resTb').innerHTML='<div class="badges" style="justify-content:center;margin:12px 0 4px">'+G.badges.map(b=>`<span class="bd${got[b.k]?' on':''}">${got[b.k]?'✔':b.i} ${b.name}</span>`).join('')+'</div>'; show('done'); return; }
  const ms=elapsed(), min=ms/60000;
  const L=G.limitMin||45; let st=min<=L-15?5:min<=L-10?4:min<=L-5?3:min<=L?2:1;   // 2026-11-06: 제한 시간(40분)에 맞춰 5분씩(25·30·35·40분) st=Math.max(0, st-Math.floor(S.hint/4));
  $('stars').innerHTML='★'.repeat(st)+'<em>'+'★'.repeat(5-st)+'</em>';
  $('resTb').innerHTML=`<div class="ln"><span>걸린 시간 · 힌트</span><b class="mono">${f(ms)} · ${S.hint}번</b></div><div class="ln"><span>벌점으로 잃은 시간</span><b class="mono">${S.pen}분 (${S.pen}번)</b></div><div class="ln"><span>틀린 답으로 잃은 시간</span><b class="mono">${S.wrong}분 (${S.wrong}번)</b></div>`;
  show('done'); }
/* ---------- 새로고침해도 이어 하기 (이 디벗 안에만 저장, 3시간 지나면 버림) ---------- */
function save(){ if(saveOff) return; if(P ? !(flow||Object.keys(got).length) : !S.begun) return;
  const d={t:Date.now(), acc:S.acc+(S.running?Date.now()-S.start:0), running:S.running, pen:S.pen, hint:S.hint, wrong:S.wrong, penMs:S.penMs, wrongMs:S.wrongMs, solved:S.solved, hintLv:S.hintLv, seen:S.seen, flow, got};
  try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }
setInterval(save, 1000); window.addEventListener('pagehide', save);
(function restore(){ let d=null; try{ d=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){}
  if(!d || Date.now()-d.t > 3*3600000) return;
  ['acc','pen','hint','wrong','penMs','wrongMs','solved','hintLv','seen'].forEach(k=>{ if(d[k]!==undefined) S[k]=d[k]; });
  if(P){ flow=d.flow||0; Object.assign(got, d.got||{}); paintBadges(); glowNow(); }
  else { S.begun=true; document.body.classList.remove('nostart'); S.running=!!d.running; if(S.running) S.start=Date.now(); else $('pauseBtn').textContent='▶';
    $('startBtn').style.display='none'; $('endBtn').style.display=''; }
  homeSay('info','💾 하던 곳부터 이어서 해요. (새로고침 전 기록을 불러왔어요)<small><a href="#" id="resetGame" style="color:#7a1d10;font-weight:900">처음부터 다시 하기</a></small>');
  const r=$('resetGame'); r.onclick=e=>{ e.preventDefault(); if(r.dataset.sure){ saveOff=true; try{ localStorage.removeItem(KEY); }catch(_){} location.reload(); } else { r.dataset.sure=1; r.textContent='정말 처음부터? 한 번 더 누르세요'; } };
  tick(); })();
/* 🚀 2026-11-05: 안내 화면(studentesc.html)에서 선생님이 [시작!]을 누르면 ?go=1로 들어와 바로 시간이 흐른다(이어 하던 게임은 그대로) */
if(!P && !S.begun && /[?&]go=1/.test(location.search)){ const sb=$('startBtn'); if(sb) sb.click(); }
/* ⏹↺ 2026-11-06: 안내 화면에서 ?classNo=로 들어오면 선생님 화면의 [게임 끝내기]·[처음으로]를 따른다(rooms/{반}__escape/guide.end·reset) */
const ESC_Q = new URLSearchParams(location.search), ESC_C = ESC_Q.get('classNo') || (()=>{ try{ return sessionStorage.getItem('escCls')||''; }catch(e){ return ''; } })(), ESC_R = ESC_Q.get('round') || '';
if(ESC_C){ try{ sessionStorage.setItem('escCls', ESC_C); }catch(e){} }
if(/[?&]go=1/.test(location.search)) try{ history.replaceState(null,'',location.pathname); }catch(e){}
if(ESC_C && !P){
  const T0 = Date.now(), FB = { apiKey:'AIzaSyBK7NlpKOr1ozAXF96vS8p7YyjiNaAJlfI', authDomain:'brojuntest.firebaseapp.com', databaseURL:'https://brojuntest-default-rtdb.asia-southeast1.firebasedatabase.app', projectId:'brojuntest' };
  const room = (String(ESC_C).trim().replace(/[.#$\[\]\/\s]+/g,'_').slice(0,30) || 'x') + '__escape';
  const load = src => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
  const V = 'https://www.gstatic.com/firebasejs/10.12.2/';
  (window.firebase ? Promise.resolve() : load(V+'firebase-app-compat.js').then(()=>Promise.all([load(V+'firebase-auth-compat.js'), load(V+'firebase-database-compat.js')])))
  .then(()=>{ if(!firebase.apps.length) firebase.initializeApp(FB); return firebase.auth().signInAnonymously(); })
  .then(()=>{ let done=false; firebase.database().ref('rooms/'+room+'/guide').on('value', s=>{ const g=s.val()||{};
      if(+g.reset > T0){ saveOff=true; try{ localStorage.removeItem(KEY); }catch(e){} location.href='studentesc.html?round='+encodeURIComponent(ESC_R||g.round||0)+'&classNo='+encodeURIComponent(ESC_C); return; }
      if(!done && +g.end > T0 && S.begun && !$('done').classList.contains('on')){ done=true; finish(); const D=$('done'), q=sel=>D.querySelector(sel);
        if(q('.nm')) q('.nm').textContent='시간 종료';   // 선생님이 끝냄: 탈출 성공·별·결말 이야기는 숨기고 기록만
        if(q('.seal')) q('.seal').textContent='종료'; const st=$('stars'); if(st) st.innerHTML='<div style="font-size:15px;color:#7a1d10;font-weight:bold">⏹ 선생님이 게임을 끝냈어요 · 푼 자물쇠·기계 '+Object.keys(S.solved||{}).length+'개</div>';
        D.querySelectorAll('.prolog-end, a.startbtn').forEach(x=>x.style.display='none'); }
    }); }).catch(()=>{});
}
window.__S=S; window.__got=got;
})();
