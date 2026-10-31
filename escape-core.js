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
if(P) document.body.classList.add('practice');

/* ---------- 화면 뼈대 ---------- */
const BTN = [['p','hint','💡','힌트',50.0,9.0], ['y','code','🔒','자물쇠',89.0,37.3], ['g','machine','⚙️','기계',74.1,83.2], ['r','pen','⏳','벌점',25.9,83.2], ['','hid','🔍','숨은 번호',11.0,37.3]];
const ring = BTN.map(([c,m,i,t,x,y])=>`<button class="btn ${c}" style="left:${x}%;top:${y}%" data-act="${m}" id="b_${m}"><i>${i}</i><span>${t}</span></button>`).join('');
const ttl = `<div class="ep">붉은 나침반 · ${G.ep}</div><div class="nm">${G.title}</div>`;
document.body.insertAdjacentHTML('afterbegin', `
<div class="scr on" id="home">
  <div class="ttl top serif">${ttl}</div>
  <div class="rg"><div class="brass"></div>
    <div class="face"><div class="tl">${P?'연습':'남은 시간'}</div><div id="timer" class="mono">${P?'∞':''}</div>
      ${P?'<div class="paused-note">연습은 시간이 안 흘러요</div>':'<button class="pp" id="pauseBtn" aria-label="멈춤">❚❚</button>'}</div>
    ${ring}</div>
  <div class="side">
    <div class="ttl serif" style="margin-bottom:${P?12:26}px">${ttl}</div>
    ${P?'<div class="steps" id="steps"></div><div class="tcard" id="tcard"></div><button class="startbtn" id="endBtn" style="display:none;margin-top:14px">🏁 탈출 (마지막 카드 번호)</button>':
      `<div class="sc" id="homeMsg">모둠이 모두 모이면 <b>항해 시작</b>을 누르세요.<small>시작 카드를 펼치는 순간 시간이 흘러요.</small></div>
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
  <div class="ttl serif" style="text-align:center;margin-bottom:26px"><div class="ep">붉은 나침반 · ${G.ep}</div><div class="nm">${P?'훈련 끝!':'탈출 성공!'}</div></div>
  <div class="res"><div class="seal serif">${P?'수료':'탈출'}</div><h2 class="serif">${P?'훈련 일지':'항해 일지'}</h2><div class="st" id="stars"></div><div id="resTb"></div></div>
  <div class="sc" style="width:min(560px,92vw);margin-top:20px">${G.reflect||''}</div>
  ${G.next?`<a class="startbtn" style="display:block;width:min(560px,92vw);text-align:center;line-height:64px;text-decoration:none" href="${G.next.url}">${G.next.label}</a>`:''}
</div>
<div class="note">테스트용 · 기록은 저장되지 않아요</div>`);

const $ = id => document.getElementById(id);
const S = {start:null, acc:0, running:false, begun:P, pen:0, hint:0, wrong:0, penMs:0, wrongMs:0, solved:{}, hintLv:{}, seen:[]};
const LIMIT = (G.limitMin||45)*60000;
const elapsed = ()=> S.acc + (S.running ? Date.now()-S.start : 0) + S.penMs + S.wrongMs;
function fmtLeft(ms){ const r=LIMIT-ms, a=Math.abs(r), m=Math.floor(a/60000), s=Math.floor(a%60000/1000); return (r<0?'+':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }
function tick(){ if(P){ $('padTm').textContent='연습'; $('mTm').textContent='연습'; return; }
  const e=elapsed(), t=fmtLeft(e); $('timer').textContent=t; $('timer').classList.toggle('over', e>LIMIT); $('padTm').textContent=t; $('mTm').textContent=t;
  $('sPen').textContent=S.pen; $('sWrong').textContent=S.wrong; $('sHint').textContent=S.hint; }
setInterval(tick, 250); tick();
function flash(){ const t=$('timer'); t.classList.remove('pen'); void t.offsetWidth; t.classList.add('pen'); }
function lose(kind){ if(P) return '<span class="lost">⏳ 본게임이면 1분 잃어요</span> (연습이라 괜찮아요)';
  if(kind==='pen'){ S.penMs+=60000; S.pen++; } else { S.wrongMs+=60000; S.wrong++; } flash(); return '<span class="lost">⏳ 1분 잃음</span>'; }
function show(id){ ['home','pad','mach','done'].forEach(x=> $(x).classList.toggle('on', x===id)); }

/* 카드와 같은 모양의 번호 */
const chip = n => `<span class="chip ${(G.kinds||{})[n]||'G'}"${/[가-힣]/.test(n)?' style="font-size:12px"':''}><i>${n}</i></span>`;
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
function homeSay(cls, html){ if(P){ tutFeedback(cls, html); return; }
  const m=$('homeMsg'); m.className='sc'+(cls?' '+cls:''); m.innerHTML=html; }
function sub(el, cls, html){ const m=$(el); m.className='sc pm'+(cls?' '+cls:''); m.innerHTML=html; m.style.display=''; }

/* ---------- 숫자판 ---------- */
let padMode='', buf='';
const PT = {machine:['⚙️ 기계','초록 카드의 번호를 넣고 열어 보기를 누르세요.',2], code:['🔒 자물쇠','4자리 비밀번호를 넣으세요.',4],
  hint:['💡 힌트','막힌 카드의 번호를 넣으세요.'+(G.zeroHint?' (시작 카드는 0)':''),2], end:['🏁 탈출','마지막 카드의 번호를 넣으세요.',2]};
function paint(){ const n = padMode==='code' ? 4 : Math.max(1, buf.length); let h='';
  for(let i=0;i<n;i++) h += `<div class="sl mono${buf[i]===undefined?' e':''}">${buf[i]===undefined?'·':buf[i]}</div>`; $('slots').innerHTML=h; }
function openPad(mode){ if(!S.begun){ homeSay('info','먼저 <b>항해 시작</b>을 누르세요.'); return; }
  padMode=mode; buf=''; $('padMsg').style.display='none'; const T=PT[mode]; $('padTitle').textContent=T[0]; $('padSub').textContent=T[1];
  if(mode==='hint' && S.seen.length) sub('padMsg','info','📜 지금까지 본 힌트<small>'+S.seen.map(h=>`${h[0]}번 ${h[1]}단계: ${h[2]}`).join('<br>')+'</small>');
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
    const hit = Object.entries(G.codes||{}).find(([n,c])=> c.code===v);
    if(hit){ S.solved[hit[0]]=1; emit('code', hit[0]); win(hit[1].ok); return; }
    const why = (G.wrongCodes||{})[v] || '이 비밀번호로 열리는 자물쇠가 없어요.';
    sub('padMsg','no', resultHTML({msg:why, lose:lose('wrong')})); buf=''; paint(); return; }
  if(padMode==='machine'){ openMach(+v); return; }
  if(padMode==='hint'){
    const n=+v, h=(G.hints||{})[n];
    if(!h){ sub('padMsg','info','그 카드에는 힌트가 없어요. 다른 카드 번호를 넣어 보세요.'); return; }
    const lv=S.hintLv[n]||0;
    if(lv>=2){ sub('padMsg','info','힌트를 모두 봤어요.<br>① '+h[0]+'<br>② '+h[1]); return; }
    S.hintLv[n]=lv+1; if(!P) S.hint++; S.seen.push([n,lv+1,h[lv]]); emit('hint', n);
    sub('padMsg','info','🏮 등대지기 할머니: "'+h[lv]+'"'+(lv===0?'<small>같은 번호를 한 번 더 넣으면 다음 힌트가 나와요.'+(P?'':' 힌트를 많이 쓰면 별이 줄어요.')+'</small>':'')); return; }
  if(padMode==='end'){ if(+v===+G.endCard){ emit('end'); finish(); } else sub('padMsg','no','아직 끝이 아니에요! 마지막 카드의 번호를 넣으세요.'); }
};

/* ---------- 기계 ---------- */
let mState=null;
function gridSvg(M){ const u=46, ox=34, oy=M.ymax*u+36, W=M.xmax*u+74, H=oy+30;
  let s=`<svg class="grid" viewBox="0 0 ${W} ${H}">`;
  for(let i=0;i<=M.xmax;i++) s+=`<line x1="${ox+i*u}" y1="${oy}" x2="${ox+i*u}" y2="${oy-M.ymax*u}" stroke="#c7ad7a"/><text x="${ox+i*u-4}" y="${oy+20}" font-size="14" fill="#5a4116">${i}</text>`;
  for(let j=0;j<=M.ymax;j++) s+=`<line x1="${ox}" y1="${oy-j*u}" x2="${ox+M.xmax*u}" y2="${oy-j*u}" stroke="#c7ad7a"/><text x="${ox-22}" y="${oy-j*u+5}" font-size="14" fill="#5a4116">${j}</text>`;
  if(M.poly) s+=`<polyline points="${M.poly.map(p=>(ox+p[0]*u)+','+(oy-p[1]*u)).join(' ')}" fill="rgba(122,29,16,.08)" stroke="#7a1d10" stroke-width="3"/>`;
  for(const [nm,[x,y]] of Object.entries(M.pts||{})) s+=`<circle cx="${ox+x*u}" cy="${oy-y*u}" r="9" fill="#7a1d10"/><text x="${ox+x*u+11}" y="${oy-y*u-11}" font-size="19" font-weight="900" fill="#3b2a12">${nm}</text>`;
  for(let i=0;i<=M.xmax;i++) for(let j=0;j<=M.ymax;j++) s+=`<circle class="pt" data-x="${i}" data-y="${j}" cx="${ox+i*u}" cy="${oy-j*u}" r="20" fill="transparent" style="cursor:pointer"/>`;
  return s+`<circle id="pick" r="12" fill="#1565c0" opacity="0" stroke="#fff" stroke-width="3" pointer-events="none"/></svg>`; }
function imgSvg(M){ const xs=M.xs, ys=M.ys;
  let s=`<svg class="grid" viewBox="0 0 100 100"><image href="${M.img}" x="0" y="0" width="100" height="100"/>`;
  xs.forEach((x,i)=> s+=`<text x="${x}" y="${ys[0]+4.5}" text-anchor="middle" font-size="3.6" font-weight="800" fill="#5a3a12">${i}</text>`);
  ys.forEach((y,j)=>{ if(j) s+=`<text x="${xs[0]-2.4}" y="${y+1.3}" text-anchor="end" font-size="3.6" font-weight="800" fill="#5a3a12">${j}</text>`; });
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
  else { $('mBody').innerHTML=`<div class="dial"><div class="dialface"><div class="dialin"><div class="needle" id="needle"></div><div id="dval" class="mono">0°</div></div></div><div class="drow"><button class="k" data-d="-10">−10</button><button class="k" data-d="-1">−1</button><button class="k" data-d="1">+1</button><button class="k" data-d="10">+10</button></div></div>`;
    const upd=()=>{ $('dval').textContent=mState.a+'°'; $('needle').style.transform=`rotate(${180+mState.a}deg)`; }; upd();
    $('mBody').querySelectorAll('[data-d]').forEach(b=> b.onclick=()=>{ mState.a=(mState.a + +b.dataset.d + 360)%360; upd(); }); }
  show('mach'); }
$('mOk').onclick=()=>{ const M=G.mach[mState.n]; let r;
  if(M.type==='dial2') r=M.check(mState.a, mState.m);
  else if(M.type==='grid' || M.type==='img'){ if(mState.x===null){ sub('mMsg','info','먼저 점을 하나 고르세요.'); return; } r=M.check(mState.x, mState.y); }
  else r=M.check(mState.a);
  if(r.ok){ S.solved[mState.n]=1; emit('mach', mState.n); win(r); }
  else sub('mMsg','no', resultHTML({msg:r.msg, lose:lose('wrong')})); };

/* ---------- 첫 화면 버튼 ---------- */
document.querySelectorAll('[data-act]').forEach(b=> b.onclick=()=>{
  const a=b.dataset.act;
  if(a==='hint'||a==='code'||a==='machine') return openPad(a);
  if(!S.begun){ homeSay('info','먼저 <b>항해 시작</b>을 누르세요.'); return; }
  if(a==='pen'){ emit('pen'); homeSay('no', resultHTML({msg:'벌점 카드를 펼쳤군요. 그 <b>벌점 카드만</b> 치우세요. 합쳤던 카드는 그대로 둬요.', lose:lose('pen')})); }
  if(a==='hid'){ emit('hid'); homeSay('info','🔍 '+G.hidden(S)); }
});
if(!P){
  $('startBtn').onclick=()=>{ S.begun=true; S.start=Date.now(); S.running=true; $('startBtn').style.display='none'; $('endBtn').style.display='';
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

/* ---------- 연습: 단계 안내 ---------- */
let step=0;
function emit(ev, arg){ if(!P) return; const st=G.steps[step]; if(st && st.wait && st.wait(ev, arg)) nextStep(); }
function tutFeedback(cls, html){ const f=$('tfb'); if(!f) return; f.className='fb '+(cls==='ok'?'ok':cls==='no'?'no':'ok'); f.innerHTML=html; }
function paintStep(){
  const st=G.steps[step];
  $('steps').innerHTML = G.steps.map((_,i)=>`<i class="${i<step?'d':i===step?'n':''}"></i>`).join('');
  document.querySelectorAll('.btn').forEach(b=> b.classList.remove('glow'));
  (st.glow||[]).forEach(id=>{ const b=$('b_'+id); if(b) b.classList.add('glow'); });
  $('tcard').innerHTML = `<div class="lv">${step+1} / ${G.steps.length} · ${st.name}</div>${st.text(chip, dz)}`+
    (st.todo?`<div class="do">👉 ${st.todo(chip)}</div>`:'')+`<div class="fb" id="tfb"></div>`+
    (st.next?`<button class="tnext" id="tnext">${st.next}</button>`:'');
  if(st.next) $('tnext').onclick=()=> nextStep();
  if(st.showEnd){ $('endBtn').style.display=''; $('endBtn').classList.add('glow'); }
}
function nextStep(){ if(step < G.steps.length-1){ step++; paintStep(); } }
if(P) paintStep();

/* ---------- 결과 ---------- */
function finish(){
  if(S.running){ S.acc+=Date.now()-S.start; S.running=false; }
  const f=x=>Math.floor(x/60000)+'분 '+String(Math.floor(x%60000/1000)).padStart(2,'0')+'초';
  if(P){ $('stars').innerHTML='★★★★★'; $('resTb').innerHTML='<div class="ln"><span>배운 것</span><b>합치기 · 함정 · 숨은 번호 · 기계 · 힌트 · 자물쇠 · 탈출</b></div>'; show('done'); return; }
  const ms=elapsed(), min=ms/60000;
  let st=min<=30?5:min<=35?4:min<=40?3:min<=45?2:1; st=Math.max(0, st-Math.floor(S.hint/4));
  $('stars').innerHTML='★'.repeat(st)+'<em>'+'★'.repeat(5-st)+'</em>';
  $('resTb').innerHTML=`<div class="ln"><span>걸린 시간 · 힌트</span><b class="mono">${f(ms)} · ${S.hint}번</b></div><div class="ln"><span>벌점으로 잃은 시간</span><b class="mono">${S.pen}분 (${S.pen}번)</b></div><div class="ln"><span>틀린 답으로 잃은 시간</span><b class="mono">${S.wrong}분 (${S.wrong}번)</b></div>`;
  show('done'); }
window.__S=S; window.__step=()=>step;
})();
