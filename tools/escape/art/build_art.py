# 그림 카드 만들기: build.py의 카드 문장 + 그림 + 번호 위치
import re,os,math,html as H
src=open('/tmp/claude-0/escape/print/build.py',encoding='utf-8').read()
ns={}
exec(src.split("def front")[0],ns)   # COL, grid, V, cards, DIS, shapes, sail ...
cards,DIS=ns['cards'],ns['DIS']
ART='/tmp/claude-0/escape/art/'
import sys as _s;_s.path.insert(0,ART)
from texts import T,TALL
TYPE={'red':'red','blue':'blue','grey':'grey','green':'green','yellow':'yellow','pen':'pen','start':'start'}
# 그림 파일과 번호 위치 (원본 그림 기준 0~1)
SPEC={
 '시작':('a00.jpg',[('G',18,.40,.355),('G',49,.845,.06),('R',27,.74,.51),('B',23,.91,.21)]),
 '18':('a18.jpg',[]),'49':('a49.jpg',[('Y',94,.625,.47)]),'27':('a27.jpg',[]),'23':('a23.jpg',[]),
 '42':('a42b.jpg',[]),
 '35':('a35.jpg',[('R',40,.72,.42)]),'40':('a40.jpg',[]),
 '91':('a91c.jpg',[('G',96,.17,.30),('R',42,.33,.13),('G',2,.66,.22),('Gr',44,.33,.60),('R',59,.66,.60)]),
 '96':('a96.jpg',[]),'2':('a2.jpg',[]),'44':('a44c.jpg',[]),'4':('a4.jpg',[('B',14,.20,.52),('B',26,.55,.66)]),
 '14':('a14.jpg',[]),'26':('a26.jpg',[]),'85':('a85b.jpg',[]),'63':('a63.jpg',[]),'59':('a59.jpg',[]),'73':('a73.jpg',[]),'47':('a47.jpg',[]),
 '52':('a52.jpg',[]),'99':('a99.jpg',[]),
 '43':('a43.jpg',[('R',61,.52,.42)]),'86':('a86.jpg',[('B',38,.55,.42)]),'6':('a6.jpg',[]),'69':('a69.jpg',[]),'3':('a3.jpg',[]),'24':('a24.jpg',[]),'61':('a61.jpg',[]),'38':('a38.jpg',[]),'36':('a36.jpg',[]),'31':('a31.jpg',[]),'98':('a98.jpg',[]),

 '50':('a50.jpg',[('Gr',52,.37,.42),('B',5,.68,.55)]),'94':('a94b.jpg',[]),'58':('a58c.jpg',[]),
 '5':('a5.jpg',[]),'51':('a51.jpg',[]),'14':('a14.jpg',[]),'26':('a26.jpg',[]),
 '29':('a29b.jpg',[('R',31,.30,.13),('G',98,.12,.82),('G',24,.25,.58),('Gr',3,.43,.70),('Y',6,.66,.66)]),
 '연습 시작':('aP0.jpg',[('R',10,.2,.6),('B',20,.47,.74),('B',11,.82,.74)]),
 '연습 10':('aP10.jpg',[]),'연습 20':('aP20.jpg',[]),'연습 11':('aP11.jpg',[]),'연습 21':('aP21.jpg',[]),
 '연습 30':('aP30.jpg',[]),'연습 5':('aP5b.jpg',[]),'연습 X':('aPX.jpg',[]),'연습 9':('aP9.jpg',[]),
}
HID={}
ETCH={'58'}
def tagkind(n):
    for c in cards:
        if c[2]==str(n) and not c[0].startswith('연습'): return {'red':'R','blue':'B','green':'Gr','yellow':'Y'}.get(c[1],'G')
    return 'G'
