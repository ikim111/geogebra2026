// ⭐ 2026-10-28 잘 쓴 글 고르기 (23번 확률 탐구 글쓰기 ② 교사 화면 tpa3에서 부른다)
// 선생님과 정한 기준(GAISE II의 통계적 문제해결 4단계를 확률 탐구에 맞게 바꿈 + 비교 판단 + 강점별 대표작):
//   mode:'judge'   — 보고서 1편을 4개 기준으로 절대평가(O/X)하고, 가장 뚜렷한 강점과 근거 한 줄을 돌려준다.
//   mode:'compare' — 보고서 2편(a, b)을 나란히 놓고 "다른 반 학생에게 예시로 보여 주기에 더 좋은 글"을 고른다.
// 15점 채점(report-grade)과는 별개다. 점수를 바꾸지 않고, 우수작 후보를 고르는 데만 쓴다.
//
// 요청(POST JSON)
//   judge  : { mode:'judge', title, intro, body, concl, sources:[{name,link}] }
//   compare: { mode:'compare', a:{title,intro,body,concl,sources}, b:{...} }
// 응답
//   judge  : { checks:'OXOO', why:['','','',''], strength:'q'|'d'|'a'|'i'|'', line, model }
//   compare: { win:'a'|'b', why, model }
const { parseReport, callOpenAI, parseJSON } = require('./_report-common');

const CRITERIA = `[잘 쓴 확률 탐구 보고서 기준 — 4개, 각각 O 또는 X]
이 기준은 감점용이 아니라, 중학교 2학년 확률 탐구 보고서 중에서 다른 학생에게 예시로 보여 줄 만한 글을 고르기 위한 것이다.
기본 채점(질문이 있다, 자료가 2개다, 계산이 맞다, 결론이 있다)보다 한 단계 높은 수준을 본다. 중2 수준에서 판단하되, 확실히 드러날 때만 O를 준다.

1. 질문(q): 탐구 질문에서 확률을 구할 사건, 대상, 조건이 분명하다.
   O 예: "2025 시즌 ○○팀이 홈경기에서 이길 확률은?" (사건=이김, 대상=○○팀, 조건=2025 시즌·홈경기)
   X 예: "야구에서 이길 확률은?" (대상·조건이 없음)
2. 자료(d): 확률의 분모가 되는 전체가 몇 번(몇 명, 며칠) 중인지 밝혔고, 그 수가 적으면 한계로 인식했다.
   전체 수가 충분히 크면 한계를 쓰지 않아도 O. 전체 수를 밝히지 않았거나, 아주 적은데(예: 5경기) 아무 언급이 없으면 X.
3. 분석(a): 질문의 상황과 같은 조건의 자료로 확률을 구했다.
   예측형: 예측하려는 상황과 같은 조건의 자료로 계산했다. (예: "5월 경주 수학여행 날 비 올 확률" → 전국 1년치가 아니라 경주의 5월 자료)
   비교형: 두 확률을 같은 기준(같은 기간·같은 조건)으로 구했다.
4. 해석(i): 확률의 불확실성을 자기 주제에 맞게 풀어 썼다.
   O 예: "승률이 0.6이어도 10경기 중 4경기는 질 수 있다", "작년 자료라 올해는 달라질 수 있다"
   X: 해석이 없거나, "확률이 높다고 반드시 일어나는 것은 아니다" 같은 일반적인 문장만 있고 자기 주제와 연결하지 않음.`;

const JUDGE_PROMPT = `너는 중학교 2학년 확률 탐구 보고서에서 잘 쓴 글을 찾는 선생님을 돕는 AI이다.
아래 기준 4개로 학생 보고서를 판단한다. 반드시 학생 글에 실제로 있는 내용만 근거로 삼는다.

${CRITERIA}

[출력 — JSON]
- checks: ["O"|"X", 4개] — 순서대로 질문, 자료, 분석, 해석
- why: [문자열 4개] — 각 기준의 판단 근거를 25자 이내로. O면 무엇을 잘했는지, X면 무엇이 없는지.
- strength: "q"|"d"|"a"|"i"|"" — O인 기준 중 다른 학생이 가장 배울 만한 강점 하나. O가 없으면 "".
- line: 선생님이 볼 한 줄 요약(30자 이내). 학생 글의 핵심 장점을 구체적으로. (예: "5월 경주 자료만 골라 계산함")

[학생 보고서]
{{학생보고서}}`;

