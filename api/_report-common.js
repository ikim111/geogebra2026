// 확률 탐구 글쓰기(22·23번) AI 기능 공통 코드. 파일 이름이 _로 시작해서 Vercel이 이 파일 자체를
// 주소(/api/...)로 열지 않는다 — report-grade.js(23번 교사용 AI 채점·피드백),
// step-feedback.js, chat-help.js(22번 학생용)가 require로 가져다 쓴다.
//
// [설정 방법] Vercel 프로젝트 > Settings > Environment Variables 에
//   OPENAI_API_KEY = platform.openai.com 에서 발급한 API 키   (필수)
//   OPENAI_MODEL   = 사용할 모델 ID                           (선택, 비우면 DEFAULT_MODEL)
// 을 등록하고 재배포(Redeploy)하면 적용된다.

// 가장 저렴한 최신 모델(2026-10 기준 입력 100만 토큰당 $0.10, 출력 $0.50 — 보고서 1편에 약 2~3원).
// 더 꼼꼼하게 하려면 Vercel 환경변수 OPENAI_MODEL에 더 큰 모델 ID를 넣으면 된다.
const DEFAULT_MODEL = 'gpt-6-luna';
const MAX_FIELD = 12000; // 한 칸 최대 글자 수(비정상적으로 긴 입력 방지)

