/* =====================================================================
   🚩 오류 신고 — 모든 학생 화면 공통 (각 student*.html 맨 끝에서 <script src="report.js">로 불러온다)
   - 화면 왼쪽 아래 「🚩 오류 신고」 버튼 → 어떤 오류인지 적어서 보낸다.
   - AI 피드백 칸의 「🤔 AI가 틀린 것 같아요」도 이 창을 연다(그때의 피드백 내용이 함께 저장된다).
   - 저장 위치: rooms/__reports/items/{자동 키}  ("rooms/$room" 규칙 안이라 규칙을 따로 추가하지 않아도 된다)
   - 선생님은 관리 페이지(mgmt-…html)에서 모든 반·활동의 신고를 모아 본다.
   ===================================================================== */
(function(){
  if (window.__reportLoaded) return; window.__reportLoaded = true;
  if (/[?&]preview=1/.test(location.search)) return;   // 교사용 미리보기에서는 숨김

  /* 🔑 비밀번호 확인 표시(2026-10-17): 목차(student.html)에서 비밀번호를 넣은 사람만 활동 화면을 쓸 수 있다.
     목차가 이 탭(sessionStorage)에 「반|번호_이름」 표시를 남기고, 여기서는 지금 프로필과 같은지만 본다. */
  (function pinGate(){
    if (!/\/student(\d+|pa\d+)\.html$/.test(location.pathname)) return;   // 학생 활동 화면(studentN, studentpaN)에만. 목차·교사·관리·배움노트 화면은 제외
    let p = null; try { p = JSON.parse(localStorage.getItem('ggb_profile_v1') || 'null'); } catch (e) {}
    if (!p || !p.classNo || !p.name) return;   // 프로필이 없으면 각 화면이 알아서 목차로 안내한다
    const sz = v => (String(v || '')).trim().replace(/[.#$\[\]\/\s]+/g, '_') || 'x';
    const tag = sz(p.classNo) + '|' + sz(p.number).slice(0,30) + '_' + sz(p.name).slice(0,30);
    let ok = false; try { ok = sessionStorage.getItem('ggb_pin_ok') === tag; } catch (e) { ok = true; }
    if (ok) return;
    const show = () => {
      const d = document.createElement('div');
      d.setAttribute('style', 'position:fixed;inset:0;z-index:99999;background:rgba(20,24,40,.92);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit;');
      d.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:360px;width:100%;padding:24px 20px;text-align:center;">'
        + '<div style="font-size:40px;">🔒</div><h3 style="margin:6px 0 8px;color:#1a237e;">비밀번호를 확인해 주세요</h3>'
        + '<p style="font-size:14.5px;color:#444;line-height:1.6;margin:0 0 14px;">목차에서 내 번호·이름과 <b>비밀번호</b>를 넣고 다시 들어와 주세요.</p>'
        + '<a href="student.html" style="display:inline-block;background:#1565c0;color:#fff;border-radius:10px;padding:10px 20px;font-weight:bold;text-decoration:none;">목차로 가기</a></div>';
      document.body.appendChild(d);
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  })();

  const css = `
  #rpFab{position:fixed;left:12px;bottom:12px;z-index:9000;background:#fff;color:#c62828;border:1.5px solid #ef9a9a;border-radius:20px;
    padding:6px 12px;font-size:13px;font-weight:bold;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,.12);opacity:.9;}
  #rpFab:hover{opacity:1;background:#fdecea;}
  #rpFab.in-bar{position:static;flex:0 0 auto;box-shadow:none;opacity:1;background:#2a2e33;color:#ffb4ab;border:1px solid #6b3b3b;border-radius:6px;padding:7px 10px;font-size:13px;white-space:nowrap;}
  #rpFab.in-bar:hover{background:#4a2b2b;}
  #rpModal{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;padding:16px;}
  #rpModal .rp-card{background:#fff;border-radius:14px;max-width:460px;width:100%;padding:18px 18px 14px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-family:inherit;}
  #rpModal h3{margin:0 0 6px;font-size:18px;color:#c62828;}
  #rpModal p{margin:0 0 8px;font-size:14px;color:#52514e;line-height:1.55;}
  #rpModal textarea{width:100%;box-sizing:border-box;min-height:110px;border:1px solid #c5cad1;border-radius:8px;padding:8px 10px;font-size:15px;font-family:inherit;resize:vertical;}
  #rpModal .rp-ai{background:#faf8ff;border:1px solid #e1d9f5;border-radius:8px;padding:6px 10px;font-size:13px;margin:0 0 8px;max-height:120px;overflow:auto;}
  #rpModal .rp-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:10px;}
  #rpModal button{border-radius:8px;padding:8px 16px;font-size:15px;cursor:pointer;font-family:inherit;}
  #rpModal .rp-cancel{background:#fff;border:1px solid #c5cad1;color:#52514e;}
  #rpModal .rp-send{background:#c62828;border:none;color:#fff;font-weight:bold;}
  #rpModal .rp-send:disabled{background:#e8a3a3;cursor:default;}
  #rpModal .rp-msg{font-size:13.5px;margin-top:6px;min-height:18px;}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let extra = null;

  function profile(){
    try { const p = JSON.parse(localStorage.getItem('ggb_profile_v1') || '{}'); return { classNo: String(p.classNo || ''), number: String(p.number || ''), name: String(p.name || '') }; }
    catch (e) { return { classNo:'', number:'', name:'' }; }
  }
  /* 지금 학생이 보고 있는 화면의 제목(보이는 첫 번째 h2) */
  function currentView(){
    const hs = Array.from(document.querySelectorAll('h2'));
    const h = hs.find(x => x.offsetParent !== null);
    return h ? h.textContent.trim().slice(0, 120) : '';
  }
  async function db(){
    if (!window.firebase || !firebase.database) throw new Error('no firebase');
    if (!firebase.apps.length) {
      if (typeof FIREBASE_CONFIG === 'undefined' || !FIREBASE_CONFIG.apiKey) throw new Error('no config');
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    if (firebase.auth && !firebase.auth().currentUser) await firebase.auth().signInAnonymously();
    return firebase.database();
  }

  function build(){
    const fab = document.createElement('button'); fab.id = 'rpFab'; fab.type = 'button'; fab.textContent = '🚩 오류 신고';
    fab.title = '화면이나 채점, AI 피드백이 이상하면 선생님께 알려 주세요';
    fab.addEventListener('click', () => open(null));
    // 위쪽 고정 막대(🏠 ◀이전 … 다음▶)가 있으면 🏠 바로 옆에 넣어 잘 보이게 하고, 없으면 화면 왼쪽 아래에 띄운다.
    const bar = document.querySelector('#stickyBar .sticky-controls');
    if (bar) {
      fab.classList.add('in-bar');
      const home = bar.querySelector('a[href="student.html"]');
      if (home && home.nextSibling) bar.insertBefore(fab, home.nextSibling); else bar.insertBefore(fab, bar.firstChild);
    } else document.body.appendChild(fab);
    const m = document.createElement('div'); m.id = 'rpModal';
    m.innerHTML = `<div class="rp-card">
      <h3>🚩 오류 신고</h3>
      <p id="rpLead">이상한 점이 있었나요? 어떤 오류인지 적어 주면 선생님이 확인하고 고칠게요.</p>
      <div class="rp-ai" id="rpAi" style="display:none;"></div>
      <textarea id="rpText" placeholder="예) 답을 맞게 쓴 것 같은데 틀렸다고 나와요 / 버튼을 눌러도 아무 일도 안 일어나요"></textarea>
      <div class="rp-msg" id="rpMsg"></div>
      <div class="rp-btns"><button type="button" class="rp-cancel" id="rpCancel">닫기</button><button type="button" class="rp-send" id="rpSend">보내기</button></div>
    </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) close(); });
    m.querySelector('#rpCancel').addEventListener('click', close);
    m.querySelector('#rpSend').addEventListener('click', send);
  }
  function open(x){
    extra = x || null;
    const m = document.getElementById('rpModal'); if (!m) return;
    const ai = document.getElementById('rpAi');
    if (extra && extra.kind === 'ai') {
      document.getElementById('rpLead').textContent = 'AI 피드백에서 어떤 점이 틀렸다고 생각하나요? 왜 그렇게 생각하는지도 적어 주세요.';
      const f = extra.fb || {};
      ai.innerHTML = `<b>받은 AI 피드백</b>` + (f.good || []).map(g => `<div>👍 ${esc(g)}</div>`).join('') + (f.fix || []).map(g => `<div>🔧 ${esc(g)}</div>`).join('');
      ai.style.display = '';
      document.getElementById('rpText').placeholder = '예) 저는 「횟수가 많아질수록」을 썼는데 AI가 빠졌다고 해요';
    } else {
      document.getElementById('rpLead').textContent = '이상한 점이 있었나요? 어떤 오류인지 적어 주면 선생님이 확인하고 고칠게요.';
      ai.style.display = 'none';
      document.getElementById('rpText').placeholder = '예) 답을 맞게 쓴 것 같은데 틀렸다고 나와요 / 버튼을 눌러도 아무 일도 안 일어나요';
    }
    document.getElementById('rpMsg').textContent = '';
    document.getElementById('rpSend').disabled = false;
    m.style.display = 'flex';
    setTimeout(() => document.getElementById('rpText').focus(), 50);
  }
  function close(){ const m = document.getElementById('rpModal'); if (m) m.style.display = 'none'; }
  async function send(){
    const text = document.getElementById('rpText').value.trim();
    const msg = document.getElementById('rpMsg'), btn = document.getElementById('rpSend');
    if (text.length < 5) { msg.style.color = '#c62828'; msg.textContent = '어떤 오류인지 5자 이상 적어 주세요.'; return; }
    btn.disabled = true; msg.style.color = '#52514e'; msg.textContent = '⏳ 보내는 중…';
    const p = profile();
    const item = {
      ts: Date.now(), page: location.pathname.replace(/^\//, '') || 'index', title: document.title.slice(0, 120), view: currentView(),
      classNo: p.classNo, number: p.number, name: p.name, text: text.slice(0, 1000),
      kind: (extra && extra.kind) || 'page', done: false
    };
    if (extra && extra.kind === 'ai') {
      const f = extra.fb || {};
      item.ai = { unit: extra.unit || '', answer: String(f.a || '').slice(0, 400), good: (f.good || []).slice(0, 3), fix: (f.fix || []).slice(0, 3) };
    }
    try {
      const d = await db();
      await d.ref('rooms/__reports/items').push(item);
      msg.style.color = '#2e7d32'; msg.textContent = '✅ 보냈어요! 알려 줘서 고마워요.';
      document.getElementById('rpText').value = '';
      setTimeout(close, 1200);
    } catch (e) {
      btn.disabled = false; msg.style.color = '#c62828'; msg.textContent = '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.';
    }
  }
  window.reportOpen = open;
  const start = () => { build(); document.querySelectorAll('.aifb').forEach(b => b._paint && b._paint());
    try { if (typeof AI !== 'undefined' && AI && typeof AI.paint === 'function') AI.paint(); } catch (e) {} };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
