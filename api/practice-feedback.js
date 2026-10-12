// Vercel 서버리스 함수: 수업 활동(21·22·23번)의 "🤖 AI 피드백 받기" 연습 버튼이 호출한다.
// 수행평가 2부의 step-feedback과 같은 형식(잘한 점 good / 보완할 점 fix)으로 짧게 돌려준다.
// 학생 한 명당 한 곳에서 3번까지만 부르도록 학생 화면에서 막는다(비용 절약).
//
// 요청 형식(POST, JSON): { unit: 21|22|23, answer: 학생 글, ctx: 학생 화면이 만든 참고 정보(실험 결과 등) }
// 응답 형식(JSON): { good:[문장], fix:[문장], model }
const { bodyOf, callOpenAI, parseJSON } = require('./_report-common');

const S = (x, n) => String(x == null ? '' : x).slice(0, n || 1500).trim();

const UNITS = {
  21: {
    name: '8.2 확률의 뜻 — 동전을 계속 던지면 어떻게 될까?',
    question: '동전을 던지는 횟수가 많아질수록 앞면이 나온 상대도수에는 어떤 변화가 나타나는가?',
    check: `모범 답안: "동전을 던지는 횟수가 많아질수록 앞면이 나온 상대도수는 0.5에 가까워진다."
모범 답안의 세 요소가 학생 글에 들어 있는지만 본다(낱말이 달라도 뜻이 같으면 인정한다).
  ① 조건: 던지는 횟수가 많아질수록(많이 던질수록)
  ② 대상: 앞면이 나온 상대도수(무엇의 값이 변하는지)
  ③ 결과: 0.5(또는 일정한 값, 반쯤)에 가까워진다
※ 세 요소가 모두 있으면 잘했다고 칭찬하고 fix는 빈 목록 []으로 둔다.
※ 빠진 요소가 있으면 잘한 점(들어 있는 요소)을 칭찬하고, 빠진 요소마다 하나씩 짧은 질문으로 알려 준다.
   예) ①이 빠짐 → "언제 0.5에 가까워지는지도 써 볼까요?" / ②가 빠짐 → "무엇이 0.5에 가까워지는지 써 볼까요?"
※ 모범 답안 문장을 그대로 알려 주지 않는다. 실험 결과 값을 근거로 들지 않았다고 지적하지 않는다.`,
    secret: '학생이 0.5를 쓰지 않았다면 0.5라는 값과 "확률"의 정의는 직접 말하지 않는다(학생이 아직 배우기 전). 학생이 0.5를 썼으면 "0.5에 가까워진다는 것을 잘 찾았어요"처럼 그대로 칭찬한다.'
  },
  22: {
    name: '8.3 확률의 계산 — 공정한 상금 분배 (다시 생각해 보기)',
    question: '처음 내 생각과 비교해서 무엇이 달라졌나요? 왜 이렇게 나누는 것이 공정한가요?',
    check: `(1) 처음 생각과 비교해 무엇이 달라졌는지(또는 그대로인지)를 썼는가?
(2) 공정하다고 보는 근거로 남은 경기에서 각자 우승할 가능성(경우의 수나 확률, 시뮬레이션 결과)을 들었는가?`,
    secret: '공정한 분배 금액(48만 원 : 16만 원)이나 확률값(3/4, 1/4)을 학생이 쓰지 않았다면 직접 알려 주지 않는다.'
  },
  '22b': {
    name: '8.3 확률의 계산 — 타자 영입 (왜 예상과 다를까?)',
    question: '전반기와 후반기 모두 A의 타율이 더 높은데, 시즌 전체 타율은 왜 B가 더 높을까요? 표의 타수를 살펴보고 설명해 보세요.',
    check: `모범 답안의 뜻: "A는 타율이 낮은 후반기에 타수가 많고(40타수), B는 타율이 높은 전반기에 타수가 많아서(40타수), 시즌 전체 타율은 B가 더 높다."
아래 두 요소가 학생 글에 들어 있는지만 본다(낱말이 달라도 뜻이 같으면 인정한다).
  ① 두 선수가 시기마다 친 타수(횟수)가 다르다는 것 — 어느 시기에 더 많이 쳤는지
  ② 그 타수가 많은 시기의 타율(잘 친 시기인지 못 친 시기인지)이 시즌 전체 타율에 크게 영향을 준다는 것
     예) "A는 못 칠 때 많이 쳤고 B는 잘 칠 때 많이 쳤다"처럼 써도 ①②를 모두 쓴 것으로 인정한다.
※ 두 요소가 모두 있으면 잘했다고 칭찬하고 fix는 빈 목록 []으로 둔다.
※ 빠진 요소가 있으면 빠진 것마다 짧은 질문으로 알려 준다. 예) "두 선수가 전반기와 후반기에 각각 몇 타수씩 쳤는지 비교해 볼까요?"
※ 계산 실수나 맞춤법은 지적하지 않는다.`,
    secret: '"심슨의 역설"이라는 이름은 말하지 않는다(정리에서 소개한다). 모범 답안 문장을 그대로 알려 주지 않는다.'
  },
  23: {
    name: '8.2 확률의 뜻 — 말 속에서 확률 찾기 (내가 찾은 확률 표현)',
    question: '우리 주변에서 확률(가능성)과 관련된 표현을 하나 찾아, 그 의미를 확률로 나타내 보세요. 이렇게 나타낸 이유(표현의 뜻)도 써 보세요.',
    check: `[학생이 쓴 글]은 "이렇게 나타낸 이유(표현의 뜻)" 칸이다. 표현과 확률값은 [학생 화면의 참고 정보]에 있다. 아래 세 가지를 본다.
(1) 찾은 표현이 가능성(얼마나 일어날 것 같은지)과 관련된 표현인가?
(2) 나타낸 확률값이 0 이상 1 이하이고, 표현의 뜻과 어울리는가? (말 속의 확률은 사람마다 조금씩 다를 수 있으니 뜻과 크게 어긋나지 않으면 인정한다)
(3) 이유 칸에 표현이 "무슨 뜻인지"를 자기 말로 풀어 썼는가? — 가장 중요하다.
    · 인정하는 예: "30%는 이런 날이 100번 있으면 그중 30번쯤 비가 온다는 뜻이라 0.3으로 나타냈다", "십중팔구는 열 번 중 여덟아홉 번이라는 뜻이라 0.85"
    · 인정하지 않는 예: 표현이나 값을 그대로 다시 쓴 것("비 올 가능성이 30프로이다", "확률이 0.3이다"), "그냥", "그렇게 생각해서"
※ (3)이 빠졌으면 fix에 "30%(또는 그 표현)가 무슨 뜻인지 풀어서 써 볼까요?"처럼 짧게 묻는다. 이때는 good에 표현을 잘 찾은 점만 칭찬한다.
※ 세 가지가 모두 되어 있으면 잘했다고 칭찬하고 fix는 빈 목록 []으로 둔다.`,
    secret: '학생 대신 확률값을 정해 주지 않는다. 학생 대신 뜻을 풀어 써 주지 않는다.'
  }
};

