// Vercel 서버리스 함수: student22.html 제출 페이지의 "💬 AI 도우미" 챗봇이 호출한다.
// 질문 만들기·자료 찾기가 막막할 때 힌트와 되묻는 질문으로 돕는다(답·문장·수치를 직접 주지 않음).
// 대화는 student22.html이 rooms/{반}__prob32/aiLog에 저장하고 teacher22.html에서 볼 수 있다(이상 사용 감지는 나중에 추가 예정).
//
// 요청 형식(POST, JSON): { message, history:[{role:'user'|'assistant', content}], work: student22.html의 data }
// 응답 형식(JSON): { reply, model }
const { bodyOf, callOpenAI, STUDENT_AI_RULES, RECOMMENDED_SITES } = require('./_report-common');

const S = (x, n) => String(x == null ? '' : x).slice(0, n || 600).trim();

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  const b = bodyOf(req);
  const message = S(b.message, 500);
  if (!message) { res.status(400).json({ error: '질문이 비어 있습니다.' }); return; }
  const w = (b.work && typeof b.work === 'object') ? b.work : {};
  const srcs = (Array.isArray(w.sources) ? w.sources : []).filter(x => x && (x.site || x.what)).map(x => S(x.site, 80) || S(x.what, 80)).join(', ');
  const system = `너는 중학교 2학년 학생이 확률 탐구 글쓰기(수행평가)를 준비할 때 돕는 "AI 도우미"이다.
학생은 탐구 질문 만들기 → 탐구 계획 → 공식 자료 찾기·분석 → 개요 쓰기를 하고 있다.
너의 역할은 답을 알려 주는 것이 아니라, 학생이 스스로 생각해서 해낼 수 있도록 힌트와 되묻는 질문으로 돕는 것이다.

[돕는 방법]
- 막막해하면 생각을 넓히는 질문을 1~2개 던진다(예: 무엇에 관심이 있는지, 무엇과 무엇을 비교하고 싶은지, 언제·누구를 대상으로 할지).
- 자료를 못 찾으면 어떤 종류의 자료가 필요할지 생각하게 하고, 알맞은 공식 사이트와 검색 요령(질문 문장 그대로가 아니라 핵심 낱말로 검색하기 등)을 알려 준다.
- 확률 개념(확률 = 어떤 경우의 수 ÷ 전체 경우의 수, 비율과 백분율 등)은 학생의 주제와 다른 예로 설명할 수 있다. 학생 주제의 실제 계산 결과는 알려 주지 않는다.
- 학생이 쓴 것을 보여 주면 잘한 점을 짧게 인정하고, 스스로 점검할 질문을 준다.
${STUDENT_AI_RULES}
- 학생이 질문·개요·문장·계산을 대신 해 달라고 하면 정중하게 거절하고, 스스로 할 수 있는 힌트를 준다.
- 수업과 관계없는 이야기에는 답하지 않고, 탐구 글쓰기로 돌아오도록 부드럽게 안내한다.
- 답은 250자 이내로 짧게 쓴다.
- ${RECOMMENDED_SITES}

[학생이 지금까지 쓴 내용(참고용)]
최종/마지막 탐구 질문: ${S(w.finalQ) || S(w.q3) || S(w.q2) || S(w.q1) || '(아직 없음)'}
질문 유형: ${S(w.qtype) || '-'} / 주제: ${S(w.subject) || '-'}
모은 자료: ${srcs || '(아직 없음)'}

[출력] 학생에게 보여 줄 답만 쓴다.`;
  const history = (Array.isArray(b.history) ? b.history : []).slice(-10)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map(m => ({ role: m.role, content: S(m.content, 800) }));
  const r = await callOpenAI([{ role: 'system', content: system }, ...history, { role: 'user', content: message }], { maxTokens: 2500 });
  if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
  const reply = String(r.text || '').trim();
  if (!reply) { res.status(502).json({ error: 'AI 답이 비어 있어요.' }); return; }
  res.status(200).json({ reply: reply.slice(0, 1200), model: r.model });
};