// ↓ 선생님이 준 프롬프트를 바탕으로, 2026-10-02 선생님 요청("중2 글치고 너무 깐깐하고 피드백이 너무 길다")에 맞춰
//   [중학교 2학년 수준에 맞춘 채점]·[분량] 부분을 더하고 출력 형식을 짧게 줄였다.
//   {{학생보고서}} 자리에 학생 보고서가 들어간다. 원래 프롬프트는 git 기록(커밋 876578f)에 남아 있다.
const PROMPT_TEMPLATE = `너는 중학교 2학년 학생의 확률·통계 탐구 보고서를 점검해 주는 AI 피드백 도우미이다.

가장 중요한 원칙은 학생의 글을 대신 작성하지 않는 것이다.
학생이 스스로 자신의 글을 점검하고 수정할 수 있도록 채점 기준에 따라 짧고 분명하게 피드백한다.

모든 피드백의 가장 첫 부분에 다음 문구를 반드시 그대로 제시한다.

※ AI의 피드백이 항상 맞는 것은 아닙니다.
피드백을 참고하되, 자신의 생각과 채점 기준에 비추어 필요한 부분만 선택하여 수정하세요.


[피드백 원칙]

1. 학생의 문장, 분석, 주장, 결론을 대신 작성하지 않는다.
2. 학생의 문장을 완성된 문장으로 고쳐서 제시하지 않는다.
3. 점수를 높이기 위해 새로운 분석, 계산, 주장, 결론을 만들어 주지 않는다.
4. 부족한 부분이 있다면 무엇이 부족한지 알려주고, 학생이 스스로 수정할 수 있도록 질문을 제시한다.
5. 맞춤법이나 문장 표현보다는 탐구 내용, 자료 활용, 분석, 논리성을 중심으로 피드백한다. 오타는 지적하지 않는다.
6. 학생이 이미 잘 작성한 부분은 억지로 수정하도록 하지 않는다.
7. 명확한 문제가 없다면 "현재 상태로 제출해도 좋습니다."라고 안내할 수 있다.
8. 학생의 생각이나 표현 방식이 다소 서툴더라도 의미가 분명하면 불필요하게 문체를 획일화하지 않는다.
9. 근거 없이 높은 점수 또는 낮은 점수를 주지 말고, 반드시 학생의 실제 글을 근거로 판단한다.
10. 학생이 작성하지 않은 내용을 작성한 것처럼 가정하지 않는다.


[중학교 2학년 수준에 맞춘 채점 — 매우 중요]

- 이 글은 중학교 2학년 학생이 처음 써 보는 탐구 글이다. 전문가나 대학생 수준의 엄밀함을 요구하지 않는다.
- 학생이 질문을 정하고, 자료를 찾아, 그 수치로 확률을 계산하거나 해석하려고 했다면 그 시도를 충분히 인정한다.
- 유병률과 발병률의 구분, 조건부확률의 엄밀한 조건, 분모·모집단의 정확한 정의, 자료의 독립성 같은 전문적인 통계 개념을 이유로 감점하지 않는다. 이런 점은 필요하면 "더 생각해 볼 질문"으로만 가볍게 제시한다.
- 블로그, 카페, 커뮤니티, SNS, 위키(나무위키·위키백과), 질문·답변 사이트(지식iN 등), 유튜브, 브런치 같은 개인 글, AI가 만든 글은 자료로 인정하지 않는다. 이런 출처는 자료 개수에 넣지 않고, 이런 자료만 썼다면 자료 조사를 하지 않은 것으로 본다(보고서의 [자료 출처]에 "프로그램 판단: 자료로 인정하지 않음"이라고 표시된 것은 그대로 따른다).
- 출처는 기관명이나 자료 이름만 있어도 출처를 밝힌 것으로 인정한다. 링크나 연도가 빠진 것은 보완할 점으로 알려 주되 감점은 최대 1점으로 한다.
- 자료가 조금 오래되었거나 조건이 학생의 질문과 완전히 일치하지 않는 정도는 감점하지 않고 보완할 점으로만 알려 준다.
- 감점은 다음처럼 분명한 문제가 있을 때만 한다: 확률·통계와 관련 없는 질문, 자료가 1개뿐이거나 출처가 전혀 없음, 수치를 나열만 하고 확률 계산·해석이 전혀 없음, 결론이 앞의 자료와 관계없음, 글자 수 기준(서론 150·본론 700·결론 150, 합계 1000자)에 못 미침.
- 점수 판단 기준(참고)
  · 탐구 질문(3점): 아래 [채점 기준] 1번의 5항목을 각각 ○(2)·△(1)·✕(0)로 판단해 더한 뒤 9~10 → 3점, 5~8 → 2점, 2~4 → 1점, 0~1 → 0점. 단, (1) 확률을 구하는 질문이 ✕이면 평가할 것이 없으므로 0점(1부 step1 자기평가와 같은 기준).
  · 자료 수집(3점): 아래 [채점 기준] 2번의 3항목을 각각 맞으면 1점, 아니면 0점. 블로그·카페·커뮤니티·SNS·위키·지식iN·유튜브·개인 글·AI 글과, 출처 이름·링크가 없는 자료는 자료로 세지 않는다. 인정되는 자료가 하나도 없으면 0점.
  · 자료 분석(4점): 아래 [채점 기준] 3번의 4항목을 각각 맞으면 1점, 아니면 0점. 질문 유형(예측형/비교·선택형)에 맞는 항목을 쓴다.
  · 글의 논리(5점): 아래 [채점 기준] 4번의 5항목을 각각 맞으면 1점, 아니면 0점. (1)~(3) 글자 수는 프로그램이 센 값으로 정한다.


[채점 기준]

총점은 15점이다.

1. 적절한 탐구 질문 형성: 3점 (보고서의 제목·서론에 드러난 탐구 질문을 본다)
- (1) 확률을 구하는 질문인가?
- (2) 예측형 또는 비교·선택형 질문의 형태인가?
- (3) 대상·기간·조건이 정해져 있는가?
- (4) 공식 통계·기록으로 답을 구할 수 있는 질문인가?
- (5) 자료의 수치로 확률을 계산하거나 비교할 수 있는 질문인가?
- 항목마다 ○ 2, △ 1, ✕ 0을 더해 9~10 → 3점, 5~8 → 2점, 2~4 → 1점, 0~1 → 0점. 단 (1)이 ✕이면 0점. (예: ○5개 3점, ○4·△1 3점, ○3·△2 2점, ○4·✕1 2점)
- (2): "~할 확률은 얼마일까?"(예측형) 또는 "A와 B 중 어느 쪽 확률이 높을까?"(비교·선택형) 형태. (5): 기록 하나를 찾아 읽으면 끝나는 질문이 아니라 자료의 수치로 확률을 계산하거나 비교해야 답할 수 있는 질문.

2. 신뢰성 있는 자료 수집: 3점 (항목마다 1점 또는 0점)
- 전제: 블로그·카페·커뮤니티·SNS·위키·지식iN·유튜브·개인 글·AI 글과, 출처 이름·링크가 없는 자료는 자료로 세지 않는다. 인정되는 자료가 하나도 없으면 0점.
- (1) 자료 1이 탐구 질문에 맞는 자료인가? (대상·기간·조건이 질문과 맞는가)
- (2) 자료 2가 탐구 질문에 맞고, 자료 1과 다른 정보를 주는가? (같은 사이트여도 표나 기간이 다르면 다른 자료, 한 표를 나눠 적으면 1개)
- (3) 두 자료로 확률 계산에 필요한 수치를 모두 얻을 수 있는가?

3. 자료의 타당한 분석: 4점 (항목마다 1점 또는 0점)
- 비교·선택형(확률 2개):
  (1) 확률 1의 분자·분모가 될 수치를 자료에서 찾아 글에 썼는가?
  (2) 확률 2의 분자·분모가 될 수치를 자료에서 찾아 글에 썼는가?
  (3) 확률 1의 계산식(분수)과 계산 결과를 썼는가?
  (4) 확률 2의 계산식(분수)과 계산 결과를 썼는가?
- 예측형(확률 1개):
  (1) 분자가 될 수치를 자료에서 찾아 글에 썼는가?
  (2) 분모가 될 수치를 자료에서 찾아 글에 썼는가?
  (3) 확률을 분수(계산식)로 나타냈는가?
  (4) 계산 결과(소수 또는 %)를 썼는가?
- 수치는 자료에 있는 값이어야 하고, 계산 결과는 0~1 또는 0~100% 사이의 맞는 값이어야 한다(계산 보조 도구로 계산하므로 반올림 차이는 문제 삼지 않는다).

4. 글의 논리적 완성: 5점 (항목마다 1점 또는 0점)
- (1) 서론이 150자 이상인가? (2) 본론이 700자 이상인가? (3) 결론이 150자 이상인가? — 보고서 끝에 프로그램이 센 글자 수로 정한다(AI가 판단하지 않는다).
- (4) 결론에 탐구 질문에 대한 답이 있는가? ("그래서 ~이다"가 분명히 있음. 비교·선택형은 어느 쪽인지)
- (5) 확률에 대한 해석이 올바른가? (확률값의 뜻을 맞게 말함 — 예: 0.625 → "10번 중 약 6번". 비교가 맞음. 자료 범위를 넘어 "반드시"처럼 단정하지 않음)
- 결론에 한계점은 쓰지 않아도 된다.


[분량 — 반드시 지킨다]

- 피드백 전체는 공백 포함 900자를 넘지 않는다. 학생이 한 번에 읽을 수 있도록 짧게 쓴다.
- 각 항목의 "잘된 점"과 "보완할 점"은 각각 1문장, 최대 2개까지만 쓴다.
- "생각해 볼 질문"은 각 항목에 최대 1개만 쓴다.
- 보완할 점이나 생각해 볼 질문이 없으면 그 줄(🔧, ❓)은 아예 쓰지 않는다. "없음"이라고도 쓰지 않는다.
- 한 줄에는 한 가지 내용만 쓴다. 2개를 쓸 때는 같은 기호로 줄을 나누어 쓴다(예: 👍 … 다음 줄에 👍 …).
- 마크다운 기호(**, ##, 표 등)는 쓰지 않는다. 아래 출력 형식의 기호와 줄바꿈만 쓴다.
- 같은 내용을 여러 항목에서 반복하지 않는다.
- 쉬운 말로 쓴다. 어려운 통계 용어는 쓰지 않는다.


[출력 형식]

※ AI의 피드백이 항상 맞는 것은 아닙니다.
피드백을 참고하되, 자신의 생각과 채점 기준에 비추어 필요한 부분만 선택하여 수정하세요.

[1. 탐구 질문] ○/3점
👍 
🔧 
❓ 

[2. 자료 수집] ○/3점
👍 
🔧 
❓ 

[3. 자료 분석] ○/4점
👍 
🔧 
❓ 

[4. 글의 논리] ○/5점
👍 
🔧 
❓ 

[예상 점수] ○/15점 (AI 예상 점수이며 실제 선생님 채점과 다를 수 있습니다.)

[가장 먼저 고치면 좋은 점]
점수에 가장 큰 영향을 줄 수 있는 부분 1가지만, 1~2문장으로 쓴다.

[제출 상태]
다음 중 하나와 이유 1문장.
- 현재 상태로 제출해도 좋습니다.
- 일부 내용을 확인한 뒤 제출하는 것이 좋습니다.
- 중요한 보완이 필요합니다.
학생을 불안하게 만들거나 과장된 표현을 사용하지 않는다.

(👍 = 잘된 점, 🔧 = 보완할 점, ❓ = 스스로 생각해 볼 질문. 이 설명 줄은 출력하지 않는다. 🔧와 ❓ 줄은 해당 내용이 있을 때만 쓴다.)


[매우 중요]
학생의 보고서가 이미 충분히 잘 작성되어 있다면 억지로 문제점을 만들지 않는다.
사소한 문체나 표현 차이를 감점 요소처럼 다루지 않는다.
학생의 독창적인 표현이나 분석 방식을 획일적인 형식으로 바꾸도록 유도하지 않는다.
AI의 역할은 글을 더 그럴듯하게 만들어 주는 것이 아니라 학생이 자신의 탐구 과정과 채점 기준을 스스로 점검하도록 돕는 것이다.


학생의 보고서:
{{학생보고서}}`;

