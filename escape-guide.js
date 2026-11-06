/* 🧭 방탈출 시작 전 안내 화면 (2026-11-05 선생님 요청)
   교사 화면(tesc-r8k2w.html)이 넘기면 학생 디벗(studentesc.html)이 실시간으로 같은 장을 본다.
   Firebase: rooms/{반}__escape/guide = {round, page, go(시작 누른 시각)} / rooms/{반}__escape/viewers/{uid} = 접속 시각
   연습(0)은 규칙을 자세히, 1·2·3회는 규칙 복습 + 그 회차 이야기. 예시 카드는 게임에 없는 카드로 그린다. */
(function(){
const ROUNDS = {
  0:{ep:'연습', series:'선원 훈련소', title:'규칙 익히기', color:'#8d6e63', game:'escape0.html', min:0,
     story:'붉은 나침반 선원 훈련소에 온 걸 환영해! 진짜 모험에 나가기 전에 카드 보는 법을 익혀 보자.'},
  1:{ep:'제1회', series:'붉은 나침반', title:'찢어진 지도', color:'#d32f2f', game:'escape1.html', min:40,
     story:'할아버지가 떠난 뒤 처음 연 다락방. 책상 위에 붉은 나침반 하나. "우리 집안의 보물 지도는 찢어서 숨겨 두었단다." 창밖에서 검은 갈매기가 지켜보고 있다!'},
  2:{ep:'제2회', series:'푸른 나침반', title:'강을 건너, 동굴로', color:'#1565c0', game:'escape2.html', min:40,
     story:'붉은 나침반이 가리킨 곳은 강 건너 절벽 위 동굴. "두 번째 나침반은 푸른빛이다." 길가에 검은 깃털이… 검은 갈매기 해적단이 벌써 지나갔다!'},
  3:{ep:'제3회', series:'황금 나침반', title:'동굴 속 보물 방', color:'#f9a825', game:'escape3.html', min:40,
     story:'푸른 나침반이 멈춘 곳은 절벽 아래 깊은 동굴. "세 번째 나침반은 황금빛이다." 횃불이 꺼지기 전에 해적단보다 먼저 보물 방에 닿아라!'}
};
const BACKS = [['#8d6e63','연습'],['#d32f2f','1회'],['#1565c0','2회'],['#f9a825','3회']];
const back = (c, lab) => `<div class="eg-bk"><svg viewBox="0 0 60 84"><rect x="1" y="1" width="58" height="82" rx="6" fill="#fbf6ea" stroke="#5d4037" stroke-width="1.5"/><circle cx="30" cy="42" r="18" fill="none" stroke="#5d4037" stroke-width="1.5"/><text x="30" y="20" font-size="6" text-anchor="middle" fill="#5d4037">N</text><path d="M30 26 L34 42 L26 42Z" fill="${c}"/><path d="M30 58 L34 42 L26 42Z" fill="#fff" stroke="#5d4037" stroke-width="1"/></svg><span>${lab}</span></div>`;
const card = (col, emo, num, name, dz) => `<div class="eg-sc ${col}"><div class="em">${emo}</div><b>${num}</b><small>${name}</small>${dz?'<i class="dz"></i>':''}</div>`;
const S = (tag, h3, body) => `<div class="eg-tag">${tag}</div><h3>${h3}</h3>${body}`;

const cover = r => { const R = ROUNDS[r]; return S(`나침반 시리즈 · ${R.ep}`, `🧭 ${R.series} — ${R.title}`,
  `<p>${R.story}</p><p>${R.min ? `⏱ 제한 시간 <b>${R.min}분</b> · ` : ''}모둠 디벗 1대</p><div class="eg-backs">${BACKS.map(b=>back(b[0],b[1])).join('')}</div>`); };
const SL = {
  ready: S('준비', '🃏 카드 놓기', `<div class="eg-two"><div><p>① 카드 더미는 <b>번호가 보이게</b> 쌓아 둬요.</p><p>② <b>시작 카드</b>만 펼쳐요.</p><p>③ 카드에 나온 번호는 더미에서 찾아 펼쳐요.</p></div>
    <div><p><b>모둠 역할</b></p><p>🃏 카드 담당 — 카드 찾기·펼치기</p><p>📱 디벗 담당 — 번호 넣기</p><p>📝 기록 담당 — 계산·메모</p></div></div>`),
  combo: S('규칙 1', '🔴 + 🔵 = 새 카드', `<p>빨간 번호 카드와 파란 번호 카드를 합치면, <b>두 수를 더한 번호</b>의 카드를 펼쳐요.</p>
    <div class="eg-combo">${card('r','🔑','12','열쇠')}<span class="op">+</span>${card('b','📦','30','상자')}<span class="op">=</span>${card('w','🎁','42','열린 상자')}</div><p class="eg-note">더한 번호의 카드가 없으면 맞지 않는 조합이에요.</p>`),
  hidden: S('규칙 2', '🔍 그림 속 숨은 번호', `<div class="eg-two"><div class="eg-hid"><div class="eg-pic">🏝️<span class="tiny">7</span></div></div>
    <div><p>그림을 구석까지 잘 보세요.</p><p>작은 숫자가 숨어 있으면 <b>그 번호의 카드</b>를 펼쳐요.</p></div></div>`),
  lockmach: S('규칙 3', '🔒 자물쇠 · ⚙️ 기계', `<div class="eg-two"><div><p><b class="y">🟡 노란 자물쇠 카드</b></p><p>흩어진 단서를 모아 <b>4자리 비밀번호</b>를 찾고, 디벗 <b>🔒 자물쇠</b>에 넣어요.</p></div>
    <div><p><b class="g">🟢 초록 기계 카드</b></p><p>디벗 <b>⚙️ 기계</b>에 카드 번호를 넣고, 구한 값으로 직접 조작해요.</p></div></div>`),
  clear: S('규칙 4', '🗑 치우기 · 벌점 · 힌트', `<div class="eg-two"><div><p><b>빨간 줄</b>이 그어진 번호가 나오면 그 카드는 치워요.</p><div class="eg-combo sm">${card('r','🔑','12','열쇠',true)}</div></div>
    <div><p><b>⚠️ 벌점 카드</b>가 나오면 디벗 <b>⏳ 벌점</b>에 번호를 넣어요. 시간이 줄어요.</p><p><b>💡 힌트</b>는 막힌 카드 번호를 넣으면 나와요. 쓸수록 별 ⭐이 줄어요.</p></div></div>`),
  recap: S('규칙 복습', '🧭 기억나죠?', `<div class="eg-grid"><div>🔴 + 🔵<br><b>더한 번호</b> 펼치기</div><div>🔍 그림 속<br><b>숨은 번호</b></div><div>🔒 자물쇠<br><b>4자리</b> 비밀번호</div><div>⚙️ 기계<br>구한 값으로 <b>조작</b></div><div>🗑 빨간 줄<br>카드 <b>치우기</b></div><div>⚠️ 벌점 · 💡 힌트<br>시간 · 별 ⭐ 줄어요</div></div>`),
  go: r => S('출발', r ? '🚀 시간이 흐르기 시작해요!' : '🚀 연습 시작!', `<p>마지막 카드를 찾으면 디벗 <b>🏁 탈출</b>에 그 번호를 넣어요.</p><p>모르는 게 있으면 <b>💡 힌트</b>부터! 그래도 막히면 손을 들어요.</p>${r ? '<p>모둠이 모두 의논하고, 한 사람만 디벗을 눌러요.</p>' : ''}`)
};
const PAGES = r => r === 0 ? [cover(0), SL.ready, SL.combo, SL.hidden, SL.lockmach, SL.clear, SL.go(0)] : [cover(r), SL.recap, SL.go(r)];

const CSS = `.eg-slide{aspect-ratio:16/9;width:100%;background:#1a237e;border-radius:14px;color:#fff;position:relative;overflow:hidden;padding:4% 5%;box-sizing:border-box;display:flex;flex-direction:column;container-type:inline-size}
.eg-slide .eg-tag{font-size:2.2cqw;opacity:.75}.eg-slide h3{font-size:4.6cqw;margin:.25em 0 .35em}.eg-slide p{font-size:2.6cqw;margin:.3em 0;line-height:1.45}
.eg-pg{position:absolute;right:3%;bottom:4%;font-size:1.8cqw;opacity:.7}.eg-note{opacity:.8;font-size:2.2cqw!important}
.eg-backs{display:flex;gap:2.5%;justify-content:center;margin-top:auto}.eg-bk{text-align:center}.eg-bk svg{height:17cqw;display:block}.eg-bk span{font-size:1.8cqw;opacity:.85}
.eg-combo{display:flex;align-items:center;gap:2.5%;justify-content:center;margin:auto 0}.eg-combo.sm{margin:1.5cqw 0}.op{font-size:5.5cqw;font-weight:bold}
.eg-sc{background:#fff;color:#222;border-radius:10px;width:15cqw;aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;border-top:1cqw solid #999}
.eg-sc.r{border-top-color:#d32f2f}.eg-sc.b{border-top-color:#1565c0}.eg-sc .em{font-size:5.5cqw}.eg-sc b{font-size:3.3cqw}.eg-sc small{font-size:1.5cqw;color:#666}
.eg-sc .dz{position:absolute;left:-6%;right:-6%;top:48%;height:.6cqw;background:#e53935;transform:rotate(-14deg);border-radius:3px}
.eg-two{display:flex;gap:4%;margin:auto 0}.eg-two>div{flex:1;background:rgba(255,255,255,.1);border-radius:12px;padding:2.5%}
.eg-two b.y{color:#ffd54f}.eg-two b.g{color:#81c784}
.eg-hid{display:flex;align-items:center;justify-content:center}.eg-pic{position:relative;font-size:16cqw;line-height:1}.eg-pic .tiny{position:absolute;right:8%;bottom:14%;font-size:2.2cqw;font-weight:bold;color:#fff;background:#5d4037;border-radius:4px;padding:0 .5cqw}
.eg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2cqw;margin:auto 0}.eg-grid>div{background:rgba(255,255,255,.1);border-radius:12px;padding:2cqw;font-size:2.4cqw;line-height:1.5;text-align:center}`;

window.EGUIDE = {
  ROUNDS, count: r => PAGES(r).length,
  html: (r, p) => { const P = PAGES(r), i = Math.max(0, Math.min(P.length-1, p|0)); return `<div class="eg-slide">${P[i]}<div class="eg-pg">${i+1} / ${P.length}</div></div>`; },
  css: () => { if(!document.getElementById('egcss')){ const s = document.createElement('style'); s.id = 'egcss'; s.textContent = CSS; document.head.appendChild(s); } },
  FB: { apiKey:'AIzaSyBK7NlpKOr1ozAXF96vS8p7YyjiNaAJlfI', authDomain:'brojuntest.firebaseapp.com', databaseURL:'https://brojuntest-default-rtdb.asia-southeast1.firebasedatabase.app',
        projectId:'brojuntest', storageBucket:'brojuntest.firebasestorage.app', messagingSenderId:'426333242398', appId:'1:426333242398:web:b3ae216d5269ce13065a0f' },
  room: c => (String(c||'').trim().replace(/[.#$\[\]\/\s]+/g,'_').slice(0,30) || 'x') + '__escape'
};
})();
