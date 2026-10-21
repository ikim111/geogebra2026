/* teacher20.html 전용. 기존 자리배치 데이터는 수정하지 않는다. */
(() => {
  'use strict';
  const panel = document.createElement('section');
  panel.id = 't-presentation'; panel.hidden = true;
  document.querySelector('main').append(panel);
  const button = document.createElement('button');
  button.dataset.t = 'presentation'; button.textContent = '🎤 발표 기록';
  // 발표 기록은 매 수업 쓰는 탭이라 맨 앞에 둔다(자리 바꾸기는 학기에 두어 번)
  document.querySelector('#tabs').prepend(button);
  button.onclick = () => { tab = 'presentation'; render(); };
  /* 처음 열 때 탭: 주소에 ?tab=… 이 있으면 그것, 아니면 자리배치가 입력된 반은 발표 기록, 없는 반은 기존대로 */
  const qsTab = new URLSearchParams(location.search).get('tab');
  let tabPicked = false;
  document.querySelector('#tabs').addEventListener('click', e=>{ if(e.target.closest('button')) tabPicked = true; });
  function autoTab(){
    if (tabPicked) return;
    if (qsTab) { tab = qsTab; tabPicked = true; return; }
    if (S && S.roster && S.roster.length) { tab = Object.keys(S.seats||{}).length ? 'presentation' : tab; tabPicked = true; }
  }
  let pendingCount = 0;
  function paintBadge(){ button.textContent = '🎤 발표 기록' + (pendingCount ? ' 🛒' + pendingCount : ''); button.classList.toggle('ps-has-req', !!pendingCount); }
  let dangerOpen = false, openDays = new Set(), requests = {}, reqRef = null, events = {}, ledger = null, ready = false, busy = false, message = '', pending = null, resetAt = 0, resetRef = null;
  const COST = { jelly:{label:'🍬 망고젤리 1개', cost:1}, point:{label:'⭐ 상점 1점', cost:10} };
  let day = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul'}).format(new Date());
  
  const originalRender = render;
  render = function () {
    autoTab();
    originalRender();
    panel.hidden = tab !== 'presentation';
    if (!panel.hidden) draw();
  };
  const originalLoad = loadRoom;
  loadRoom = function (r) {
    if (ledger) ledger.off(); if (resetRef) resetRef.off(); if (reqRef) reqRef.off();
    events = {}; requests = {}; pendingCount = 0; paintBadge(); ready = false; pending = null; message = ''; ledger = null; resetAt = 0; resetRef = null; reqRef = null;
    originalLoad(r);
    if (!db) return;
    // 저장 경로: 최상위 presentationScores/… 는 Firebase 규칙이 막혀 있어(permission_denied) 다른 데이터처럼 rooms/ 아래에 둔다. 자리배치(__seat20)와는 별개 경로.
    const active = db.ref('rooms/' + r + '__present20/events');
    ledger = active;
    reqRef = db.ref('rooms/' + r + '__present20/requests');
    reqRef.on('value', snap => { if (ledger !== active) return; requests = snap.val() || {}; pendingCount = Object.values(requests).filter(x=>x && x.status==='pending').length; paintBadge(); if (tab === 'presentation') draw(); });
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
      const v = out[a.no] ||= {direct:0,mentor:0,group:0,redeem:0,penalty:0,total:0};
      v[a.reason] = (v[a.reason]||0) + a.points; v.total += a.points;
    })); return out;
  };
  function studentButton(n, totals) {
    const x = byNo(n); if (!x) return '<div class="ps-empty">빈자리</div>';
    return `<div class="ps-cell"><button class="ps-student ${x.mentor?'ps-mentor':''}" data-ps-student="${n}" ${!ready||busy?'disabled':''}><b>${esc(x.name)}</b><strong>${totals[n]?.total||0}점</strong><small>${n}번 · ${x.mentor?'멘토':'멘티'}</small></button><button class="ps-order" data-ps-order="${n}" title="주문(점수 차감)" ${!ready||busy?'disabled':''}>🛒</button><button class="ps-minus" data-ps-minus="${n}" title="감점 −1" ${!ready||busy?'disabled':''}>−1</button></div>`;
  }
  function draw() {
    const totals = sums();
    const cards = [6,5,4,3,2,1].map(g=>{
      const L=setAt(g,'L'), R=setAt(g,'R'), ls=L?S.seats[L.m]:{}, rs=R?S.seats[R.m]:{};
      const top = isSix(g) ? [ls.top,rs.top] : [ls.top];
      const nums = [...top,L?.m,rs.bot,ls.bot,R?.m];
      return `<article class="ps-group"><div class="row ps-ghead"><b>${g}모둠</b><span class="ps-gbtns"><button class="btn ps-gminus" data-ps-gminus="${g}" ${!ready||busy||!members(g).length?'disabled':''}>모둠 전체 −1</button><button class="btn ps-gplus" data-ps-group="${g}" ${!ready||busy||!members(g).length?'disabled':''}>모둠 전체 +1</button></span></div><div class="ps-seats ${isSix(g)?'':'ps-five'}">${nums.map(n=>studentButton(n,totals)).join('')}</div></article>`;
    }).join('');
    const seated = new Set([1,2,3,4,5,6].flatMap(members));
    const unseated = roster().filter(x=>!seated.has(x.no));
    /* 날짜별 기록: 오늘은 펼쳐서, 지난 날짜는 접어서(누르면 펼침) — 입력 날짜(기록 날짜)와는 별개 */
    const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul'}).format(new Date());
    const byDay = {}; list().forEach(e=>{ (byDay[e.date] ||= []).push(e); });
    const days = Object.keys(byDay).sort().reverse(); if(!days.includes(today)) days.unshift(today);
    const row = e=>`<div class="ps-history">${e.voided?'[취소] ':''}${esc(e.label)} — ${Object.values(e.awards).map(a=>esc(a.name)+' '+(a.points>0?'+':'')+a.points).join(' · ')} ${!e.voided?`<button class="btn" data-ps-void="${esc(e.id)}" ${!ready||busy?'disabled':''}>이 기록 취소</button>`:''}</div>`;
    const wk = d=>'일월화수목금토'[new Date(d+'T00:00:00+09:00').getDay()];
    const historyHTML = days.map(d=>{ const L=(byDay[d]||[]).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)||b.id.localeCompare(a.id)); const live=L.filter(e=>!e.voided).length;
      const head = `${d===today?'📅 오늘 ':''}${esc(d)} (${wk(d)}) · ${live}건${L.length>live?` <small>(취소 ${L.length-live})</small>`:''}`;
      const body = L.map(row).join('') || '<p class="hint">기록 없음</p>';
      return d===today ? `<div class="ps-day ps-today"><div class="ps-dayhead">${head}</div>${body}</div>` : `<details class="ps-day" data-day="${esc(d)}" ${openDays.has(d)?'open':''}><summary class="ps-dayhead">${head}</summary>${body}</details>`; }).join('');
    const resetTxt = resetAt ? new Date(resetAt).toLocaleDateString('ko-KR') + ' 초기화 이후' : '처음부터';
    panel.innerHTML = `<div class="panel ps-top"><div class="row"><h2 style="margin:0;">${esc(room)}반 발표 기록</h2><label title="발표를 입력할 때 저장되는 날짜예요. 지난 기록 보기는 맨 아래 날짜별 기록에서 해요.">입력 날짜 <input id="ps-day" type="date" value="${day}"></label>${day!==new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date())?'<b style="color:#c62828;font-size:13px;">⚠ 오늘이 아닌 날짜로 입력 중</b>':''}<button class="btn" id="ps-csv">집계 CSV</button><button class="btn" id="ps-json">전체 기록 백업</button><span role="status" class="ps-status">${esc(message || (ready?'● 연결됨 · 자동 저장':'○ 기록 연결 중 — 입력할 수 없습니다'))}</span></div><p class="hint ps-hint">이름을 누르면 발표 +1(멘티는 연결된 멘토도 +1) · 모둠 점수는 「모둠 전체 +1」로 바로 입력(잘못 눌렀으면 아래 날짜별 기록에서 취소) · 🛒 주문: 망고젤리 1개 −1점, 상점 1점 −10점(학생 신청은 위 목록에서 승인) · 집계는 <b>${esc(resetTxt)}</b> 합계(초기화 전까지 유지, 기존 명단 점수 제외)</p></div>
    ${(()=>{ const rq = Object.entries(requests).map(([id,r])=>({...r,id})).filter(r=>r && r.status==='pending').sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)); if(!rq.length) return ''; return `<div class="panel ps-req"><b>🛒 학생 주문 신청 ${rq.length}건</b> <span class="hint">— 물건을 건네주면서 ✔ 승인을 누르면 그때 점수가 빠져요</span><div class="ps-reqlist">${rq.map(r=>{ const bal=(totals[+r.no]||{}).total||0, it=COST[r.item], ok=it && bal>=it.cost; return `<span class="ps-reqitem"><b>${esc((byNo(+r.no)||{}).name||r.name||'')}</b> ${r.no}번 · ${esc(it?it.label:r.item)} (−${it?it.cost:'?'}) · 남은 ${bal}점 <button class="btn primary" data-ps-approve="${esc(r.id)}" ${!ready||busy||!ok?'disabled':''}>✔ 승인</button><button class="btn" data-ps-reject="${esc(r.id)}" ${!ready||busy?'disabled':''}>✖ 거절</button>${ok?'':'<small class="hint">점수 부족</small>'}</span>`; }).join('')}</div></div>`; })()}
    ${pending?`<div class="panel ps-pending"><b>${esc(pending.label)}</b><p>${pending.awards.map(a=>esc(a.name)+' '+(a.points>0?'+':'')+a.points).join(' · ')}${pending.note?` <span class="hint">${esc(pending.note)}</span>`:''}</p>${pending.choices?pending.choices.map(c=>`<button class="btn ${c.ok?'primary':''}" data-ps-choice="${c.key}" ${busy||!c.ok?'disabled':''}>${esc(c.label)}</button> `).join(''):`<button class="btn primary" id="ps-confirm" ${busy?'disabled':''}>확정</button> `}<button class="btn" id="ps-cancel">취소</button></div>`:''}
    <div class="ps-board">${cards}</div>${unseated.length?`<div class="panel"><h3>자리 미배정</h3><div class="ps-unseated">${unseated.map(x=>studentButton(x.no,totals)).join('')}</div></div>`:''}
    <div class="panel"><h3>날짜별 기록</h3>${historyHTML}</div><div class="panel"><h3>집계 (${esc(resetTxt)})</h3><div style="overflow:auto"><table class="roster"><tr><th>번호</th><th>이름</th><th>직접 발표</th><th>멘토 점수</th><th>모둠 점수</th><th>주문 차감</th><th>감점</th><th>남은 점수</th></tr>${roster().map(x=>{const t=totals[x.no]||{};return `<tr><td>${x.no}</td><td>${esc(x.name)}</td><td>${t.direct||0}</td><td>${t.mentor||0}</td><td>${t.group||0}</td><td>${t.redeem||0}</td><td>${t.penalty||0}</td><td><b>${t.total||0}</b></td></tr>`;}).join('')}</table></div><details class="ps-danger" ${dangerOpen?'open':''}><summary>⚙ 집계 초기화 (새 학기·새 집계 기간을 시작할 때만)</summary><p class="hint">누르면 그 시각부터 모든 학생의 점수가 0에서 다시 시작해요. 지난 기록은 날짜별 기록·백업에 그대로 남아요. 실수 방지를 위해 반 번호를 입력해야 해요.</p><button class="btn" id="ps-reset" ${!ready||busy?'disabled':''}>🔄 ${esc(room)}반 집계 초기화…</button></details></div>`;
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
  panel.addEventListener('toggle', e=>{ const t=e.target; if(!t.classList) return; if(t.classList.contains('ps-danger')) dangerOpen = t.open; if(t.classList.contains('ps-day') && t.dataset.day){ if(t.open) openDays.add(t.dataset.day); else openDays.delete(t.dataset.day); } }, true);
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
    } else if(b.dataset.psApprove || b.dataset.psReject){
      const id=b.dataset.psApprove||b.dataset.psReject, r=requests[id]; if(!r||r.status!=='pending'||!ready||busy) return;
      const activeRoom=room, n=+r.no, x=byNo(n), it=COST[r.item];
      busy=true; draw();
      try{
        if(b.dataset.psApprove){
          const bal=(sums()[n]||{}).total||0; if(!x||!it||bal<it.cost) throw new Error('점수가 모자라거나 명단에 없는 학생이에요.');
          const item=ledger.push(); await item.set({kind:'redeem',actorNo:n,item:r.item,label:x.name+' '+it.label+' 주문(학생 신청)',awards:[award(n,'redeem',-it.cost)],requestId:id,date:day,createdAt:firebase.database.ServerValue.TIMESTAMP});
          await reqRef.child(id).update({status:'approved',eventId:item.key,decidedAt:firebase.database.ServerValue.TIMESTAMP});
          if(room===activeRoom) message=x.name+' 주문 승인 — '+it.cost+'점 차감';
        } else { await reqRef.child(id).update({status:'rejected',decidedAt:firebase.database.ServerValue.TIMESTAMP}); if(room===activeRoom) message='주문 신청을 거절했어요.'; }
      }catch(err){ if(room===activeRoom) message='처리 실패: '+err.message; }
      finally{ busy=false; if(tab==='presentation') draw(); }
    } else if(b.dataset.psMinus){   // 감점 −1: 바로 저장하지 않고 확인 칸에서 「확정」(2026-10-21). 그 학생만 깎이고 멘토는 그대로
      const n=+b.dataset.psMinus, x=byNo(n); if(!x) return;
      await write({kind:'penalty',actorNo:n,label:x.name+' 감점',awards:[award(n,'penalty',-1)]});   // 바로 저장(잘못 누르면 아래 기록에서 취소)
    } else if(b.dataset.psGminus){   // 모둠 전체 −1: 확인 칸에서 「확정」해야 저장, 모둠원 각자 감점 −1(2026-10-21)
      const g=+b.dataset.psGminus, ms=members(g); if(!ms.length) return;
      await write({kind:'groupPenalty',group:g,label:g+'모둠 전체 감점',awards:ms.map(n=>award(n,'penalty',-1))});   // 바로 저장
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
      const typed = prompt(room+'반 발표 점수 집계를 지금부터 0에서 다시 시작합니다.\n(지난 기록은 지워지지 않고 날짜별 기록·백업에 남아요)\n\n정말 초기화하려면 반 번호 "'+room+'"를 입력하세요.');
      if(typed===null) return;
      if(String(typed).trim()!==String(room)){ message='반 번호가 달라서 초기화하지 않았어요.'; draw(); return; }
      try{ await resetRef.set(firebase.database.ServerValue.TIMESTAMP); message='집계를 초기화했어요.'; }catch(err){ message='초기화 실패: '+err.message; }
      draw();
    } else if(b.dataset.psGroup){const g=+b.dataset.psGroup; await write({kind:'group',group:g,label:g+'모둠 점수',awards:members(g).map(n=>award(n,'group'))});}
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
      const rows=[['반','번호','이름','집계 시작','직접 발표','멘토 점수','모둠 점수','주문 차감','감점','남은 점수'],...roster().map(x=>{const v=t[x.no]||{};return [room,x.no,x.name,since,v.direct||0,v.mentor||0,v.group||0,v.redeem||0,v.penalty||0,v.total||0];})];
      const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
      download(room+'반_발표점수_'+day+'.csv','\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    }
  });
  const style=document.createElement('style');
  style.textContent='.ps-top .row{align-items:center;gap:10px;flex-wrap:wrap}.ps-top label{font-size:13px}.ps-status{font-size:13px;color:#2e7d32;margin-left:auto}.ps-hint{margin:4px 0 0;font-size:12px}.ps-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:10px 0}.ps-group{background:white;border:1px solid #b9c5db;border-radius:10px;padding:8px 10px}.ps-group>.row{justify-content:space-between;margin-bottom:6px;align-items:center}.ps-group>.row .btn{padding:4px 10px;font-size:13px}.ps-seats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.ps-five>:first-child{grid-column:span 2}.ps-cell{position:relative}.ps-cell .ps-student{width:100%}.ps-ghead{display:flex;align-items:center;gap:8px}.ps-gbtns{margin-left:auto;display:flex;gap:6px}.ps-gminus{color:#c62828 !important;border-color:#ef9a9a !important;background:#fff5f5 !important}.ps-gplus{color:#1565c0 !important;border-color:#90caf9 !important;background:#f3f8ff !important}.ps-minus{position:absolute;left:4px;bottom:4px;border:1px solid #ef9a9a;background:#fff;color:#c62828;border-radius:6px;font-size:12px;font-weight:bold;padding:1px 5px;cursor:pointer;line-height:1.3}.ps-order{position:absolute;right:4px;bottom:4px;border:1px solid #c4cedd;background:#fff;border-radius:6px;font-size:12px;padding:1px 4px;cursor:pointer;line-height:1.3}.ps-order:disabled{opacity:.5}.ps-pending .btn{margin-bottom:4px}.ps-req{border:2px solid #f0a500;background:#fffbe6}.ps-reqlist{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}.ps-reqitem{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #f3d27a;border-radius:8px;padding:4px 8px;font-size:14px}.ps-reqitem .btn{padding:3px 9px;font-size:13px}.ps-has-req{color:#b26a00 !important;font-weight:bold}.ps-day{border:1px solid #d6dce6;border-radius:8px;padding:6px 12px;margin:6px 0;background:#fff}.ps-today{border-color:#1565c0;background:#f5f9ff}.ps-dayhead{font-weight:bold;cursor:pointer;padding:2px 0}.ps-today .ps-dayhead{cursor:default;color:#1565c0}.ps-day .ps-history{padding:6px 0}.ps-danger{margin:14px 0;border:1px dashed #e57373;border-radius:8px;padding:6px 10px;background:#fff8f8}.ps-danger summary{cursor:pointer;color:#b71c1c;font-size:13.5px}.ps-student{border:1px solid #c4cedd;border-radius:8px;background:#f7faff;padding:7px 6px 5px;cursor:pointer;color:#172443;font:inherit;min-height:56px;line-height:1.25}.ps-student b{font-size:15px}.ps-student strong{color:#2157bd;margin-left:6px;font-size:14px}.ps-student small{display:block;margin-top:2px;font-size:11px;color:#667}.ps-mentor{background:#fff2bb}.ps-empty{min-height:56px;display:grid;place-items:center;color:#aaa;font-size:13px}.ps-unseated{display:flex;gap:8px;flex-wrap:wrap}.ps-unseated .ps-student{min-width:120px}.ps-history{padding:10px 0;border-bottom:1px solid #ddd}.ps-student:disabled{opacity:.55;cursor:wait}@media(max-width:760px){.ps-board{grid-template-columns:1fr}}';
  document.head.append(style);
  // 최초 익명 인증이 끝나면 위에서 감싼 loadRoom으로 연결한다.
  if(ref) loadRoom(room);
})();