// 글자 수: 띄어쓰기 포함, 연달아 친 띄어쓰기는 1자, 줄바꿈·줄 앞뒤 공백 제외(student23.html과 같은 방식).
const countChars = s => Array.from(String(s == null ? '' : s).split(/\r?\n/).map(l => l.replace(/[\s　]+/g, ' ').trim()).join('')).length;

/* 요청 본문 → 보고서 글. AI는 글자 수를 정확히 세지 못하므로 서버에서 센 글자 수를 끝에 함께 적는다. */
function parseReport(raw) {
  let b = raw;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const pick = k => String(b[k] == null ? '' : b[k]).slice(0, MAX_FIELD).trim();
  const title = pick('title'), intro = pick('intro'), body = pick('body'), concl = pick('concl');
  const sources = (Array.isArray(b.sources) ? b.sources : []).slice(0, 15)
    .map(x => ({ name: String((x && x.name) || '').slice(0, 300).trim(), link: String((x && x.link) || '').slice(0, 500).trim() }))
    .filter(x => x.name || x.link)
    .map(x => Object.assign(x, { banned: bannedSourceKind(x.link, x.name) }));
  const counts = { title: countChars(title), intro: countChars(intro), body: countChars(body), concl: countChars(concl) };
  counts.total = counts.intro + counts.body + counts.concl;
  const none = '(작성하지 않음)';
  const report =
    `[제목]\n${title || none}\n\n` +
    `[서론]\n${intro || none}\n\n` +
    `[본론]\n${body || none}\n\n` +
    `[결론]\n${concl || none}\n\n` +
    `[자료 출처] (글자 수에 포함하지 않음)\n${sources.length ? sources.map((x, i) => `${i + 1}. ${x.name || '(이름 없음)'}${x.link ? ' — ' + x.link : ' (링크 없음)'}${x.banned ? `  ← 프로그램 판단: ${x.banned}(자료로 인정하지 않음)` : ''}`).join('\n') : none}\n\n` +
    `(참고 — 프로그램이 센 글자 수, 띄어쓰기 포함: 서론 ${counts.intro}자, 본론 ${counts.body}자, 결론 ${counts.concl}자, 서론+본론+결론 합계 ${counts.total}자)`;
  return { empty: !intro && !body && !concl, counts, report, sources };
}

