# 그림 위에 겹쳐 그리는 SVG (viewBox 0~100, 가로 기준). 실제 값의 비율로 그린다.
import math
INK = '#3b2412'; PEN = "font-family='Nanum Pen Script'"
def tri_sides(a, b, c):
    """세 변 a(밑변), b, c → 꼭짓점 (0,0),(a,0),(x,y) (위쪽이 +y)"""
    x = (a*a + c*c - b*b) / (2*a); y = math.sqrt(max(c*c - x*x, 0)); return [(0, 0), (a, 0), (x, y)]
def tri_angles(A, B, base=1.0):
    """밑변 양 끝 각 A(왼쪽), B(오른쪽)"""
    C = 180 - A - B; L = base*math.sin(math.radians(B))/math.sin(math.radians(C))
    return [(0, 0), (base, 0), (L*math.cos(math.radians(A)), L*math.sin(math.radians(A)))]
def place(P, ox, oy, s):   # 수학 좌표 → 화면 (y 뒤집기)
    return [(ox + x*s, oy - y*s) for x, y in P]
def poly(P, w=1.2, col=INK):
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in P)}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linejoin="round"/>'
def mid(p, q): return ((p[0]+q[0])/2, (p[1]+q[1])/2)
def side_label(p, q, t, cen, fs=6, off=4.2):
    m = mid(p, q); dx, dy = m[0]-cen[0], m[1]-cen[1]; d = math.hypot(dx, dy) or 1
    return f'<text x="{m[0]+dx/d*off:.1f}" y="{m[1]+dy/d*off+fs*0.35:.1f}" text-anchor="middle" font-size="{fs}" {PEN} fill="{INK}">{t}</text>'
def arc(v, p, q, r=4.5, t='', fs=5.2):
    a1 = math.atan2(p[1]-v[1], p[0]-v[0]); a2 = math.atan2(q[1]-v[1], q[0]-v[0])
    d = (a2-a1) % (2*math.pi)
    if d > math.pi: a1, a2 = a2, a1; d = 2*math.pi-d
    x1, y1 = v[0]+r*math.cos(a1), v[1]+r*math.sin(a1); x2, y2 = v[0]+r*math.cos(a2), v[1]+r*math.sin(a2)
    am = a1 + d/2; tx, ty = v[0]+(r+4.6)*math.cos(am), v[1]+(r+4.6)*math.sin(am)
    s = f'<path d="M{x1:.1f},{y1:.1f} A{r},{r} 0 0 1 {x2:.1f},{y2:.1f}" fill="none" stroke="{INK}" stroke-width=".6"/>'
    return s + (f'<text x="{tx:.1f}" y="{ty+fs*0.35:.1f}" text-anchor="middle" font-size="{fs}" {PEN} fill="{INK}">{t}</text>' if t else '')
