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
 'river': '''<svg width="170" height="92" viewBox="0 0 170 92" font-size="10" font-weight="700">
<rect x="0" y="4" width="170" height="56" fill="#cfe8f7"/><line x1="0" y1="4" x2="170" y2="4" stroke="#1565c0"/><text x="120" y="30" fill="#1565c0" font-size="10">강</text>
<line x1="0" y1="60" x2="170" y2="60" stroke="#1565c0"/>
<line x1="20" y1="4" x2="20" y2="60" stroke="#000" stroke-width="1.6"/><line x1="20" y1="4" x2="125" y2="74" stroke="#000"/>
<line x1="125" y1="60" x2="125" y2="74" stroke="#000" stroke-width="1.6"/>
<circle cx="20" cy="4" r="2.5"/><text x="25" y="10">A</text><circle cx="20" cy="60" r="2.5"/><text x="8" y="72">B</text>
<circle cx="104" cy="60" r="2.5"/><text x="96" y="73">C</text><circle cx="125" cy="60" r="2.5"/><text x="129" y="58">D</text>
<circle cx="125" cy="74" r="2.5"/><text x="129" y="84">E</text>
<text x="52" y="72" font-size="9">12m</text><text x="104" y="86" font-size="9">3m</text><text x="131" y="71" font-size="9">2m</text></svg>''',
 'tri': '''<svg width="200" height="120" viewBox="0 0 200 120" font-size="10" font-weight="700">
<polygon points="100,8 20,110 180,110" fill="none" stroke="#000" stroke-width="1.5"/>
<line x1="60" y1="59" x2="140" y2="59" stroke="#000" stroke-dasharray="3 2"/><line x1="46.7" y1="76" x2="153.3" y2="76" stroke="#000"/>
<text x="96" y="6">A</text><text x="8" y="118">B</text><text x="184" y="118">C</text>
<text x="46" y="57">D</text><text x="144" y="57">E</text><text x="32" y="80">F</text><text x="157" y="80">G</text><text x="88" y="120" font-size="9">30cm</text></svg>''',
 'cave': '''<svg width="200" height="84" viewBox="0 0 200 84" font-size="9" font-weight="700">
<circle cx="18" cy="42" r="12" fill="#eee" stroke="#000"/><text x="8" y="45">입구</text>
<circle cx="100" cy="42" r="12" fill="#eee" stroke="#000"/><text x="90" y="45">광장</text>
<circle cx="182" cy="42" r="12" fill="#eee" stroke="#000"/><text x="171" y="45">보물</text>
<path d="M30,38 Q59,22 88,38 M30,42 L88,42 M30,46 Q59,62 88,46" fill="none" stroke="#000"/>
<path d="M112,36 Q141,16 170,36 M112,40 Q141,32 170,40 M112,44 Q141,52 170,44 M112,48 Q141,68 170,48" fill="none" stroke="#000"/>
<path d="M22,30 Q100,-6 178,30 M22,54 Q100,90 178,54" fill="none" stroke="#1565c0" stroke-dasharray="4 2"/><text x="84" y="10" fill="#1565c0">물길</text></svg>'''}
def vis(c):
    t = c[5]
    return '' if not t else '<div class="vis">' + ''.join(f'<span><b>{n}</b> {H.escape(cards[str(n)][3])}</span>' for n in t) + '</div>'
def front(c):
    bl, t, n, title, body = c[:5]; col, lab = COL[t]
    fig = FIG.get(c[6], '') if len(c) > 6 else ''
    body = body.replace('<div class="hid">', '<div class="hid">')
    d = R.DIS.get(bl, '')
    dis = f'<div class="dis">🗑 치우기: {d}</div>' if d else ''
    return f'<div class="card"><div class="band" style="background:{col}"><span class="no">{H.escape(n)}</span><span class="lab">{lab}</span></div><div class="ti">{title}</div><div class="bd">{body}{fig}{vis(c)}</div>{dis}<div class="ft">붉은 나침반 {N}회</div></div>'
def back(c):
    bl = c[0]; fs = '18pt' if len(bl) > 3 else '30pt'
    return f'<div class="card bk"><div class="bt">붉은 나침반</div><div class="bn" style="font-size:{fs}">{H.escape(bl)}</div><div class="bt2">{N}회</div></div>'
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
