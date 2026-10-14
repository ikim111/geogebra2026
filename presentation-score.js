/* teacher20.html 전용. 기존 자리배치 데이터는 수정하지 않는다. */
(() => {
  'use strict';
  const panel = document.createElement('section');
  panel.id = 't-presentation'; panel.hidden = true;
  document.querySelector('main').append(panel);
  const button = document.createElement('button');
  button.dataset.t = 'presentation'; button.textContent = '⑤ 발표 기록';
  document.querySelector('#tabs').append(button);
  button.onclick = () => { tab = 'presentation'; render(); };
  let events = {}, ledger = null, ready = false, busy = false, message = '', pending = null, resetAt = 0, resetRef = null;
  const COST = { jelly:{label:'🍬 망고젤리 1개', cost:1}, point:{label:'⭐ 상점 1점', cost:10} };
  let day = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul'}).format(new Date());
  
  const originalRender = render;
  render = function () {
    originalRender();
    panel.hidden = tab !== 'presentation';
    if (!panel.hidden) draw();
  };
  const originalLoad = loadRoom;
  loadRoom = function (r) {
    if (ledger) ledger.off(); if (resetRef) resetRef.off();
    events = {}; ready = false; pending = null; message = ''; ledger = null; resetAt = 0; resetRef = null;
    originalLoad(r);
    if (!db) return;
    // 저장 경로: 최상위 presentationScores/… 는 Firebase 규칙이 막혀 있어(permission_denied) 다른 데이터처럼 rooms/ 아래에 둔다. 자리배치(__seat20)와는 별개 경로.
    const active = db.ref('rooms/' + r + '__present20/events');
    ledger = active;
    resetRef = db.ref('rooms/' + r + '__present20/resetAt');
    resetRef.on('value', snap => { if (ledger !== active) return; resetAt = +snap.val() || 0; if (tab === 'presentation') draw(); });
    active.on('value', snap => {
      if (ledger !== active) return;
      events = snap.val() || {}; ready = true;
      if (tab === 'presentation') draw();
    }, err => {
      if (ledger !== active) return;
      ready = false; message = '기록을 불러오지 못했습니다: ' + err.message;
      if (tab === 'presentation') draw();
    });
  };
  const list = () => Object.entries(events).map(([id,e]) => ({...e,id})).filter(e => e && e.date && e.awards);
  const roster = () => [...S.roster].sort((a,b)=>a.no-b.no);
  const members = g => [...new Set(S.teams.filter(t => S.seats[t.m] && +S.seats[t.m].g === g).flatMap(t=>[t.m,...t.e]))].filter(n=>byNo(n));
  /* 집계: 선생님이 「집계 초기화」를 누른 시각(resetAt) 이후의 기록만 합산한다(월이 바뀌어도 지워지지 않음). 주문(redeem)은 음수 점수. */
  const sums = () => {
    const out = {};
    list().filter(e=>!e.voided && (+e.createdAt||0) > resetAt).forEach(e=>Object.values(e.awards).forEach(a=>{
      const v = out[a.no] ||= {direct:0,mentor:0,group:0,redeem:0,total:0};
      v[a.reason] = (v[a.reason]||0) + a.points; v.total += a.points;
    })); return out;
  };
  function studentButton(n, totals) {
    const x = byNo(n); if (!x) return '<div class="ps-empty">빈자리</div>';
    return `<div class="ps-cell"><button class="ps-student ${x.mentor?'ps-mentor':''}" data-ps-student="${n}" ${!ready||busy?'disabled':''}><b>${esc(x.name)}</b><strong>${totals[n]?.total||0}점</strong><small>${n}번 · ${x.mentor?'멘토':'멘티'}</small></button><button class="ps-order" data-ps-order="${n}" title="주문(점수 차감)" ${!ready||busy?'disabled':''}>🛒</button></div>`;
  }
  function draw() {
    const totals = sums();
    const cards = [6,5,4,3,2,1].map(g=>{
      const L=setAt(g,'L'), R=setAt(g,'R'), ls=L?S.seats[L.m]:{}, rs=R?S.seats[R.m]:{};
      const top = isSix(g) ? [ls.top,rs.top] : [ls.top];
      const nums = [...top,L?.m,rs.bot,ls.bot,R?.m];
      return `<article class="ps-group"><div class="row"><b>${g}모둠</b><button class="btn" data-ps-group="${g}" ${!ready||busy||!members(g).length?'disabled':''}>모둠 전체 +1</button></div><div class="ps-seats ${isSix(g)?'':'ps-five'}">${nums.map(n=>studentButton(n,totals)).join('')}</div></article>`;
    }).join('');
    const seated = new Set([1,2,3,4,5,6].flatMap(members));
    const unseated = roster().filter(x=>!seated.has(x.no));
    const history = list().filter(e=>e.date===day).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)||b.id.localeCompare(a.id));
    const resetTxt = resetAt ? new Date(resetAt).toLocaleDateString('ko-KR') + ' 초기화 이후' : '처음부터';
    panel.innerHTML = `<div class="panel ps-top"><div class="row"><h2 style="margin:0;">${esc(room)}반 발표 기록</h2><label>기록 날짜 <input id="ps-day" type="date" value="${day}"></label><button class="btn" id="ps-csv">집계 CSV</button><button class="btn" id="ps-json">전체 기록 백업</button><button class="btn" id="ps-reset" ${!ready||busy?'disabled':''}>🔄 집계 초기화</button><span role="status" class="ps-status">${esc(message || (ready?'● 연결됨 · 자동 저장':'○ 기록 연결 중 — 입력할 수 없습니다'))}</span></div><p class="hint ps-hint">이름을 누르면 발표 +1(멘티는 연결된 멘토도 +1) · 모둠 점수는 확인 후 입력 · 집계는 <b>${esc(resetTxt)}</b> 합계(초기화 전까지 유지, 기존 명단 점수 제외)</p></div>
    ${pending?`<div class="panel ps-pending"><b>${esc(pending.label)}</b><p>${pending.awards.map(a=>esc(a.name)+' '+(a.points>0?'+':'')+a.points).join(' · ')}${pending.note?` <span class="hint">${esc(pending.note)}</span>`:''}</p>${pending.choices?pending.choices.map(c=>`<button class="btn ${c.ok?'primary':''}" data-ps-choice="${c.key}" ${busy||!c.ok?'disabled':''}>${esc(c.label)}</button> `).join(''):`<button class="btn primary" id="ps-confirm" ${busy?'disabled':''}>확정</button> `}<button class="btn" id="ps-cancel">취소</button></div>`:''}
    <div class="ps-board">${cards}</div>${unseated.length?`<div class="panel"><h3>자리 미배정</h3><div class="ps-unseated">${unseated.map(x=>studentButton(x.no,totals)).join('')}</div></div>`:''}
    <div class="panel"><h3>집계 (${esc(resetTxt)})</h3><div style="overflow:auto"><table class="roster"><tr><th>번호</th><th>이름</th><th>직접 발표</th><th>멘토 점수</th><th>모둠 점수</th><th>주문 차감</th><th>남은 점수</th></tr>${roster().map(x=>{const t=totals[x.no]||{};return `<tr><td>${x.no}</td><td>${esc(x.name)}</td><td>${t.direct||0}</td><td>${t.mentor||0}</td><td>${t.group||0}</td><td>${t.redeem||0}</td><td><b>${t.total||0}</b></td></tr>`;}).join('')}</table></div><h3>${esc(day)} 기록</h3>${history.map(e=>`<div class="ps-history">${e.voided?'[취소] ':''}${esc(e.label)} — ${Object.values(e.awards).map(a=>esc(a.name)+' '+(a.points>0?'+':'')+a.points).join(' · ')} ${!e.voided?`<button class="btn" data-ps-void="${esc(e.id)}" ${!ready||busy?'disabled':''}>이 기록 취소</button>`:''}</div>`).join('')||'<p>기록 없음</p>'}</div>`;
  }
  function award(no,reason,points) { return {no,name:byNo(no).name,points:points==null?1:points,reason}; }
  async function write(data) {
    if (!ready || busy || !ledger) return;
    const target = ledger, activeRoom = room;
    busy = true; draw();
    try {
      const item = target.push();
      await item.set({...data,date:day,createdAt:firebase.database.ServerValue.TIMESTAMP});
      if (room===activeRoom) { message=data.label+' 저장됨'; pending=null; }
    } catch(err) { if(room===activeRoom) message='저장 실패: '+err.message; }
    finally { busy=false; if(tab==='presentation') draw(); }
  }
  function download(filename,body,type) {
    const url=URL.createObjectURL(new Blob([body],{type})), a=document.createElement('a');
    a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  panel.addEventListener('change', e=>{
    if(e.target.id==='ps-day' && e.target.value){day=e.target.value; pending=null; draw();}
  });
  panel.addEventListener('click', async e=>{
    const b=e.target.closest('button'); if(!b || b.disabled) return;
    if(b.dataset.psStudent){
      const n=+b.dataset.psStudent, x=byNo(n), team=teamOf(n);
      if(!x.mentor && (!team || team.m===n || !byNo(team.m))){message='멘티의 연결된 멘토를 먼저 짝 정하기에서 지정해 주세요.';draw();return;}
      const awards=[award(n,'direct')]; if(!x.mentor) awards.push(award(team.m,'mentor'));
      const data={kind:'presentation',actorNo:n,label:x.name+' 발표',awards};
      if(list().some(v=>!v.voided&&v.date===day&&v.actorNo===n&&v.kind==='presentation')){pending={...data,label:x.name+' 추가 발표 (오늘 기록 있음)'};draw();}
      else await write(data);
    } else if(b.dataset.psOrder){
      const n=+b.dataset.psOrder, x=byNo(n), bal=(sums()[n]||{}).total||0;
      pending={kind:'redeem',actorNo:n,label:x.name+' 주문 (남은 점수 '+bal+'점)',awards:[],note:'망고젤리 1개 = 1점, 상점 1점 = 10점',
        choices:Object.entries(COST).map(([key,c])=>({key,label:c.label+' (−'+c.cost+')',ok:bal>=c.cost}))};
      draw();
    } else if(b.dataset.psChoice && pending && pending.kind==='redeem'){
      const c=COST[b.dataset.psChoice], n=pending.actorNo, x=byNo(n), bal=(sums()[n]||{}).total||0;
      if(!c || bal<c.cost){message='점수가 모자라요.';pending=null;draw();return;}
      await write({kind:'redeem',actorNo:n,item:b.dataset.psChoice,label:x.name+' '+c.label+' 주문',awards:[award(n,'redeem',-c.cost)]});
    } else if(b.id==='ps-reset'){
      if(!ready||busy||!resetRef) return;
      if(!confirm(room+'반 발표 점수 집계를 지금부터 다시 0에서 시작할까요?\n(지난 기록은 지워지지 않고 백업·날짜별 기록에 남아요)')) return;
      try{ await resetRef.set(firebase.database.ServerValue.TIMESTAMP); message='집계를 초기화했어요.'; }catch(err){ message='초기화 실패: '+err.message; }
      draw();
    } else if(b.dataset.psGroup){const g=+b.dataset.psGroup;pending={kind:'group',group:g,label:g+'모둠 점수',awards:members(g).map(n=>award(n,'group'))};draw();}
    else if(b.id==='ps-confirm' && pending) await write(pending);
    else if(b.id==='ps-cancel'){pending=null;draw();}
    else if(b.dataset.psVoid){
      if(!ready||busy)return;
      const target=ledger.child(b.dataset.psVoid), activeRoom=room;
      busy=true;draw();
      try{await target.child('voided').set(true);if(room===activeRoom)message='기록을 취소했습니다.';}
      catch(err){if(room===activeRoom)message='취소 실패: '+err.message;}
      finally{busy=false;if(tab==='presentation')draw();}
    } else if(b.id==='ps-json') download(room+'반_발표기록.json',JSON.stringify({schema:2,classNo:room,resetAt,events},null,2),'application/json');
    else if(b.id==='ps-csv'){
      const t=sums(), since=resetAt?new Date(resetAt).toISOString().slice(0,10):'처음';
      const rows=[['반','번호','이름','집계 시작','직접 발표','멘토 점수','모둠 점수','주문 차감','남은 점수'],...roster().map(x=>{const v=t[x.no]||{};return [room,x.no,x.name,since,v.direct||0,v.mentor||0,v.group||0,v.redeem||0,v.total||0];})];
      const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
      download(room+'반_발표점수_'+day+'.csv','\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    }
  });
  const style=document.createElement('style');
  style.textContent='.ps-top .row{align-items:center;gap:10px;flex-wrap:wrap}.ps-top label{font-size:13px}.ps-status{font-size:13px;color:#2e7d32;margin-left:auto}.ps-hint{margin:4px 0 0;font-size:12px}.ps-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:10px 0}.ps-group{background:white;border:1px solid #b9c5db;border-radius:10px;padding:8px 10px}.ps-group>.row{justify-content:space-between;margin-bottom:6px;align-items:center}.ps-group>.row .btn{padding:4px 10px;font-size:13px}.ps-seats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.ps-five>:first-child{grid-column:span 2}.ps-cell{position:relative}.ps-cell .ps-student{width:100%}.ps-order{display:none;position:absolute;right:4px;bottom:4px;border:1px solid #c4cedd;background:#fff;border-radius:6px;font-size:12px;padding:1px 4px;cursor:pointer;line-height:1.3}.ps-order:disabled{opacity:.5}.ps-pending .btn{margin-bottom:4px}.ps-student{border:1px solid #c4cedd;border-radius:8px;background:#f7faff;padding:7px 6px 5px;cursor:pointer;color:#172443;font:inherit;min-height:56px;line-height:1.25}.ps-student b{font-size:15px}.ps-student strong{color:#2157bd;margin-left:6px;font-size:14px}.ps-student small{display:block;margin-top:2px;font-size:11px;color:#667}.ps-mentor{background:#fff2bb}.ps-empty{min-height:56px;display:grid;place-items:center;color:#aaa;font-size:13px}.ps-unseated{display:flex;gap:8px;flex-wrap:wrap}.ps-unseated .ps-student{min-width:120px}.ps-history{padding:10px 0;border-bottom:1px solid #ddd}.ps-student:disabled{opacity:.55;cursor:wait}@media(max-width:760px){.ps-board{grid-template-columns:1fr}}';
  document.head.append(style);
  // 최초 익명 인증이 끝나면 위에서 감싼 loadRoom으로 연결한다.
  if(ref) loadRoom(room);
})();
