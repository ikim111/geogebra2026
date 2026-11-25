/* 🧭 방탈출 시작 전 안내 화면 (2026-11-05 선생님 요청)
   2026-11-25부터 TV(tesc-r8k2w.html) 안내 슬라이드만 — 학생 디벗과 연동 없음(선생님 결정). 아래 Firebase는 tesc의 📊 기록 탭만 씀.
   Firebase: rooms/{반}__escape/guide = {round, page, go(시작 누른 시각)} / rooms/{반}__escape/viewers/{uid} = 접속 시각
   2026-11-25: 연습(0)=이야기·카드 놓기·규칙 한눈에·유의사항·출발, 1·2·3회=이야기·유의사항·출발. 학생 디벗은 슬라이드 대신 'TV를 보세요' 대기 화면. 3학년(전환기)은 반을 '3-5'처럼. 예시 카드는 실제 카드 틀에 가짜 그림·번호(연습 답이 안 보이게). 뒷면만 실제 그림(esc-img/b_*.jpg). */
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
const BACKS = [['practice','연습'],['r1','1회'],['r2','2회'],['r3','3회']];
const back = (c, lab) => `<div class="eg-bk"><svg viewBox="0 0 60 84"><rect x="1" y="1" width="58" height="82" rx="6" fill="#fbf6ea" stroke="#5d4037" stroke-width="1.5"/><circle cx="30" cy="42" r="18" fill="none" stroke="#5d4037" stroke-width="1.5"/><text x="30" y="20" font-size="6" text-anchor="middle" fill="#5d4037">N</text><path d="M30 26 L34 42 L26 42Z" fill="${c}"/><path d="M30 58 L34 42 L26 42Z" fill="#fff" stroke="#5d4037" stroke-width="1"/></svg><span>${lab}</span></div>`;
const card = (col, emo, num, name, dz) => `<div class="eg-sc ${col}"><div class="em">${emo}</div><b>${num}</b><small>${name}</small>${dz?'<i class="dz"></i>':''}</div>`;
const S = (tag, h3, body) => `<div class="eg-tag">${tag}</div><h3>${h3}</h3>${body}`;

const cover = r => { const R = ROUNDS[r]; return S(`나침반 시리즈 · ${R.ep}`, `🧭 ${R.series} — ${R.title}`,
  `<p>${R.story}</p><p>${R.min ? `⏱ 제한 시간 <b>${R.min}분</b> · ` : ''}모둠 디벗 1대</p><div class="eg-backs">${BACKS.map(b=>`<div class="eg-bk"><img src="esc-img/b_${b[0]}.jpg" alt=""><span>${b[1]}</span></div>`).join('')}</div>`); };