const COMPARE_PROMPT = `너는 중학교 2학년 확률 탐구 보고서 두 편을 비교하는 선생님을 돕는 AI이다.
다른 반 학생들에게 "이렇게 쓰면 좋다"는 예시로 보여 주기에 어느 글이 더 좋은지 하나만 고른다.
아래 기준을 참고하되, 항목을 세지 말고 글 전체의 완성도(질문→자료→계산→해석→결론이 한 흐름으로 이어지는지, 읽는 학생이 배울 점이 분명한지)로 판단한다.
글이 길다는 이유만으로 고르지 않는다.

${CRITERIA}

[출력 — JSON]
- win: "a" 또는 "b"
- why: 고른 이유 40자 이내

[보고서 a]
{{A}}

[보고서 b]
{{B}}`;

const JUDGE_FORMAT = { type: 'json_schema', json_schema: { name: 'best_judge', strict: true, schema: {
  type: 'object', additionalProperties: false, required: ['checks', 'why', 'strength', 'line'],
  properties: {
    checks: { type: 'array', items: { type: 'string', enum: ['O', 'X'] } },
    why: { type: 'array', items: { type: 'string' } },
    strength: { type: 'string', enum: ['q', 'd', 'a', 'i', ''] },
    line: { type: 'string' } } } } };
const COMPARE_FORMAT = { type: 'json_schema', json_schema: { name: 'best_compare', strict: true, schema: {
  type: 'object', additionalProperties: false, required: ['win', 'why'],
  properties: { win: { type: 'string', enum: ['a', 'b'] }, why: { type: 'string' } } } } };

module.exports = async (req, res) => {
  if (require('./_guard').blockForeign(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};

  if (b.mode === 'compare') {
    const A = parseReport(b.a), B = parseReport(b.b);
    if (A.empty || B.empty) { res.status(400).json({ error: '비교할 보고서가 비어 있습니다.' }); return; }
    const prompt = COMPARE_PROMPT.replace('{{A}}', () => A.report).replace('{{B}}', () => B.report);
    const r = await callOpenAI(prompt, { maxTokens: 6000, responseFormat: COMPARE_FORMAT, effort: 'low' });
    if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
    const j = parseJSON(r.text);
    if (!j || !['a', 'b'].includes(j.win)) { res.status(502).json({ error: 'AI 비교 결과를 해석하지 못했어요.' }); return; }
    res.status(200).json({ win: j.win, why: String(j.why || '').slice(0, 80), model: r.model });
    return;
  }

  const rep = parseReport(b);
  if (rep.empty) { res.status(400).json({ error: '판단할 보고서 내용이 비어 있습니다.' }); return; }
  const r = await callOpenAI(JUDGE_PROMPT.replace('{{학생보고서}}', () => rep.report), { maxTokens: 8000, responseFormat: JUDGE_FORMAT, effort: 'medium' });
  if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
  const j = parseJSON(r.text);
  if (!j || !Array.isArray(j.checks)) { res.status(502).json({ error: 'AI 판단 결과를 해석하지 못했어요.' }); return; }
  const checks = [0, 1, 2, 3].map(i => j.checks[i] === 'O' ? 'O' : 'X').join('');
  const why = [0, 1, 2, 3].map(i => String((j.why || [])[i] || '').slice(0, 60));
  let strength = ['q', 'd', 'a', 'i'].includes(j.strength) ? j.strength : '';
  if (strength && checks['qdai'.indexOf(strength)] !== 'O') strength = (['q', 'd', 'a', 'i'].find((k, i) => checks[i] === 'O') || '');
  res.status(200).json({ checks, why, strength, line: String(j.line || '').slice(0, 60), model: r.model });
};