/* OpenAI Chat Completions 호출. 추론 모델이면 추론을 '낮음'으로(빠르고 싸게). opts.effort로 바꿀 수 있다(2부 채점은 'medium').
   reasoning_effort나 response_format을 지원하지 않는 모델이면(400) 그 옵션을 빼고 다시 시도한다.
   반환: { ok:true, text, model } 또는 { ok:false, status, error, detail } */
async function callOpenAI(promptOrMessages, opts) {
  opts = opts || {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, status: 500, error: 'OPENAI_API_KEY가 설정되지 않았습니다. Vercel 프로젝트 환경변수를 확인해주세요.' };
  const model = (process.env.OPENAI_MODEL || DEFAULT_MODEL).trim();
  let useEffort = true, useFormat = !!opts.responseFormat;
  const call = () => fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(Object.assign(
      { model, messages: Array.isArray(promptOrMessages) ? promptOrMessages : [{ role: 'user', content: promptOrMessages }], max_completion_tokens: opts.maxTokens || 6000 },
      useEffort ? { reasoning_effort: opts.effort || 'low' } : {},
      useFormat ? { response_format: opts.responseFormat } : {}
    ))
  });
  try {
    let r = await call();
    for (let i = 0; i < 2 && r.status === 400; i++) {
      const t = await r.text();
      if (useEffort && /reasoning/i.test(t)) useEffort = false;
      else if (useFormat && /response_format|json_schema/i.test(t)) useFormat = false;
      else return { ok: false, status: 502, error: 'OpenAI API 호출 실패', detail: t.slice(0, 1000) };
      r = await call();
    }
    if (!r.ok) {
      const errText = await r.text();
      let hint = '';
      if (r.status === 401) hint = ' (API 키가 올바르지 않아요)';
      else if (r.status === 429) hint = /quota|billing/i.test(errText) ? ' (크레딧이 없거나 사용 한도를 넘었어요 — OpenAI 결제를 확인하세요)' : ' (요청이 너무 많아요 — 잠시 후 다시 시도하세요)';
      else if (r.status === 404) hint = ` (모델 '${model}'을 쓸 수 없어요 — OPENAI_MODEL을 확인하세요)`;
      return { ok: false, status: 502, error: 'OpenAI API 호출 실패' + hint, detail: errText.slice(0, 1000) };
    }
    const data = await r.json();
    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    const text = (msg && typeof msg.content === 'string') ? msg.content.trim() : '';
    if (!text) {
      const why = data && data.choices && data.choices[0] && data.choices[0].finish_reason;
      return { ok: false, status: 502, error: 'OpenAI 응답이 비어 있습니다.' + (why ? ` (finish_reason: ${why})` : '') };
    }
    return { ok: true, text, model: data.model || model };
  } catch (err) {
    return { ok: false, status: 500, error: err.message || String(err) };
  }
}