def sail_svg():
    A=(250,22);L=(135,415);R=(365,415);r=105
    def u(P):
        dx,dy=P[0]-A[0],P[1]-A[1];d=math.hypot(dx,dy);return (A[0]+dx/d*r,A[1]+dy/d*r)
    p1,p2=u(L),u(R)
    return f'''<svg viewBox="0 0 500 500" preserveAspectRatio="xMidYMin slice"><line x1="{A[0]}" y1="{A[1]}" x2="{L[0]}" y2="{L[1]}" stroke="#7a1d10" stroke-width="3.5" stroke-dasharray="10 6" opacity=".85"/><line x1="{A[0]}" y1="{A[1]}" x2="{R[0]}" y2="{R[1]}" stroke="#7a1d10" stroke-width="3.5" stroke-dasharray="10 6" opacity=".85"/><path d="M{p1[0]:.1f},{p1[1]:.1f} A{r},{r} 0 0 0 {p2[0]:.1f},{p2[1]:.1f}" fill="none" stroke="#c62828" stroke-width="5"/><rect x="215" y="140" width="70" height="36" rx="6" fill="#fbf3dc" stroke="#7a1d10" stroke-width="2.5"/><text x="250" y="166" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="900" font-size="25" fill="#7a1d10">40°</text><g stroke="#7a1d10" stroke-width="3.5"><line x1="184" y1="214" x2="198" y2="222"/><line x1="302" y1="222" x2="316" y2="214"/></g></svg>'''
INK94='''<svg viewBox="0 0 120 170" style="width:100%;height:100%"><g fill="none" stroke="#5a3a1a" stroke-width="1.6" stroke-linejoin="round"><rect x="12" y="8" width="26" height="26"/><rect x="66" y="12" width="44" height="22"/><polygon points="25,53 45,64 25,75 5,64"/><polygon points="72,52 112,52 102,76 62,76"/><polygon points="40,110 80,110 96,136 24,136"/></g><g font-family="Noto Sans CJK KR" font-size="8.5" font-weight="700" fill="#5a3a1a" text-anchor="middle"><text x="25" y="44">정사각형</text><text x="88" y="44">직사각형</text><text x="25" y="91">마름모</text><text x="87" y="91">평행사변형</text><text x="60" y="150">등변사다리꼴</text></g></svg>'''
OVER={'42':sail_svg(),'94':f'<div style="position:absolute;left:59%;top:6%;width:37%;height:86%;z-index:2;transform:rotate(-1deg)">{INK94}</div>'}

def SV(inner): return f'<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMin slice">{inner}</svg>'
OVER['58']=SV('<text x="64.6" y="45.6" text-anchor="middle" font-family="Hahmlet" font-weight="800" font-size="3.9" fill="#4a2f0c" opacity=".85">51</text><text x="64.6" y="45.85" text-anchor="middle" font-family="Hahmlet" font-weight="800" font-size="3.9" fill="none" stroke="rgba(255,230,170,.35)" stroke-width=".15">51</text>')
OVER['연습 30']=SV('<text x="61" y="50" text-anchor="middle" font-family="Hahmlet" font-weight="700" font-size="4.2" fill="#3a4a6a" opacity=".8" transform="rotate(-22 61 50)">5</text>')
OVER['29']=SV('<g transform="rotate(-18 36 71)"><rect x="35.3" y="61" width="1.4" height="8" fill="#7a4a1e" stroke="#3b2a12" stroke-width=".3"/><rect x="33.8" y="60" width="4.4" height="1.4" rx=".5" fill="#7a4a1e" stroke="#3b2a12" stroke-width=".3"/><path d="M33.4 69 L38.6 69 L38 73.5 Q36 76 34 73.5 Z" fill="#9aa3a8" stroke="#3b2a12" stroke-width=".35"/></g>')
OVER['연습 5']=SV(open(ART+'wellov.txt').read())
#OVER['2']=SV('<g stroke="#7a1d10" stroke-width=".7" fill="none"><line x1="8" y1="66" x2="8" y2="80" stroke-dasharray="1.5 1"/><line x1="88" y1="64" x2="88" y2="80" stroke-dasharray="1.5 1"/><line x1="9" y1="78" x2="87" y2="78"/><path d="M11 76.3 L8.6 78 L11 79.7 M85 76.3 L87.4 78 L85 79.7"/></g><rect x="40" y="74.2" width="20" height="7.6" rx="1.2" fill="#fbf3dc" stroke="#7a1d10" stroke-width=".5"/><text x="50" y="80" text-anchor="middle" font-family="Hahmlet" font-weight="800" font-size="5.6" fill="#7a1d10">12m</text>')
OVER['연습 X']=SV(''.join(f'<text x="{x}" y="20.5" text-anchor="middle" font-family="Hahmlet" font-weight="800" font-size="7" fill="#7a1d10" transform="rotate(-3 {x} 20.5)">{d}</text>' for x,d in [(23.5,'0'),(42.5,'1'),(64.5,'2'),(87,'4')]))
OVER['24']=SV('<g transform="rotate(4 53 32)"><rect x="14" y="15" width="78" height="37" rx="2" fill="#f4e4bc" opacity=".82"/><g font-family="Hahmlet" font-weight="800" fill="#3b1f0a" text-anchor="middle"><text x="53" y="23.5" font-size="5">섬은 직각삼각형</text><text x="53" y="32" font-size="4.6">해안 길 6km · 8km · 10km</text><text x="53" y="40.5" font-size="4.6">넓이 24km²</text><text x="53" y="48.5" font-size="3.9">둥근 호수는 세 해안 길에 모두 접한다</text></g></g>')
OVER['52']=SV('<g stroke="#5a3a1a" stroke-width=".8" fill="none"><line x1="22" y1="72" x2="58" y2="72"/><line x1="58" y1="72" x2="72" y2="44"/></g><g fill="#7a1d10"><circle cx="22" cy="72" r="1.6"/><circle cx="58" cy="72" r="1.6"/><circle cx="72" cy="44" r="1.6"/></g><g font-family="Hahmlet" font-weight="800" font-size="5.5" fill="#5a3a1a"><text x="16" y="80">A</text><text x="57" y="80">B</text><text x="74" y="43">C</text></g>')
OVER['36']='<div style="position:absolute;inset:0;background:#2a1d0e;z-index:2"></div><div style="position:absolute;left:50%;top:50%;width:86%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:url(/tmp/claude-0/escape/art/a29b.jpg) center/100%;border:1.6mm solid #b8903f;outline:.5mm solid #3b2a12;z-index:3"></div>'
W,AH=70,64
def pos(x,y): return x*100, y*W/AH*100   # 가로 맞춤, 위 기준
SVGART={'연습 5'}
PANEL=set()
DROP={'94','42'}
def split_svg(body):
    m=re.search(r'<svg.*?</svg>(<div style="font-size[^"]*">.*?</div>)?',body,flags=re.S)
    return (body[:m.start()]+body[m.end():], m.group(0)) if m else (body,'')