def cen(P): return (sum(x for x,_ in P)/3, sum(y for _,y in P)/3)
def pair(kind, box=(14, 14, 86, 74)):
    """돌판 위 삼각형 한 쌍. box=(x0,y0,x1,y1) 안에 왼쪽 작은 것·오른쪽 큰 것"""
    x0, y0, x1, y1 = box; W = x1-x0; out = ''
    if kind == 'AA':
        L = tri_angles(40, 60); R = tri_angles(60, 80)
        specs = [(L, 1.0, [(0,40),(1,60)]), (R, 1.25, [(0,60),(1,80)])]
    elif kind == 'N':
        specs = [(tri_sides(4, 3, 2), 1.0, None, ['4','3','2']), (tri_sides(9, 6, 4), 1.0, None, ['9','6','4'])]
    elif kind == 'SSS':
        specs = [(tri_sides(6, 5, 4), 1.0, None, ['6','5','4']), (tri_sides(12, 10, 8), 1.0, None, ['12','10','8'])]
    else:  # SAS: 두 변과 끼인각 50°
        def sas(b, c, A): return [(0,0),(b,0),(c*math.cos(math.radians(A)), c*math.sin(math.radians(A)))]
        specs = [(sas(6, 4, 50), 1.0, 'S', ['6','4']), (sas(9, 6, 50), 1.0, 'S', ['9','6'])]
    # 크기 맞추기: 두 삼각형을 같은 배율로(실제 비율 유지)
    def ext(P): xs=[p[0] for p in P]; ys=[p[1] for p in P]; return max(xs)-min(xs), max(ys)-min(ys)
    if kind == 'AA':
        tris = [(place(sp[0], 0, 0, 1), sp) for sp in specs]
    k = None
    raw = [sp[0] for sp in specs]
    if kind == 'AA': raw = [[(x*sp[1], y*sp[1]) for x,y in sp[0]] for sp in specs]
    wsum = sum(ext(P)[0] for P in raw); hmax = max(ext(P)[1] for P in raw)
    s = min((W-9*(len(raw)-1)-8)/wsum, (y1-y0-10)/hmax)
    cx = x0 + (W - wsum*s - 9*(len(raw)-1))/2
    for i, P in enumerate(raw):
        w, h = ext(P); mnx = min(p[0] for p in P)
        Q = place([(x-mnx, y) for x, y in P], cx, y0 + (y1-y0 + hmax*s)/2, s); cx += w*s + 9
        C = cen(Q); out += poly(Q)
        sp = specs[i]
        if kind == 'AA':
            for vi, deg in sp[2]:
                o = [j for j in range(3) if j != vi]; out += arc(Q[vi], Q[o[0]], Q[o[1]], t=f'{deg}°')
        elif kind in ('N', 'SSS'):
            labs = sp[3]; out += side_label(Q[0], Q[1], labs[0], C) + side_label(Q[1], Q[2], labs[1], C) + side_label(Q[2], Q[0], labs[2], C)
        else:
            labs = sp[3]; out += side_label(Q[0], Q[1], labs[0], C) + side_label(Q[2], Q[0], labs[1], C) + arc(Q[0], Q[1], Q[2], r=4, t='50°')
    return out

def pen(x, y, t, fs=4.2, anchor='start', col='#2b1a0a', rot=0):
    r = f' transform="rotate({rot} {x} {y})"' if rot else ''
    return f'<text x="{x}" y="{y}" font-size="{fs}" {PEN} fill="{col}" text-anchor="{anchor}"{r}>{t}</text>'
def journal41():
    """41: 왼쪽 쪽 손글씨, 오른쪽 쪽 거울 측량 스케치(가로 1m = 1.05)"""
    g = '#3a3a3a'; s = ''
    s += pen(17, 37, '절벽 높이 재기', 5) + pen(17, 44.5, '거울을 땅에 놓고', 4.3) + pen(17, 51, '꼭대기가 거울에', 4.3) + pen(17, 57.5, '보이는 곳에 섰다.', 4.3)
    s += pen(17, 65, '높이 =', 4.6) + '<ellipse cx="35" cy="63.5" rx="7.5" ry="3.4" fill="#6b5a44" opacity=".55"/><ellipse cx="38" cy="65" rx="4" ry="2" fill="#6b5a44" opacity=".4"/>'
    k = 1.05; x0 = 51.5; gy = 60; mx = x0 + 3*k; cx = mx + 24*k; top = gy - 12*k*1.6
    s += f'<line x1="50" y1="{gy}" x2="{cx+3}" y2="{gy}" stroke="{g}" stroke-width=".7"/>'
    s += f'<rect x="{cx:.1f}" y="{top:.1f}" width="3" height="{gy-top:.1f}" fill="#bbb" fill-opacity=".35" stroke="{g}" stroke-width=".7"/>'
    ey = gy - 4
    s += f'<circle cx="{x0}" cy="{ey-1.2:.1f}" r="1.1" fill="none" stroke="{g}" stroke-width=".6"/><line x1="{x0}" y1="{ey:.1f}" x2="{x0}" y2="{gy}" stroke="{g}" stroke-width=".7"/>'
    s += f'<rect x="{mx-1.4:.1f}" y="{gy-.7}" width="2.8" height=".9" fill="#3a6ea5"/>'
    s += f'<polyline points="{x0+.8},{ey-1.2:.1f} {mx:.1f},{gy-.6} {cx:.1f},{top:.1f}" fill="none" stroke="#3a6ea5" stroke-width=".7" stroke-dasharray="1.4 .9"/>'
    s += pen((x0+mx)/2, gy+5, '3m', 4.4, 'middle') + pen((mx+cx)/2, gy+5, '24m', 4.6, 'middle') + pen(mx+1, gy-2.5, '거울', 3.6, 'start')
    return s
