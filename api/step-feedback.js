// Vercel 서버리스 함수: student22.html 각 step의 "🤖 AI 피드백 받기" 버튼이 호출한다.
// 학생이 지금 step에 적은 내용을 채점 기준에 비추어 확인하고, 잘한 점(칭찬)과 보완할 점을 짧게 돌려준다.
// 보완할 점이 없으면 빈 목록을 돌려준다(학생 화면에 "보완할 점이 없어요"로 표시).
//
// 요청 형식(POST, JSON): { step: 1~4, data: student22.html의 data }
// 응답 형식(JSON): { good:[문장], fix:[문장], model }
const { bodyOf, callOpenAI, parseJSON, bannedSourceKind, STUDENT_AI_RULES, RECOMMENDED_SITES } = require('./_report-common');

const S = x => String(x == null ? '' : x).slice(0, 3000).trim();
const SELF = ['확률과 연관된 질문인가?', '선택한 주제/유형에 적합한 질문인가?', '질문이 충분히 구체적인가?', '자료 수집(검색)이 가능한가?', '단순한 사실 확인을 넘어서는 질문인가?', '윤리적으로 올바른가?'];
const DATA = ['최신성', '신뢰성', '관련성', '필요성'];

const STEPS = {
  1: { name: 'step1 탐구 질문 만들기',
    // 선생님 지정(2026-10-06): step1에서는 아래 3가지만 중점적으로 본다. 자료를 찾아보라는 말은 하지 않는다(그건 step3).
    check: `이 단계에서는 아래 3가지만 중점적으로 본다(다른 것은 지적하지 않는다).
(1) 질문 유형 선택: 고른 유형이 질문과 맞는가?
    · 예측형 = "~할 확률은 얼마일까?"처럼 한 가지 사건의 확률을 구하는 질문
    · 비교/선택형 = "A와 B 중 어느 것이 확률이 높을까?"처럼 둘 이상을 비교하는 질문
    유형을 안 골랐거나 질문과 맞지 않으면 보완할 점으로 알려 준다.
(2) 질문의 명료화·구체화: 1차 → 2차 → 3차로 갈수록 질문이 분명하고 구체적으로 다듬어졌는가?
    (누구·무엇을 대상으로, 언제·어떤 조건에서의 확률인지가 드러나는가? 뜻이 애매한 낱말은 없는가?)
(3) 현실성: 현실적으로 확률을 구할 수 있는 질문인가?
    (공식 통계나 기록을 바탕으로 확률을 구할 수 있는 사건인가? 너무 막연하거나, 개인의 마음·취향처럼 셀 수 없는 것이거나, 관련 기록이 있을 수 없는 질문은 아닌가? 앞으로 일어날 일을 예측하는 질문도 지난 기록으로 확률을 구할 수 있으면 괜찮다.)
※ 지금은 질문을 만드는 단계이다. "자료를 찾아보세요", "기록을 조사해 보세요"처럼 자료 조사를 하라는 말은 하지 않는다.
※ 질문 선정 동기, 체크리스트 자기 평가는 참고만 하고 평가하지 않는다.`,
    text: d => `관심사: ${S(d.topicInterest) || '-'} / 진로: ${S(d.topicCareer) || '-'} / 취미: ${S(d.topicHobby) || '-'}
질문 유형: ${S(d.qtype) || '(안 고름)'}
주제: ${S(d.subject) || '-'}
1차 질문: ${S(d.q1) || '-'}
2차 질문: ${S(d.q2) || '-'}
3차 질문: ${S(d.q3) || '-'}
질문 선정 동기: ${S(d.motive) || '-'}
학생의 자기 평가: ${SELF.map((t, i) => `${t} ${({ O: '○', '△': '△', X: '✕' })[String(d.selfCheck || '')[i]] || '-'}`).join(' / ')}` },
  2: { name: 'step2 탐구 계획하기',
    // 선생님 요청(2026-10-06 "계획 짜는데 너무 까다롭다"): 칸이 채워져 있고 크게 어긋나지 않으면 인정. 더 잘 쓰는 법은 지적하지 않는다.
    check: `계획 단계이므로 아주 너그럽게 본다. 아래 칸이 채워져 있고 탐구 질문과 크게 어긋나지 않으면 모두 잘한 것으로 인정한다.
- 최종 탐구 질문이 적혀 있는가?
- 계획 1(무엇을 조사해 어떻게 결론을 낼지), 계획 2(확률 계산식), 계획 3(조사할 수 없는 변수·한계점)이 한 줄이라도 적혀 있는가?
  (계산식은 "무엇 ÷ 무엇" 정도로 드러나면 충분하다. 한계점은 적기만 했으면 되고 보완 방법까지 요구하지 않는다. 결론을 내는 비교 기준을 자세히 요구하지 않는다.)
- 자료 수집 계획에 필요한 자료와 찾을 곳이 1줄 이상 적혀 있는가? 찾을 곳이 블로그·카페·커뮤니티·위키·지식iN·유튜브·AI 글이면 공식 사이트로 바꾸라고 알려 준다.
- 예상 결과가 적혀 있는가?
보완할 점(fix)은 ① 빈 칸이 있을 때 ② 계산식이 탐구 질문과 전혀 관계없을 때 ③ 찾을 곳이 인정되지 않는 출처일 때에만 쓴다. 이 밖의 "더 자세히 쓰면 좋겠다" 같은 지적은 하지 않는다.`,
    text: d => `최종 탐구 질문: ${S(d.finalQ) || '-'}
1. 무엇을 조사해 어떻게 결론을 낼지: ${S(d.plan1) || '-'}
2. 확률 계산식: ${S(d.plan2) || '-'}
3. 변수·한계·보정 계획: ${S(d.plan3) || '-'}
자료 수집 계획: ${(Array.isArray(d.planRows) ? d.planRows : []).filter(r => r && (S(r.need) || S(r.where))).map((r, i) => `(${i + 1}) 필요 자료: ${S(r.need) || '-'} / 찾을 곳: ${S(r.where) || '-'}`).join(' ') || '-'}
예상 결과: ${S(d.expect) || '-'}` },
  3: { name: 'step3 자료 수집, 분석하기',
    check: `- 서로 다른 자료가 2개 이상인가?
- 자료마다 출처(사이트·자료 이름)와 확인할 수 있는 링크가 있는가?
- 공공기관·공식 통계·공식 기록 자료인가? 블로그·카페·커뮤니티·SNS·위키·질문답변 사이트(지식iN)·유튜브·개인 글·AI 생성글은 자료로 인정되지 않는다(프로그램 판단 표시가 있으면 그대로 따른다). 그런 자료가 있으면 반드시 보완할 점으로 알려 준다("자료 조사를 하지 않은 것으로 봐요").
- 분석에 자료에서 알아낸 사실·수치, 그리고 확률 계산이나 그 의미가 들어 있는가?
- 자료가 탐구 질문과 관련 있는가?
(링크가 실제로 그 자료인지는 확인할 수 없으므로 판단하지 않는다.)`,
    text: d => `최종 탐구 질문: ${S(d.finalQ) || S(d.q3) || S(d.q2) || S(d.q1) || '-'}
${(Array.isArray(d.sources) ? d.sources : []).filter(x => x && (S(x.what) || S(x.site) || S(x.link) || S(x.analysis))).map((x, i) => {
  const bl = bannedSourceKind(x.link, x.site);
  return `[자료 ${i + 1}] 수집한 자료: ${S(x.what) || '-'} / 출처: ${S(x.site) || '-'} / 링크: ${S(x.link) || '(없음)'}${bl ? ` ← 프로그램 판단: ${bl}(자료로 인정 안 됨)` : ''}\n분석: ${S(x.analysis) || '-'}`; }).join('\n') || '(자료 없음)'}
학생의 자료 점검 체크: ${DATA.map((t, i) => `${t} ${String(d.dataCheck || '')[i] === '1' ? '☑' : '☐'}`).join(' ')}` },
  4: { name: 'step4 개요 작성하기',
    check: `개요는 키워드·핵심 문장 위주의 짧은 정리이므로 문장 완성도는 보지 않는다. 다음 내용이 개요에 들어 있는지 본다.
- 제목에 탐구 질문이 드러나는가?
- 서론: 질문 선정 동기, 무엇을 알아보고 싶은지, 사용할 자료 소개
- 본론: 2개 이상의 공식 자료와 출처, 자료 분석, 확률 계산과 그 의미 해석
- 결론: 탐구 질문에 대한 최종 답, 한계점, 추가로 고려할 변수·더 알아보고 싶은 점
(실제 보고서는 서론 200자·본론 500자·결론 200자 이상, 합계 1000자 이상으로 쓴다.)`,
    text: d => `최종 탐구 질문: ${S(d.finalQ) || '-'}
제목: ${S(d.oTitle) || '-'}
서론 개요: ${S(d.oIntro) || '-'}
본론 개요: ${S(d.oBody) || '-'}
결론 개요: ${S(d.oConcl) || '-'}
(참고 — step3에서 모은 자료: ${(Array.isArray(d.sources) ? d.sources : []).filter(x => x && (S(x.site) || S(x.what))).map(x => S(x.site) || S(x.what)).join(', ') || '없음'})` }
};