def clean(body):
    body=re.sub(r'<div class="vis">.*?</div>','',body,flags=re.S)
    body=re.sub(r'<div class="hid".*?</div>','',body,flags=re.S)
    body=re.sub(r'<div class="sus">앞치마에 갈매기 자수</div>','',body,flags=re.S)
    return body
CSS=open(ART+'c3.html',encoding='utf-8').read().split('<style>')[1].split('</style>')[0]
CSS+='''.tall .art{height:50mm}.tall .cap{top:54mm}.rl{min-height:6.4mm;display:flex;align-items:center;gap:1mm}.rl .tag{flex:none;margin:0}.cap{overflow:hidden}.pen{--c:#5d4037;--d:#2b1d18}.sus{margin-top:1mm;font-size:2.4mm;color:#6b5330;font-style:italic}
.hidn{position:absolute;font:700 2.6mm "DejaVu Sans Mono",monospace;color:rgba(40,25,10,.8);z-index:2}
.hidn.etch{font:700 3.6mm 'DejaVu Sans Mono',monospace;color:#2a1a0e;text-shadow:0 .18mm 0 rgba(210,170,120,.55),0 -.1mm 0 rgba(0,0,0,.6);transform:rotate(-4deg);letter-spacing:.2mm}
.tx svg{max-width:100%;height:auto}
.no.s{font:900 2.6mm/12.5mm "Noto Sans CJK KR",sans-serif;letter-spacing:-.1mm}
.sheet{display:grid;grid-template-columns:repeat(3,70mm);grid-auto-rows:99mm;gap:0;width:210mm;padding:0;page-break-after:always}
.card{outline:.2mm dashed #aaa;outline-offset:0;box-shadow:none}
.back{background:radial-gradient(circle at 50% 45%,#1d2a40,#070b16 75%);color:#ffe9a8;display:flex;flex-direction:column;align-items:center;justify-content:center}
.back .rose{width:34mm;height:34mm;border-radius:50%;border:1.2mm solid #c9a55a;display:flex;align-items:center;justify-content:center;font:900 13mm "DejaVu Sans Mono",monospace;box-shadow:0 0 0 1.2mm #0d1a2e,0 0 0 1.6mm #c9a55a}
.back .bt{font-family:"Noto Serif CJK KR",serif;font-weight:900;font-size:4.2mm;letter-spacing:1mm;margin-top:5mm;color:#c9a55a}
.back.p{background:radial-gradient(circle at 50% 45%,#3b5d3a,#132313 75%)}
.ti{font-family:"Hahmlet",serif!important;font-weight:800!important}.tx,.sus{font-family:"Gowun Dodum",sans-serif!important}
.no{font-family:"Hahmlet",serif!important;font-weight:800!important}.no.s{font:800 5.4mm/12.5mm "Hahmlet",serif!important;letter-spacing:-.3mm!important}
.bk2 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.bk2 .bv{position:absolute;inset:0;background:radial-gradient(circle,transparent 35%,rgba(0,0,0,.35))}
.bk2 .bw{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26mm;height:26mm;border-radius:50%;background:radial-gradient(circle at 45% 40%,#fbf3dc,#ead6a4);box-shadow:0 0 0 1.2mm #c9a55a,0 0 0 1.9mm #3a2a0e,0 1.5mm 4mm rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;color:#3b2a12;font:800 12mm "Hahmlet",serif}
.bk2 .bw.s{font-size:9mm;letter-spacing:-.4mm}
.tag.Y{color:#3b2a12!important}
.no{left:3.2mm!important;top:2.6mm!important}.dis{top:1.4mm!important;right:3.4mm!important}.dis span{isolation:isolate;color:#1f1f1f!important;text-shadow:0 0 .25mm #e9e2cf,0 0 .25mm #e9e2cf,0 0 .5mm #e9e2cf,0 0 .5mm #e9e2cf}.dis span:after{z-index:-1}/* 2026-11-03 선생님 결정: 빨간 줄은 그대로, 숫자를 줄 위로 올려 가리지 않게 */.bk2 .bw{top:46.3%!important;width:19mm!important;height:19mm!important;background:#fbf6ea!important;box-shadow:0 0 0 .6mm #3e2818!important;color:#3e2818!important;font-size:10.5mm!important}.bk2 .bw.s{font-size:7mm!important;letter-spacing:-.3mm}.bk2 .bv{display:none}/* 2026-11-03 새 뒷면(아이보리 잉크 선 나침반, 번호 동그라미 19mm) */
.bk2.pk .bw{background:radial-gradient(circle at 45% 40%,#ffffff,#dcdcdc)!important;box-shadow:0 0 0 1.2mm #a9a9a9,0 0 0 1.9mm #333,0 1.5mm 4mm rgba(0,0,0,.6)!important;color:#2b2b2b!important}
.rulebox{position:absolute;left:3mm;right:3mm;top:15mm;bottom:3mm;border-radius:1.6mm;padding:2.2mm 2.8mm;color:#3b2a12;background:linear-gradient(180deg,#f3e2b6,#e6cf96);font-family:"Gowun Dodum",sans-serif;font-size:3mm;line-height:1.3;overflow:hidden}.rulebox .ti{font-size:4mm!important;margin-bottom:.5mm}
.rt{border-collapse:collapse;width:100%;margin-top:1.5mm;font-size:3mm}.rl2{font-size:3mm}.rt td{padding:.6mm 0;vertical-align:middle;border-bottom:.2mm dashed #b99a62}
.rt td.ic{width:16mm;white-space:nowrap}.rt .tag{position:relative;display:inline-block;margin:0 .6mm 0 0;left:auto;top:auto;vertical-align:middle}
.rl2{margin-top:.9mm}.rt .tag{transform:scale(.85)}.rt .tag.R{transform:rotate(45deg) scale(.85)}
.tico{position:absolute;right:2.6mm;top:1.3mm;width:7.6mm;height:7.6mm;border-radius:50%;background:#fbf3dc;display:flex;align-items:center;justify-content:center;font-size:4.3mm;z-index:4;box-shadow:0 0 0 .5mm #c9a55a}
.card:has(.tico) .dis{right:11.8mm!important}
@page{size:A4;margin:0}body{margin:0!important;padding:0!important;background:#fff!important;display:block!important}.sheet{width:210mm;height:297mm;box-sizing:border-box;padding:0 0 0 0;align-content:start;justify-content:center;page-break-after:always;break-after:page;overflow:hidden}'''
RULE='''<div class="card start"><div class="stripe"></div><div class="no s">규칙</div>
<div class="rulebox"><div class="ti">놀이 규칙</div>
<table class="rt">
<tr><td class="ic"><span class="tag R"><i>12</i></span><span class="tag B"><i>33</i></span></td><td><b>빨강+파랑</b> = 더한 번호(45)</td></tr>
<tr><td class="ic"><span class="tag Gr"><i>70</i></span></td><td><b>기계</b>: ⚙️에 번호</td></tr>
<tr><td class="ic"><span class="tag Y"><i>81</i></span></td><td><b>자물쇠</b>: 🔒에 4자리</td></tr>
<tr><td class="ic"><span class="tag G"><i>16</i></span></td><td><b>장소·단서</b>: 펼쳐요</td></tr>
<tr><td class="ic"><span class="dis" style="position:static;display:inline-flex"><span>7</span></span></td><td>줄 그은 번호: 치워요</td></tr>
</table>
<div class="rl2">🔍 그림 속 숨은 번호</div>
<div class="rl2">⏳ 벌점 카드: 누르고 그 카드만 버려요</div>
<div class="rl2">💡 막히면 카드 번호로 힌트</div>
<div class="rl2">🏁 마지막 카드 번호로 탈출</div>
</div></div>'''
TICON={'green':'⚙️','yellow':'🔒','pen':'⏳'}
def front(c):
    if c[0]=='규칙': return RULE
    bl,t,n,ti,body=c
    if bl in T:
        svgkeep=re.search(r'<svg.*?</svg>(<div style="font-size[^"]*">.*?</div>)?',body,flags=re.S)
        ti,body=T[bl][0],T[bl][1]+(svgkeep.group(0) if svgkeep else '')
    cls=TYPE[t]; img,tags=SPEC.get(bl,(None,[]))
    nocls='s' if re.search('[가-힣]',n) else ''
    dis=DIS.get(bl,'')
    disl=[x.strip() for x in re.split('[,]',dis)] if dis and re.match(r'^[\dX, ]+$',dis) else []
    d=''.join(f'<span>{x}</span>' for x in disl)
    body,svg=split_svg(body) if img else (body,'')
    if svg and bl in SVGART: OVERX=f'<div style="position:absolute;inset:8% 8%;display:flex;align-items:center;justify-content:center;z-index:2">{svg}</div>'
    elif svg and bl in PANEL: OVERX=f'<div style="position:absolute;left:4%;right:4%;bottom:3%;height:50%;flex-direction:column;font-size:2.6mm;color:#3b2a12;background:rgba(251,243,220,.93);border-radius:1.5mm;display:flex;align-items:center;justify-content:center;z-index:2;box-shadow:0 1mm 2mm rgba(0,0,0,.4)">{svg}</div>'
    else: OVERX=''
    inner=OVER.get(bl,'')+OVERX+''.join(f'<div class="tag {k}" style="left:{pos(x,y)[0]:.1f}%;top:{pos(x,y)[1]:.1f}%"><i>{num}</i></div>' for k,num,x,y in tags)
    if bl in HID: h=HID[bl];inner+=f'<div class="hidn{" etch" if bl in ETCH else ""}" style="left:{pos(h[1],h[2])[0]:.1f}%;top:{pos(h[1],h[2])[1]:.1f}%">{h[0]}</div>'
    extra='' if disl or not dis else f'<div class="sus">🗑 {dis}</div>'
    art=f'<div class="art"><img src="{ART+img}">{inner}</div>' if img else '<div class="art" style="background:#0d1a2e"></div>'
    ic=TICON.get(t,'')
    return f'<div class="card {cls}{" tall" if bl in TALL else ""}"><div class="stripe"></div>{"<div class=tico>"+ic+"</div>" if ic else ""}<div class="no {nocls}">{H.escape(n)}</div>{"<div class=dis>"+d+"</div>" if d else ""}{art}<div class="cap"><div class="ti">{ti}</div><div class="tx">{clean(body)}{extra}</div></div></div>'