def notebook66():
    s = pen(13, 36, '닮음 표시', 4.8) + pen(13, 44, 'SSS 닮음 = 1', 4.0) + pen(13, 50.5, 'SAS 닮음 = 2', 4.0) + pen(13, 57, 'AA 닮음 = 3', 4.0) + pen(13, 63.5, '닮지 않음 = 0', 4.0)
    s += pen(44, 36, '— 측량대', 3.6)
    s += '<g fill="none" stroke="#3b2412" stroke-width=".5"><polygon points="45,58 55,58 48,50"/><polygon points="59,62 74,62 63.5,50"/></g>' + pen(58, 46, '닮은 꼴 찾기!', 3.4)
    return s

NOTE = ["뒤따라오는 동|료에게: 나는", "돌문 번호를 알|아내 먼저 간다.", "작은 문 열쇠는 가|짜와 섞어 묻었다.", "진짜는 바위 뒤 그|을음 자국에 맞춰라.",
        "배를 묶은 말뚝(O)|에 10걸음 밧줄을", "매고 팽팽히 당겨, 밧|줄 끝이 강가 길에", "닿는 곳을 파|라. — 검은 갈매기"]
def note_half(side):
    s = ''
    for i, ln in enumerate(NOTE):
        a, b = ln.split('|'); y = 22 + i*9.2
        if side == 'L': s += pen(80, y, ('"' if i == 0 else '') + a, 5.2, 'end', rot=-1)
        else: s += pen(19, y, b + ('"' if i == len(NOTE)-1 else ''), 5.2, 'start', rot=-1)
    return s
def rock48():
    s = ''
    for x, sym in zip([18, 35, 51.3, 68], ['☀', '☾', '★', '⚓']):
        s += f'<text x="{x}" y="35" text-anchor="middle" font-size="6" fill="#3b2412" opacity=".85">{sym}</text>'
    return s
def door83():
    A = (48, 19); B = (22, 63); C = (73, 63)
    def at(P, Q, t): return (P[0] + (Q[0]-P[0])*t, P[1] + (Q[1]-P[1])*t)
    H, I = at(A, B, 5/15), at(A, C, 5/15); F, G = at(A, B, 9/15), at(A, C, 9/15)
    ink = '#2a1a0e'; s = ''
    for P, Q in [(H, I), (F, G)]:
        s += f'<line x1="{P[0]:.1f}" y1="{P[1]:.1f}" x2="{Q[0]:.1f}" y2="{Q[1]:.1f}" stroke="{ink}" stroke-width="1.3" opacity=".8"/>'
    # 눈금 15칸
    dx, dy = B[0]-A[0], B[1]-A[1]; L = math.hypot(dx, dy); nx, ny = -dy/L, dx/L
    for k in range(1, 15):
        P = at(A, B, k/15); s += f'<line x1="{P[0]-nx*1.2:.1f}" y1="{P[1]-ny*1.2:.1f}" x2="{P[0]+nx*1.2:.1f}" y2="{P[1]+ny*1.2:.1f}" stroke="{ink}" stroke-width=".5"/>'
    lab = lambda P, t, ox, oy: f'<text x="{P[0]+ox:.1f}" y="{P[1]+oy:.1f}" text-anchor="middle" font-family="Hahmlet" font-weight="800" font-size="4.2" fill="{ink}">{t}</text>'
    s += lab(A, 'A', 0, -2) + lab(B, 'B', -2.5, 4) + lab(C, 'C', 2.5, 4) + lab(H, 'H', -3, 1) + lab(I, 'I', 3, 1) + lab(F, 'F', -3, 1) + lab(G, 'G', 3, 1)
    for (P, Q), t in [((A, H), '5칸'), ((H, F), '4칸'), ((F, B), '6칸')]:
        m = at(P, Q, .5); s += pen(m[0]-7.5, m[1]+1, t, 4.0, 'middle', col='#5a1a0a')
    for P, Q in [(H, I), (F, G), (B, C)]:
        m = at(P, Q, .5); s += f'<path d="M{m[0]-1:.1f},{m[1]-1:.1f} L{m[0]+.6:.1f},{m[1]} L{m[0]-1:.1f},{m[1]+1:.1f}" fill="none" stroke="{ink}" stroke-width=".5"/>'
    s += '<rect x="74" y="31" width="23" height="7" rx="1.5" fill="#3b2412" opacity=".8"/><text x="85.5" y="36" text-anchor="middle" font-size="3.8" font-family="Hahmlet" font-weight="800" fill="#ffe9a8">FG▢▢·HI▢▢</text>'
    return s

