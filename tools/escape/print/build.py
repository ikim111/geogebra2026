import html
COL={'grey':('#757575','장소·단서'),'red':('#d32f2f','빨강 물건 · 파랑과 합쳐요'),'blue':('#1976d2','파랑 물건 · 빨강과 합쳐요'),
'green':('#2e7d32','초록 기계 · 디벗 ⚙️ 기계'),'yellow':('#f9a825','노랑 자물쇠 · 디벗 🔒 4자리'),'pen':('#5d4037','벌점'),'start':('#1a237e','시작')}
def grid(pts,w=200,h=150,xmax=9,ymax=6,torn=None,tri=None):
    u=min((w-24)/xmax,(h-20)/ymax); ox,oy=18,h-14
    P=lambda x,y:(ox+x*u,oy-y*u)
    s=f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
    for i in range(xmax+1): x,_=P(i,0); s+=f'<line x1="{x}" y1="{oy}" x2="{x}" y2="{oy-ymax*u}" stroke="#ccc"/><text x="{x-3}" y="{oy+11}" font-size="8">{i}</text>'
    for j in range(ymax+1): _,y=P(0,j); s+=f'<line x1="{ox}" y1="{y}" x2="{ox+xmax*u}" y2="{y}" stroke="#ccc"/><text x="{ox-11}" y="{y+3}" font-size="8">{j}</text>'
    if tri: s+='<polygon points="'+' '.join('%.1f,%.1f'%P(*p) for p in tri)+'" fill="none" stroke="#999" stroke-dasharray="3 2"/>'
    if torn:
        s+='<polyline points="'+' '.join('%.1f,%.1f'%P(*p) for p in torn)+'" fill="none" stroke="#333" stroke-width="2"/>'
    for nm,(x,y) in pts.items():
        X,Y=P(x,y); anc='end' if x>=xmax-2 else 'start'; dx=-5 if anc=='end' else 4; s+=f'<circle cx="{X}" cy="{Y}" r="3.5" fill="#c62828"/><text x="{X+dx}" y="{Y-5}" font-size="10" font-weight="700" text-anchor="{anc}">{nm}({x},{y})</text>'
    return s+'</svg>'
