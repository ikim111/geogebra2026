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
  let events = {}, ledger = null, ready = false, busy = false, message = '', pending = null;
  let day = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul'}).format(new Date());
  let month = day.slice(0,7);
  const originalRender = render;
  render = function () {
    originalRender();
    panel.hidden = tab !== 'presentation';
    if (!panel.hidden) draw();
  };
  const originalLoad = loadRoom;
  loadRoom = function (r) {
    if (ledger) ledger.off();
    events = {}; ready = false; pending = null; message = ''; ledger = null;
    originalLoad(r);
    if (!db) return;
    // 저장 경로: 최상위 presentationScores/… 는 Firebase 규칙이 막혀 있어(permission_denied) 다른 데이터처럼 rooms/ 아래에 둔다. 자리배치(__seat20)와는 별개 경로.
    const active = db.ref('rooms/' + r + '__present20/events');
    ledger = active;
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
  const sums = filter => {
    const out = {};
    list().filter(e=>!e.voided && filter(e)).forEach(e=>Object.values(e.awards).forEach(a=>{
      const v = out[a.no] ||= {direct:0,mentor:0,group:0,total:0};
      v[a.reason] = (v[a.reason]||0) + a.points; v.total += a.points;
    })); return out;
  };
  function studentButton(n, totals) {
    const x = byNo(n); if (!x) return '<div class="ps-empty">빈자리</div>';
    return `<button class="ps-student ${x.mentor?'ps-mentor':''}" data-ps-student="${n}" ${!ready||busy?'disabled':''}><b>${esc(x.name)}</b><small>${n}번 · ${x.mentor?'멘토':'멘티'}</small><strong>${totals[n]?.total||0}점</strong></button>`;
  }
  function draw() {
    const totals = sums(e=>e.date.startsWith(month));
    const cards = [6,5,4,3,2,1].map(g=>{
      const L=setAt(g,'L'), R=setAt(g,'R'), ls=L?S.seats[L.m]:{}, rs=R?S.seats[R.m]:{};
      const top = isSix(g) ? [ls.top,rs.top] : [ls.top];
      const nums = [...top,L?.m,rs.bot,ls.bot,R?.m];
      return `<article class="ps-group"><div class="row"><b>${g}모둠</b><button class="btn" data-ps-group="${g}" ${!ready||busy||!members(g).length?'disabled':''}>모둠 전체 +1</button></div><div class="ps-seats ${isSix(g)?'':'ps-five'}">${nums.map(n=>studentButton(n,totals)).join('')}</div></article>`;
    }).join('');
    const seated = new Set([1,2,3,4,5,6].flatMap(members));
    const unseated = roster().filter(x=>!seated.has(x.no));
    const history = list().filter(e=>e.date===day).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)||b.id.localeCompare(a.id));
    panel.innerHTML = `<div class="panel"><h2>${esc(room)}반 발표 기록</h2><p>학생 이름을 누르면 발표 점수 입력 · 멘티 발표는 연결된 멘토도 +1 · 모둠 점수는 확인 후 입력</p><div class="row"><label>기록 날짜 <input id="ps-day" type="date" value="${day}"></label><label>집계 월 <input id="ps-month" type="month" value="${month}"></label><button class="btn" id="ps-csv">월별 CSV</button><button class="btn" id="ps-json">전체 기록 백업</button></div><p role="status">${esc(message || (ready?'연결됨 · 입력 기록 자동 저장':'기록 연결 중 — 입력할 수 없습니다'))}</p><p class="hint">표시 점수는 선택한 월의 새 기록 합계입니다. 기존 명단 점수는 포함하지 않습니다. 하루 제한·주간 보너스는 자동 적용하지 않습니다.</p></div>
    ${pending?`<div class="panel"><b>${esc(pending.label)}</b><p>${pending.awards.map(a=>esc(a.name)+' +1').join(' · ')}</p><button class="btn primary" id="ps-confirm" ${busy?'disabled':''}>확정</button> <button class="btn" id="ps-cancel">취소</button></div>`:''}
    <div class="ps-board">${cards}</div>${unseated.length?`<div class="panel"><h3>자리 미배정</h3><div class="ps-unseated">${unseated.map(x=>studentButton(x.no,totals)).join('')}</div></div>`:''}
    <div class="panel"><h3>월별 집계 (${esc(month)})</h3><div style="overflow:auto"><table class="roster"><tr><th>번호</th><th>이름</th><th>직접 발표</th><th>멘토 점수</th><th>모둠 점수</th><th>합계</th></tr>${roster().map(x=>{const t=totals[x.no]||{};return `<tr><td>${x.no}</td><td>${esc(x.name)}</td><td>${t.direct||0}</td><td>${t.mentor||0}</td><td>${t.group||0}</td><td><b>${t.total||0}</b></td></tr>`;}).join('')}</table></div><h3>${esc(day)} 기록</h3>${history.map(e=>`<div class="ps-history">${e.voided?'[취소] ':''}${esc(e.label)} — ${Object.values(e.awards).map(a=>esc(a.name)+' +'+a.points).join(' · ')} ${!e.voided?`<button class="btn" data-ps-void="${esc(e.id)}" ${!ready||busy?'disabled':''}>이 기록 취소</button>`:''}</div>`).join('')||'<p>기록 없음</p>'}</div>`;
  }
  function award(no,reason) { return {no,name:byNo(no).name,points:1,reason}; }
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
    if(e.target.id==='ps-month' && e.target.value){month=e.target.value; draw();}
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
    } else if(b.id==='ps-json') download(room+'반_발표기록.json',JSON.stringify({schema:1,classNo:room,events},null,2),'application/json');
    else if(b.id==='ps-csv'){
      const t=sums(v=>v.date.startsWith(month));
      const rows=[['반','번호','이름','월','직접 발표','멘토 점수','모둠 점수','합계'],...roster().map(x=>{const v=t[x.no]||{};return [room,x.no,x.name,month,v.direct||0,v.mentor||0,v.group||0,v.total||0];})];
      const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
      download(room+'반_'+month+'_발표점수.csv','\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    }
  });
  const style=document.createElement('style');
  style.textContent='.ps-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:14px 0}.ps-group{background:white;border:1px solid #b9c5db;border-radius:12px;padding:12px}.ps-group>.row{justify-content:space-between;margin-bottom:10px}.ps-seats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.ps-five>:first-child{grid-column:span 2}.ps-student{border:1px solid #c4cedd;border-radius:8px;background:#f7faff;padding:14px 6px;cursor:pointer;color:#172443;font:inherit;min-height:86px}.ps-student small,.ps-student strong{display:block;margin-top:4px}.ps-student small{font-size:12px}.ps-student strong{color:#2157bd}.ps-mentor{background:#fff2bb}.ps-empty{min-height:86px;display:grid;place-items:center;color:#aaa}.ps-unseated{display:flex;gap:8px;flex-wrap:wrap}.ps-history{padding:10px 0;border-bottom:1px solid #ddd}.ps-student:disabled{opacity:.55;cursor:wait}@media(max-width:760px){.ps-board{grid-template-columns:1fr}}';
  document.head.append(style);
  // 최초 익명 인증이 끝나면 위에서 감싼 loadRoom으로 연결한다.
  if(ref) loadRoom(room);
})();
