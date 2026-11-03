# 내용 검수용 글 카드 PDF 만들기 (그림 없음)
# 사용: python3 build_text.py 2   → out/방탈출2회_글카드.html (topdf.js로 PDF)
import sys, os, re, json, subprocess, importlib, html as H
N = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
R = importlib.import_module('r' + N)
COL = {'grey':('#757575','장소·단서'),'red':('#d32f2f','빨강 물건'),'blue':('#1976d2','파랑 물건'),
       'green':('#2e7d32','⚙️ 기계'),'yellow':('#f9a825','🔒 자물쇠'),'pen':('#5d4037','⏳ 벌점'),'start':('#1a237e','시작'),'story':('#6d4c41','📜 이야기')}
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
<path d="M112,29 Q141,9 170,29 M112,33 Q141,25 170,33 M112,37 Q141,45 170,37 M112,41 Q141,61 170,41" fill="none" stroke="#000"/><g font-size="8"><text x="52" y="22">🔥</text><text x="52" y="33">🔥</text><text x="52" y="54">🔥</text><text x="134" y="17">🔥</text><text x="134" y="29">🔥</text><text x="134" y="43">🔥</text><text x="134" y="57">🔥</text></g></svg>''',
 'stone': '''<svg width="200" height="54" viewBox="0 0 200 54" font-weight="700"><rect x="1" y="1" width="198" height="52" rx="6" fill="#eee" stroke="#000"/>