shapes='''<svg width="210" height="122" viewBox="0 0 210 122" font-size="9" font-weight="700">
<rect x="6" y="8" width="34" height="34" fill="none" stroke="#000" stroke-width="1.5"/><text x="18" y="54">①</text>
<rect x="52" y="14" width="50" height="26" fill="none" stroke="#000" stroke-width="1.5"/><text x="72" y="54">②</text>
<polygon points="135,6 155,25 135,44 115,25" fill="none" stroke="#000" stroke-width="1.5"/><text x="131" y="58">③</text>
<polygon points="170,40 182,10 206,10 194,40" fill="none" stroke="#000" stroke-width="1.5"/><text x="184" y="54">④</text>
<polygon points="40,108 56,72 92,72 108,108" fill="none" stroke="#000" stroke-width="1.5"/><text x="70" y="120">⑤</text>
</svg><div style="font-size:7.5pt;text-align:center">① 정사각형 ② 직사각형 ③ 마름모<br>④ 평행사변형 ⑤ 등변사다리꼴</div>'''
sail='<svg width="120" height="80"><polygon points="60,6 20,74 100,74" fill="#f3e5c0" stroke="#000" stroke-width="1.5"/><text x="50" y="26" font-size="11" font-weight="700">40°</text></svg>'
def V(*items): return '<div class="vis">'+''.join(f'<span><b>{n}</b> {t}</span>' for n,t in items)+'</div>'
cards=[
# (back label, type, number shown, title, body html)
('연습 시작','start','연습','선원 훈련소 우물가','본게임 전에 디벗 사용법을 하나씩 익혀요. 연습에서는 시간이 줄지 않아요.<br>빨강 카드와 파랑 카드의 숫자를 <b>더한 번호</b>의 카드를 찾아 펼쳐요.'+V((10,'양동이'),(20,'밧줄'),(11,'구멍 난 바가지'))),
('연습 10','red','10','양동이 (연습)','물을 길을 양동이. 무엇과 합쳐 볼까?'),
('연습 20','blue','20','밧줄 (연습)','튼튼한 밧줄. 양동이를 우물에 내릴 수 있겠다.'),
('연습 11','blue','11','구멍 난 바가지 (연습)','바닥에 구멍이 뚫린 바가지.'),
('연습 21','pen','21','벌점 (연습)','바가지로 물을 퍼 담았더니 다 샌다! 이런 카드가 <b>함정</b>이에요.<br>디벗 ⏳ <b>벌점</b>을 눌러 보세요. (연습이라 시간은 안 줄어요)'),
('연습 30','grey','30','우물에서 건진 쪽지 (연습)','양동이로 쪽지를 건졌다! "우물 지도를 찾아라."<br>카드 구석까지 잘 보세요. <b>숨은 번호</b>가 있어요. 못 찾겠으면 디벗 🔍 <b>숨은 번호</b>나 💡 <b>힌트</b>에 30을 넣어 보세요.<div class="hid" style="font-size:9pt;color:#555">5</div>'),
('연습 5','green','5','우물 지도 (연습)','<b>기계</b> 카드예요. 디벗 ⚙️ 기계에 <b>5</b>를 넣고, 지도에서 <b>(2, 3)</b> 점을 누르세요.'),
('연습 X','yellow','X','훈련 상자 (연습)','<b>자물쇠</b> 카드예요. 뚜껑에 깃발 네 개: <b>2 · 0 · 2 · 6</b><br>디벗 🔒 자물쇠에 넣으면 연습 끝! 본게임이 시작돼요.'),
('연습 9','grey','9','훈련 수료증',''),
('규칙','start','규칙','놀이 규칙',''),
('시작','start','시작','할아버지의 다락방','먼지 쌓인 다락방에서 낡은 물건들을 발견했다. 할아버지의 쪽지: "이 지도는 수학을 아는 사람만 끝까지 따라갈 수 있단다. 막히면 섬의 등대지기를 찾아가렴."'+V((18,'낡은 일기장'),(49,'벽의 액자'),(27,'나무 상자'),(23,'못에 걸린 열쇠'))),
('18','grey','18','선장의 일기','"보물 지도는 <b>마주 보는 두 쌍의 변이 서로 평행한</b> 종이였다. 모서리는 <b>A→B→C→D</b> 순서로 돈다." — 붉은 나침반'),
('49','grey','49','벽의 액자','젊은 할아버지와 등대지기 할머니의 사진. 액자가 살짝 들떠 있다. 뒤에 무언가 있다!'+V((94,'작은 금고'))+'<div class="sus">사진 구석에 작은 갈매기 그림</div>'),
('27','red','27','나무 상자','열쇠 구멍이 하나 있는 묵직한 나무 상자.'),
('23','blue','23','놋쇠 열쇠','낡은 놋쇠 열쇠. 다락방 상자의 열쇠다.'),
('50','grey','50','열린 상자','상자가 열렸다! 안에 귀퉁이가 찢긴 지도와 망원경이 있다.'+V((52,'찢어진 지도'),(5,'망원경'))),
('5','blue','5','망원경','멀리 있는 것을 볼 때 쓰자. 버리지 말고 가지고 있자!'),
('52','green','52','찢어진 지도','모서리 D가 찢겨 나갔다. D는 어디였을까?'+grid({'A':(1,1),'B':(6,1),'C':(8,5)},torn=[(2.0,3.0),(1,1),(6,1),(8,5),(4.4,5),(4.0,4.4),(3.6,4.7),(3.1,4.0),(2.6,4.2),(2.3,3.5),(2.0,3.0)])),
('94','yellow','94','작은 금고','할아버지의 쪽지: "아래 성질을 가진 사각형의 <b>개수</b>를 차례로 이어 4자리로."<br>❶ 두 대각선의 길이가 같다 ❷ 두 대각선이 수직이다<br>❸ 두 대각선이 서로를 이등분한다 ❹ 네 변의 길이가 같다'+shapes),
('58','grey','58','금고 속','금고가 열렸지만… 텅 비어 있다? 안쪽 벽에 긁힌 자국만 남아 있다.<div class="hid" style="font-size:9pt;color:#555">51</div>'),
('51','blue','51','배 열쇠','해적선 사다리의 쇠사슬을 여는 열쇠. 손잡이에 닻 무늬.'),
('35','grey','35','35번 부두','지도의 찢긴 귀퉁이에는 "35번 부두"라고 적혀 있었다. 낡은 해적선이 묶여 있다. 배로 오르는 사다리에 쇠사슬이 감겨 있다.'+V((40,'쇠사슬'))),
('40','red','40','쇠사슬','사다리를 꽁꽁 감은 녹슨 쇠사슬. 자물통이 달려 있다.'),
('91','grey','91','해적선 갑판','배에 올랐다! 갑판 위에 여러 가지가 보인다.'+V((96,'늙은 선원'),(42,'돛'),(2,'돛대'),(44,'선장실 문'),(59,'키 받침'))),
('96','grey','96','늙은 선원','"이 돛은 <b>두 옆변의 길이가 같지</b>. 섬으로 가려면 키를 돛 <b>아래 모서리 각</b>만큼 돌려야 해."'),
('42','red','42','삼각형 돛','꼭대기에 각도가 새겨져 있다.'+sail),
('2','grey','2','돛대(가운데 기둥)','돛대 꼭대기에서 갑판 양쪽으로 밧줄 두 개가 내려와 있다. <b>두 밧줄의 길이는 같고</b>, 돛대는 <b>두 밧줄 사이의 각을 똑같이 나눈다</b>. 갑판에 닿은 두 밧줄 끝 사이는 <b>12m</b>.'),
('44','green','44','선장실 문','문에 다이얼이 두 개 있다. ① <b>돛대</b>와 갑판이 이루는 각(°) ② 돛대 밑에서 <b>한쪽</b> 밧줄 끝까지의 거리(m)'),
('4','grey','4','선장실','선장의 책상 위에 물건이 두 개. 메모: "키 받침에는 <b>둥근 손잡이</b>를 끼워야 키가 돌아간다."'+V((14,'둥근 나무 손잡이'),(26,'녹슨 열쇠'))),
('14','blue','14','키 손잡이','둥근 나무 손잡이.'),
('26','blue','26','녹슨 열쇠','붉게 녹이 슨 커다란 열쇠. 어디에 쓰는 걸까?'),
('85','pen','85','벌점','키 받침에 녹슨 열쇠를 억지로 꽂았더니 뚝 부러졌다! 메모를 다시 읽어 보자. <b>⏳ 벌점!</b>'),
('63','pen','63','벌점','놋쇠 열쇠를 쇠사슬 자물통에 꽂았더니 걸려서 안 빠진다! 다락방 상자 열쇠였는데… <b>⏳ 벌점!</b>'),
('59','red','59','키 받침','배를 움직이는 키. 손잡이가 빠져 있어 돌릴 수 없다.'),
('73','green','73','나침반 키','키를 돌릴 수 있다! 몇 도 돌려야 할까?'),
('47','pen','47','벌점','망원경으로 돛 <b>꼭대기 각</b>만 보고 그만큼 키를 돌리려다 배가 기울었다! 꼭대기 각과 아래 모서리 각은 달라요. <b>⏳ 벌점!</b>'),
('29','grey','29','세 등대 섬','드디어 섬에 도착했다! 섬은 세 모서리에 등대가 하나씩 서 있는 삼각형 모양이다.'+V((98,'등대지기 할머니'),(24,'해안 안내판'),(31,'세 등대'),(3,'삽'),(6,'보트 대여소'))),
('98','grey','98','등대지기 할머니','"왔구나. 길을 잃으면 나를 부르렴. 이 섬에선 모든 게 <b>같은 거리</b>로 통한단다."'+'<div class="sus">앞치마에 갈매기 자수</div>'),
('31','red','31','세 등대','멀리 섬의 세 모서리에 등대가 보인다. 자세히 보려면…? (끝까지 가지고 있자)'),
('36','grey','36','망원경으로 본 등대','등대 위치가 보인다. 바위에 새긴 글: "지도 조각은 <b>세 등대에서 모두 같은 거리</b>인 곳에 묻었다."'+grid({'P':(0,0),'Q':(8,0),'R':(0,6)},tri=[(0,0),(8,0),(0,6)],ymax=6)),
('3','green','3','삽','어디를 파 볼까?'),
('43','grey','43','묻힌 상자','상자 안에서 지도 조각 하나를 찾았다!'+V((61,'지도 조각 ①'))),
('61','red','61','지도 조각 ①','지도의 한 조각. 다른 조각과 맞춰 보자.'),
('24','grey','24','해안 안내판','섬은 <b>직각삼각형</b>, 해안 길은 <b>6km · 8km · 10km</b>, 넓이는 <b>24km²</b>.<br>섬 한가운데에는 <b>세 해안 길에 모두 닿는 둥근 호수</b>가 있고, 호수 한가운데에 작은 섬이 있다.'),
('6','yellow','6','보트 대여소','"호숫가 어디서 출발해도 가운데 섬까지 거리는 같다오. 그 거리를 <b>m</b>로 말하면, 딱 그 길이의 밧줄을 보트에 매어 주지." (4자리)'),
('86','grey','86','호수 가운데 섬','작은 섬 바위 틈에서 지도 조각을 찾았다!'+V((38,'지도 조각 ②'))),
('38','blue','38','지도 조각 ②','지도의 한 조각. 다른 조각과 맞춰 보자.'),
('69','pen','69','벌점','조각②를 들고 등대로 달려갔다. 그런데 호수 섬에서 세 등대까지 거리가 다 다르다! 호수는 <b>등대</b>가 아니라 <b>해안 길</b>에서 같은 거리였지. <b>⏳ 벌점!</b>'),
('99','grey','99','지도 완성!','조각을 맞추자 지도가 완성되고, 섬 안쪽 <b>동굴</b> 표시가 드러났다!<br>지도 뒷면에 붙은 편지 조각: "너희보다 하루 먼저 출발한다. — 검은 갈매기"<br><br>🎉 디벗 🏁 <b>탈출</b>에 <b>99</b>를 넣으세요!<br>다음 회: 「강을 건너, 동굴로」'),
]
DIS={'연습 X':'30, 5','연습 9':'X','연습 30':'10, 20','50':'27','35':'52, 50, 18','58':'94, 49','91':'23, 35, 40, 51, 58','4':'2, 44','73':'4, 14, 26, 59','29':'73, 91, 96, 42','36':'5','43':'3, 36','86':'6, 24'}
def front(c):
    bl,t,n,title,body=c; col,lab=COL[t]
    if bl in DIS: body+=f'<div class="dis">🗑 버리세요: {DIS[bl]}</div>'
    return f'<div class="card"><div class="band" style="background:{col}"><span class="no">{html.escape(n)}</span><span class="lab">{lab}</span></div><div class="ti">{title}</div><div class="bd">{body}</div><div class="ft">붉은 나침반 1회</div></div>'