const SL = {
  ready: S('준비', '🃏 카드 놓기', `<div class="eg-two"><div><p>① 카드 더미는 <b>번호가 보이게</b> 쌓아 둬요.</p><p>② <b>시작 카드</b>만 펼쳐요.</p><p>③ 카드에 나온 번호는 더미에서 찾아 펼쳐요.</p></div>
    <div><p><b>모둠 역할</b></p><p>🃏 카드 담당 — 카드 찾기·펼치기</p><p>📱 디벗 담당 — 번호 넣기</p><p>📝 기록 담당 — 계산·메모</p></div></div>`),
  go: r => S('출발', r ? '🚀 시간이 흐르기 시작해요!' : '🚀 연습 시작!', `<p>마지막 카드를 찾으면 디벗 <b>🏁 탈출</b>에 그 번호를 넣어요.</p><p>모르는 게 있으면 <b>💡 힌트</b>부터! 그래도 막히면 손을 들어요.</p>${r ? '<p>모둠이 모두 의논하고, 한 사람만 디벗을 눌러요.</p><p>끝나면 <b>항해 일지</b>에 반·모둠·번호를 골라 <b>기록 남기기</b>! 못 끝냈으면 <b>🏳 여기까지 하기</b>.</p>' : ''}`)
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
/* 2026-11-25 선생님 요청: 훈련소(연습)는 한 쪽에 하나씩 그림 예시와 함께 차분히, 1·2·3회는 규칙 복습 한 쪽으로 간단히.
   예시는 실제 카드 틀 + 가짜 그림·번호(12·31·33·43·45·7·88·99, 연습에 없는 번호). 안 펼친 카드는 번호 순으로 나눠 들기. */
const rc = (n, ex='') => `<div class="eg-rc"><img src="esc-img/${n}.jpg" alt="">${ex}</div>`;   // 실제 훈련소 카드 그림(2026-11-25 선생님: 실제 카드와 맞추기)
const ring = (x,y,w,h) => `<i class="eg-ring" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></i>`;
/* 예시 카드: 실제 카드 틀(띠·번호 동그라미·베이지 글상자·태그·줄 그은 번호·아이콘) 그대로, 그림·번호만 연습에 없는 가짜(2026-11-25 선생님: 실제 카드로 보여 주면 연습 의미가 없음) */
const FK = {R:['#d32f2f','#8e1b12'],B:['#1976d2','#0d3c7a'],Gy:['#757575','#3d3d3d'],G:['#2e7d32','#124016'],Y:['#f9a825','#9a6500'],S:['#1a237e','#0b1040'],P:['#5d4037','#2b1d18']};
const fc = (k, no, ti, tx, emo, o={}) => `<div class="eg-fc" style="--c:${FK[k][0]};--d:${FK[k][1]}"><div class="st"></div><div class="no${String(no).length>2?' s':''}"><span>${no}</span></div>`
 + (o.dis?`<div class="dis">${o.dis.map(n=>`<span><i>${n}</i></span>`).join('')}</div>`:'') + (o.ico?`<div class="ico"><i>${o.ico}</i></div>`:'')
 + `<div class="art"><span class="em">${emo}</span>${(o.tags||[]).map(t=>`<b class="tg ${t[0]}" style="left:${t[1]}%;top:${t[2]}%"><i>${t[3]}</i></b>`).join('')}${o.hid?`<u class="hd" style="left:${o.hid[0]}%;top:${o.hid[1]}%"><i>${o.hid[2]}</i></u>`:''}</div>`
 + `<div class="cap"><div class="ti"><i>${ti}</i></div><div class="tx"><i>${tx}</i></div></div>${o.ring?ring(...o.ring):''}</div>`;
const C = {
  s:  () => fc('S','시작','바닷가 오두막','그림 속 번호 카드를 찾아 펼쳐 봐.','🛖',{tags:[['R',22,70,12],['B',55,82,31],['B',82,70,33]]}),
  r12:() => fc('R',12,'녹슨 열쇠','오래된 열쇠.','🗝️'),
  b31:() => fc('B',31,'작은 상자','잠긴 나무 상자.','📦'),
  b33:() => fc('B',33,'돌멩이','동글동글한 돌.','🪨'),
  g43:(o={}) => fc('Gy',43,'열린 상자','상자 안에 쪽지가 있다.','📜',{dis:[12,31],hid:[70,62,7],...o}),
  p45:() => fc('P',45,'벌점','열쇠로 돌을 두드렸다. 아무 일도 없다!','💥',{ico:'⏳'}),
  m7: () => fc('G',7,'톱니 장치','장치를 돌려 문을 열자.','⚙️',{ico:'⚙️'}),
  y88:() => fc('Y',88,'비밀 금고','4자리 비밀번호.','🧰',{ico:'🔒',dis:[43,7]}),
  e99:() => fc('Gy',99,'보물 지도','🏁 탈출에 이 카드 번호를 넣어.','🗺️',{dis:[88]})
};
const dev = (inner) => `<div class="eg-dev">${inner}</div>`;
const big = (emo, txt) => `<div class="eg-big"><div class="e">${emo}</div><div class="t">${txt}</div></div>`;
SL.deal = S('준비 ①', '🃏 안 펼친 카드는 나눠 들어요', `<div class="eg-deal">${[1,2,3,4].map(i=>`<div class="hand"><div class="fan">${[0,1,2].map(k=>`<img src="esc-img/b_practice.jpg" style="transform:rotate(${(k-1)*12}deg)">`).join('')}</div><b>${i}번 선원</b></div>`).join('')}</div><p>카드를 <b>번호 순</b>으로 정리해 차례대로 나눠 들어요. 번호가 나오면 <b>"12번!"</b> 하고 부르고, 가진 사람이 가운데에 펼쳐요.</p><p class="eg-sm">🚫 들고 있는 카드의 앞면은 보지 않아요.</p>`);
SL.start = S('준비 ②', '🃏 시작 카드부터', `<div class="eg-two"><div class="eg-cen">${C.s()}</div><div><p>가운데에 <b>시작 카드</b>만 펼쳐요.</p><p>그림 속 <b>번호 동그라미</b>(빨강 12, 파랑 31·33)를 보고, 그 번호 카드를 찾아 펼쳐요.</p><p class="eg-sm">📱 디벗 담당 1명 · 📝 기록 담당 1명을 정해요.</p></div></div>`);
SL.add = S('규칙 1', '🔴 + 🔵 = 더한 번호', `<div class="eg-combo">${C.r12()}<span class="op">+</span>${C.b31()}<span class="op">=</span>${C.g43()}</div><p>위 띠가 <b>빨강</b>인 카드와 <b>파랑</b>인 카드는 함께 쓸 수 있어요. 두 번호를 <b>더해요</b>. 12 + 31 = <b>43번</b> 카드를 펼쳐요.</p>`);
SL.trap = S('규칙 2', '⏳ 함정 조심!', `<div class="eg-combo">${C.r12()}<span class="op">+</span>${C.b33()}<span class="op">=</span>${C.p45()}</div><p>아무거나 더하면 <b>벌점 카드</b>(갈색 띠, ⏳)가 나와요. 디벗 <b>⏳ 벌점</b>에 번호를 넣으면 시간이 1분 줄어요.</p><p class="eg-sm">벌점 카드만 치우고, 나머지 카드는 그대로 둬요.</p>`);
SL.hid = S('규칙 3', '🔍 그림 속 숨은 번호', `<div class="eg-two"><div class="eg-cen">${C.g43({ring:[70,8+0.62*64.6,16,10]})}</div><div><p>그림을 <b>구석까지</b> 잘 봐요.</p><p>그림 속에 작은 <b>7</b>이 숨어 있어요. → <b>7번 카드</b>를 펼쳐요.</p><p class="eg-sm">못 찾겠으면 디벗 🔍 <b>숨은 번호</b> 버튼이 어느 카드를 볼지 알려 줘요.</p></div></div>`);
SL.clr = S('규칙 4', '🗑 줄 그은 번호 = 치우기', `<div class="eg-two"><div class="eg-cen">${C.g43({ring:[84,4.8,26,9]})}</div><div><p>카드 <b>오른쪽 위</b>에 <b>빨간 줄</b>이 그어진 번호가 있으면,</p><p>그 번호 카드(12·31)는 <b>이제 필요 없어요</b>. 치워서 책상을 정리해요.</p></div></div>`);
SL.mach = S('규칙 5', '⚙️ 초록 기계 카드', `<div class="eg-two"><div class="eg-cen">${C.m7()}</div><div>${dev('⚙️ 기계 → <b>7</b> 입력 → 화면에서 직접 조작')}<p>위 띠가 <b>초록</b>이고 오른쪽 위에 ⚙️가 있으면 기계 카드예요. 디벗 ⚙️ <b>기계</b>에 카드 번호를 넣어요.</p><p>문제를 풀어 구한 값으로 <b>직접 움직이거나 눌러요</b>.</p></div></div>`);
SL.lock = S('규칙 6', '🔒 노란 자물쇠 카드', `<div class="eg-two"><div class="eg-cen">${C.y88()}</div><div>${dev('🔒 자물쇠 → <span class="sl">?</span><span class="sl">?</span><span class="sl">?</span><span class="sl">?</span>')}<p>위 띠가 <b>노랑</b>이고 🔒가 있으면 자물쇠 카드예요. 흩어진 단서를 모아 <b>4자리 비밀번호</b>를 찾아요.</p><p>디벗 🔒 <b>자물쇠</b>에 카드 번호와 4자리를 넣어요. 틀리면 1분 줄어요.</p></div></div>`);
SL.help = S('규칙 7', '💡 막히면 힌트 · 📖 규칙', `<div class="eg-two"><div>${dev('💡 힌트 → 막힌 <b>카드 번호</b> 입력')}<p>한 번 누르면 귀띔, 한 번 더 누르면 더 큰 힌트가 나와요. 힌트를 많이 쓰면 별 ⭐이 줄어요.</p></div>
  <div>${dev('📖 규칙')}<p>규칙이 헷갈리면 디벗 왼쪽 아래 <b>📖 규칙</b>을 눌러요.</p><p>그래도 안 되면 <b>손을 들어요</b>.</p></div></div>`);
SL.end = S('규칙 8', '🏁 탈출!', `<div class="eg-two"><div class="eg-cen">${C.e99()}</div><div><p>마지막 카드에는 <b>"🏁 탈출에 이 카드 번호를 넣어"</b>라고 적혀 있어요.</p><p>디벗 🏁 <b>탈출</b>에 그 번호를 넣으면 끝!</p></div></div>`);
SL.warn1 = S('유의사항 ①', '⚠️ 시작 전에 꼭!', `${big('🙈','들고 있는 카드는 <b>앞면을 보지 않기</b>')}${big('🚫','다른 모둠 카드와 <b>섞지 않기</b>')}${big('⏳','벌점 카드도 꼭 <b>디벗에 입력</b>하기')}`);
SL.warn2 = S('유의사항 ②', '⚠️ 시작 전에 꼭!', `${big('🔄','디벗은 새로고침해도 이어져요. <b>[처음부터 다시]</b>는 누르지 않기')}${big('🧹','끝나면 다음 반을 위해 <b>번호 순으로 모으고</b> 장수 세기')}${big('💡','막히면 <b>힌트 → 📖 규칙</b>, 그래도 안 되면 손 들기')}`);
SL.recap = S('규칙 복습', '🧭 기억나죠?', SL.rules.slice(SL.rules.indexOf('<div class="eg-grid">')));
const PAGES = r => r === 0 ? [cover(0), SL.deal, SL.start, SL.add, SL.trap, SL.hid, SL.clr, SL.mach, SL.lock, SL.help, SL.end, SL.warn1, SL.warn2, SL.go(0)]
                           : [cover(r), SL.recap, SL.warn1, SL.warn2, SL.go(r)];
const LABELS = r => r === 0 ? ['📜 이야기','🃏 카드 나눠 들기','🃏 시작 카드','🔴+🔵 합치기','⏳ 함정','🔍 숨은 번호','🗑 치우기','⚙️ 기계','🔒 자물쇠','💡 힌트·📖 규칙','🏁 탈출','⚠️ 유의사항 ①','⚠️ 유의사항 ②','🚀 출발']
                            : ['📜 이야기','🧭 규칙 복습','⚠️ 유의사항 ①','⚠️ 유의사항 ②','🚀 출발'];

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
.eg-sc.g{border-top-color:#2e7d32}.eg-sc.y{border-top-color:#f9a825}.eg-sc.p{border-top-color:#6d4c41;background:#efebe9}.eg-sc.w{border-top-color:#9e9e9e}.eg-deal{display:flex;gap:3%;justify-content:center;margin:auto 0 1cqw}.eg-deal .hand{background:rgba(255,255,255,.1);border-radius:12px;padding:1.6cqw 2cqw;text-align:center;min-width:14cqw}.eg-deal .fan{font-size:5cqw;height:7cqw;display:flex;justify-content:center}.eg-deal .fan span{display:inline-block;margin:0 -1cqw}.eg-deal b{display:block;font-size:3cqw;color:#ffd54f}.eg-deal small{font-size:1.8cqw;opacity:.8}.eg-cen{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5cqw}.eg-strike{display:flex;gap:1.5cqw}.eg-strike span{position:relative;background:#fbf3dc;color:#3b2412;border-radius:50%;width:6cqw;height:6cqw;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:2.6cqw}.eg-strike span:after{content:"";position:absolute;left:-8%;right:-8%;top:47%;height:.6cqw;background:#e53935;transform:rotate(-30deg)}.eg-dev{background:#fff;color:#1a237e;border-radius:10px;padding:1.4cqw 1.8cqw;font-size:2.4cqw;margin-bottom:1.2cqw;display:inline-block}.eg-dev .sl{display:inline-block;width:3.6cqw;height:4.4cqw;line-height:4.4cqw;text-align:center;border:.3cqw solid #1a237e;border-radius:6px;margin:0 .3cqw;font-weight:900}.eg-pic .tiny.ring{box-shadow:0 0 0 .5cqw #ffd54f}.eg-big{display:flex;align-items:center;gap:2.5cqw;background:rgba(255,255,255,.1);border-radius:14px;padding:1.6cqw 2.4cqw;margin:1.1cqw 0}.eg-big .e{font-size:5.6cqw}.eg-big .t{font-size:3cqw;line-height:1.35}.eg-big b{color:#ffd54f}.eg-grid b.hl{color:#ffd54f}.eg-warn{display:grid;grid-template-columns:1fr 1fr;gap:1.6cqw;margin:auto 0}.eg-warn>div{background:rgba(255,255,255,.1);border-radius:12px;padding:1.6cqw 2cqw;font-size:2.35cqw;line-height:1.45}.eg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2cqw;margin:auto 0}.eg-grid>div{background:rgba(255,255,255,.1);border-radius:12px;padding:2cqw;font-size:2.4cqw;line-height:1.5;text-align:center}.eg-rc{position:relative;width:17cqw;flex:none}.eg-rc img{width:100%;display:block;border-radius:4px;box-shadow:0 .4cqw 1.2cqw rgba(0,0,0,.45)}.eg-ring{position:absolute;transform:translate(-50%,-50%);border:.45cqw solid #ffd54f;border-radius:50%;box-shadow:0 0 0 .3cqw rgba(0,0,0,.35),0 0 1.4cqw #ffd54f}.eg-two .eg-rc{width:22cqw}.eg-deal .fan img{width:6.5cqw;border-radius:3px;margin:0 -1.6cqw;box-shadow:0 .3cqw .8cqw rgba(0,0,0,.4)}.eg-deal .fan{height:auto;align-items:flex-end;padding:.6cqw 0 1cqw}.eg-bk img{width:100%;display:block;border-radius:4px}.eg-backs .eg-bk{width:9cqw}.eg-sm{font-size:.85em;opacity:.8}.eg-fc{position:relative;width:17cqw;font-size:calc(17cqw/70);height:99em;flex:none;background:#0d1a2e;overflow:hidden;border-radius:.8em;box-shadow:0 .4cqw 1.2cqw rgba(0,0,0,.45);color:#3b2a12;text-align:left}.eg-two .eg-fc{width:22cqw;font-size:calc(22cqw/70)}.eg-fc i{font-style:normal}.eg-fc .st{position:absolute;left:0;right:0;top:0;height:8em;background:linear-gradient(180deg,var(--c),var(--d));border-bottom:.5em solid #c9a55a;z-index:2}.eg-fc .no{position:absolute;left:3em;top:1.6em;width:12.5em;height:12.5em;border-radius:50%;background:#fbf3dc;color:var(--c);text-align:center;box-shadow:0 0 0 .8em var(--c),0 0 0 1.3em #c9a55a;z-index:3}.eg-fc .no span{font:900 6.2em/2.016 'DejaVu Sans Mono',monospace}.eg-fc .no.s span{font:900 3.4em/3.68 sans-serif}.eg-fc .art{position:absolute;left:0;top:8em;width:70em;height:64em;background:linear-gradient(180deg,#bfe0f0 0,#f6e7c4 45%,#d9b98a 100%);display:flex;align-items:center;justify-content:center}.eg-fc .art .em{font-size:34em;line-height:1}.eg-fc .tg{position:absolute;width:7.6em;height:7.6em;margin:-3.8em;border-radius:50%;color:#fff;text-align:center;box-shadow:0 0 0 .55em #fbf3dc}.eg-fc .tg i{display:inline-block;font:900 3.6em/2.11 'DejaVu Sans Mono',monospace}.eg-fc .tg.R{background:#c62828;border-radius:1.2em;transform:rotate(45deg)}.eg-fc .tg.R i{transform:rotate(-45deg)}.eg-fc .tg.B{background:#1565c0}.eg-fc .hd{position:absolute;text-decoration:none;color:rgba(40,25,10,.85);transform:rotate(-12deg)}.eg-fc .hd i{font:700 3.6em 'DejaVu Sans Mono',monospace}.eg-fc .dis{position:absolute;top:.9em;right:3em;display:flex;gap:1em;z-index:3}.eg-fc .dis span{position:relative;width:6.2em;height:6.2em;border-radius:50%;background:#e9e2cf;color:#555;text-align:center}.eg-fc .dis span i{font:900 3em/2.07 'DejaVu Sans Mono',monospace}.eg-fc .dis span:after{content:'';position:absolute;left:-.4em;right:-.4em;top:2.9em;height:.6em;background:#c62828;transform:rotate(-35deg)}.eg-fc .ico{position:absolute;top:.9em;right:3em;width:6.2em;height:6.2em;border-radius:50%;background:#fbf3dc;text-align:center;z-index:3}.eg-fc .dis+.ico{right:21em}.eg-fc .ico i{font-size:3.6em;line-height:1.72}.eg-fc .cap{position:absolute;left:3em;right:3em;bottom:3em;top:70em;border-radius:1.6em;padding:2.2em 2.8em;background:linear-gradient(180deg,#f3e2b6,#e6cf96);box-shadow:inset 0 0 4em rgba(120,80,20,.35),0 0 0 .4em #c9a55a;overflow:hidden}.eg-fc .ti i{font:900 4.3em/1.3 serif}.eg-fc .tx{margin-top:1em;line-height:1.2}.eg-fc .tx i{font-size:3.05em;line-height:1.45}.eg-fc .eg-ring{z-index:4}`;

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
