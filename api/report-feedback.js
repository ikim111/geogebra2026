// Vercel 서버리스 함수: teacher23.html의 "🤖 AI 피드백 보내기" 버튼이 호출하는 엔드포인트.
// 학생 보고서(제목·서론·본론·결론)를 받아, 선생님이 정한 프롬프트(아래 PROMPT_TEMPLATE)로
// OpenAI에게 피드백을 받아 돌려준다. (API 키는 브라우저에 노출되지 않도록 이 서버 함수 안에서만 사용)
//
// [설정 방법] Vercel 프로젝트 > Settings > Environment Variables 에
//   OPENAI_API_KEY = platform.openai.com 에서 발급한 API 키   (필수)
//   OPENAI_MODEL   = 사용할 모델 ID                           (선택, 비우면 DEFAULT_MODEL)
// 을 등록하고 재배포(Redeploy)하면 적용된다. OpenAI API는 무료로 쓸 수 없어서 platform.openai.com
// > Settings > Billing 에서 크레딧을 먼저 충전해야 한다.
//
// 요청 형식(POST, JSON): { title, intro, body, concl, sources:[{name, link}] }
// 응답 형식(JSON): { text, counts:{title,intro,body,concl,total}, model }
// - 글자 수는 띄어쓰기 포함, 연달아 친 띄어쓰기는 1자, 줄바꿈·줄 앞뒤 공백 제외(student23.html과 같은 방식).
//   AI는 글자 수를 정확히 세지 못하므로, 서버에서 센 글자 수를 보고서 끝에 함께 적어 보낸다
//   (채점 기준 4의 "1000자 이상 작성되었는가?"를 AI가 정확하게 판단할 수 있게).

// 가장 저렴한 최신 모델(2026-10 기준 입력 100만 토큰당 $0.10, 출력 $0.50 — 보고서 1편 피드백에 약 2~3원).
// 더 꼼꼼한 피드백을 원하면 Vercel 환경변수 OPENAI_MODEL에 더 큰 모델 ID를 넣으면 된다.
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
- 출처는 기관명이나 자료 이름만 있어도 출처를 밝힌 것으로 인정한다. 링크나 연도가 빠진 것은 보완할 점으로 알려 주되 감점은 최대 1점으로 한다.
- 자료가 조금 오래되었거나 조건이 학생의 질문과 완전히 일치하지 않는 정도는 감점하지 않고 보완할 점으로만 알려 준다.
- 감점은 다음처럼 분명한 문제가 있을 때만 한다: 확률·통계와 관련 없는 질문, 자료가 1개뿐이거나 출처가 전혀 없음, 수치를 나열만 하고 확률 계산·해석이 전혀 없음, 결론이 앞의 자료와 관계없음, 1000자 미만.
- 점수 판단 기준(참고)
  · 탐구 질문(3점): 확률과 관련되고 자료로 답을 찾을 수 있으면 3점, 질문이 다소 모호하면 2점, 확률과 관련이 거의 없거나 단순 사실 확인이면 1점.
  · 자료 수집(3점): 믿을 만한 곳의 서로 다른 자료 2개 이상 + 출처 제시면 3점, 출처 표시가 일부 부족하면 2점, 자료가 1개뿐이거나 출처를 알 수 없으면 1점.
  · 자료 분석(4점): 자료의 수치로 확률을 계산하고 그 의미를 해석했으면 4점, 계산은 했지만 해석이 부족하거나 작은 오류가 있으면 3점, 수치 소개 위주이고 분석이 적으면 2점, 분석이 거의 없으면 1점.
  · 글의 논리(5점): 서론-본론-결론이 갖춰져 있고 결론이 자료에 근거하며 1000자 이상이면 5점, 흐름이 일부 어색하면 4점, 결론과 근거의 연결이 약하면 3점, 구성이 많이 부족하면 2점 이하. 1000자 미만이면 1점 감점.


[채점 기준]

총점은 15점이다.

1. 적절한 탐구 질문 형성: 3점
- 탐구 질문이 확률 또는 통계와 관련되어 있는가?
- 실제 자료를 수집하여 탐구할 수 있는 질문인가?
- 이후 수집한 자료와 분석 내용이 탐구 질문과 연결되는가?

2. 신뢰성 있는 자료 수집: 3점
- 서로 다른 자료를 2개 이상 활용했는가?
- 자료의 출처가 제시되어 있는가?
- 공공기관, 연구기관, 신뢰할 수 있는 언론이나 통계 자료 등 믿을 만한 자료인가?

3. 자료의 타당한 분석: 4점
- 자료를 소개하는 데 그치지 않고 특징, 차이, 경향 등을 설명하고 있는가?
- 자료의 수치를 이용해 확률을 계산하거나 확률의 의미를 해석하고 있는가?
- 분석 내용이 탐구 질문과 관련되어 있는가?

