/* 🎨 2026-10-27 학생 화면 공통 규칙 (모든 student*.html 맨 끝에서 불러온다)
   1) 못 누르는 버튼(disabled)은 회색·점선·흐린 글씨, 마우스를 올려도 반응 없음 — 회색인데 눌리는 버튼은 없게
   2) 태블릿·휴대폰(손가락)에서는 버튼을 최소 44px로
   3) 글 쓰는 칸을 누르면 파란 테두리 + 옅은 파란 그림자
   4) 12px보다 작은 글씨는 12.5px로 키움 */
(function(){
  const css = `
  /* 고른 답·정답/오답 표시처럼 상태를 보여 주는 버튼은 원래 모양 그대로(선택한 답이 회색이 되면 안 됨) */
  button:disabled:not(.selected):not(.sel):not(.on):not(.active):not(.pick):not(.picked):not(.chosen):not(.right):not(.wrong):not(.correct):not(.ok):not(.no):not(.done):not(.o):not(.x):not(.t):not(.win){background:#eceff1!important;color:#9aa0a6!important;border:1px dashed #c9ced6!important;
    box-shadow:none!important;cursor:not-allowed!important;opacity:.8!important;filter:none!important;transform:none!important;background-image:none!important;}
  button:disabled:not(.selected):not(.sel):not(.on):not(.active):not(.pick):not(.picked):not(.chosen):not(.right):not(.wrong):not(.correct):not(.ok):not(.no):not(.done):not(.o):not(.x):not(.t):not(.win):hover{background:#eceff1!important;}
  textarea:focus, input[type="text"]:focus, input[type="number"]:focus, input[type="url"]:focus, input:not([type]):focus{
    outline:none!important;border:2px solid #1e63d6!important;box-shadow:0 0 0 4px rgba(30,99,214,.18)!important;}
  @media (pointer:coarse){ button, .btn, a.task-link{min-height:44px;} }
  `;
  const st = document.createElement('style'); st.id = 'sdash-css'; st.textContent = css; document.head.appendChild(st);

  // 작은 글씨 키우기: 처음 한 번 + 화면이 바뀔 때마다(0.5초 모아서)
  const MIN = 12.5;
  const fix = root => {
    (root || document.body).querySelectorAll('small, span, div, p, label, li, td, b').forEach(el=>{
      if(el.dataset.sdFs || !el.childNodes.length) return;
      let hasText = false; for(const n of el.childNodes){ if(n.nodeType === 3 && n.textContent.trim()){ hasText = true; break; } }
      if(!hasText) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if(fs && fs < MIN - 0.01){ el.style.fontSize = MIN + 'px'; el.dataset.sdFs = '1'; }
    });
  };
  let t = null, pend = new Set();
  const later = recs=>{ recs.forEach(r=> r.addedNodes.forEach(n=>{ if(n.nodeType === 1) pend.add(n); else if(n.parentElement) pend.add(n.parentElement); }));
    clearTimeout(t); t = setTimeout(()=>{ const list = [...pend]; pend.clear(); list.forEach(n=>{ if(n.isConnected){ fix(n); if(!n.dataset.sdFs) fix(n.parentElement || n); } }); }, 400); };
  if(document.body){ fix(); new MutationObserver(later).observe(document.body, { childList:true, subtree:true }); }

  /* 못 누르는 이유: 버튼에 data-why="…"가 있으면, 못 누를 때만 버튼 바로 아래에 이유를 보여 준다 */
  const whyCss = document.createElement('style'); whyCss.textContent = `.sd-why{display:inline-block;margin-left:10px;vertical-align:middle;font-size:13.5px;color:#e65100;font-weight:bold;} .sd-why::before{content:'👉 ';}
    #progressText{font-size:15px!important;font-weight:bold!important;color:#fff!important;}`;
  document.head.appendChild(whyCss);
  const paintWhy = b=>{ let w = b.nextElementSibling && b.nextElementSibling.classList && b.nextElementSibling.classList.contains('sd-why') ? b.nextElementSibling : null;
    if(b.disabled && b.dataset.why){ if(!w){ w = document.createElement('span'); w.className = 'sd-why'; b.after(w); } w.textContent = b.dataset.why; w.style.display = ''; }
    else if(w) w.style.display = 'none'; };
  const watchWhy = ()=> document.querySelectorAll('button[data-why]').forEach(b=>{ if(b.dataset.sdWhy) return; b.dataset.sdWhy = '1'; paintWhy(b);
    new MutationObserver(()=> paintWhy(b)).observe(b, { attributes:true, attributeFilter:['disabled','data-why'] }); });
  watchWhy();
  new MutationObserver(recs=>{ let need = false; recs.forEach(r=>{ if(r.type === 'attributes' && r.target.dataset && !r.target.dataset.sdWhy) need = true; else if(r.type === 'childList' && r.addedNodes.length) need = true; }); if(need) watchWhy(); })
    .observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['data-why'] });


  /* ✔ 확인하기 버튼: 초록색 + 오른쪽 정렬 (개념 확인·맞춤법 확인은 제외) */
  const ckCss = document.createElement('style'); ckCss.textContent = `button.sd-check:not(:disabled){background:#2e7d32!important;border-color:#2e7d32!important;color:#fff!important;}
    button.sd-check:not(:disabled):hover{background:#256b29!important;}`;
  document.head.appendChild(ckCss);
  const CK = /^\s*(✔\s*)?(확인|확인하기|닮음 확인)\s*$/;
  const markCheck = root=> (root.querySelectorAll ? root.querySelectorAll('button:not(.sd-check)') : []).forEach(b=>{
    if(!CK.test(b.textContent)) return; b.classList.add('sd-check');
    const p = b.parentElement; if(!p || p.dataset.sdRight) return; p.dataset.sdRight = '1';
    const d = getComputedStyle(p).display; if(d.includes('flex')) p.style.justifyContent = 'flex-end'; else p.style.textAlign = 'right'; });
  markCheck(document);
  new MutationObserver(recs=> recs.forEach(r=> r.addedNodes.forEach(n=>{ if(n.nodeType === 1){ markCheck(n.parentElement || n); } })))
    .observe(document.body, { childList:true, subtree:true });
  /* 👀 교사용 미리보기(?preview=1)에서는 막힌 버튼을 모두 풀어서 선생님이 어느 단계든 눌러 볼 수 있게 한다(기록은 저장되지 않음) */
  if(/[?&]preview=1/.test(location.search)){
    const un = root=> (root.querySelectorAll ? root.querySelectorAll('button[disabled], input[disabled], textarea[disabled], select[disabled]') : []).forEach(el=>{ el.disabled = false; });
    un(document);
    new MutationObserver(recs=> recs.forEach(r=>{ if(r.type === 'attributes' && r.target.disabled) r.target.disabled = false; else if(r.addedNodes) r.addedNodes.forEach(n=>{ if(n.nodeType === 1) un(n); }); }))
      .observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['disabled'] });
  }
})();