const item = { type: 'array', items: { type: 'string' } };
const RESPONSE_FORMAT = { type: 'json_schema', json_schema: { name: 'practice_feedback', strict: true, schema: {
  type: 'object', additionalProperties: false, required: ['good', 'fix'], properties: { good: item, fix: item } } } };

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1500, responseMimeType: 'application/json',
          responseSchema: { type: 'object', properties: { good: { type: 'array', items: { type: 'string' } }, fix: { type: 'array', items: { type: 'string' } } }, required: ['good', 'fix'] } } })
    });
    if (!r.ok) return null;
    const data = await r.json();
    const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const j = parseJSON(parts.map(x => x.text || '').join(''));
    return (j && Array.isArray(j.good)) ? j : null;
  } catch (e) { return null; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  const b = bodyOf(req);
  const u = UNITS[String(b.unit || '').trim()];
  if (!u) { res.status(400).json({ error: 'unit이 올바르지 않습니다.' }); return; }
  const answer = S(b.answer, 1200), ctx = S(b.ctx, 800);
  const prompt = `너는 중학교 2학년 수학 수업에서 학생이 쓴 짧은 글에 피드백하는 AI 도우미이다.
피드백이란 잘한 점은 칭찬하고, 아쉬운 점은 보완하라고 알려 주는 것이다.

[수업] ${u.name}
[질문] ${u.question}

[원칙]
- 학생의 문장을 대신 써 주지 않는다. 고쳐 쓴 문장이나 모범 답안을 주지 않는다.
- ${u.secret}
- 중학교 2학년 수준에 맞게 너그럽게 본다. 기준에 해당하는 내용이 대체로 들어 있으면 잘했다고 분명하게 칭찬하고, fix는 빈 목록 []으로 둔다.
- "조금 더 자세히", "더 구체적으로" 같은 사소한 아쉬움은 지적하지 않는다. 보완할 점은 기준에서 빠졌거나 분명히 잘못된 것만 쓰고, 학생이 스스로 고칠 수 있게 짧은 질문이나 힌트로 쓴다.
- 보완할 점을 억지로 만들지 않는다. 질문에 대한 핵심 답이 맞으면 fix는 빈 목록 []이다.
- 학생이 거의 쓰지 않았거나 질문과 상관없는 글이면 good은 빈 목록으로 두고, fix에 무엇부터 쓰면 좋을지 알려 준다.
- 아래 [확인 기준]에 없는 내용, 맞춤법·오타는 지적하지 않는다.
- 쉬운 말과 "-해요" 말투로 짧게 쓴다. 마크다운 기호(**, ## 등)는 쓰지 않는다.

[확인 기준]
${u.check}

[출력]
JSON 하나만 출력한다: {"good":["잘한 점"], "fix":["보완할 점"]}
- good 최대 2개, fix 최대 2개. 각 문장은 70자 이내.

${ctx ? `[학생 화면의 참고 정보]\n${ctx}\n\n` : ''}[학생이 쓴 글]
${answer || '(비어 있음)'}`;
  // 비용 절약: 외심내심 채점(grade-justify.js)에서 이미 쓰는 Gemini 소형 모델(GEMINI_API_KEY)을 먼저 쓴다.
  // Gemini가 실패하면 OpenAI(생각 최소)로 한 번 더 시도한다. OPENAI_PRACTICE_MODEL을 넣으면 그 모델을 쓴다.
  let j = await callGemini(prompt), model = GEMINI_MODEL;
  if (!j) {
    const r = await callOpenAI(prompt, { maxTokens: 1500, effort: 'minimal', responseFormat: RESPONSE_FORMAT,
      model: (process.env.OPENAI_PRACTICE_MODEL || '').trim() || undefined });
    if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
    j = parseJSON(r.text); model = r.model;
  }
  if (!j) { res.status(502).json({ error: 'AI 피드백을 해석하지 못했어요.' }); return; }
  const clean = a => (Array.isArray(a) ? a : []).map(x => String(x || '').trim()).filter(Boolean).slice(0, 2).map(x => x.slice(0, 200));
  res.status(200).json({ good: clean(j.good), fix: clean(j.fix), model });
};
