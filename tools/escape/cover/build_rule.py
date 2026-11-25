# 방탈출 규칙 카드(연습·1·2·3회) — 모둠마다 한 장. 앞면: 회차 QR + 규칙 6개, 뒷면: 유의사항·기록. 2026-11-25 선생님 요청
# 사용: python3 cover/build_rule.py → cover/out/방탈출_규칙카드.html (PDF: node art2/topdf2.js <html> <pdf>)
import os, io, base64, qrcode, qrcode.image.svg
HERE = os.path.dirname(os.path.abspath(__file__)); BACK = os.path.join(HERE, '..', 'art3', 'back')
head = open(os.path.join(HERE, '..', 'art2', 'out', '방탈출2회_카드.html'), encoding='utf-8').read()
head = head[:head.index('<body')]
SITE = 'https://geogebra2026.vercel.app/'
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
RULES = [('🔴+🔵', '두 번호를 <b>더한 번호</b><br>카드를 펼쳐요'), ('🔍', '그림 속 <b>작은 숫자</b><br>= 펼칠 카드'),
         ('🔒', '노란 자물쇠<br>단서를 모아 <b>4자리</b>'), ('⚙️', '초록 기계<br>화면 ⚙️에 <b>카드 번호</b>'),
         ('🗑', '<b>줄 그은 번호</b><br>카드는 치워요'), ('⏳', '벌점 카드도 꼭<br>화면 <b>⏳에 입력</b>')]
WARN = [('🙈', '들고 있는 카드는 <b>앞면을 보지 않기</b>'), ('🚫', '다른 모둠 카드와 <b>섞지 않기</b>'),
        ('💡', '막히면 <b>힌트</b> → 📖 규칙 → 손 들기'), ('🔄', '새로고침해도 이어져요. <b>처음부터 다시</b>는 누르지 않기'),
        ('📝', '끝나면 항해 일지에 <b>반·모둠·번호</b> 남기기'), ('🏳', '못 끝냈으면 <b>여기까지 하기</b>로 기록'),
        ('🧹', '카드를 <b>번호 순</b>으로 모아 장수 세기')]
css = '''<style>
.rk{background:#fbf6ea;color:#2b1a0a}.rk .band{position:absolute;left:0;right:0;top:0;height:7mm;background:var(--c)}
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
.rk.bk .ls{top:11mm}.rk.bk .ls .it{font-size:2.75mm;padding:1mm 1.6mm}
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
order = [0, 1, 2, 3, 0, 1, 2, 3, None]
fr = [front(R[i]) if i is not None else '<div></div>' for i in order]
bk = [back(R[i]) if i is not None else '<div></div>' for i in order]
bk = sum([bk[j:j+3][::-1] for j in range(0, 9, 3)], [])   # 긴 쪽 넘김: 줄마다 좌우 뒤집기
import sys; sys.path.insert(0, os.path.join(HERE, '..')); from cutlayout import cut_css_js
_, cutjs = cut_css_js('#fbf6ea')
html = head + css + '</head><body><div class="sheet">' + ''.join(fr) + '</div><div class="sheet">' + ''.join(bk) + '</div>' + cutjs + '</body></html>'
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
p = os.path.join(HERE, 'out', '방탈출_규칙카드.html'); open(p, 'w', encoding='utf-8').write(html); print(p)