def back(c):
    bl=c[0]; fs='18pt' if len(bl)>3 else '30pt'; return f'<div class="card bk"><div class="bt">붉은 나침반</div><div class="bn" style="font-size:{fs}">{html.escape(bl)}</div><div class="bt2">1회 · 찢어진 지도</div></div>'
css='''@page{size:A4;margin:0} body{margin:0;font-family:"Noto Sans CJK KR",sans-serif}
.page{width:210mm;height:297mm;display:grid;grid-template-columns:repeat(3,63mm);grid-template-rows:repeat(3,88mm);justify-content:center;align-content:center;page-break-after:always}
.card{width:63mm;height:88mm;box-sizing:border-box;border:0.3mm dashed #999;padding:2.5mm;position:relative;overflow:hidden;font-size:8.6pt;line-height:1.35}
.band{display:flex;align-items:center;gap:2mm;color:#fff;border-radius:2mm;padding:1.2mm 2mm;margin-bottom:1.5mm}
.no{font-size:17pt;font-weight:900;background:#fff;color:#222;border-radius:1.5mm;padding:0 2mm;min-width:8mm;text-align:center}
.lab{font-size:7pt;font-weight:700}
.ti{font-size:11pt;font-weight:900;margin-bottom:1mm}.bd svg{display:block;margin:1mm auto 0;max-width:100%}
.vis{display:flex;flex-wrap:wrap;gap:1mm;margin-top:1.5mm}.vis span{border:0.3mm solid #333;border-radius:3mm;padding:0.3mm 1.5mm;font-size:8pt}.vis b{font-size:9pt}
.dis{margin-top:1.5mm;font-size:8pt;font-weight:700;color:#c62828;border-top:1px dashed #c62828;padding-top:1mm}
.sus{margin-top:1.5mm;font-size:7.5pt;color:#555;font-style:italic}
.hid{position:absolute;right:4mm;bottom:7mm;font-size:6pt;color:#888}
.ft{position:absolute;bottom:1.5mm;right:2.5mm;font-size:6pt;color:#aaa}
.bk{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;color:#1a237e;border:0.3mm dashed #999}
.bn{font-size:30pt;font-weight:900;color:#1a237e;border:0.8mm double #1a237e;text-align:center;line-height:1.05;border-radius:50%;width:34mm;height:34mm;display:flex;align-items:center;justify-content:center}
.bt{font-size:9pt;letter-spacing:1mm;margin-bottom:4mm}.bt2{font-size:7pt;margin-top:4mm;color:#888}
.sheet{width:210mm;padding:14mm;box-sizing:border-box;font-size:10pt;line-height:1.5;page-break-after:always}
.sheet h1{font-size:16pt;margin:0 0 3mm;color:#1a237e}.sheet h2{font-size:12pt;margin:4mm 0 2mm;color:#1a237e}
table{border-collapse:collapse;width:100%;font-size:9pt}td,th{border:0.3mm solid #999;padding:1.2mm;vertical-align:top}th{background:#eee}'''
pages=[]
for i in range(0,len(cards),9):
    grp=cards[i:i+9]; grp+= [None]*(9-len(grp))
    pages.append('<div class="page">'+''.join(front(c) if c else '<div class="card" style="border:none"></div>' for c in grp)+'</div>')
    rows=[grp[r*3:r*3+3][::-1] for r in range(3)]  # 긴 쪽 넘김 양면: 좌우 뒤집기
    pages.append('<div class="page">'+''.join(back(c) if c else '<div class="card" style="border:none;background:none"></div>' for row in rows for c in row)+'</div>')
