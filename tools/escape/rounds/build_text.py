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
<line x1="60.6" y1="23.0" x2="54.4" y2="28.0" stroke="#d32f2f" stroke-width="1.5"/><line x1="95.6" y1="66.0" x2="89.4" y2="71.0" stroke="#d32f2f" stroke-width="1.5"/><line x1="58.3" y1="49.3" x2="53.7" y2="55.7" stroke="#d32f2f" stroke-width="1.5"/><line x1="62.3" y1="49.3" x2="57.7" y2="55.7" stroke="#d32f2f" stroke-width="1.5"/><line x1="93.3" y1="74.3" x2="88.7" y2="80.7" stroke="#d32f2f" stroke-width="1.5"/><line x1="97.3" y1="74.3" x2="92.7" y2="80.7" stroke="#d32f2f" stroke-width="1.5"/><circle cx="110" cy="90" r="2.5"/><text x="114" y="94">C</text><circle cx="75" cy="47" r="2.5"/><text x="80" y="48">M</text><circle cx="75" cy="65" r="2.5"/><text x="62" y="72">N</text>
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
<text x="60" y="44">H</text><text x="76" y="26" font-size="8" fill="#d32f2f">5칸</text><text x="50" y="58" font-size="8" fill="#d32f2f">4칸</text><text x="24" y="92" font-size="8" fill="#d32f2f">6칸</text><text x="97" y="40" font-size="9">›</text><text x="97" y="67" font-size="9">›</text><text x="97" y="108" font-size="9">›</text><text x="130" y="44">I</text><text x="38" y="74">F</text><text x="152" y="74">G</text></svg>''',
 'shadow': '''<svg width="190" height="80" viewBox="0 0 190 80" font-size="9" font-weight="700">
