/* 🧭 방탈출 시작 전 안내 화면 (2026-11-05 선생님 요청)
   교사 화면(tesc-r8k2w.html)이 넘기면 학생 디벗(studentesc.html)이 실시간으로 같은 장을 본다.
   Firebase: rooms/{반}__escape/guide = {round, page, go(시작 누른 시각)} / rooms/{반}__escape/viewers/{uid} = 접속 시각
   2026-11-25: 연습(0)=이야기·카드 놓기·규칙 한눈에·유의사항·출발, 1·2·3회=이야기·유의사항·출발. 학생 디벗은 슬라이드 대신 'TV를 보세요' 대기 화면. 3학년(전환기)은 반을 '3-5'처럼. 예시 카드는 게임에 없는 카드로 그린다. */
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
  go: r => S('출발', r ? '🚀 시간이 흐르기 시작해요!' : '🚀 연습 시작!', `<p>마지막 카드를 찾으면 디벗 <b>🏁 탈출</b>에 그 번호를 넣어요.</p><p>모르는 게 있으면 <b>💡 힌트</b>부터! 그래도 막히면 손을 들어요.</p>${r ? '<p>모둠이 모두 의논하고, 한 사람만 디벗을 눌러요.</p>' : ''}`)
};
/* 2026-11-25 선생님 요청(시안 승인): 규칙 5쪽 대신 '규칙 한눈에' 한 쪽(연습 전) + 매 회 '유의사항'. 규칙은 훈련소에서 직접 해 보며 익히고, 게임 중에는 디벗 📖 규칙 버튼 */
SL.rules = S('규칙 한눈에', '🧭 이것만 기억해요', `<div class="eg-grid">
<div>🔴 + 🔵<br>두 번호를 <b class="hl">더한 번호</b><br>카드를 펼쳐요</div>
<div>🔍 그림 속 <b class="hl">작은 숫자</b><br>= 펼칠 카드 번호</div>
<div>🔒 노란 자물쇠<br>단서를 모아 <b class="hl">4자리</b><br>디벗 🔒에 입력</div>
<div>⚙️ 초록 기계<br>디벗 ⚙️에 <b class="hl">카드 번호</b><br>넣고 직접 조작</div>
<div>🗑 <b class="hl">빨간 줄</b> 그어진 번호<br>= 그 카드는 치워요</div>
<div>💡 막히면 <b class="hl">힌트</b><br>⏳ 벌점 카드 = 시간 −1분</div></div>`);
SL.warn = S('유의사항', '⚠️ 시작 전에 꼭!', `<div class="eg-warn">
<div>🃏 카드 더미는 <b>번호가 보이게</b>.<br>미리 뒤집거나 뒷면을 엿보지 않기</div>
<div>⏳ 벌점 카드도 버리지 말고<br><b>디벗에 입력</b> 후 옆에 두기</div>
<div>🚫 다른 모둠 카드와 <b>섞지 않기</b></div>
<div>🔄 디벗은 새로고침해도 이어져요.<br><b>[처음부터 다시]</b>는 누르지 않기</div>
<div>🧹 끝나면 카드를 <b>번호 순</b>으로 모아<br>표지에 적힌 장수 확인</div>
<div>💡 막히면 <b>힌트 → 📖 규칙</b> 먼저,<br>그래도 안 되면 손 들기</div></div>`);
const PAGES = r => r === 0 ? [cover(0), SL.ready, SL.rules, SL.warn, SL.go(0)] : [cover(r), SL.warn, SL.go(r)];
const LABELS = r => r === 0 ? ['📜 이야기', '🃏 카드 놓기', '🧭 규칙 한눈에', '⚠️ 유의사항', '🚀 출발'] : ['📜 이야기', '⚠️ 유의사항', '🚀 출발'];

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
.eg-grid b.hl{color:#ffd54f}.eg-warn{display:grid;grid-template-columns:1fr 1fr;gap:1.6cqw;margin:auto 0}.eg-warn>div{background:rgba(255,255,255,.1);border-radius:12px;padding:1.6cqw 2cqw;font-size:2.35cqw;line-height:1.45}.eg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2cqw;margin:auto 0}.eg-grid>div{background:rgba(255,255,255,.1);border-radius:12px;padding:2cqw;font-size:2.4cqw;line-height:1.5;text-align:center}`;

window.EGUIDE = {
  ROUNDS, count: r => PAGES(r).length, label: (r, p) => LABELS(r)[p] || '',
  cls: c => { const m = String(c||'').match(/^(\d+)-(\d+)$/); return m ? m[1] + '학년 ' + m[2] + '반' : (c ? c + '반' : ''); },   // 2026-11-25: 3학년은 '3-5', 2학년은 '5'
  html: (r, p) => { const P = PAGES(r), i = Math.max(0, Math.min(P.length-1, p|0)); return `<div class="eg-slide">${P[i]}<div class="eg-pg">${i+1} / ${P.length}</div></div>`; },
  css: () => { if(!document.getElementById('egcss')){ const s = document.createElement('style'); s.id = 'egcss'; s.textContent = CSS; document.head.appendChild(s); } },
  FB: { apiKey:'AIzaSyBK7NlpKOr1ozAXF96vS8p7YyjiNaAJlfI', authDomain:'brojuntest.firebaseapp.com', databaseURL:'https://brojuntest-default-rtdb.asia-southeast1.firebasedatabase.app',
        projectId:'brojuntest', storageBucket:'brojuntest.firebasestorage.app', messagingSenderId:'426333242398', appId:'1:426333242398:web:b3ae216d5269ce13065a0f' },
  room: c => (String(c||'').trim().replace(/[.#$\[\]\/\s]+/g,'_').slice(0,30) || 'x') + '__escape'
};
})();