def back(c):
    bl=c[0];p=bl.startswith('연습') or bl=='규칙';lab=('연습' if bl=='연습 시작' else bl.replace('연습 ','')) if bl.startswith('연습') else bl
    img=ART+('aback_practice.jpg' if p and os.path.exists(ART+'aback_practice.jpg') else 'aback.jpg')   # 2026-11-03 새 뒷면: 연습·규칙은 바늘을 칠하지 않은(갈색 잉크) 나침반, 본게임은 빨간 바늘
    p=p and not os.path.exists(ART+'aback_practice.jpg')   # 새 뒷면이 있으면 세피아 필터는 쓰지 않음
    small=' s' if re.search('[가-힣]',lab) else ''
    return f'<div class="card bk2"><img src="{img}"{" style=\"filter:sepia(.9) saturate(1.3) brightness(1.25) contrast(.9)\"" if p else ""}><div class="bv"></div><div class="bw{small}">{H.escape(lab)}</div></div>'
if __name__=='__main__':
    import sys
    only=[c for c in cards if c[0] in SPEC] if 'preview' in sys.argv else cards
    pages=''
    for i in range(0,len(only),9):
        grp=only[i:i+9]
        pages+='<div class="sheet">'+''.join(front(c) for c in grp)+'</div>'
        bk=[back(c) for c in grp]+['<div></div>']*(9-len(grp))
        rows=[bk[j:j+3][::-1] for j in range(0,9,3)]   # 긴 쪽 넘김: 좌우 뒤집기
        if 'preview' not in sys.argv: pages+='<div class="sheet">'+''.join(sum(rows,[]))+'</div>'
    FONTLINKS='<link rel="stylesheet" href="file:///tmp/claude-0/escape/fonts/fontsource-hahmlet-5.3.0/package/700.css"><link rel="stylesheet" href="file:///tmp/claude-0/escape/fonts/fontsource-hahmlet-5.3.0/package/800.css"><link rel="stylesheet" href="file:///tmp/claude-0/escape/fonts/fontsource-gowun-dodum-5.3.0/package/400.css">'
    FIT='<script>document.fonts.ready.then(()=>{for(const c of document.querySelectorAll(".cap")){let f=3.05;const tx=c.querySelector(".tx");while(c.scrollHeight>c.clientHeight+1&&f>2.1){f-=.1;tx.style.fontSize=f+"mm"}}})</script>'
    TEACH=src.split("teacher='''")[1].split("'''")[0]+src.split("<div class=\"sheet\"><h1>인쇄 안내</h1>")[0][-0:0]
    guide=src.split("<div class=\"sheet\"><h1>인쇄 안내</h1>")[1].split("'''")[0]
    tcss=ns.get('css','')
    pages+=TEACH.replace('<div class="sheet">','<div class="tsheet">')
    open(ART+'out/cards_art.html','w',encoding='utf-8').write(f'<html><head><meta charset="utf-8">{FONTLINKS}<style>{CSS}\n.tsheet{{padding:10mm 12mm;font-size:9.5pt;page-break-before:always}}.tsheet table{{border-collapse:collapse;width:100%;font-size:8pt}}.tsheet td,.tsheet th{{border:1px solid #999;padding:3px;vertical-align:top}}</style></head><body>{pages}{FIT}</body></html>')
    print(len(only),'cards')

# 흐린 그림자 없애기 (PDF에서 네모 상자로 찍힘)
if __name__=='__main__':
    p=ART+'out/cards_art.html';h=open(p,encoding='utf-8').read()
    # CUTLAYOUT: 프린터 여백 확보 + 또렷한 점선
    import sys,os;sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'));from cutlayout import cut_css_js
    _c,_j=cut_css_js('#f4dfc1');h=h.replace('</head>',_c+'</head>');h=h.replace('</body>',_j+'</body>')
    h=re.sub(r',\s*0 [\d.]+mm [\d.]+mm rgba\(0,0,0,[\d.]+\)','',h)
    h=re.sub(r'box-shadow:\s*0 [\d.]+mm [\d.]+mm rgba\(0,0,0,[\d.]+\)\s*;?','',h)
    h=re.sub(r'filter:drop-shadow\([^)]*\)','',h)
    h=re.sub(r'text-shadow:[^;"}]*[\d.]+mm [\d.]+mm [\d.]+mm[^;"}]*','text-shadow:none',h)
    open(p,'w',encoding='utf-8').write(h)
    print('blur left:',len(re.findall(r'\d+(\.\d+)?mm \d+(\.\d+)?mm rgba\(0,0,0',h)))
