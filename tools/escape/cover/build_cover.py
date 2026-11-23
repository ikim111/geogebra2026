# 방탈출 표지 카드(연습·1·2·3회) — A4 한 장에 4종 2장씩 + 뒷면(긴 쪽 넘김). 2026-11-23 선생님 요청
# 사용: python3 cover/build_cover.py → cover/out/방탈출_표지카드.html (PDF: node art2/topdf2.js <html> <pdf>)
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); BACK = os.path.join(HERE, '..', 'art3', 'back')
head = open(os.path.join(HERE, '..', 'art2', 'out', '방탈출2회_카드.html'), encoding='utf-8').read()
head = head[:head.index('<body')]
R = [  # (뒷면 그림, 색, 윗줄, 제목, 시간 줄들)
 ('aback_practice.jpg', '#8d6e63', '연습 · 규칙 익히기', '선원 훈련소', ['⏱ 시간 제한 없음', '카드와 디벗 쓰는 법을 익혀요', '끝까지 가면 <b>수료!</b>']),
 ('aback_r1.jpg', '#d32f2f', '제1회 · 붉은 나침반', '찢어진 지도', None),
 ('aback_r2.jpg', '#1565c0', '제2회 · 푸른 나침반', '강을 건너, 동굴로', None),
 ('aback_r3.jpg', '#c88a00', '제3회 · 황금 나침반', '동굴 속 보물 방', None),
]
MAIN = ['⏱ 제한 시간 <b>40분</b>', '★★★★★ 25분 안 · ★★★★ 30분 안', '★★★ 35분 안 · ★★ 40분 안', '벌점·틀린 답 −1분 · 힌트 4번마다 ★ −1']
css = '''<style>
.cv{background:#f4ead2}.cv img.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
.cv .band{position:absolute;left:0;right:0;top:0;height:7mm;background:var(--c)}
.cv .tt{position:absolute;left:5mm;right:5mm;top:11mm;text-align:center;background:rgba(251,246,234,.93);border:.5mm solid #3e2818;border-radius:2.5mm;padding:2.6mm 1mm 3mm}
.cv .tt .k{font:700 3.6mm "Gowun Dodum",sans-serif;color:var(--c);letter-spacing:.2mm}
.cv .tt .h{font:800 7.4mm/1.2 "Hahmlet",serif;color:#2b1a0a;margin-top:1.2mm;word-break:keep-all}
.cv .rl{position:absolute;left:5mm;right:5mm;bottom:6mm;background:rgba(251,246,234,.95);border:.4mm solid #3e2818;border-radius:2mm;padding:2mm 2mm;text-align:center;font:400 3.05mm/1.55 "Gowun Dodum",sans-serif;color:#2b1a0a}
.cv .rl{display:block!important}.cv .rl>div{display:block!important;width:auto!important;position:static!important}.cv .tt>div{display:block!important;position:static!important}.cv .rl div:first-child{font-size:3.8mm;font-weight:700}.cv .rl b{color:var(--c)}
.cv .sr{position:absolute;left:0;right:0;bottom:1.6mm;text-align:center;font:700 2.6mm "Gowun Dodum",sans-serif;color:#3e2818;letter-spacing:.4mm}
</style>'''
def front(r):
    img, c, k, h, rl = r; rl = rl or MAIN
    return (f'<div class="card cv" style="--c:{c}"><img class="bg" src="{os.path.join(BACK, img)}"><div class="band"></div>'
            f'<div class="tt"><div class="k">{k}</div><div class="h">{h}</div></div>'
            '<div class="sr">나침반 시리즈 · 표지</div></div>')   # 2026-11-23 선생님: 시간·별 안내 상자는 빼기
def back(r):
    return f'<div class="card bk2"><img src="{os.path.join(BACK, r[0])}"><div class="bv"></div><div class="bw s">표지</div></div>'
order = [0, 1, 2, 3, 0, 1, 2, 3, None]
fr = [front(R[i]) if i is not None else '<div></div>' for i in order]
bk = [back(R[i]) if i is not None else '<div></div>' for i in order]
bk = sum([bk[j:j+3][::-1] for j in range(0, 9, 3)], [])   # 긴 쪽 넘김: 줄마다 좌우 뒤집기
import sys; sys.path.insert(0, os.path.join(HERE, '..')); from cutlayout import cut_css_js
_, cutjs = cut_css_js('#f4dfc1')   # 2026-11-23: 카드 묶음과 같은 절취선(앞면)·뒷면 색 여백(bleed)
html = head + css + '</head><body><div class="sheet">' + ''.join(fr) + '</div><div class="sheet">' + ''.join(bk) + '</div>' + cutjs + '</body></html>'
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
p = os.path.join(HERE, 'out', '방탈출_표지카드.html'); open(p, 'w', encoding='utf-8').write(html); print(p)