<text x="10" y="34" font-size="15">🔥</text><rect x="32" y="14" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><rect x="54" y="14" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><text x="88" y="34" font-size="15">🔥+⛵</text><rect x="136" y="14" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><rect x="158" y="14" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/></svg>''',
 'frac': '''<svg width="120" height="76" viewBox="0 0 120 76"><rect x="1" y="1" width="118" height="74" rx="8" fill="#eee" stroke="#000"/><rect x="38" y="5" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><rect x="62" y="5" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><line x1="30" y1="38" x2="90" y2="38" stroke="#000" stroke-width="3"/><rect x="38" y="45" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><rect x="62" y="45" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/></svg>''',
 'clock': '''<svg width="140" height="52" viewBox="0 0 140 52" font-weight="700"><rect x="1" y="1" width="138" height="50" rx="8" fill="#263238" stroke="#000"/><rect x="14" y="12" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><rect x="38" y="12" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><text x="64" y="33" font-size="20" fill="#ffca28">:</text><rect x="80" y="12" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><rect x="104" y="12" width="20" height="26" rx="3" fill="#fff" stroke="#000" stroke-width="1.5"/><text x="34" y="47" font-size="7" fill="#ffca28">시</text><text x="100" y="47" font-size="7" fill="#ffca28">분</text></svg>'''}
def vis(c):
    t = c[5]
    return '' if not t else '<div class="vis">' + ''.join(f'<span><b>{n}</b> {H.escape(cards[str(n)][3])}</span>' for n in t) + '</div>'
def front(c):
    bl, t, n, title, body = c[:5]; col, lab = COL[t]
    if t == 'story': n = '📜'
    fig = FIG.get(c[6], '') if len(c) > 6 else ''
    body = body.replace('<div class="hid">', '<div class="hid">')
    d = R.DIS.get(bl, '')
    dis = f'<div class="dis">🗑 치우기: {d}</div>' if d else ''
    return f'<div class="card"><div class="band" style="background:{col}"><span class="no">{H.escape(n)}</span><span class="lab">{lab}</span></div><div class="ti">{title}</div><div class="bd">{body}{fig}{vis(c)}</div>{dis}<div class="ft">나침반 시리즈 {N}회</div></div>'
def back(c):
    bl = c[0]; fs = '18pt' if len(bl) > 3 else '30pt'
    if c[1] == 'story': return f'<div class="card bk"><div class="bt">{R.EP.split(" · ")[0]}</div><div class="bn" style="font-size:16pt">📜 먼저 읽어요</div><div class="bt2">{N}회</div></div>'
    return f'<div class="card bk"><div class="bt">{R.EP.split(" · ")[0]}</div><div class="bn" style="font-size:{fs}">{H.escape(bl)}</div><div class="bt2">{N}회</div></div>'
# 화면 설정에서 정답·오답 안내 뽑기
html = os.path.join(HERE, '..', '..', '..', f'escape{N}.html')
js = r"""const fs=require('fs');const h=fs.readFileSync(process.argv[1],'utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);const window={};eval(m[1]);const G=window.EG;
const o={codes:G.codes,mach:{},wrong:G.wrongCodes,hints:G.hints,same:G.hintSame||{},pens:G.pens||{},end:G.endCard};
for(const[k,M]of Object.entries(G.mach)){let ans=null,open=[],wr=[],cnt={};const tr=[];
 const lb=t=>{const v=t[0];return Array.isArray(v)?(v.length>8?v.length+'칸 ('+(M.ansNote||'')+')':v.join(', ')+(M.unit?' '+M.unit:'')):v+(M.unit||'')};
 if(M.tries){for(const t of M.tries)tr.push([t,lb(t)])}else if(M.type==='grid'){for(let x=0;x<=(M.xmax||12);x++)for(let y=0;y<=(M.ymax||12);y++)tr.push([[x,y],`(${x}, ${y})`])}else{for(let a=0;a<=(M.max||360);a++)tr.push([[a],a+(M.unit||'°')])}
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
# 2026-11-03 선생님 요청: 정답표는 한 장, 큰 글씨로 '카드 / 정답 / 펼치기 → 치우기'만(힌트·오답 안내는 디벗 화면에 있으니 뺌)
rows = ''
for i, (scene, k, math, clue) in enumerate(R.FLOW, 1):
    if k in G['codes']:
        c = G['codes'][k]; ans = c['code']; opn = c['ok']['open']; kind = '🔒'
    elif k in G['mach']:
        m = G['mach'][k]; ans = str(m['ans']).strip('[]').replace("'", ''); opn = m['open']; kind = '⚙️'
    else:
        a, b = k.split('+'); ans = str(int(a) + int(b)); opn = [ans]; kind = '➕'
    names = ' + '.join(f'{x} {cards[x][3]}' for x in k.split('+'))
    dis = ' · '.join(f'{o} → 치우기 {R.DIS[o]}' if o in R.DIS else f'{o}' for o in opn)
    rows += f'<tr><td>{i}</td><td>{kind} {names}</td><td class="big">{ans}</td><td>{dis}{'' if math=='—' else '<div class="sm">'+math+'</div>'}</td></tr>'
pens = ' · '.join(f'{n}({p.get("m",1)}분)' for n, p in G['pens'].items())
combo = ' · '.join(f'{r}+{b}={v}' + (' ⏳' if cards[str(v)][1]=='pen' else '') for (r, b), v in R.COMBOS.items())
teacher = f"""<div class="sheet ts"><h1>{R.EP} — 선생님 정답표</h1>
<p>🔗 디벗: <a href="https://geogebra2026.vercel.app/escape{N}.html">geogebra2026.vercel.app/escape{N}.html</a> · 연습 escape0 · 45분 · 카드 {len(R.CARDS)}장 · 🏁 탈출 번호 <b class="bl">{G['end']}</b></p>
<table><tr><th>#</th><th>카드</th><th>정답</th><th>펼치기 → 치우기 <small>(아래: 쓰는 수학)</small></th></tr>{rows}</table>
<p>⏳ 벌점 카드(그 카드만 치움): {pens}<br>➕ 합치기: {combo} — 그 밖의 합은 카드가 없어요.</p>
<p class="sm">준비: A4 양면 인쇄(긴 쪽 넘김, 100%) → 점선대로 잘라 모둠당 1세트 · 이야기 카드를 맨 위, 시작 카드만 펼쳐 둠 · 디벗 모둠당 1대 · 힌트와 오답 안내는 디벗 화면에 나와요.</p></div>"""
css = open(os.path.join(HERE, '..', 'print', 'build.py'), encoding='utf-8').read().split("css='''")[1].split("'''")[0]
css += '.ts{font-size:12pt}.ts table{width:100%}.ts td,.ts th{font-size:12pt;padding:2mm}.ts td.big{font-size:18pt;font-weight:bold;color:#1565c0;white-space:nowrap}.ts .bl{color:#1565c0;font-size:15pt}.ts .sm{font-size:9pt;color:#555}.hid{position:static;display:inline-block;margin-left:2mm;font-size:6.5pt;color:#999}.dis{position:absolute;left:2.5mm;right:2.5mm;bottom:5mm}.bd svg{max-height:30mm}.note{margin-top:1.5mm;padding:1mm 1.5mm;background:#f5ead0;font-size:7.5pt;line-height:1.5}.note.L{text-align:right}'
pages = ''
L = ([('이야기','story','이야기',R.PROLOGUE[0],R.PROLOGUE[1],[])] if hasattr(R,'PROLOGUE') else []) + list(R.CARDS)  # 이야기 카드는 맨 앞(2026-11-02)
for i in range(0, len(L), 9):
    g = L[i:i+9]
    pages += '<div class="page">' + ''.join(front(c) for c in g) + '</div>'
    bk = [back(c) for c in g] + ['<div></div>'] * (9 - len(g))
    pages += '<div class="page">' + ''.join(sum([bk[j:j+3][::-1] for j in range(0, 9, 3)], [])) + '</div>'
out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
p = os.path.join(out, f'방탈출{N}회_글카드.html')
open(p, 'w', encoding='utf-8').write(f'<html><head><meta charset="utf-8"><style>{css}.sheet table{{border-collapse:collapse;width:100%;font-size:7.5pt;margin-bottom:6px}}.sheet h2{{font-size:11pt;margin:10px 0 4px}}.sheet td,.sheet th{{border:1px solid #999;padding:3px;vertical-align:top}}</style></head><body>{pages}{teacher}</body></html>')
print(p, len(L), '장')
