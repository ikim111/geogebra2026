# 3회 주사위 그림(45·42)을 실제 주사위처럼 다시 그리기 — 2026-11-26 선생님 피드백(AI 그림의 눈 배치가 틀림)
# 보이는 세 면이 한 꼭짓점에서 만나는 실제 조합(1·2·3 / 4·5·6)만 쓴다.
PIPS = {1:[(.5,.5)], 2:[(.25,.25),(.75,.75)], 3:[(.25,.25),(.5,.5),(.75,.75)], 4:[(.25,.25),(.75,.25),(.25,.75),(.75,.75)],
        5:[(.25,.25),(.75,.25),(.5,.5),(.25,.75),(.75,.75)], 6:[(.25,.22),(.75,.22),(.25,.5),(.75,.5),(.25,.78),(.75,.78)]}
def die(cx, cy, s, top, left, right):
    k = .866*s
    T, R, C, L = (cx, cy-s), (cx+k, cy-s/2), (cx, cy), (cx-k, cy-s/2)
    B, BL, BR = (cx, cy+s), (cx-k, cy+s/2), (cx+k, cy+s/2)
    P = lambda pts: ' '.join(f'{x:.2f},{y:.2f}' for x, y in pts)
    out = f'<ellipse cx="{cx+1.2:.2f}" cy="{cy+s*1.02:.2f}" rx="{k*1.05:.2f}" ry="{s*.28:.2f}" fill="#000" opacity=".35"/>'
    faces = [((L, T, R, C), '#f8eedb', top), ((L, C, B, BL), '#e9d6b2', left), ((C, R, BR, B), '#d8c194', right)]
    for (a, b, c, d), col, n in faces:
        out += f'<polygon points="{P((a,b,c,d))}" fill="{col}" stroke="#5a3a1a" stroke-width=".45" stroke-linejoin="round"/>'
        for u, v in PIPS[n]:   # 면 위 점: a + u*(b-a) + v*(d-a)
            x = a[0] + u*(b[0]-a[0]) + v*(d[0]-a[0]); y = a[1] + u*(b[1]-a[1]) + v*(d[1]-a[1])
            r = s*(.13 if n == 1 else .085)
            out += f'<ellipse cx="{x:.2f}" cy="{y:.2f}" rx="{r:.2f}" ry="{r*(.62 if col=="#f8eedb" else .85):.2f}" fill="{"#b71c1c" if n==1 and col=="#f8eedb" else "#2b1a0c"}"/>'
    return out
