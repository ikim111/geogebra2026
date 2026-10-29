// 🔎 2026-10-29 채점 근거 문장 (23번 2부 교사 화면 tpa3에서 부른다)
// 이미 정해진 ○✕(교사가 고친 것 포함)를 받아, 항목마다 그렇게 판단한 근거가 되는 학생 글을 글자 그대로 짧게 인용한다.
// 점수·○✕는 바꾸지 않는다. ✕ 항목은 "무엇이 없는지/틀린 곳"을 보여 주는 문장, 없으면 빈 칸.
// 글자 수 항목(글의 논리 1~3)은 프로그램이 센 숫자를 화면에서 보여 주므로 여기서는 묻지 않는다.
// 요청: { title, intro, body, concl, sources, checks:{question:'OOX', data:'OOO', analysis:'OOXO', logic:'OOOOO'} }
// 응답: { ev:{question:['','',''], data:[...3], analysis:[...4], logic:['','','','',''] }, model }
const { parseReport, callOpenAI, parseJSON } = require('./_report-common');

const ITEMS = {
  question: ['탐구 질문을 썼다', '확률을 구하는 질문이다', '예측형 또는 비교·선택형 질문이다'],
  data: ['자료 1이 탐구 질문에 맞다', '자료 2가 질문에 맞고 자료 1과 다른 정보다', '확률 계산에 필요한 수치를 모두 얻을 수 있다'],
  analysis: ['자료 1의 수치를 본론에 활용했다', '자료 2의 수치를 본론에 활용했다', '확률의 분자·분모를 올바르게 정했다', '분수·소수로 올바르게 계산했다'],
  logic: ['서론 150자 이상', '본론 500자 이상', '결론 150자 이상', '확률값의 뜻을 알맞게 해석했다', '결론에 탐구 질문의 답이 있다']
};
const ID = { question: 'q', data: 'd', analysis: 'a', logic: 'l' };

module.exports = async (req, res) => {
  if (require('./_guard').blockForeign(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const rep = parseReport(b);
  if (rep.empty) { res.status(400).json({ error: '보고서 내용이 비어 있습니다.' }); return; }
  const checks = b.checks || {};
  const lines = [], ids = [];
  for (const k of Object.keys(ITEMS)) {
    const c = String(checks[k] || '');
    ITEMS[k].forEach((t, i) => {
      if (k === 'logic' && i < 3) return;
      const ox = c[i] === 'O' ? 'O' : c[i] === 'X' ? 'X' : '';
      if (!ox) return;
      const id = ID[k] + (i + 1); ids.push(id);
      lines.push(`${id} [${ox === 'O' ? '○ 맞음' : '✕ 아님'}] ${t}`);
    });
  }
  if (!ids.length) { res.status(400).json({ error: '판정(○✕)이 없습니다.' }); return; }
  const prompt = `너는 중학교 2학년 확률 탐구 보고서 채점 결과에 근거 문장을 붙이는 도우미이다.
아래 항목마다 이미 ○ 또는 ✕로 판정되어 있다. 판정은 바꾸지 않는다.
항목마다 그 판정의 근거가 되는 학생 글의 일부를 **글자 그대로** 인용한다. 문장 전체가 아니라 판정에 꼭 필요한 핵심 부분만 짧게(10~40자) 잘라 인용한다(2026-10-29 표에서 읽기 쉽게).
- 같은 문장을 여러 항목에 되풀이하지 말고, 항목마다 그 기준에 해당하는 부분을 골라 인용한다(예: 질문 항목 2는 '확률' 부분, 3은 '어느 것이 더' 부분).
- ○ 항목: 그 기준을 만족한다는 것을 보여 주는 문장(예: 질문 문장, 자료에서 쓴 수치, 계산식, 해석 문장).
- ✕ 항목: 문제가 드러나는 문장(예: 잘못 정한 분모가 나온 문장). 빠져서 인용할 문장이 없으면 빈 문자열.
- 학생 글에 없는 문장을 지어내지 않는다. 고쳐 쓰거나 줄여 쓰지 않는다. 띄어쓰기·맞춤법이 틀려도 그대로 옮긴다.
- 자료 항목은 [자료 출처]의 이름이나, 본론에서 그 자료를 쓴 문장을 인용해도 된다.

[항목]
${lines.join('\n')}

[학생 보고서]
${rep.report}`;
  const FORMAT = { type: 'json_schema', json_schema: { name: 'evidence', strict: true, schema: {
    type: 'object', additionalProperties: false, required: ['quotes'],
    properties: { quotes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'quote'],
      properties: { id: { type: 'string', enum: ids }, quote: { type: 'string' } } } } } } } };
  const r = await callOpenAI(prompt, { maxTokens: 6000, responseFormat: FORMAT, effort: 'low' });
  if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
  const j = parseJSON(r.text);
  if (!j || !Array.isArray(j.quotes)) { res.status(502).json({ error: '근거 결과를 해석하지 못했어요.' }); return; }
  const ev = { question: ['', '', ''], data: ['', '', ''], analysis: ['', '', '', ''], logic: ['', '', '', '', ''] };
  const KEY = { q: 'question', d: 'data', a: 'analysis', l: 'logic' };
  const all = [rep.report].join('');
  j.quotes.forEach(x => {
    const m = /^([qdal])(\d)$/.exec(String(x && x.id || '')); if (!m) return;
    const k = KEY[m[1]], i = +m[2] - 1; let q = String(x.quote || '').replace(/\*\*/g, '').trim().slice(0, 80);
    if (q && !all.includes(q)) q = '';   // 글에 그대로 없는 인용은 버린다(지어낸 문장 방지)
    if (ev[k][i] !== undefined) ev[k][i] = q;
  });
  res.status(200).json({ ev, model: r.model });
};