<line x1="175" y1="5" x2="175" y2="75" stroke="#000" stroke-width="3"/><text x="160" y="78">벽</text>
<circle cx="15" cy="40" r="5" fill="#f9a825" stroke="#000"/><text x="5" y="58">횃불</text>
<line x1="110" y1="29" x2="110" y2="51" stroke="#5d4037" stroke-width="4"/><text x="96" y="64">열쇠</text>
<line x1="175" y1="23.5" x2="175" y2="56.5" stroke="#555" stroke-width="7" opacity=".5"/>
<line x1="15" y1="40" x2="175" y2="23.5" stroke="#999" stroke-dasharray="3 2"/><line x1="15" y1="40" x2="175" y2="56.5" stroke="#999" stroke-dasharray="3 2"/>
<text x="55" y="12">2뼘</text><line x1="15" y1="16" x2="110" y2="16" stroke="#000"/><text x="88" y="78">3뼘</text><line x1="15" y1="70" x2="175" y2="70" stroke="#000"/></svg>''',
 'pairs': '''<svg width="210" height="124" viewBox="0 0 210 124" font-size="8.5" font-weight="700"><text x="0" y="21" font-size="10">①</text><polygon points="14,28 44,28 30,10" fill="none" stroke="#000"/><text x="48" y="22">40°, 60°</text><polygon points="112,30 150,30 132,8" fill="none" stroke="#000"/><text x="154" y="22">60°, 80°</text><text x="0" y="51" font-size="10">②</text><polygon points="14,58 44,58 30,40" fill="none" stroke="#000"/><text x="48" y="52">2, 3, 4</text><polygon points="112,60 150,60 132,38" fill="none" stroke="#000"/><text x="154" y="52">4, 6, 9</text><text x="0" y="81" font-size="10">③</text><polygon points="14,88 44,88 30,70" fill="none" stroke="#000"/><text x="48" y="82">4, 5, 6</text><polygon points="112,90 150,90 132,68" fill="none" stroke="#000"/><text x="154" y="82">8, 10, 12</text><text x="0" y="111" font-size="10">④</text><polygon points="14,118 44,118 30,100" fill="none" stroke="#000"/><text x="48" y="112">4, 6, 끼인각 50°</text><polygon points="112,120 150,120 132,98" fill="none" stroke="#000"/><text x="154" y="112">6, 9, 끼인각 50°</text></svg>''',
 'pA': '''<svg width="200" height="80" viewBox="0 0 200 80" font-size="10" font-weight="700"><text x="186" y="12" font-size="13">☀</text><polygon points="8,60 64,60 38,18" fill="none" stroke="#000" stroke-width="1.5"/><text x="4" y="12">두 각 40°, 60°</text><polygon points="104,62 180,62 144,8" fill="none" stroke="#000" stroke-width="1.5"/><text x="96" y="12" ></text><text x="104" y="77" font-size="9">두 각 60°, 80°</text></svg>''',
 'pN': '''<svg width="200" height="80" viewBox="0 0 200 80" font-size="10" font-weight="700"><text x="186" y="12" font-size="13">☾</text><polygon points="8,60 64,60 38,18" fill="none" stroke="#000" stroke-width="1.5"/><text x="4" y="12">세 변 2, 3, 4</text><polygon points="104,62 180,62 144,8" fill="none" stroke="#000" stroke-width="1.5"/><text x="96" y="12" ></text><text x="104" y="77" font-size="9">세 변 4, 6, 9</text></svg>''',
 'pR': '''<svg width="200" height="80" viewBox="0 0 200 80" font-size="10" font-weight="700"><text x="186" y="12" font-size="13">★</text><polygon points="8,60 64,60 38,18" fill="none" stroke="#000" stroke-width="1.5"/><text x="4" y="12">세 변 4, 5, 6</text><polygon points="104,62 180,62 144,8" fill="none" stroke="#000" stroke-width="1.5"/><text x="96" y="12" ></text><text x="104" y="77" font-size="9">세 변 8, 10, 12</text></svg>''',
 'pS': '''<svg width="200" height="80" viewBox="0 0 200 80" font-size="10" font-weight="700"><text x="186" y="12" font-size="13">⚓</text><polygon points="8,60 64,60 38,18" fill="none" stroke="#000" stroke-width="1.5"/><text x="4" y="12">두 변 4, 6, 끼인각 50°</text><polygon points="104,62 180,62 144,8" fill="none" stroke="#000" stroke-width="1.5"/><text x="96" y="12" ></text><text x="104" y="77" font-size="9">두 변 6, 9, 끼인각 50°</text></svg>''',
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
# 화면 설정에서 정답·오답 안내 뽑기
html = os.path.join(HERE, '..', '..', '..', f'escape{N}.html')
js = r"""const fs=require('fs');const h=fs.readFileSync(process.argv[1],'utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);const window={};eval(m[1]);const G=window.EG;
const o={codes:G.codes,mach:{},wrong:G.wrongCodes,hints:G.hints,same:G.hintSame||{},pens:G.pens||{},end:G.endCard};
for(const[k,M]of Object.entries(G.mach)){let ans=null,open=[],wr=[],cnt={};const tr=[];
 if(M.type==='grid'){for(let x=0;x<=(M.xmax||12);x++)for(let y=0;y<=(M.ymax||12);y++)tr.push([[x,y],`(${x}, ${y})`])}else{for(let a=0;a<=(M.max||360);a++)tr.push([[a],a+(M.unit||'°')])}
 for(const[t,l]of tr){const r=M.check(...t);if(r.ok){ans=l;open=r.open}else{cnt[r.msg]=(cnt[r.msg]||0)+1;wr.push([l,r.msg])}}
 o.mach[k]={t:M.t,s:M.s,ans,open,wrong:wr.filter(([l,m])=>cnt[m]<=2)}}
console.log(JSON.stringify(o));"""
G = json.loads(subprocess.check_output(['node', '-e', js, html]).decode())
strip = lambda t: re.sub('<[^>]+>', '', str(t))
def hint3(k):
    h = G['hints'].get(k) or G['hints'].get(str(G['same'].get(k, ''))) or ['', '', '']
    return ''.join(f'<td>{strip(x)}</td>' for x in (h + ['', '', ''])[:3])
def wrongs_for(k):
    if k in G['mach']: return '<br>'.join(f'<b>{l}</b>: {strip(m)}' for l, m in G['mach'][k]['wrong'])
    return ''
lock_wrong = {}
for code, msg in G['wrong'].items(): lock_wrong.setdefault('lock', []).append((code, msg))
rows = ''
for scene, k, math, clue in R.FLOW:
    if k in G['codes']:
        c = G['codes'][k]; ans = f'<b>{c["code"]}</b> → {", ".join(c["ok"]["open"])}'; kind = '🔒'
    elif k in G['mach']:
        m = G['mach'][k]; ans = f'<b>{m["ans"]}</b> → {", ".join(m["open"])}'; kind = '⚙️'
    else:
        ans = f'<b>{k}</b> = ' + k.split('+')[0] if '+' in k else k; kind = '➕'
        a, b = k.split('+'); ans = f'<b>{int(a)+int(b)}</b>'
    title = cards[k][3] if k in cards else ''
    rows += f'<tr><td>{scene}</td><td>{kind} {k} {title}</td><td>{ans}</td><td>{math}</td><td>{clue}</td></tr>'
hrows = ''
for scene, k, math, clue in R.FLOW:
    kk = k.split('+')[0]
    hrows += f'<tr><td>{k}</td>{hint3(kk)}<td style="font-size:7pt">{wrongs_for(k)}</td></tr>'
lw = '<br>'.join(f'<b>{a}</b>: {strip(b)}' for a, b in G['wrong'].items())
pens = ''.join(f'<tr><td>{n} {strip(cards[n][4]).split("⏳")[0][:40]}</td><td>{p.get("m",1)}분</td><td>{strip(p.get("msg",""))}</td></tr>' for n, p in G['pens'].items())
dis = ''.join(f'<tr><td>{a} {cards[a][3]}</td><td>{b}</td></tr>' for a, b in R.DIS.items())
combo = ' · '.join(f'{r}+{b}={v}' + (' (⏳)' if cards[str(v)][1]=='pen' else '') for (r, b), v in R.COMBOS.items())
teacher = f"""<div class="sheet"><h1>{R.EP} — 선생님 정답표</h1>
<p>🔗 디벗: <a href="https://geogebra2026.vercel.app/escape{N}.html">geogebra2026.vercel.app/escape{N}.html</a> · 연습: <a href="https://geogebra2026.vercel.app/escape0.html">escape0.html</a> · 제한 45분 · 카드 {len(R.CARDS)}장 · 탈출 번호 <b>{G['end']}</b></p>
<h2>1. 풀이 흐름 (이 순서로 풀려요)</h2><table><tr><th>장면</th><th>카드</th><th>정답 → 펼칠 카드</th><th>쓰는 수학</th><th>필요한 단서</th></tr>{rows}</table>
<p>합치기(빨강 + 파랑): {combo}. 그 밖의 합은 해당 카드가 없어요.</p>
<h2>2. 힌트 3단계와 디벗 오답 안내</h2><table><tr><th>카드</th><th>힌트 1</th><th>힌트 2</th><th>정답 힌트</th><th>기계 오답 → 디벗 안내 (−1분)</th></tr>{hrows}</table>
<p style="font-size:7.5pt"><b>자물쇠 오답 → 디벗 안내 (−1분)</b><br>{lw}</p>
<h2>3. 벌점 카드</h2><table><tr><th>카드</th><th>잃는 시간</th><th>디벗에 뜨는 설명</th></tr>{pens}</table>
<h2>4. 치우기</h2><table><tr><th>이 카드를 펼치면</th><th>치울 카드</th></tr>{dis}</table>
<h2>5. 준비</h2><p>· A4 <b>양면 인쇄 — 긴 쪽 넘김</b>, 배율 100%. 점선대로 잘라 모둠당 1세트.<br>· 카드는 번호가 보이게 뒷면으로 쌓아 두고 <b>시작 카드만</b> 펼쳐요. 그림 속 번호가 보이면 그 카드를 찾아 펼쳐요.<br>· 디벗은 모둠당 1대. 처음 하는 반은 연습(escape0)부터.<br>· 이 정답표는 선생님만 가지고 계세요.</p></div>"""
css = open(os.path.join(HERE, '..', 'print', 'build.py'), encoding='utf-8').read().split("css='''")[1].split("'''")[0]
css += '.hid{position:static;display:inline-block;margin-left:2mm;font-size:6.5pt;color:#999}.dis{position:absolute;left:2.5mm;right:2.5mm;bottom:5mm}.bd svg{max-height:30mm}.note{margin-top:1.5mm;padding:1mm 1.5mm;background:#f5ead0;font-size:7.5pt;line-height:1.5}.note.L{text-align:right}'
pages = ''
L = R.CARDS
for i in range(0, len(L), 9):
    g = L[i:i+9]
    pages += '<div class="page">' + ''.join(front(c) for c in g) + '</div>'
    bk = [back(c) for c in g] + ['<div></div>'] * (9 - len(g))
    pages += '<div class="page">' + ''.join(sum([bk[j:j+3][::-1] for j in range(0, 9, 3)], [])) + '</div>'
out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
p = os.path.join(out, f'방탈출{N}회_글카드.html')
open(p, 'w', encoding='utf-8').write(f'<html><head><meta charset="utf-8"><style>{css}.sheet table{{border-collapse:collapse;width:100%;font-size:7.5pt;margin-bottom:6px}}.sheet h2{{font-size:11pt;margin:10px 0 4px}}.sheet td,.sheet th{{border:1px solid #999;padding:3px;vertical-align:top}}</style></head><body>{pages}{teacher}</body></html>')
print(p, len(L), '장')
