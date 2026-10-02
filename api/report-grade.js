// Vercel 서버리스 함수: teacher23.html의 "🤖 AI 채점" 버튼이 호출하는 엔드포인트.
// 학생 보고서를 4개 채점 요소(탐구 질문 3, 자료 수집 3, 자료 분석 4, 글의 논리 5 — 총 15점)로
// 1차 채점해 점수와 이유(선생님용)를 돌려준다. 최종 점수는 선생님이 teacher23.html에서 항목별로 고친다.
// 채점 기준은 학생 피드백과 같은 것(_report-common.js의 [중학교 2학년 수준에 맞춘 채점]·[채점 기준])을 쓴다.
//
// 요청 형식(POST, JSON): { title, intro, body, concl, sources:[{name, link}] }
// 응답 형식(JSON): { scores:{question,data,analysis,logic}, reasons:{...}, total, counts, model }
const { parseReport, callOpenAI, rubricText } = require('./_report-common');

const CRITERIA = { question: 3, data: 3, analysis: 4, logic: 5 };

const PROMPT = `너는 중학교 2학년 확률·통계 탐구 보고서를 채점하는 선생님을 돕는 1차 채점자이다.
아래 기준으로 학생 보고서를 채점한다. 최종 점수는 선생님이 확인하고 고친다.

` + rubricText() + `


[출력 — 반드시 지킨다]
- 아래 JSON 하나만 출력한다. 다른 글은 쓰지 않는다.
- score는 정수이다. question 0~3, data 0~3, analysis 0~4, logic 0~5.
- reason은 선생님이 보는 채점 이유이다. 학생 글의 구체적인 부분을 근거로 1~2문장(80자 이내)으로 쓴다.
{"question":{"score":0,"reason":""},"data":{"score":0,"reason":""},"analysis":{"score":0,"reason":""},"logic":{"score":0,"reason":""}}


학생의 보고서:
{{학생보고서}}`;

const item = { type: 'object', properties: { score: { type: 'integer' }, reason: { type: 'string' } }, required: ['score', 'reason'], additionalProperties: false };
const RESPONSE_FORMAT = { type: 'json_schema', json_schema: { name: 'report_grade', strict: true, schema: {
  type: 'object', additionalProperties: false, required: Object.keys(CRITERIA),
  properties: Object.fromEntries(Object.keys(CRITERIA).map(k => [k, item])) } } };

function parseJSON(text) {
  try { return JSON.parse(text); } catch (e) {}
  const m = String(text).match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  const rep = parseReport(req.body);
  if (rep.empty) { res.status(400).json({ error: '채점할 보고서 내용이 비어 있습니다.' }); return; }
  const prompt = PROMPT.replace('{{학생보고서}}', () => rep.report);
  const r = await callOpenAI(prompt, { maxTokens: 4000, responseFormat: RESPONSE_FORMAT });
  if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
  const j = parseJSON(r.text);
  if (!j) { res.status(502).json({ error: 'AI 채점 결과를 해석하지 못했어요.', raw: r.text.slice(0, 500) }); return; }
  const scores = {}, reasons = {};
  let total = 0;
  for (const [k, max] of Object.entries(CRITERIA)) {
    const e = j[k] || {};
    let sc = parseInt(e.score, 10);
    if (!Number.isFinite(sc)) sc = 0;
    sc = Math.max(0, Math.min(max, sc)); // 범위를 벗어난 값은 잘라낸다
    scores[k] = sc; reasons[k] = String(e.reason || '').slice(0, 300);
    total += sc;
  }
  res.status(200).json({ scores, reasons, total, counts: rep.counts, model: r.model });
};
