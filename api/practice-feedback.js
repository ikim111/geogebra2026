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
    check: `(1) 던지는 횟수가 많아질수록 상대도수가 어떻게 변하는지(들쭉날쭉하다가 어떤 값 가까이에 모이는지)를 썼는가?
(2) 아래 [학생의 실험 결과]에 있는 횟수나 상대도수 값을 근거로 들었는가?`,
    secret: '앞면이 나올 확률이 0.5(1/2)라는 것, "확률"의 정의는 학생이 아직 배우기 전이므로 직접 말하지 않는다. 학생이 이미 썼으면 칭찬은 해도 된다.'
  },
  22: {
    name: '8.3 확률의 계산 — 공정한 상금 분배 (다시 생각해 보기)',
    question: '처음 내 생각과 비교해서 무엇이 달라졌나요? 왜 이렇게 나누는 것이 공정한가요?',
    check: `(1) 처음 생각과 비교해 무엇이 달라졌는지(또는 그대로인지)를 썼는가?
(2) 공정하다고 보는 근거로 남은 경기에서 각자 우승할 가능성(경우의 수나 확률, 시뮬레이션 결과)을 들었는가?`,
    secret: '공정한 분배 금액(48만 원 : 16만 원)이나 확률값(3/4, 1/4)을 학생이 쓰지 않았다면 직접 알려 주지 않는다.'
  },
  23: {
    name: '8.2 확률의 뜻 — 말 속에서 확률 찾기 (내가 찾은 확률 표현)',
    question: '우리 주변에서 확률(가능성)과 관련된 표현을 하나 찾아, 그 의미를 확률로 나타내 보세요.',
    check: `(1) 찾은 표현이 가능성(얼마나 일어날 것 같은지)과 관련된 표현인가?
(2) 이유에 표현의 뜻을 썼는가?
(3) 나타낸 확률값이 0 이상 1 이하이고, 표현의 뜻과 어울리는가? (거의 틀림없다는 뜻이면 1에 가깝게, 거의 없다는 뜻이면 0에 가깝게, 반반이면 1/2 근처)
※ 말 속의 확률은 사람마다 조금씩 다르게 볼 수 있다. 뜻과 크게 어긋나지 않으면 맞는 것으로 인정한다.`,
    secret: '학생 대신 확률값을 정해 주지 않는다.'
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
  const u = UNITS[parseInt(b.unit, 10)];
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
- 보완할 점을 억지로 만들지 않는다.
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
