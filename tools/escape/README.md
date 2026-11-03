# 방탈출 「붉은 나침반」 카드 만들기 도구

학생 화면(escape0.html, escape1.html, escape-core.js/css)은 저장소 맨 위에 있고, 여기에는 **종이 카드 PDF를 만드는 프로그램과 검사용 시뮬레이션**이 있어요.
자세한 규칙·순서는 스킬 `escape-room`에 있어요. 검토는 `검토기준표_플레이.md`(48점 채점표)와 `검토기준표_카드디자인.md`로 해요.

## 다시 쓰려면 (새 작업 공간)
1. `bash tools/escape/restore.sh` 를 실행해요. 이 폴더를 `/tmp/claude-0/escape/`로 복사하고 글꼴을 받아요.
   (프로그램 안의 경로가 `/tmp/claude-0/escape/…`로 되어 있어요.)
2. 그림 파일(`방탈출_그림_1회.zip`, 약 18MB)은 저장소에 없어요. 선생님 맥북 다운로드 폴더(또는 구글 드라이브)에 보관돼 있어요.
   받아서 `/tmp/claude-0/escape/art/`에 풀어요.
3. 카드 PDF 만들기:
   ```
   cd /tmp/claude-0/escape/art && python3 build_art.py && node topdf.js out/방탈출1회_카드.pdf && node audit.js
   ```
4. 검사:
   - 카드 길 시뮬레이션: `python3 sim/final3.py`
   - 디벗 화면 시험: `node sim/t_odd.js`(엉뚱한 행동 44가지), `node sim/t_new2.js`(처음부터 끝까지), `node sim/t_size.js`(화면 크기·44px), `node sim/t_a11y.js`(글자 대비)

## 파일
- `print/build.py`: 카드 데이터(번호·종류·원래 문장), 버릴 카드(DIS), 선생님 정답표·인쇄 안내
- `art/texts.py`: 카드에 실제로 들어가는 제목·문장
- `art/build_art.py`: 그림·번호 태그 위치(SPEC), 겹쳐 그리는 SVG(OVER), 규칙 카드, 뒷면, 자르는 선
- `art/topdf.js`: PDF 만들기 / `art/audit.js`: 글 넘침·금지어 검사 / `art/crop.py`: 2×2 그림 자르기

## 2회 그림 카드 (2026-11-01)
- 그림: ChatGPT '그림 > 그림체 통일 요청' 방에서 2×2로 그려 받음(방탈출2_A~L.png, 선생님 다운로드 폴더). 잘라 둔 그림 묶음은 `방탈출_그림_2회.zip`(다운로드 폴더).
- 풀어서 `/tmp/claude-0/escape/art2/`에 두고: `cd tools/escape/art2 && python3 build_art2.py 2` → `node topdf2.js out/방탈출2회_카드.html 결과.pdf`
- 번호 태그 위치·숨은 번호·그림 위 글자는 `art2/layout2.json`, 카드 글은 `rounds/r2.py`.

## 3회 그림 카드 (2026-11-03)
- 그림: 같은 ChatGPT 방에서 2×2로 9장(방탈출3_A~I.png) + 숙소 다시(J60, 그물침대 5개). 프롬프트는 `art3/prompts3.md`, 잘라 둔 그림과 원본 묶음은 `방탈출_그림_3회.zip`(다운로드 폴더).
- 풀어서 `/tmp/claude-0/escape/art3/`에 두고: `cd tools/escape/art2 && python3 build_art2.py 3` → `node topdf2.js "$PWD/out/방탈출3회_카드.html" out/방탈출3회_카드.pdf`
- 번호 위치·숨은 번호(23은 저울 주머니 위)·겹쳐 그린 것(11 동굴 길, 52 🔥 표시, 49 숫자 1~30)·줄인 카드 글은 `art2/layout3.json`.
- 1회 CSS(c3.html)가 없으면 2회 카드 html의 <style>로 되살릴 수 있다.