teacher='''<div class="sheet"><h1>1회 「찢어진 지도」 선생님 정답표</h1>
<p>🔗 연습 <a href="https://geogebra2026.vercel.app/escape0.html">geogebra2026.vercel.app/escape0.html</a> · 1회 <a href="https://geogebra2026.vercel.app/escape1.html">geogebra2026.vercel.app/escape1.html</a><br>모둠 디벗이 답을 확인해요. 이 표는 선생님이 돌아다니며 도와줄 때 보는 정답표예요. 디벗이 안 될 때는 선생님이 디벗 역할을 해요. 초록(기계)·노랑(자물쇠) 카드에서 학생이 답을 말하면 아래대로 답해 주세요. 틀린 답은 <b>1분 벌점</b>. 힌트는 카드 번호를 말하면 1단계 → 2단계 → 3단계(정답, 힌트 2번으로 셈) 순서로.</p>
<table><tr><th>카드</th><th>정답 → 줄 카드</th><th>틀린 답 반응 (−1분)</th><th>힌트 1</th><th>힌트 2</th></tr>
<tr><td>연습</td><td>10+11=21 함정(⏳) → 10+20=30 → 쪽지의 숨은 5 → 5 기계 (2,3) → X 자물쇠 0124(삐삐: 영원히 사랑해) → 9 → 🏁 탈출에 9</td><td>연습은 시간이 안 줄어요</td><td>쪽지를 자세히 보세요</td><td>쪽지 위 작은 숫자 5</td></tr>
<tr><td>52 지도</td><td><b>D(3, 5)</b> → 35</td><td>그 밖의 점: "마주 보는 변이 평행하지 않아요"</td><td>AB와 DC는 평행하고 길이가 같아요</td><td>B에서 C로 간 만큼 A에서도 똑같이 가 보세요</td></tr>
<tr><td>94 금고</td><td><b>3242</b> → 58</td><td>2242: "하나를 빠뜨렸어요. 사다리꼴을 다시 보세요"<br>4242: "마름모는 두 대각선의 길이가 달라요"<br>그 밖: "이 비밀번호로 열리는 자물쇠가 없어요" (어느 자리가 틀렸는지는 비밀)</td><td>사각형마다 네 성질을 하나씩 따져 보세요</td><td>❶은 정사각형·직사각형 말고 하나 더 있어요</td></tr>
<tr><td>58 금고 속</td><td>(금고 안 꼬리표의 숨은 번호 51 → 51번 카드)</td><td>—</td><td>금고 안쪽 벽에 무언가 걸려 있어요</td><td>꼬리표를 자세히 보세요</td></tr>
<tr><td>44 도르래</td><td>다이얼 <b>90° · 6m</b> → 4</td><td>70°: "70°는 돛의 밑각이에요. 지금은 돛대가 갑판과 이루는 각"<br>12m: "12m는 두 밧줄 끝 사이 전체 거리예요"</td><td>이등변삼각형의 꼭지각을 이등분하는 선의 성질은?</td><td>밑변을 수직이등분해요 → 90°, 12÷2</td></tr>
<tr><td>73 나침반</td><td><b>70°</b> → 29</td><td>40: "꼭지각만큼 돌렸더니 배가 제자리에서 빙글…"<br>140: "두 밑각을 더한 만큼 돌려서 너무 돌았어요"</td><td>이등변삼각형의 두 밑각은 같아요</td><td>(180 − 40) ÷ 2</td></tr>
<tr><td>3 삽</td><td><b>(4, 3)</b> → 43</td><td>(2,2): "세 해안 길에서는 같은 거리지만 등대에서는 아니에요" (내심과 혼동)<br>(3,2): "가운데쯤이지만 거리가 같지 않아요" (무게중심)<br>(4,0)·(0,3): "두 등대에서만 같은 거리예요"</td><td>세 점에서 같은 거리인 점은? 외심!</td><td>직각삼각형의 외심은 어디에 있었죠? (빗변의 중점)</td></tr>
<tr><td>6 보트</td><td><b>2000</b> → 86</td><td>5000: "그건 세 등대까지 거리(외심)예요"<br>4000: "그건 지름이에요"<br>0002·0020: "단위를 m로 바꿔 보세요"</td><td>세 변에 모두 접하는 원의 중심은 내심이에요</td><td>넓이 = ½ × 반지름 × (세 변의 합)</td></tr>
</table>
<h2>합치기 (빨강 + 파랑)</h2>
<p>27+23=50 · 40+51=91 · 59+14=73 · 31+5=36 · 61+38=99 · 함정(벌점): 42+5=47 · 40+23=63 · 59+26=85 · 31+38=69. 그 밖의 합은 해당 카드가 없어요 → "아무 일도 일어나지 않아요".</p>
<h2>정답 길</h2>
<p>시작 → [27+23=50 → 52에서 D(3,5) → 35] 와 [49 → 94 금고 3242 → 58 숨은 51] → 40+51=91 → [91에서 기운 돛대가 선장실 문을 막음 → 2(돛대 세우는 법) → 44 도르래 90°·6m → 4 선장실 → 14 (26 녹슨 열쇠는 함정)] 와 [96·42로 70° 미리 계산] → 59+14=73 → 70° → 29 → [31+5=36 → 3 삽 (4,3) → 43 → 61] 와 [24 → 6 보트 2000 → 86 → 38] → 61+38=99</p>
<h2>테스트 때 재 볼 것</h2><p>방마다 걸린 시간(목표: 다락방 10분, 해적선 10분, 섬 12분) · 벌점·힌트 횟수 · 노는 학생이 있었는지 · 헷갈린 문장</p></div>
<div class="sheet"><h1>인쇄 안내</h1><p><b>🔗 디벗 주소 (누르면 열려요)</b><br>· 연습: <a href="https://geogebra2026.vercel.app/escape0.html">geogebra2026.vercel.app/escape0.html</a><br>· 1회 「찢어진 지도」: <a href="https://geogebra2026.vercel.app/escape1.html">geogebra2026.vercel.app/escape1.html</a><br>· 연습을 끝내면 화면의 버튼으로 1회로 바로 넘어가요.</p><p>· A4, <b>양면 인쇄 — 긴 쪽 넘김</b>, 배율 100%(실제 크기). 180~220g 종이면 가장 좋아요.<br>· 앞면 1쪽 뒤에 뒷면 1쪽이 짝으로 들어 있어요.<br>· 점선을 따라 잘라요. 모둠당 1세트(연습 9장 + 규칙 1장 + 본게임 39장 = 49장, A4 6장 양면).<br>· 연습 카드와 규칙 카드(<b>노란 뒷면</b>)는 따로 두고 먼저 해요. 본게임 카드(<b>파란 뒷면</b>)는 번호가 보이게 뒤집어 쌓아 두고, 시작 카드만 펼쳐요.<br>· 카드 위쪽에 <b>줄 그은 번호</b>가 있으면 그 카드는 다 쓴 거예요. 한쪽에 치워 두세요. 벌점 카드는 ⏳ 버튼을 누르고 그 카드만 치워요.<br>· 바로 앞 쪽 「선생님 정답표」는 선생님만 가지고 계세요.</p></div>'''
open('cards.html','w',encoding='utf-8').write(f'<html><head><meta charset="utf-8"><style>{css}</style></head><body>{"".join(pages)}{teacher}</body></html>')
print(len(cards),'cards',len(pages),'card pages')
