# 회차 카드(rN.py) ↔ 디벗 화면(escapeN.html) 대조 + 카드 길 시뮬레이션
# 사용: python3 check_round.py 2
import sys, re, json, subprocess, importlib, os, itertools
N = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
R = importlib.import_module('r' + N)
html = os.path.join(HERE, '..', '..', '..', f'escape{N}.html')
js = r'''const fs=require('fs');const h=fs.readFileSync(process.argv[1],'utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);
const window={};eval(m[1]);const G=window.EG;const o={kinds:G.kinds,codes:{},mach:{},hints:Object.keys(G.hints),same:G.hintSame||{},end:G.endCard};
for(const[k,c]of Object.entries(G.codes))o.codes[k]={code:c.code,open:c.ok.open,clear:c.ok.clear};
const tries={grid:[],dial:[]};for(let x=0;x<=12;x++)for(let y=0;y<=12;y++)tries.grid.push([x,y]);for(let a=0;a<360;a++)tries.dial.push([a]);
for(const[k,M]of Object.entries(G.mach)){let ok=[];const T=M.type==='dial2'?[]:tries[M.type==='img'?'grid':M.type];
 if(M.type==='dial2'){for(let a=0;a<360;a++)for(let b=0;b<=30;b++){const r=M.check(a,b);if(r.ok)ok.push({in:[a,b],open:r.open,clear:r.clear})}}
 else for(const t of T){const r=M.check(...t);if(r.ok)ok.push({in:t,open:r.open,clear:r.clear})}
 o.mach[k]=ok}
console.log(JSON.stringify(o));'''
G = json.loads(subprocess.check_output(['node', '-e', js, html]).decode())
bad = []
cards = {c[2]: c for c in R.CARDS}
T = {'red': 'R', 'blue': 'B', 'green': 'Gr', 'yellow': 'Y', 'pen': 'P', 'grey': 'G', 'start': 'G'}
# 1) 종류
for n, c in cards.items():
    k = G['kinds'].get(n, 'G')
    if k != T[c[1]]: bad.append(f'종류 다름: {n} 카드={c[1]} 화면={k}')
for n in G['kinds']:
    if n not in cards: bad.append(f'화면에만 있는 번호: {n}')
# 2) 답이 하나뿐인지, 펼치기/치우기 = 카드 표시
def dis(n): return sorted(x.strip() for x in R.DIS.get(n, '').split(',') if x.strip())
for k, c in G['codes'].items():
    if cards.get(k, ('',))[1] != 'yellow': bad.append(f'자물쇠 {k}가 노랑 카드가 아님')
    for o in c['open']:
        if sorted(c['clear']) != dis(o): bad.append(f'자물쇠 {k}: 화면 치우기 {c["clear"]} ≠ 카드 {o}의 표시 {dis(o)}')
for k, oks in G['mach'].items():
    if cards.get(k, ('',))[1] != 'green': bad.append(f'기계 {k}가 초록 카드가 아님')
    if len(oks) != 1: bad.append(f'기계 {k}: 정답이 {len(oks)}개 {[o["in"] for o in oks][:5]}')
    for ok in oks[:1]:
        for o in ok['open']:
            if sorted(ok['clear']) != dis(o): bad.append(f'기계 {k}: 화면 치우기 {ok["clear"]} ≠ 카드 {o}의 표시 {dis(o)}')
for (r, b), res in R.COMBOS.items():
    res = str(res)
    if cards[res][1] != 'pen' and cards[res][1] not in ('grey', 'green', 'yellow'): bad.append(f'합 {r}+{b}={res} 종류 이상')
    if r + b != int(res): bad.append(f'합 계산 틀림 {r}+{b}')
    if cards[res][1] == 'pen' and dis(res): bad.append(f'벌점 {res}에 버리기 표시가 있음')
# 3) 빨강+파랑 전수
reds = [int(n) for n, c in cards.items() if c[1] == 'red']; blues = [int(n) for n, c in cards.items() if c[1] == 'blue']
for r, b in itertools.product(reds, blues):
    if str(r + b) in cards and (r, b) not in R.COMBOS: bad.append(f'뜻밖의 합: {r}+{b}={r+b}')
# 4) 힌트 번호
for h in G['hints'] + list(G['same']):
    if h != '0' and h not in cards: bad.append(f'힌트 번호 {h} 카드 없음')
for k, v in G['same'].items():
    if str(v) not in G['hints']: bad.append(f'hintSame {k}→{v}: 힌트 없음')
# 5) 카드 길 시뮬레이션 (버리기 표시를 지키며)
def tags(n):
    c = cards[n]; t = [str(x) for x in c[5]] + re.findall(r'class="hid">(\d+)<', c[4]); return t
table = {'시작'}; seen = {'시작'}; gone = set(); solved = set(); log = []
def open_(n, why):
    if n in seen: return
    seen.add(n); table.add(n); log.append(f'{why} → {n}')
    if cards[n][1] == 'pen': table.discard(n); return
    for d in dis(n):
        if d not in table: bad.append(f'{n}을 펼칠 때 버릴 {d}가 탁자에 없음 (아직 안 펼쳤거나 이미 버림)')
        table.discard(d); gone.add(d)
for _ in range(60):
    for n in list(table):
        for t in tags(n): open_(t, f'{n} 그림')
    for (r, b), res in sorted(R.COMBOS.items(), key=lambda kv: cards[str(kv[1])][1] != 'pen'):  # 함정 먼저 (함께 놓이는 때가 있는지)
        if str(r) in table and str(b) in table: open_(str(res), f'{r}+{b}')
    for k, c in G['codes'].items():
        if k in table and k not in solved:
            solved.add(k)
            for o in c['open']: open_(o, f'자물쇠 {k} {c["code"]}')
    for k, oks in G['mach'].items():
        if k in table and k not in solved and oks:
            solved.add(k)
            for o in oks[0]['open']: open_(o, f'기계 {k} {oks[0]["in"]}')
miss = [n for n in cards if n not in seen]
if miss: bad.append(f'못 간 카드: {miss}')
if str(G['end']) not in seen: bad.append('엔딩에 못 감')
# 함정 합: 두 카드가 함께 탁자에 있는 때가 있었는지 (펼친 순서로 근사)
print(f'{N}회: 카드 {len(cards)}장, 자물쇠 {len(G["codes"])}, 기계 {len(G["mach"])}, 합 {len(R.COMBOS)}')
print('길:', ' / '.join(log))
print('결과:', '✅ 문제 없음' if not bad else '❌\n  ' + '\n  '.join(bad))
