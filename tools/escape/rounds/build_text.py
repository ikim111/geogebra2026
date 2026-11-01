# 내용 검수용 글 카드 PDF 만들기 (그림 없음)
# 사용: python3 build_text.py 2   → out/방탈출2회_글카드.html (topdf.js로 PDF)
import sys, os, re, json, subprocess, importlib, html as H
N = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
R = importlib.import_module('r' + N)
COL = {'grey':('#757575','장소·단서'),'red':('#d32f2f','빨강 물건'),'blue':('#1976d2','파랑 물건'),
       'green':('#2e7d32','⚙️ 기계'),'yellow':('#f9a825','🔒 자물쇠'),'pen':('#5d4037','⏳ 벌점'),'start':('#1a237e','시작')}
cards = {c[2]: c for c in R.CARDS}
FIG = {
 'river': '''<svg width="170" height="96" viewBox="0 0 170 96" font-size="10" font-weight="700">
<rect x="0" y="4" width="170" height="36" fill="#cfe8f7"/><line x1="0" y1="4" x2="170" y2="4" stroke="#1565c0"/><line x1="0" y1="40" x2="170" y2="40" stroke="#1565c0"/>
<text x="130" y="26" fill="#1565c0">강</text>
<polygon points="40,4 40,40 110,90" fill="none" stroke="#000"/><line x1="40" y1="4" x2="40" y2="40" stroke="#000" stroke-width="2"/>
<line x1="75" y1="47" x2="75" y2="65" stroke="#000" stroke-dasharray="3 2"/>
<circle cx="40" cy="4" r="2.5"/><text x="45" y="12">A</text><circle cx="40" cy="40" r="2.5"/><text x="28" y="52">B</text>
<circle cx="110" cy="90" r="2.5"/><text x="114" y="94">C</text><circle cx="75" cy="47" r="2.5"/><text x="80" y="48">M</text><circle cx="75" cy="65" r="2.5"/><text x="62" y="72">N</text>
</svg>''',
 'mirror': '''<svg width="170" height="92" viewBox="0 0 170 92" font-size="8.5" font-weight="700">
<line x1="0" y1="80" x2="170" y2="80" stroke="#000"/><rect x="123" y="32" width="14" height="48" fill="#bbb" stroke="#000"/>
<line x1="15" y1="74" x2="15" y2="80" stroke="#000" stroke-width="2.5"/><circle cx="15" cy="74" r="2" fill="#000"/>
<polyline points="15,74 27,80 123,32" fill="none" stroke="#1565c0" stroke-dasharray="3 2"/>
<rect x="23" y="79" width="8" height="2.5" fill="#1565c0"/><text x="21" y="72" font-size="8">거울</text>
<text x="16" y="90">3m</text><text x="70" y="90">24m</text><text x="139" y="60">절벽</text></svg>''',
 'tri': '''<svg width="200" height="120" viewBox="0 0 200 120" font-size="10" font-weight="700">
<polygon points="100,8 20,110 180,110" fill="none" stroke="#000" stroke-width="1.5"/>
<line x1="73.3" y1="42" x2="126.7" y2="42" stroke="#000"/><line x1="52" y1="69.2" x2="148" y2="69.2" stroke="#000"/>
<text x="96" y="6">A</text><text x="8" y="118">B</text><text x="184" y="118">C</text>
<text x="60" y="44">H</text><text x="130" y="44">I</text><text x="38" y="74">F</text><text x="152" y="74">G</text></svg>''',
 'cave': '''<svg width="200" height="70" viewBox="0 0 200 70" font-size="9" font-weight="700">
<circle cx="18" cy="35" r="12" fill="#eee" stroke="#000"/><text x="8" y="38">입구</text>
<circle cx="100" cy="35" r="12" fill="#eee" stroke="#000"/><text x="90" y="38">광장</text>
<circle cx="182" cy="35" r="12" fill="#eee" stroke="#000"/><text x="171" y="38">보물</text>
<path d="M30,31 Q59,15 88,31 M30,35 L88,35 M30,39 Q59,55 88,39" fill="none" stroke="#000"/>
<path d="M112,29 Q141,9 170,29 M112,33 Q141,25 170,33 M112,37 Q141,45 170,37 M112,41 Q141,61 170,41" fill="none" stroke="#000"/></svg>'''}
def vis(c):
    t = c[5]
    return '' if not t else '<div class="vis">' + ''.join(f'<span><b>{n}</b> {H.escape(cards[str(n)][3])}</span>' for n in t) + '</div>'
def front(c):
    bl, t, n, title, body = c[:5]; col, lab = COL[t]
    fig = FIG.get(c[6], '') if len(c) > 6 else ''
    body = body.replace('<div class="hid">', '<div class="hid">')
    d = R.DIS.get(bl, '')
    dis = f'<div class="dis">🗑 치우기: {d}</div>' if d else ''
    return f'<div class="card"><div class="band" style="background:{col}"><span class="no">{H.escape(n)}</span><span class="lab">{lab}</span></div><div class="ti">{title}</div><div class="bd">{body}{fig}{vis(c)}</div>{dis}<div class="ft">나침반 시리즈 {N}회</div></div>'
