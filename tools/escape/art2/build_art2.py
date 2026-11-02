# 2·3회 그림 카드 만들기: rounds/rN.py 카드 + 그림(art2/aN_번호.jpg) + 번호 위치
# 사용: python3 build_art2.py 2  → out/방탈출2회_카드.html (PDF는 art/topdf.js)
import re, os, sys, math, html as H, importlib, json
N = sys.argv[1] if len(sys.argv) > 1 else '2'
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'rounds'))
R = importlib.import_module('r' + N)
BT = importlib.import_module('build_text_figs') if False else None
ART = '/tmp/claude-0/escape/art/'          # 1회 그림(뒷면 등)과 CSS
IMG = f'/tmp/claude-0/escape/art{N}/'      # 이번 회 그림
src = open(os.path.join(HERE, '..', 'art', 'build_art.py'), encoding='utf-8').read()
body = src.split("TYPE={")[1].split("if __name__=='__main__':")[0]
FIGS = open(os.path.join(HERE, '..', 'rounds', 'build_text.py'), encoding='utf-8').read().split('FIG = {')[1].split('\ndef vis')[0]
FIG = eval('{' + FIGS)
def figfor(c):
    f = FIG.get(c[6], '') if len(c) > 6 else ''
    return re.sub(r'<text x="186"[^<]*</text>', '', f) if c[6:7] and c[6].startswith('p') and c[6] != 'pairs' else f
LAY = json.load(open(os.path.join(HERE, f'layout{N}.json'), encoding='utf-8'))
PYK = {k for k, v in LAY.items() if v.get('py')}
cards = [(c[0], c[1], c[2], c[3], LAY.get(c[0], {}).get('cap') or (c[4] + ('' if c[0] in PYK else figfor(c)))) for c in R.CARDS]
DIS = R.DIS; T = {}; TALL = set()
g = {'re': re, 'os': os, 'math': math, 'H': H, 'cards': cards, 'DIS': DIS, 'ART': ART, 'T': T, 'TALL': TALL}
exec('TYPE={' + body, g)
g['SPEC'] = {k: (IMG + v.get('img', f'a{k}.jpg'), [(g['tagkind'](t[0]), t[0], t[1], t[2]) for t in v.get('tags', [])]) for k, v in LAY.items()}
g['HID'] = {k: (v['hid'][0], v['hid'][1], v['hid'][2]) for k, v in LAY.items() if 'hid' in v}
g['OVER'] = {k: g['SV'](v['over']) for k, v in LAY.items() if v.get('over','') not in ('','note')}; g['ETCH'] = set(); g['SVGART'] = {k for k, v in LAY.items() if v.get('svgart')}; g['DROP'] = set()
import figs2
for k, v in LAY.items():
    if v.get('py'):
        f = v['py']
        fn, _, arg = f.partition(':')
        g['OVER'][k] = g['SV'](figs2.pair(arg) if fn == 'pair' else (getattr(figs2, fn)(arg) if arg else getattr(figs2, fn)()))
g['ETCH'] = set(g['HID'])
g['PANEL'] = {k for k, v in LAY.items() if v.get('panel')}
# front()는 ART+img로 그림을 찾으니 절대경로를 그대로 쓰게 바꿈
g['ART'] = ''
FONT = '/tmp/claude-0/escape/fonts/'
FONTLINKS = ''.join(f'<link rel="stylesheet" href="file://{FONT}{p}">' for p in ['fontsource-hahmlet-5.3.0/package/700.css', 'fontsource-hahmlet-5.3.0/package/800.css', 'fontsource-gowun-dodum-5.3.0/package/400.css', 'fontsource-nanum-pen-script-5.3.0/package/index.css'])
FIT = '<script>document.fonts.ready.then(()=>{for(const c of document.querySelectorAll(".cap")){let f=3.05;const tx=c.querySelector(".tx");while(c.scrollHeight>c.clientHeight+1&&f>2.1){f-=.1;tx.style.fontSize=f+"mm"}}})</script>'
def back(c):
    lab = c[0]; small = ' s' if re.search('[가-힣]', lab) else ''
    return f'<div class="card bk2"><img src="/tmp/claude-0/escape/art2/aback_blue.jpg"><div class="bv"></div><div class="bw{small}">{H.escape(lab)}</div></div>'
NOTE = '.tag.Y{background:#3b2412!important}.tag.Y:before{content:"";position:absolute;inset:.45mm;background:#fbf3dc;clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)}.tag.Y:after{content:"";position:absolute;inset:1mm;background:var(--t);clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)}.tag.Y i{z-index:2}.tag{box-shadow:0 0 0 .55mm #fbf3dc,0 0 0 .85mm #3b2412!important}.tag.Y{box-shadow:none!important}.note{position:absolute;z-index:3;font-family:"Gowun Dodum",sans-serif;font-size:2.35mm;line-height:5.2mm;color:#2b1a0a;white-space:nowrap;background:rgba(238,222,182,.96);padding:.8mm 1.2mm;top:12%}.note.L{right:34%;text-align:right}.note.R{left:42%}'
def front2(c):
    m = re.search(r'<div class="note (L|R)">.*?</div>', c[4], re.S)
    if m and c[0] in PYK: return g['front']((c[0], c[1], c[2], c[3], c[4].replace(m.group(0), '')))
    if not m: return g['front'](c)
    f = g['front']((c[0], c[1], c[2], c[3], c[4].replace(m.group(0), '')))
    return f.replace('<div class="art">', '<div class="art">' + m.group(0), 1)
pages = ''
for i in range(0, len(cards), 9):
    grp = cards[i:i+9]
    pages += '<div class="sheet">' + ''.join(front2(c) for c in grp) + '</div>'
    bk = [back(c) for c in grp] + ['<div></div>'] * (9 - len(grp))
    pages += '<div class="sheet">' + ''.join(sum([bk[j:j+3][::-1] for j in range(0, 9, 3)], [])) + '</div>'
# 선생님 정답표는 글카드판에서 가져옴
tx = open(os.path.join(HERE, '..', 'rounds', 'out', f'방탈출{N}회_글카드.html'), encoding='utf-8').read()
teacher = tx[tx.index('<div class="sheet"><h1>'):tx.rindex('</body>')].replace('<div class="sheet">', '<div class="tsheet">', 1)
css = g['CSS'] + NOTE + '.tsheet{padding:10mm 12mm;font-size:9pt;page-break-before:always}.tsheet table{border-collapse:collapse;width:100%;font-size:7.5pt;margin-bottom:6px}.tsheet td,.tsheet th{border:1px solid #999;padding:3px;vertical-align:top}.tsheet h2{font-size:11pt;margin:10px 0 4px}'
import sys as _s; _s.path.insert(0, os.path.join(HERE, '..')); from cutlayout import cut_css_js
cut, cutjs = cut_css_js('#14223a')
h = f'<html><head><meta charset="utf-8">{FONTLINKS}<style>{css}</style>{cut}</head><body>{pages}{teacher}{FIT}{cutjs}</body></html>'
for sym in '☀☾★⚓': h = h.replace(sym, f'<span style="font-family:DejaVu Sans;color:#3b2412">{sym}&#xFE0E;</span>')
h = re.sub(r',\s*0 [\d.]+mm [\d.]+mm rgba\(0,0,0,[\d.]+\)', '', h)
h = re.sub(r'box-shadow:\s*0 [\d.]+mm [\d.]+mm rgba\(0,0,0,[\d.]+\)\s*;?', '', h)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
p = os.path.join(HERE, 'out', f'방탈출{N}회_카드.html'); open(p, 'w', encoding='utf-8').write(h); print(p, len(cards), '장')