def slab33():
    ink = '#2a1a0e'; s = ''
    A = (36, 21); B = (36, 41); C = (80, 74)
    s += '<rect x="13" y="21" width="74" height="20" fill="#5aa9d6" opacity=".28"/>'
    s += f'<line x1="13" y1="21" x2="87" y2="21" stroke="{ink}" stroke-width=".9"/><line x1="13" y1="41" x2="87" y2="41" stroke="{ink}" stroke-width=".9"/>'
    s += pen(72, 33.5, '강', 5.5, col='#1f4f7a')
    M = ((A[0]+C[0])/2, (A[1]+C[1])/2); N = ((B[0]+C[0])/2, (B[1]+C[1])/2)
    for P, Q in [(A, C), (B, C), (A, B)]:
        s += f'<line x1="{P[0]}" y1="{P[1]}" x2="{Q[0]}" y2="{Q[1]}" stroke="{ink}" stroke-width="1"/>'
    s += f'<line x1="{M[0]}" y1="{M[1]}" x2="{N[0]}" y2="{N[1]}" stroke="{ink}" stroke-width=".8" stroke-dasharray="1.5 1"/>'
    def tick(P, Q, n):
        m = ((P[0]+Q[0])/2, (P[1]+Q[1])/2); dx, dy = Q[0]-P[0], Q[1]-P[1]; L = math.hypot(dx, dy); ux, uy = dx/L, dy/L; nx, ny = -uy, ux; o = ''
        for k in range(n):
            c = (m[0]+ux*(k-(n-1)/2)*1.4, m[1]+uy*(k-(n-1)/2)*1.4)
            o += f'<line x1="{c[0]-nx*1.6:.1f}" y1="{c[1]-ny*1.6:.1f}" x2="{c[0]+nx*1.6:.1f}" y2="{c[1]+ny*1.6:.1f}" stroke="#7a1d10" stroke-width=".7"/>'
        return o
    s += tick(A, M, 1) + tick(M, C, 1) + tick(B, N, 2) + tick(N, C, 2)
    for P in (A, B, C, M, N): s += f'<circle cx="{P[0]:.1f}" cy="{P[1]:.1f}" r="1" fill="{ink}"/>'
    lab = lambda P, t, ox, oy: f'<text x="{P[0]+ox:.1f}" y="{P[1]+oy:.1f}" text-anchor="middle" font-family="Hahmlet" font-weight="800" font-size="4.6" fill="{ink}">{t}</text>'
    return s + lab(A, 'A', -3.5, -1) + lab(B, 'B', -3.5, 4) + lab(C, 'C', 3, 4) + lab(M, 'M', 3.5, -1) + lab(N, 'N', -1, 5.5)
def side81():
    ink = '#ffe9a8'; s = ''
    T = (25, 31); K = (55, 42); W = 70
    for y in (36, 47):
        s += f'<line x1="{T[0]}" y1="{T[1]}" x2="{W}" y2="{T[1] + (y-31)*1.5:.1f}" stroke="{ink}" stroke-width=".5" stroke-dasharray="1.4 1" opacity=".9"/>'
    def dim(x1, x2, y, t):
        return (f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{ink}" stroke-width=".7"/><line x1="{x1}" y1="{y-1.5}" x2="{x1}" y2="{y+1.5}" stroke="{ink}" stroke-width=".7"/>'
                f'<line x1="{x2}" y1="{y-1.5}" x2="{x2}" y2="{y+1.5}" stroke="{ink}" stroke-width=".7"/>' + pen((x1+x2)/2, y-1.8, t, 6, 'middle', col=ink))
    s += dim(T[0], K[0], 84, '2뼘') + dim(T[0], W, 13, '3뼘')
    s += pen(T[0], 47, '횃불걸이', 4.8, 'middle', col=ink) + pen(K[0], 35, '열쇠걸이', 4.8, 'middle', col=ink) + pen(W+7, 52, '벽', 5.4, 'middle', col=ink)
    return s
