# 방탈출 규칙 카드(연습·1·2·3회) — 모둠마다 한 장. 앞면: 회차 QR + 규칙 6개, 뒷면: 유의사항·기록. 2026-11-25 선생님 요청
# 사용: python3 cover/build_rule.py → cover/out/방탈출_규칙카드.html (PDF: node art2/topdf2.js <html> <pdf>)
import os, io, base64, qrcode, qrcode.image.svg
HERE = os.path.dirname(os.path.abspath(__file__)); BACK = os.path.join(HERE, '..', 'art3', 'back')
head = open(os.path.join(HERE, '..', 'art2', 'out', '방탈출2회_카드.html'), encoding='utf-8').read()
head = head[:head.index('<body')]
SITE = 'https://geogebra2026.vercel.app/'
# 회차별 카드 번호(최종 인쇄본: 1회 v15·2회 v16·3회 v10 — 카드가 바뀌면 여기도 고친다)
DECK = {0: ['연습', 5, 9, 10, 11, 20, 21, 30, 'X', '규칙'],
        1: ['시작', 2, 3, 4, 5, 6, 14, 18, 23, 24, 26, 27, 29, 31, 35, 36, 38, 40, 42, 43, 44, 47, 49, 50, 51, 52, 58, 59, 61, 63, 69, 73, 85, 86, 91, 94, 96, 98, 99],
        2: ['시작', 3, 5, 6, 7, 10, 12, 14, 15, 16, 17, 18, 19, 21, 22, 24, 25, 26, 27, 30, 32, 33, 34, 37, 41, 43, 46, 48, 49, 53, 55, 58, 59, 61, 63, 65, 66, 70, 73, 76, 81, 83, 84, 89, 90, 92],
        3: ['시작', 5, 11, 13, 17, 23, 25, 27, 28, 33, 34, 36, 42, 45, 46, 47, 49, 52, 54, 56, 57, 59, 61, 62, 63, 65, 68, 75, 76, 77, 80, 81, 85, 88, 90, 92, 94, 98]}
R = [  # (회차 번호, 색, 윗줄, 제목)
 (0, '#8d6e63', '연습', '선원 훈련소'),
 (1, '#d32f2f', '제1회', '찢어진 지도'),
 (2, '#1565c0', '제2회', '강을 건너, 동굴로'),
 (3, '#c88a00', '제3회', '동굴 속 보물 방'),
]
def qr(url):
    q = qrcode.QRCode(border=1, error_correction=qrcode.constants.ERROR_CORRECT_M); q.add_data(url); q.make(fit=True)
    b = io.BytesIO(); q.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(b)
    return 'data:image/svg+xml;base64,' + base64.b64encode(b.getvalue()).decode()
RULES = [('🔴+🔵', '두 번호를 <b>더해</b><br>화면 <b>🔗 합치기</b>에'), ('🔍', '그림 속 <b>작은 숫자</b><br>= 펼칠 카드'),
         ('🔒', '노란 자물쇠<br>단서를 모아 <b>4자리</b>'), ('⚙️', '초록 기계<br>화면 ⚙️에 <b>카드 번호</b>'),
         ('🗑', '<b>줄 그은 번호</b><br>카드는 치워요'), ('⏳', '함정 합이면 벌점 카드<br><b>시간이 줄어요</b>')]
WARN = [('🙈', '들고 있는 카드는 <b>앞면을 보지 않기</b>'), ('🚫', '다른 모둠 카드와 <b>섞지 않기</b>'),
        ('💡', '막히면 <b>힌트</b> → 📖 규칙 → 손 들기'), ('🔄', '새로고침해도 이어져요. <b>처음부터 다시</b>는 누르지 않기'),
        ('📝', '끝나면 항해 일지에 <b>반·모둠·번호</b> 남기기'), ('🏳', '못 끝냈으면 <b>여기까지 하기</b>로 기록'),
        ('🧹', '카드를 <b>번호 순</b>으로 모아 <b>구성 카드</b>와 맞춰 보기')]
