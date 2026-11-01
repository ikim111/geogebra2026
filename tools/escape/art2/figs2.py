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