/* 피드백 프롬프트에서 [중학교 2학년 수준에 맞춘 채점]~[채점 기준] 부분만 꺼낸다(채점 프롬프트가 같은 기준을 쓰도록). */
function rubricText() {
  const a = PROMPT_TEMPLATE.indexOf('[중학교 2학년 수준에 맞춘 채점');
  const b = PROMPT_TEMPLATE.indexOf('[분량');
  return PROMPT_TEMPLATE.slice(a, b).trim();
}

/* ---------- 자료로 인정하지 않는 출처 판별 (student22·student23·teacher22·teacher23·api/_report-common.js 공통 — 모두 똑같이 유지) ----------
   블로그·카페·커뮤니티·SNS·위키·질문답변 사이트·유튜브·개인 글 플랫폼·AI가 만든 글은 자료로 인정하지 않는다
   (선생님 기준: 이런 곳만 썼다면 자료 조사를 하지 않은 것으로 봄). 링크 주소(도메인)로 판별하고,
   링크가 없으면 출처 이름에 들어 있는 대표 이름으로 판별한다. 반환: 금지 종류 이름(예: '블로그') 또는 ''. */
const BANNED_SOURCES = [
  ['블로그', ['blog.naver.com','blog.daum.net','tistory.com','egloos.com','blogspot.com','wordpress.com','velog.io','post.naver.com','blog.me']],
  ['카페', ['cafe.naver.com','cafe.daum.net']],
  ['커뮤니티', ['dcinside.com','fmkorea.com','theqoo.net','ruliweb.com','clien.net','ppomppu.co.kr','mlbpark.donga.com','inven.co.kr','instiz.net','pann.nate.com','todayhumor.co.kr','bobaedream.co.kr','etoland.co.kr','ilbe.com','82cook.com','reddit.com','humoruniv.com','dogdrip.net','arca.live','ygosu.com','gasengi.com','slrclub.com']],
  ['SNS', ['instagram.com','facebook.com','fb.com','x.com','twitter.com','threads.net','threads.com','tiktok.com','band.us','kakao.com/story','story.kakao.com']],
  ['위키', ['namu.wiki','wikipedia.org','wikiwand.com','librewiki.net']],
  ['질문·답변 사이트', ['kin.naver.com','tip.daum.net','tip.kakao.com','quora.com','answers.yahoo.com']],
  ['유튜브', ['youtube.com','youtu.be']],
  ['개인 글 플랫폼', ['brunch.co.kr','medium.com','substack.com','postype.com']],
  ['AI가 만든 글', ['chatgpt.com','chat.openai.com','openai.com/chat','gemini.google.com','bard.google.com','g.co/gemini','claude.ai','perplexity.ai','wrtn.ai','copilot.microsoft.com','poe.com','character.ai','clova-x.naver.com','askup.upstage.ai','liner.com','gamma.app']]
];
const BANNED_NAME_WORDS = [
  ['블로그', /블로그|티스토리|tistory/i], ['카페', /네이버\s*카페|다음\s*카페/], ['커뮤니티', /디시|에펨|더쿠|루리웹|클리앙|뽐뿌|엠팍|인스티즈|네이트\s*판|오늘의\s*유머|보배드림|레딧|reddit/i],
  ['SNS', /인스타그램|instagram|페이스북|facebook|트위터|twitter|스레드|틱톡|tiktok/i], ['위키', /나무\s*위키|위키\s*백과|wikipedia|namu\.wiki/i],
  ['질문·답변 사이트', /지식\s*i?n|지식인|quora/i], ['유튜브', /유튜브|youtube/i], ['개인 글 플랫폼', /브런치|미디엄|medium\.com/i],
  ['AI가 만든 글', /chat\s*gpt|챗\s*gpt|챗지피티|gemini|제미나이|claude|클로드|perplexity|퍼플렉시티|뤼튼|wrtn|copilot|코파일럿|생성형\s*ai|ai\s*답변/i]
];
function bannedSourceKind(link, name){
  const raw = String(link||'').trim();
  if(raw){
    let host = '', path = '';
    try{ const u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://'+raw); host = u.hostname.toLowerCase().replace(/^www\.|^m\./,''); path = u.pathname.toLowerCase(); }catch(e){}
    if(host){
      const hp = host + path;
      for(const [kind, doms] of BANNED_SOURCES){
        if(doms.some(d => d.includes('/') ? hp.startsWith(d) || hp.startsWith('www.'+d) : (host===d || host.endsWith('.'+d)))) return kind;
      }
    }
  }
  const nm = String(name||'');
  for(const [kind, re] of BANNED_NAME_WORDS){ if(re.test(nm)) return kind; }
  return '';
}

/* 요청 본문 읽기(문자열이면 JSON으로) */
function bodyOf(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}
/* JSON 응답 해석(앞뒤에 다른 글이 붙어 와도 { … }만 꺼내서 읽는다) */
function parseJSON(text) {
  try { return JSON.parse(text); } catch (e) {}
  const m = String(text).match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
  return null;
}

/* 22번 학생용 AI(피드백·챗봇) 공통 원칙 */
const STUDENT_AI_RULES = `- 학생의 질문, 문장, 분석, 계산 결과, 결론을 대신 만들어 주지 않는다. 완성된 탐구 질문이나 보고서 문장을 예시로 써 주지 않는다.
- 실제 통계 수치(○○%, ○○명 등)를 알려 주지 않는다(AI가 수치를 지어낼 수 있다). 대신 어떤 공식 사이트에서 찾으면 좋을지 알려 준다.
- 자료는 정부기관·공공기관·공식 통계·공식 기록을 쓰게 한다. 블로그, 카페, 커뮤니티, SNS, 위키(나무위키·위키백과), 질문·답변 사이트(지식iN 등), 유튜브, 브런치 같은 개인 글, AI가 만든 글은 자료로 인정되지 않는다(쓰면 자료 조사를 하지 않은 것으로 본다).
- 중학교 2학년이 이해할 수 있는 쉬운 말과 "-해요" 말투로, 짧게 쓴다. 마크다운 기호(**, ## 등)는 쓰지 않는다.`;
const RECOMMENDED_SITES = `추천 사이트: 기상자료개방포털(날씨·기후), 에어코리아(미세먼지), 국민건강영양조사(건강·운동·식생활), 국가통계포털 KOSIS(인구·출생·사망·물가·소득·생활비), 국가화재정보시스템(화재), 경찰청(범죄), TAAS 교통사고분석시스템(교통사고), 국가교통DB KTDB(교통량), 학교알리미·교육통계서비스(학교·교육), KBO 공식 홈페이지 등 종목별 공식 기록 사이트(스포츠), 식품안전나라(식중독·식품 안전), 보험개발원(보험).`;

module.exports = { PROMPT_TEMPLATE, countChars, parseReport, callOpenAI, rubricText, bannedSourceKind, bodyOf, parseJSON, STUDENT_AI_RULES, RECOMMENDED_SITES };
