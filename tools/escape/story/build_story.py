# 📜 이야기 카드만 A4 한 장(앞·뒤)으로 만들기 — 2026-11-02 선생님 승인
# 1회 카드 PDF(v12)의 원본 디자인 파일이 없어 전체를 다시 만들 수 없으므로, 이미 인쇄한 묶음 위에 올릴 카드만 따로 뽑는다.
# 쓰는 법: python3.12 build_story.py out.html  → node topdf_story.js out.html out.pdf
# 글은 art/texts.py(1회)·rounds/r2.py(2회)의 PROLOGUE. 뒷면 그림은 /tmp/claude-0/escape/art/aback.jpg(1회 그림 zip).
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [os.path.join(HERE, '..', 'art'), os.path.join(HERE, '..', 'rounds')]
import texts, r2
F = 'file:///tmp/claude-0/escape/fonts/'
FONT = ''.join(f'<link rel="stylesheet" href="{F}fontsource-{f}-5.3.0/package/{w}.css">' for f, w in [('hahmlet', '800'), ('gowun-dodum', '400')])
W, H, X0, Y0 = 63, 88, 10.5, 10   # 63×88mm, 한 줄 3장 (1회 카드와 같은 자리)
CSS = f'''@page{{size:A4;margin:0}}body{{margin:0;font-family:"Gowun Dodum",sans-serif}}
.sheet{{position:relative;width:210mm;height:297mm;page-break-after:always;overflow:hidden}}
.cut{{position:absolute;border:0 dashed #888}}
.card,.bk{{position:absolute;width:{W}mm;height:{H}mm;overflow:hidden}}
.card{{background:#0d1a2e}}
.stripe{{position:absolute;left:0;right:0;top:0;height:5.5mm;background:#14206b}}
.ep{{position:absolute;right:2.6mm;top:1mm;font:800 2.6mm "Hahmlet",serif;color:#e8eaf6}}
.no{{position:absolute;left:2.6mm;top:1.6mm;width:11.5mm;height:11.5mm;border-radius:50%;background:#fbf3dc;box-shadow:0 0 0 .7mm #c9a55a;display:flex;align-items:center;justify-content:center;font:800 3.3mm "Hahmlet",serif;color:#14206b;z-index:3}}
.box{{position:absolute;left:2.6mm;right:2.6mm;top:9mm;bottom:2.6mm;border-radius:1.6mm;padding:5mm 3mm 2.5mm;color:#3b2a12;background:linear-gradient(180deg,#f3e2b6,#e6cf96);font-size:2.95mm;line-height:1.42;box-shadow:inset 0 0 0 .35mm #c9a55a}}
.box b{{font-family:"Hahmlet",serif;font-weight:800;font-size:.95em}}
.ti{{font:800 3.9mm "Hahmlet",serif;margin-bottom:1.2mm;text-align:center}}
.bk img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:sepia(.9) saturate(1.3) brightness(1.25) contrast(.9)}}
.bw{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26mm;height:26mm;border-radius:50%;background:radial-gradient(circle at 45% 40%,#fbf3dc,#ead6a4);box-shadow:0 0 0 1.2mm #c9a55a,0 0 0 1.9mm #3a2a0e;display:flex;align-items:center;justify-content:center;color:#3b2a12;font:800 7mm "Hahmlet",serif}}
.note{{position:absolute;left:{X0}mm;top:{Y0 + H + 6}mm;width:{3 * W}mm;font-size:3.2mm;color:#444;line-height:1.6}}'''
CARDS = [('1회', texts.PROLOGUE), ('2회', r2.PROLOGUE)]
def lines(xs):   # 틈 없는 점선(자르는 선): 카드 가장자리를 종이 끝까지
    out = ''
    for x in xs: out += f'<div class="cut" style="left:{x}mm;top:0;height:{Y0 + H + 4}mm;border-left-width:.25mm"></div>'
    for y in (Y0, Y0 + H): out += f'<div class="cut" style="top:{y}mm;left:0;width:210mm;border-top-width:.25mm"></div>'
    return out
def front(i, ep, t, b):
    return f'<div class="card" style="left:{X0 + i * W}mm;top:{Y0}mm"><div class="stripe"></div><div class="ep">{ep}</div><div class="no">이야기</div><div class="box"><div class="ti">📜 {t}</div>{b}</div></div>'
def back(i):   # 긴 쪽 넘김: 좌우를 뒤집은 자리
    return f'<div class="bk" style="left:{210 - X0 - (i + 1) * W}mm;top:{Y0}mm"><img src="file:///tmp/claude-0/escape/art/aback.jpg"><div class="bw">이야기</div></div>'
xs_f = sorted({X0 + k * W for k in range(3)}); xs_b = sorted({210 - X0 - k * W for k in range(3)})
note = '<div class="note"><b>📜 이야기 카드</b> — A4 <b>양면 인쇄, 긴 쪽 넘김</b>, 배율 100%. 점선대로 잘라 1회·2회 카드 묶음 <b>맨 위</b>에 올려 두세요.<br>시작하면 한 명이 소리 내어 읽은 뒤 「시작」 카드를 뒤집어요. 같은 이야기가 화면에도 나와요.</div>'
pg1 = '<div class="sheet">' + lines(xs_f) + ''.join(front(i, ep, *p) for i, (ep, p) in enumerate(CARDS)) + note + '</div>'
pg2 = '<div class="sheet">' + lines(xs_b) + ''.join(back(i) for i in range(len(CARDS))) + '</div>'
open(sys.argv[1], 'w', encoding='utf-8').write(f'<html><head><meta charset="utf-8">{FONT}<style>{CSS}</style></head><body>{pg1}{pg2}</body></html>')
print(len(CARDS), 'cards')
