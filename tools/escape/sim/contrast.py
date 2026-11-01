import json
from PIL import Image
im=Image.open('/tmp/claude-0/escape/sim/_a.png').convert('RGB');W,H=im.size
els=json.load(open('/tmp/claude-0/escape/sim/_a.json'))
def L(c):
    f=lambda v:(v/255)/12.92 if v/255<=.03928 else ((v/255+.055)/1.055)**2.4
    return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])
def cr(a,b):
    x,y=L(a),L(b);return (max(x,y)+.05)/(min(x,y)+.05)
bad=[]
for e in els:
    x0,y0,x1,y1=int(e['x']),int(e['y']),int(e['x']+e['w']),int(e['y']+e['h'])
    px=[im.getpixel((min(W-1,max(0,x)),min(H-1,max(0,y)))) for x in range(x0,x1,2) for y in range(y0,y1,2)]
    if not px: continue
    fg=tuple(e['fg'][:3])
    # 배경 = 글자색과 가장 먼 쪽 픽셀들의 중앙값(글자 픽셀 제외)
    px.sort(key=lambda c:-cr(c,fg)); bg=px[len(px)//2]
    c=cr(fg,bg); big=e['fs']>=24 or (e['fs']>=18.6 and e['fw']>=700); need=3 if big else 4.5
    if c<need or e['fs']<12: bad.append(f"{e['t']} [{e['fs']:.0f}px 대비 {c:.1f}]")
print(' | '.join(bad))