css = '''<style>
.rk{background:#fbf6ea;color:#2b1a0a}.rk .band{position:absolute;left:4mm;right:4mm;top:4mm;height:2.2mm;border-radius:1.1mm;background:var(--c)}
.sheet.rs{background:#fbf6ea!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rk .tt{position:absolute;left:4mm;right:4mm;top:9mm;display:flex;gap:2.5mm;align-items:center}
.rk .tt .tx{flex:1}.rk .tt .k{font:700 3.2mm "Gowun Dodum",sans-serif;color:var(--c)}.rk .tt .h{font:800 5.2mm/1.15 "Hahmlet",serif;word-break:keep-all;margin-top:.6mm}
.rk .tt .s{font:400 2.5mm/1.35 "Gowun Dodum",sans-serif;color:#5a4330;margin-top:1mm}
.rk .tt img{width:22mm;height:22mm;border:.4mm solid #3e2818;border-radius:1.5mm;background:#fff;padding:.6mm;flex:none}
.rk .ls{position:absolute;left:4mm;right:4mm;top:34mm;bottom:7.5mm;display:flex;flex-direction:column;gap:1mm}
.rk .ls .hd{font:800 3.4mm "Hahmlet",serif;color:#3e2818;border-bottom:.3mm solid #c9a55a;padding-bottom:.6mm;margin-bottom:.4mm}
.rk .ls .it{display:flex;gap:1.8mm;align-items:center;background:#fff;border:.3mm solid #e0d2b0;border-radius:1.6mm;padding:1mm 1.6mm;font:400 2.8mm/1.3 "Gowun Dodum",sans-serif}
.rk .ls .it .e{font-size:3.6mm;min-width:7mm;text-align:center}.rk .ls .it b{color:#7a1d10}
.rk .sr{position:absolute;left:0;right:0;bottom:1.6mm;text-align:center;font:700 2.4mm "Gowun Dodum",sans-serif;color:#3e2818;letter-spacing:.3mm}
.rk .gd{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:1.4mm}
.rk .gd .tl{background:#fff;border:.3mm solid #e0d2b0;border-radius:1.8mm;padding:1.2mm 1.4mm;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.8mm;font:400 2.75mm/1.3 "Gowun Dodum",sans-serif;word-break:keep-all}
.rk .gd .tl .e{font-size:5.6mm;line-height:1}.rk .gd .tl b{color:#7a1d10}
.rk .ls .it .n{flex:none;width:5mm;height:5mm;border-radius:50%;background:var(--c);color:#fff;font:800 2.9mm/5mm "Hahmlet",serif;text-align:center}
.rk.bk .ls{top:11mm}
.rk .cnt{font:800 3.3mm "Hahmlet",serif;color:#3e2818;margin-top:1.2mm}.rk .cnt b{color:var(--c);font-size:4.4mm}
.rk .nb{display:grid;grid-template-columns:repeat(7,1fr);gap:.9mm;margin-top:1mm}.rk .nb span{border:.3mm solid #b9a578;border-radius:1mm;background:#fff;text-align:center;font:700 2.7mm/4.6mm "DejaVu Sans Mono",monospace;position:relative}
.rk .nb span.w{font:700 2.3mm/4.6mm "Gowun Dodum",sans-serif}
.rk .how{font:400 2.6mm/1.45 "Gowun Dodum",sans-serif;color:#3b2a12;margin-top:1.4mm}.rk .how b{color:#7a1d10}.rk.bk .ls .it{font-size:2.75mm;padding:1mm 1.6mm}
</style>'''
def front(r):
    n, c, k, h = r; url = SITE + f'escape{n}.html'
    return (f'<div class="card rk" style="--c:{c}"><div class="band"></div><div class="tt"><div class="tx"><div class="k">{k} · 규칙 카드</div><div class="h">{h}</div>'
            f'<div class="s">카메라로 찍으면<br>이 판이 열려요</div></div><img src="{qr(url)}"></div>'
            '<div class="ls"><div class="hd">🧭 규칙</div><div class="gd">' + ''.join(f'<div class="tl"><div class="e">{e}</div><div>{t}</div></div>' for e, t in RULES) + '</div>' +
            '</div><div class="sr">나침반 시리즈 · 규칙</div></div>')
def back(r):
    n, c, k, h = r
    return (f'<div class="card rk bk" style="--c:{c}"><div class="band"></div><div class="ls"><div class="hd">⚠️ 유의사항</div>' +
            ''.join(f'<div class="it"><span class="n">{i}</span><span>{t}</span></div>' for i, (e, t) in enumerate(WARN, 1)) +
            f'</div><div class="sr">{k} · {h}</div></div>')
def setc(r):
    n, c, k, h = r; d = DECK[n]
    nb = ''.join(f'<span class="{"w" if isinstance(x, str) and len(x) > 1 else ""}">{x}</span>' for x in d)
    return (f'<div class="card rk" style="--c:{c}"><div class="band"></div><div class="ls" style="top:10mm;bottom:6mm"><div class="hd">📦 {k} 구성 카드 · {h}</div>'
            f'<div class="cnt">게임 카드 <b>{len(d)}장</b> <span style="font:400 2.6mm Gowun Dodum">+ 표지·규칙·구성 카드</span></div><div class="nb">{nb}</div>'
            '<div class="how">정리할 때: ① 카드를 <b>번호 순</b>으로 늘어놓고 ② 이 표와 하나씩 맞춰 봐요. ③ 빠진 번호가 있으면 <b>책상 밑·옆 모둠</b>을 찾아보고, 그래도 없으면 선생님께!</div>'
            '</div><div class="sr">나침반 시리즈 · 구성</div></div>')
def setb(r):
    img = ['aback_practice.jpg', 'aback_r1.jpg', 'aback_r2.jpg', 'aback_r3.jpg'][r[0]]
    return f'<div class="card bk2"><img src="{os.path.join(BACK, img)}"><div class="bv"></div><div class="bw s">구성</div></div>'
# 2026-11-25 선생님: A4 한 장에 한 종류(9장) — 필요한 회차 쪽만 골라 뽑게. 3회 구성 카드는 3회 최종판이 나오면 SET_ROUNDS에 3을 넣는다
RULE_ROUNDS = [0, 1, 2, 3]; SET_ROUNDS = [0, 1, 2]
import sys; sys.path.insert(0, os.path.join(HERE, '..')); from cutlayout import cut_css_js
_, cutjs = cut_css_js('#fbf6ea')
flip = lambda xs: sum([xs[j:j+3][::-1] for j in range(0, 9, 3)], [])   # 긴 쪽 넘김: 줄마다 좌우 뒤집기
pages = ''
for i in RULE_ROUNDS:
    pages += '<div class="sheet rs">' + front(R[i]) * 9 + '</div><div class="sheet rs">' + ''.join(flip([back(R[i])] * 9)) + '</div>'
for i in SET_ROUNDS:
    pages += '<div class="sheet">' + setc(R[i]) * 9 + '</div><div class="sheet">' + setb(R[i]) * 9 + '</div>'
html = head + css + '</head><body>' + pages + cutjs + '</body></html>'
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
p = os.path.join(HERE, 'out', '방탈출_규칙카드.html'); open(p, 'w', encoding='utf-8').write(html); print(p)
