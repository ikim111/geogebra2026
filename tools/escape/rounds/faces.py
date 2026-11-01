# 학생에게 보이는 카드 앞면만 글로 뽑기 (답 모르는 검토자용): python3 faces.py 2 > 파일
import sys,re,importlib
sys.path.insert(0,'.')
FIGD={'river':'[그림: 강. A는 강 건너편, B는 이쪽 강가, C는 뭍의 점. 삼각형 ABC에서 CA의 중점 M, CB의 중점 N. 길이 숫자 없음.]',
 'mirror':'[그림: 사람 — 3m — 땅 위 거울 — 24m — 절벽. 눈에서 거울로, 거울에서 절벽 꼭대기로 점선. 눈높이 숫자는 그림에 없음.]',
 'tri':'[그림: 삼각형 ABC(길이 숫자 없음). 위에서부터 HI, FG, BC가 평행.]',
 'shadow':'[그림: 횃불 — 열쇠걸이(2뼘) — 벽(3뼘). 횃불에서 열쇠 양끝을 지나 벽까지 점선, 벽에 그림자 자국.]',
 'cave':'[그림: 입구→광장 굴 3개, 광장→보물 방 굴 4개. 물길은 그려져 있지 않음.]'}
COL={'grey':'회색(장소·단서)','red':'빨강(물건)','blue':'파랑(물건)','green':'초록(기계)','yellow':'노랑(자물쇠)','pen':'벌점','start':'시작'}
n=sys.argv[1];R=importlib.import_module('r'+n);out=[f'# {R.EP} — 카드 앞면\n']
for c in R.CARDS:
    body=re.sub(r'<div class="hid">(\d+)</div>',r' (그림 구석에 아주 작게 숫자 \1이 보임)',c[4]);body=re.sub('<br>','\n',body);body=re.sub('<[^>]+>','',body)
    tags=', '.join(str(t) for t in c[5]); fig=FIGD.get(c[6],'') if len(c)>6 else ''
    dis=R.DIS.get(c[0],'')
    out.append(f'- **{c[2]}** [{COL[c[1]]}] {c[3]}: {body} {fig}'+(f' / 그림 속 번호: {tags}' if tags else '')+(f' / 치우기: {dis}' if dis else ''))
if n=='2': out.append('\n(27 모래밭 지도 화면: 0~12 × 0~9 모눈, O는 원점, y=6에 빨간 줄 = 강가 길, 한 칸 = 1걸음. 기계 다이얼은 정수만, +1/+10)')
print('\n'.join(out))