const item = { type: 'array', items: { type: 'string' } };
const RESPONSE_FORMAT = { type: 'json_schema', json_schema: { name: 'step_feedback', strict: true, schema: {
  type: 'object', additionalProperties: false, required: ['good', 'fix'], properties: { good: item, fix: item } } } };

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  const b = bodyOf(req);
  const st = STEPS[parseInt(b.step, 10)];
  if (!st) { res.status(400).json({ error: 'step이 올바르지 않습니다.' }); return; }
  const d = (b.data && typeof b.data === 'object') ? b.data : {};
  const prompt = `너는 중학교 2학년 학생의 확률 탐구 글쓰기(수행평가) 준비를 도와주는 AI 피드백 도우미이다.
학생이 지금 "${st.name}" 단계에 적은 내용을 아래 확인 기준에 비추어 보고 피드백한다.
피드백이란 잘한 점은 칭찬하고, 아쉬운 점은 보완하라고 알려 주는 것이다.

[원칙]
${STUDENT_AI_RULES}
- 중학교 2학년 수준에 맞게 너그럽게 본다. 기준에 해당하는 내용이 들어 있으면 잘한 것으로 인정한다. 전문적인 통계 개념으로 지적하지 않는다.
- 보완할 점은 빠졌거나 분명히 잘못된 것만 쓴다. "더 자세히", "더 분명하게"처럼 이미 쓴 것을 더 잘 쓰라는 지적은 하지 않는다(단, 확인 기준에 그런 항목이 직접 적혀 있으면 그것만 본다).
- 보완할 점은 "무엇이 부족한지"만 알려 주고, 학생이 스스로 고칠 수 있게 짧은 질문이나 힌트를 덧붙인다. 고쳐 쓴 문장을 주지 않는다.
- 아쉬운 점이 없으면 보완할 점(fix)을 빈 목록 []으로 둔다. 억지로 만들지 않는다.
- 지금 단계에서 할 일만 피드백한다. 다음 단계에서 할 일(자료를 직접 찾기·분석하기·보고서 쓰기 등)을 하라고 하지 않는다.
- 아래 [확인 기준]에 없는 내용은 지적하지 않는다.
- 학생이 아직 거의 쓰지 않았으면 good은 빈 목록으로 두고, fix에 무엇부터 쓰면 좋을지 알려 준다.
- 맞춤법·오타는 지적하지 않는다.
- ${RECOMMENDED_SITES}

[확인 기준 — ${st.name}]
${st.check}

[출력]
JSON 하나만 출력한다: {"good":["잘한 점"], "fix":["보완할 점"]}
- good 최대 2개, fix 최대 2개. 각 문장은 80자 이내.

[학생이 적은 내용]
${st.text(d)}`;
  const r = await callOpenAI(prompt, { maxTokens: 3000, responseFormat: RESPONSE_FORMAT });
  if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
  const j = parseJSON(r.text);
  if (!j) { res.status(502).json({ error: 'AI 피드백을 해석하지 못했어요.' }); return; }
  const clean = a => (Array.isArray(a) ? a : []).map(x => String(x || '').trim()).filter(Boolean).slice(0, 3).map(x => x.slice(0, 200));
  res.status(200).json({ good: clean(j.good).slice(0, 2), fix: clean(j.fix), model: r.model });
};