4. 글의 논리적 완성: 5점
- 글 전체가 탐구 질문에 대한 답을 찾아가는 방향으로 작성되어 있는가?
- 서론, 본론, 결론의 흐름이 자연스러운가?
- 결론이 앞에서 분석한 자료를 바탕으로 작성되어 있는가?
- 1000자 이상 작성되었는가? (글자 수는 보고서 끝에 프로그램이 센 값을 그대로 믿는다.)


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

const countChars = s => Array.from(String(s == null ? '' : s).split(/\r?\n/).map(l => l.replace(/[\s\u3000]+/g, ' ').trim()).join('')).length;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 지원합니다.' });
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다. Vercel 프로젝트 환경변수를 확인해주세요.' });
    return;
  }
  const model = (process.env.OPENAI_MODEL || DEFAULT_MODEL).trim();

  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { b = {}; }
  }
  b = b || {};
  const pick = k => String(b[k] == null ? '' : b[k]).slice(0, MAX_FIELD).trim();
  const title = pick('title'), intro = pick('intro'), body = pick('body'), concl = pick('concl');
  if (!intro && !body && !concl) {
    res.status(400).json({ error: '피드백할 보고서 내용이 비어 있습니다.' });
    return;
  }

  const sources = (Array.isArray(b.sources) ? b.sources : []).slice(0, 15)
    .map(x => ({ name: String((x && x.name) || '').slice(0, 300).trim(), link: String((x && x.link) || '').slice(0, 500).trim() }))
    .filter(x => x.name || x.link);
  const counts = { title: countChars(title), intro: countChars(intro), body: countChars(body), concl: countChars(concl) };
  counts.total = counts.intro + counts.body + counts.concl;
  const none = '(작성하지 않음)';
  const report =
    `[제목]\n${title || none}\n\n` +
    `[서론]\n${intro || none}\n\n` +
    `[본론]\n${body || none}\n\n` +
    `[결론]\n${concl || none}\n\n` +
    `[자료 출처] (글자 수에 포함하지 않음)\n${sources.length ? sources.map((x, i) => `${i + 1}. ${x.name || '(이름 없음)'}${x.link ? ' — ' + x.link : ' (링크 없음)'}`).join('\n') : none}\n\n` +
    `(참고 — 프로그램이 센 글자 수, 띄어쓰기 포함: 서론 ${counts.intro}자, 본론 ${counts.body}자, 결론 ${counts.concl}자, 서론+본론+결론 합계 ${counts.total}자)`;
  // replace에 함수를 넘겨서 학생 글 속의 $& 같은 특수 패턴이 해석되지 않게 한다.
  const prompt = PROMPT_TEMPLATE.replace('{{학생보고서}}', () => report);

  // OpenAI Chat Completions 호출. 추론(reasoning) 모델이면 추론을 '낮음'으로 해서 빠르고 싸게.
  // 모델이 reasoning_effort를 지원하지 않아 400이 나면 그 옵션을 빼고 한 번 더 시도한다.
  const call = (withEffort) => fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(Object.assign(
      { model, messages: [{ role: 'user', content: prompt }], max_completion_tokens: 6000 },
      withEffort ? { reasoning_effort: 'low' } : {}
    ))
  });

  try {
    let r = await call(true);
    if (r.status === 400) {
      const t = await r.text();
      if (/reasoning/i.test(t)) r = await call(false);
      else { res.status(502).json({ error: 'OpenAI API 호출 실패', detail: t.slice(0, 1000) }); return; }
    }
    if (!r.ok) {
      const errText = await r.text();
      let hint = '';
      if (r.status === 401) hint = ' (API 키가 올바르지 않아요)';
      else if (r.status === 429) hint = /quota|billing/i.test(errText) ? ' (크레딧이 없거나 사용 한도를 넘었어요 — OpenAI 결제를 확인하세요)' : ' (요청이 너무 많아요 — 잠시 후 다시 시도하세요)';
      else if (r.status === 404) hint = ` (모델 '${model}'을 쓸 수 없어요 — OPENAI_MODEL을 확인하세요)`;
      res.status(502).json({ error: 'OpenAI API 호출 실패' + hint, detail: errText.slice(0, 1000) });
      return;
    }
    const data = await r.json();
    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    const text = (msg && typeof msg.content === 'string') ? msg.content.trim() : '';
    if (!text) {
      const why = data && data.choices && data.choices[0] && data.choices[0].finish_reason;
      res.status(502).json({ error: 'OpenAI 응답에 피드백이 없습니다.' + (why ? ` (finish_reason: ${why})` : '') });
      return;
    }
    res.status(200).json({ text, counts, model: data.model || model });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
};
