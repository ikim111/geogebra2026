/* 🎨 2026-10-27 교사용 대시보드 공통 디자인 (일반 단원 t*.html)
   기존 화면의 요소(아이디·이벤트)는 그대로 두고, 위치와 모양만 바꾼다.
   - 제목 한 줄 · 현재 반 배지 · 관리 버튼 묶음
   - 수업 운영 카드: 지금 열림/닫힘 + 수업 시작(초록)/종료(빨강) + 속도조절
   - 현황 숫자 카드 · 공지 버튼 차분한 색 */
(function(){
  const $ = id => document.getElementById(id);
  const css = `
  .td-badge{display:inline-block;background:#1a237e;color:#fff;border-radius:16px;padding:5px 12px;font-size:13.5px;font-weight:bold;white-space:nowrap;}
  .td-mgmt{display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap;background:#f3f4f7;border:1px solid #e3e5ea;border-radius:10px;padding:4px 6px;margin-left:auto;}
  .td-mgmt .td-lab{font-size:11.5px;color:#888;margin:0 4px;}
  .td-mgmt button{padding:5px 9px!important;font-size:13px!important;border-radius:6px!important;background:#fff!important;border:1px solid #ddd!important;color:#555!important;height:auto!important;}
  .td-mgmt button:disabled{opacity:.45;cursor:default;}
  .td-mgmt #clearBtn, .td-mgmt #deleteSelectedBtn{color:#c62828!important;border-color:#f3c0c0!important;}
  .td-top button.td-plain{background:#fff!important;color:#333!important;border:1px solid #d5d8e0!important;border-radius:8px!important;height:38px;padding:0 14px!important;font-size:13.5px!important;}
  .td-top .unitListLink{height:38px;box-sizing:border-box;}
  .td-card{margin-top:10px;border:1px solid #e0e3f0;border-radius:12px;padding:10px;background:#fff;}
  .td-row{display:flex;gap:10px;align-items:stretch;flex-wrap:wrap;}
  .td-state{flex:1;min-width:280px;border:1px solid #d5d8e0;border-left:6px solid #bbb;border-radius:10px;padding:8px 14px;display:flex;flex-direction:column;justify-content:center;gap:2px;}
  .td-state .big{font-size:17px;font-weight:bold;} .td-state .big small{font-size:13px;font-weight:normal;color:#555;margin-left:4px;} .td-state .nx{font-size:13px;color:#555;}
  .td-state.open{border-left-color:#66bb6a;} .td-state.open .big{color:#1b5e20;}
  .td-state.closed{border-left-color:#e57373;} .td-state.closed .big{color:#b71c1c;}
  .td-btns{display:flex;gap:6px;align-items:stretch;}
  .td-btns button{padding:0 16px!important;font-size:14px!important;font-weight:bold;border-radius:8px!important;border-width:2px!important;border-style:solid!important;min-height:44px;}
  .td-btns #classStartBtn{background:#fff!important;color:#2e7d32!important;border-color:#66bb6a!important;}
  .td-btns #classEndBtn{background:#fff!important;color:#c62828!important;border-color:#e57373!important;}
  .td-btns #classStartBtn.active{background:#2e7d32!important;color:#fff!important;border-color:#2e7d32!important;}
  .td-btns #classEndBtn.active{background:#c62828!important;color:#fff!important;border-color:#c62828!important;}
  .td-pace{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;border:1px solid #d5d8e0;border-radius:10px;padding:8px 12px;}
  .td-pace .td-pl{font-size:13.5px;font-weight:bold;white-space:nowrap;} .td-pace .td-ps{font-size:12.5px;color:#666;}
  .td-pace #paceTrack .pace-chip{width:38px;height:36px;border-radius:8px;font-size:14px;}
  .td-pace #paceTrack .pace-chip.selected{background:#3949ab;border-color:#3949ab;}
  .td-pace #paceClearBtn{margin-left:auto;background:#fff!important;color:#444!important;border:1px solid #d5d8e0!important;border-radius:8px!important;height:34px;padding:0 12px!important;font-size:13px!important;}
  .td-pace #paceBadge{margin:0!important;background:none!important;border:none!important;padding:0!important;color:#888!important;font-size:12.5px!important;}
  #announceBtn{background:#3949ab!important;color:#fff!important;border:none!important;border-radius:8px!important;height:38px;padding:0 14px!important;font-size:13.5px!important;}
  #announceClearBtn{background:#fff!important;color:#444!important;border:1px solid #d5d8e0!important;border-radius:8px!important;height:38px;padding:0 14px!important;font-size:13.5px!important;}
  .td-cards{gap:10px;margin-top:10px;flex-wrap:wrap;}
  .td-cards .sc{flex:1;min-width:140px;background:#fff;border:1px solid #d5d8e0;border-radius:12px;padding:8px 14px;}
  .td-cards .l{font-size:12px;color:#777;} .td-cards .v{font-size:32px;font-weight:bold;color:#1a237e;line-height:1.15;} .td-cards .v b{font-size:inherit!important;color:inherit!important;} .td-cards .v small{font-size:14px;color:#666;font-weight:normal;margin-left:3px;}

  #stagePanel{background:#fff!important;border:1px solid #d5d8e0!important;border-radius:10px!important;margin-top:8px!important;}
  #conceptReveal{background:#fff!important;color:#3949ab!important;border:2px solid #3949ab!important;border-radius:8px!important;font-weight:bold;}
  #conceptReveal.active{background:#3949ab!important;color:#fff!important;}
  #stageFree{background:#fff!important;color:#e65100!important;border:2px solid #fb8c00!important;border-radius:8px!important;font-weight:bold;}
  .stg-wait{margin-top:8px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:13px;background:#f3f4f7;color:#999;}
  .stg-wait.now{background:#e8f5e9;color:#2e7d32;font-weight:bold;}
  #aggPanel{background:#fff!important;border:1px solid #d5d8e0!important;border-left:5px solid #f9c74f!important;color:#333!important;}
  #aggAnnounceBtn{background:#3949ab!important;color:#fff!important;border:none!important;border-radius:8px!important;}
  #aiReqBox{background:#fff!important;border:1px solid #d5d8e0!important;border-left:5px solid #9575cd!important;}

  .td-pace .td-sched{margin-left:auto;background:#fff!important;color:#5e35b1!important;border:2px solid #9575cd!important;border-radius:8px!important;height:34px;padding:0 12px!important;font-size:13px!important;font-weight:bold;}
  .td-pace #schedNow{font-size:12.5px!important;color:#5e35b1!important;}
  #aiAgg{background:#fff!important;border:1px solid #d5d8e0!important;color:#333!important;}
  .td-aion,.td-aioff{height:38px;padding:0 14px;border-radius:8px;font-weight:bold;font-size:13.5px;cursor:pointer;background:#fff;}
  .td-aion{color:#2e7d32;border:2px solid #66bb6a;} .td-aion.active{background:#2e7d32;color:#fff;border-color:#2e7d32;}
  .td-aioff{color:#c62828;border:2px solid #e57373;} .td-aioff.active{background:#c62828;color:#fff;border-color:#c62828;}
  #qScanBtn,#readyBtn{background:#fff!important;color:#333!important;border:1px solid #d5d8e0!important;border-radius:8px!important;height:38px;padding:0 14px!important;}
  .td-plainset button.pause, .td-plainset button.send{background:#fff!important;color:#333!important;border:1px solid #d5d8e0!important;border-radius:8px!important;}
  .td-plainset button.active{background:#3949ab!important;color:#fff!important;border-color:#3949ab!important;}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // 1) 제목 한 줄: "📊 교사용 실시간 대시보드 — 5. 삼각형의 내심" → "📊 5. 삼각형의 내심 · 5반"
  const h1 = document.querySelector('header h1');
  if(h1 && !$('hdrRoom')){
    h1.textContent = h1.textContent.replace(/교사용 실시간 대시보드\s*[—-]\s*/, '');
    const sub = document.createElement('span'); sub.className = 'td-sub'; sub.style.cssText = 'font-weight:normal;opacity:.85;font-size:.8em;margin-left:6px;'; h1.appendChild(sub);
    const p = document.querySelector('header p'); if(p) p.style.display = 'none';
    const lab = $('currentRoomLabel');
    const sync = ()=>{ const t = (lab && lab.textContent || '').trim(); sub.textContent = (t && t !== '-') ? '· ' + t : ''; };
    if(lab){ new MutationObserver(sync).observe(lab, { childList:true, characterData:true, subtree:true }); sync(); }
  }


  // 0) 반 선택: 드롭다운 + [시작하기] → 반 버튼 한 번에 바로 들어가기
  (function build(tries){
    const sel = $('roomCode'), go = $('connectBtn'); if(!sel || !go || sel.tagName !== 'SELECT') return;
    const opts = [...sel.options].filter(o=> o.value); if(!opts.length){ if((tries||0) < 40) setTimeout(()=> build((tries||0)+1), 150); return; }
    let last = ''; try{ last = localStorage.getItem('td_lastRoom') || ''; }catch(e){}
    const grid = document.createElement('div'); grid.className = 'td-rooms';
    opts.forEach(o=>{ const b = document.createElement('button'); b.type = 'button'; b.textContent = o.textContent; if(o.value === last) b.classList.add('last');
      b.onclick = ()=>{ grid.querySelectorAll('button').forEach(x=> x.classList.toggle('last', x===b)); sel.value = o.value; try{ localStorage.setItem('td_lastRoom', o.value); }catch(e){} go.click(); }; grid.appendChild(b); });
    const row = sel.parentElement; row.style.display = 'none'; row.after(grid);
    const h = row.parentElement && row.parentElement.querySelector('h2, h3, .title'); if(h && /반을 선택/.test(h.textContent)) h.textContent = '들어갈 반을 누르세요';
    const cs = $('connStatus'); if(cs && /시작하기/.test(cs.textContent)) cs.textContent = '';
    const st2 = document.createElement('style'); st2.textContent = `.td-rooms{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:6px 0 4px;}
      .td-rooms button{height:46px;border-radius:10px;border:1px solid #c5cae9;background:#fff;color:#1a237e;font-size:16px;font-weight:bold;cursor:pointer;}
      .td-rooms button:hover{background:#e8eaf6;} .td-rooms button.last{background:#1a237e;color:#fff;border-color:#1a237e;}
      @media (max-width:520px){ .td-rooms{grid-template-columns:repeat(4,minmax(0,1fr));} }`;
    document.head.appendChild(st2);
  })(0);
  // 반 변경을 누르면 제목에 남은 반 이름 지우기
  { const cb = $('changeRoomBtn'); if(cb) cb.addEventListener('click', ()=> setTimeout(()=>{ const app = $('teacherAppScreen'); if(app && getComputedStyle(app).display === 'none'){ const hr = $('hdrRoom'); if(hr) hr.textContent = ''; const s1 = document.querySelector('header h1 .td-sub'); if(s1) s1.textContent = ''; } }, 300)); }
  const start = $('classStartBtn'), end = $('classEndBtn');
  const topRow = $('changeRoomBtn') && $('changeRoomBtn').parentElement;
  const custom = !!document.querySelector('.op-card');   // 2부(tpa3)처럼 이미 운영 카드가 있는 화면은 윗줄·공지만 맞춘다

  // 2) 맨 윗줄: 현재 반 배지 · 관리 버튼 묶음
  if(topRow){
    topRow.classList.add('td-top');
    const lab = $('currentRoomLabel');
    if(lab && lab.parentElement && lab.parentElement.parentElement === topRow){
      const wrap = lab.parentElement; const badge = document.createElement('span'); badge.className = 'td-badge';
      const sync = ()=>{ badge.textContent = (lab.textContent || '-').trim(); }; new MutationObserver(sync).observe(lab, { childList:true, characterData:true, subtree:true }); sync();
      wrap.style.display = 'none'; wrap.after(badge);
    }
    ['changeRoomBtn','pauseBtn'].forEach(id=>{ const b = $(id); if(b) b.classList.add('td-plain'); });
    const ids = ['anonymizeBtn','backupBtn','surveySubmitBtn','deleteSelectedBtn','clearBtn'].filter(id=> $(id) && $(id).parentElement === topRow);
    if(ids.length){
      const g = document.createElement('span'); g.className = 'td-mgmt'; g.innerHTML = '<span class="td-lab">관리</span>';
      topRow.appendChild(g); ids.forEach(id=> g.appendChild($(id)));
      topRow.style.flexWrap = 'wrap';
    }
    const tools = topRow.querySelector('.tools');
    if(tools){ tools.classList.add('td-mgmt'); const bar = tools.querySelector('.bar'); if(bar) bar.remove(); tools.insertAdjacentHTML('afterbegin','<span class="td-lab">관리</span>'); }
  }
  // 공지는 맨 위(반·관리 줄 바로 아래)
  const annRow = $('announceInput') && $('announceInput').parentElement;
  if(annRow && topRow){ topRow.after(annRow); annRow.style.marginTop = '10px'; }
  if(custom){ const oc = document.querySelector('.op-card'); if(oc && annRow) annRow.after(oc); }
  if(custom || !start || !end) return;

  // 3) 수업 운영 카드: 상태 + 시작/종료 + 속도조절
  const oldRow = end.parentElement;
  const card = document.createElement('div'); card.className = 'td-card';
  const row = document.createElement('div'); row.className = 'td-row';
  const state = document.createElement('div'); state.className = 'td-state';
  const btns = document.createElement('div'); btns.className = 'td-btns';
  btns.appendChild(start); btns.appendChild(end);
  row.appendChild(state); row.appendChild(btns); card.appendChild(row);
  if(annRow && topRow) annRow.after(card); else if(topRow) topRow.after(card); else oldRow.before(card); oldRow.style.display = 'none';
  if(!/\(/.test(start.textContent)) start.textContent = '▶ 수업 시작';
  if(!/\(/.test(end.textContent)) end.textContent = '⏹ 수업 종료';
  const paint = ()=>{
    const ended = end.classList.contains('active');
    state.className = 'td-state ' + (ended ? 'closed' : 'open');
    state.innerHTML = ended
      ? '<span class="big">🔒 수업 종료됨 <small>학생 화면이 잠겨 있어요</small></span><span class="nx">다시 열려면 [▶ 수업 시작]을 눌러 주세요</span>'
      : '<span class="big">🟢 지금 열림 <small>학생이 활동하고 제출할 수 있어요</small></span><span class="nx">수업이 끝나면 [⏹ 수업 종료]를 눌러 주세요</span>';
  };
  new MutationObserver(paint).observe(end, { attributes:true, attributeFilter:['class'] }); paint();

  const track = $('paceTrack');
  if(track){
    const paceRow = track.parentElement, badge = $('paceBadge'), clear = $('paceClearBtn');
    const pace = document.createElement('div'); pace.className = 'td-pace';
    pace.innerHTML = '<span class="td-pl">⏩ 속도조절</span><span class="td-ps">학생이 볼 수 있는 화면</span>';
    pace.appendChild(track); if(badge) pace.appendChild(badge); if(clear) pace.appendChild(clear);
    card.appendChild(pace); paceRow.style.display = 'none';
  }

  // ⏰ 1부: 시작·종료 예약 버튼은 운영 카드 안으로
  const sched = $('schedBtn');
  if(sched){
    const r = document.createElement('div'); r.className = 'td-pace'; r.innerHTML = '<span class="td-pl">⏰ 시작·종료 예약</span>';
    sched.textContent = '예약·학생별 열기'; sched.classList.add('td-sched');
    const now = $('schedNow'); if(now) r.appendChild(now);
    r.appendChild(sched); card.appendChild(r);
  }
  // 🤖 학생 AI: [AI 켜기]/[AI 끄기] 두 버튼 (지금 상태만 색이 꽉 참)
  const aiT = $('aiToggleBtn');
  if(aiT){
    const on = document.createElement('button'), off = document.createElement('button'); on.type = off.type = 'button';
    on.className = 'td-aion'; off.className = 'td-aioff'; on.textContent = '🤖 AI 켜기'; off.textContent = '🚫 AI 끄기';
    const isOff = ()=> aiT.classList.contains('off');
    on.onclick = ()=>{ if(isOff()) aiT.click(); }; off.onclick = ()=>{ if(!isOff()) aiT.click(); };
    const wrap = document.createElement('span'); wrap.style.cssText = 'display:inline-flex;gap:6px;margin-left:auto;'; wrap.appendChild(on); wrap.appendChild(off);
    aiT.after(wrap); aiT.style.display = 'none'; const ast = $('aiState'); if(ast) ast.style.display = 'none';
    const paintAi = ()=>{ on.classList.toggle('active', !isOff()); off.classList.toggle('active', isOff()); };
    new MutationObserver(paintAi).observe(aiT, { attributes:true, attributeFilter:['class'] }); paintAi();
  }
  // 채점 화면(tpa1) 버튼들은 흰 버튼으로
  { const g = $('aiGradeAllBtn'); const pnl = g && g.closest('.panel'); if(pnl) pnl.classList.add('td-plainset'); }
  // 수업 진행 도우미: 속도조절 바로 아래(운영 카드 안)로, 단계 카드 아래 자리 통일
  const sp = $('stagePanel');
  if(sp){
    card.appendChild(sp);
    const list = $('stageList');
    const fix = ()=>{ if(!list) return; list.querySelectorAll('.stg').forEach(box=>{
        const btn = box.querySelector('.stg-go');
        if(btn){ if(/수업 시작/.test(btn.textContent)) btn.textContent = '▶ 1단계 시작'; return; }
        if(box.querySelector('.stg-wait')) return;
        const w = document.createElement('div'); const now = box.classList.contains('now');
        w.className = 'stg-wait' + (now ? ' now' : ''); w.textContent = now ? '● 지금 진행 중' : '다음 단계 대기'; box.appendChild(w); }); };
    if(list){ new MutationObserver(fix).observe(list, { childList:true }); fix(); }
  }

  // 4) 현황 숫자 카드: "학생 수: <b>26</b>" → 카드
  const sum = $('summary');
  if(sum){
    sum.classList.add('td-cards');
    [...sum.children].forEach(d=>{
      const b = d.querySelector('b'); if(!b) return;
      const label = d.textContent.replace(b.textContent, '').replace(/[:：]\s*$/, '').replace(/[:：]/, '').trim()
        .replace(/^학생 수$/, '접속 학생').replace(/^.*완료.*$/, '완료 학생');
      const unit = /진행률|%/.test(label) ? '' : '명';
      d.className = 'sc'; d.innerHTML = '';
      const l = document.createElement('div'); l.className = 'l'; l.textContent = label;
      const v = document.createElement('div'); v.className = 'v'; v.appendChild(b);
      if(unit){ const u = document.createElement('small'); u.textContent = unit; v.appendChild(u); }
      d.appendChild(l); d.appendChild(v);
    });
  }
})();