def back(c):
    bl = c[0]; fs = '18pt' if len(bl) > 3 else '30pt'
    return f'<div class="card bk"><div class="bt">{R.EP.split(" · ")[0]}</div><div class="bn" style="font-size:{fs}">{H.escape(bl)}</div><div class="bt2">{N}회</div></div>'
# 화면 설정에서 정답 뽑기
html = os.path.join(HERE, '..', '..', '..', f'escape{N}.html')
js = r'''const fs=require('fs');const h=fs.readFileSync(process.argv[1],'utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);const window={};eval(m[1]);const G=window.EG;
const o={codes:{},mach:{},wrong:G.wrongCodes,hints:G.hints};for(const[k,c]of Object.entries(G.codes))o.codes[k]=c;
for(const[k,M]of Object.entries(G.mach)){let ans=null;if(M.type==='grid'){for(let x=0;x<=12;x++)for(let y=0;y<=12;y++)if(M.check(x,y).ok)ans=`(${x}, ${y})`}else{for(let a=0;a<400;a++)if(M.check(a).ok)ans=a+(M.unit||'°')}
 o.mach[k]={t:M.t,ans,open:M.check(...(ans&&ans.startsWith('(')?ans.slice(1,-1).split(',').map(Number):[parseInt(ans)])).open}}console.log(JSON.stringify(o));'''
G = json.loads(subprocess.check_output(['node', '-e', js, html]).decode())
rows = ''
for k, c in G['codes'].items():
    w = '<br>'.join(f'{a}: {b}' for a, b in G['wrong'].items() if a in c.get('wrongFor', G['wrong']) )
    h = G['hints'].get(k, ['', '', ''])
    rows += f'<tr><td>{k} {cards[k][3]}</td><td><b>{c["code"]}</b> → {", ".join(c["ok"]["open"])}</td><td>{h[0]}</td><td>{h[1]}</td><td>{h[2] if len(h)>2 else ""}</td></tr>'
for k, m in G['mach'].items():
    h = G['hints'].get(k, ['', '', ''])
    rows += f'<tr><td>{k} {m["t"]}</td><td><b>{m["ans"]}</b> → {", ".join(m["open"])}</td><td>{h[0]}</td><td>{h[1]}</td><td>{h[2] if len(h)>2 else ""}</td></tr>'
combo = ' · '.join(f'{r}+{b}={v}' + (' (⏳벌점)' if cards[str(v)][1]=='pen' else '') for (r, b), v in R.COMBOS.items())
wrong = '<br>'.join(f'<b>{a}</b>: {H.escape(re.sub("<[^>]+>","",b))}' for a, b in G['wrong'].items())
teacher = f'''<div class="sheet"><h1>{R.EP} 선생님 정답표 (내용 검수판)</h1>
<p>🔗 디벗 화면: <a href="https://geogebra2026.vercel.app/escape{N}.html">geogebra2026.vercel.app/escape{N}.html</a> · 연습: <a href="https://geogebra2026.vercel.app/escape0.html">escape0.html</a></p>
<table><tr><th>카드</th><th>정답 → 펼칠 카드</th><th>힌트 1</th><th>힌트 2</th><th>정답 힌트</th></tr>{rows}</table>
<h2>합치기 (빨강 + 파랑)</h2><p>{combo}. 그 밖의 합은 해당 카드가 없어요.</p>
<h2>자물쇠 오답 안내 (−1분)</h2><p style="font-size:8pt">{wrong}</p></div>'''
css = open(os.path.join(HERE, '..', 'print', 'build.py'), encoding='utf-8').read().split("css='''")[1].split("'''")[0]
css += '.hid{position:static;display:inline-block;margin-left:2mm;font-size:6.5pt;color:#999}.dis{position:absolute;left:2.5mm;right:2.5mm;bottom:5mm}.bd svg{max-height:30mm}'
pages = ''
L = R.CARDS
for i in range(0, len(L), 9):
    g = L[i:i+9]
    pages += '<div class="page">' + ''.join(front(c) for c in g) + '</div>'
    bk = [back(c) for c in g] + ['<div></div>'] * (9 - len(g))
    pages += '<div class="page">' + ''.join(sum([bk[j:j+3][::-1] for j in range(0, 9, 3)], [])) + '</div>'
out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
p = os.path.join(out, f'방탈출{N}회_글카드.html')
open(p, 'w', encoding='utf-8').write(f'<html><head><meta charset="utf-8"><style>{css}.sheet table{{border-collapse:collapse;width:100%;font-size:8pt}}.sheet td,.sheet th{{border:1px solid #999;padding:3px;vertical-align:top}}</style></head><body>{pages}{teacher}</body></html>')
print(p, len(L), '장')
