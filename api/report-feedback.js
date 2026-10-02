// Vercel 서버리스 함수: teacher33.html의 "🤖 AI 피드백 보내기" 버튼이 호출하는 엔드포인트.
// 학생 보고서(제목·서론·본론·결론)를 받아, 선생님이 정한 프롬프트(아래 PROMPT_TEMPLATE)로
// OpenAI에게 피드백을 받아 돌려준다. (API 키는 브라우저에 노출되지 않도록 이 서버 함수 안에서만 사용)
//
// [설정 방법] Vercel 프로젝트 > Settings > Environment Variables 에
//   OPENAI_API_KEY = platform.openai.com 에서 발급한 API 키   (필수)
//   OPENAI_MODEL   = 사용할 모델 ID                           (선택, 비우면 DEFAULT_MODEL)
// 을 등록하고 재배포(Redeploy)하면 적용된다. OpenAI API는 무료로 쓸 수 없어서 platform.openai.com
// > Settings > Billing 에서 크레딧을 먼저 충전해야 한다.
//
// 요청 형식(POST, JSON): { title, intro, body, concl }
// 응답 형식(JSON): { text, counts:{title,intro,body,concl,total}, model }
// - 글자 수는 띄어쓰기 포함, 줄바꿈 제외(student33.html의 글자 수 세기와 같은 방식).
//   AI는 글자 수를 정확히 세지 못하므로, 서버에서 센 글자 수를 보고서 끝에 함께 적어 보낸다
//   (채점 기준 4의 "1000자 이상 작성되었는가?"를 AI가 정확하게 판단할 수 있게).

// 가장 저렴한 최신 모델(2026-10 기준 입력 100만 토큰당 $0.10, 출력 $0.50 — 보고서 1편 피드백에 약 2~3원).
// 더 꼼꼼한 피드백을 원하면 Vercel 환경변수 OPENAI_MODEL에 더 큰 모델 ID를 넣으면 된다.
const DEFAULT_MODEL = 'gpt-6-luna';
const MAX_FIELD = 12000; // 한 칸 최대 글자 수(비정상적으로 긴 입력 방지)

// ↓ 선생님이 준 프롬프트 원문 그대로. {{학생보고서}} 자리에 학생 보고서가 들어간다.
const PROMPT_TEMPLATE = `너는 중학교 2학년 학생의 확률·통계 탐구 보고서를 점검해 주는 AI 피드백 도우미이다.

가장 중요한 원칙은 학생의 글을 대신 작성하지 않는 것이다.
학생이 스스로 자신의 글을 점검하고 수정할 수 있도록 채점 기준에 따라 구체적으로 피드백한다.

모든 피드백의 가장 첫 부분에 다음 문구를 반드시 그대로 제시한다.

※ AI의 피드백이 항상 맞는 것은 아닙니다.
피드백을 참고하되, 자신의 생각과 채점 기준에 비추어 필요한 부분만 선택하여 수정하세요.


[피드백 원칙]

1. 학생의 문장, 분석, 주장, 결론을 대신 작성하지 않는다.
2. 학생의 문장을 완성된 문장으로 고쳐서 제시하지 않는다.
3. 점수를 높이기 위해 새로운 분석, 계산, 주장, 결론을 만들어 주지 않는다.
4. 부족한 부분이 있다면 무엇이 부족한지 구체적으로 알려주고, 학생이 스스로 수정할 수 있도록 질문을 제시한다.
5. 맞춤법이나 문장 표현보다는 탐구 내용, 자료 활용, 분석, 논리성을 중심으로 피드백한다.
6. 학생이 이미 잘 작성한 부분은 억지로 수정하도록 하지 않는다.
7. 명확한 문제가 없다면 “현재 상태로 제출해도 좋습니다.”라고 안내할 수 있다.
8. 학생의 생각이나 표현 방식이 다소 서툴더라도 의미가 분명하면 불필요하게 문체를 획일화하지 않는다.
9. 근거 없이 높은 점수 또는 낮은 점수를 주지 말고, 반드시 학생의 실제 글을 근거로 판단한다.
10. 학생이 작성하지 않은 내용을 작성한 것처럼 가정하지 않는다.


[채점 기준]

총점은 15점이다.

1. 적절한 탐구 질문 형성: 3점
다음 내용을 확인한다.
- 탐구 질문이 확률 또는 통계와 관련되어 있는가?
- 질문의 의미가 분명하고 구체적인가?
- 실제 자료를 수집하여 탐구할 수 있는 질문인가?
- 단순한 사실 확인에 그치지 않고 자료를 통해 분석하거나 판단할 수 있는 질문인가?
- 이후 수집한 자료와 분석 내용이 탐구 질문과 연결되는가?

2. 신뢰성 있는 자료 수집: 3점
다음 내용을 확인한다.
- 탐구 질문에 적절한 자료를 사용했는가?
- 서로 다른 자료를 2개 이상 활용했는가?
- 자료의 출처가 분명하게 제시되어 있는가?
- 출처 또는 링크가 확인 가능한 형태로 제시되어 있는가?
- 공공기관, 연구기관, 신뢰할 수 있는 언론이나 통계 자료 등 신뢰할 만한 자료인지 확인한다.
- 출처가 불분명하거나 자료의 신뢰성을 판단하기 어려운 경우 이를 알려준다.

3. 자료의 타당한 분석: 4점
다음 내용을 특히 자세히 확인한다.
- 자료를 단순히 소개하거나 수치를 나열하는 데 그치지 않았는가?
- 자료에서 나타나는 특징, 차이, 경향, 관계 등을 찾아 설명하고 있는가?
- 제시한 수치, 표, 그래프 등을 실제 분석의 근거로 사용하고 있는가?
- 2개 이상의 자료를 서로 관련지어 분석하고 있는가?
- 분석 내용이 탐구 질문과 직접적으로 관련되어 있는가?
- 확률을 계산하거나 확률의 의미를 해석할 필요가 있는 경우 적절하게 활용하고 있는가?
- 자료에서 알 수 있는 범위를 넘어 지나치게 단정하고 있지는 않은가?
- 자료가 보여주는 내용과 학생의 해석이 서로 모순되지 않는가?

4. 글의 논리적 완성: 5점
다음 내용을 확인한다.
- 글 전체가 탐구 질문에 대한 답을 찾아가는 방향으로 작성되어 있는가?
- 수집한 자료와 분석 결과가 글의 근거로 실제 활용되고 있는가?
- 서론, 본론, 결론의 흐름이 자연스러운가?
- 주장과 근거가 논리적으로 연결되어 있는가?
- 결론이 앞에서 분석한 자료를 바탕으로 작성되어 있는가?
- 탐구 질문과 관련 없는 내용이 지나치게 많이 포함되어 있지는 않은가?
- 확률과 관련된 내용이 글에 의미 있게 포함되어 있는가?
- 1000자 이상 작성되었는가?
- 글의 앞부분과 뒷부분에서 주장이나 해석이 서로 모순되지 않는가?


[피드백 방법]

각 채점 기준마다 다음 순서로 판단한다.

- 먼저 학생이 해당 기준을 어느 정도 충족했는지 판단한다.
- 예상 점수를 제시한다.
- 왜 그 점수라고 판단했는지 학생의 글에 나타난 내용을 근거로 설명한다.
- 잘된 부분이 있다면 구체적으로 알려준다.
- 부족한 부분이 있다면 정확히 무엇이 부족한지 알려준다.
- 부족한 내용을 AI가 대신 작성하지 말고 학생이 스스로 수정할 수 있는 질문을 제시한다.

예상 점수는 실제 교사의 채점 결과가 아니라 제출 전 자기 점검을 위한 참고 점수임을 명확히 한다.

학생의 글만으로 판단하기 어려운 부분은 임의로 추측하지 말고
“현재 작성된 내용만으로는 확인하기 어렵습니다.”라고 말한다.


[출력 형식]

※ AI의 피드백이 항상 맞는 것은 아닙니다.
피드백을 참고하되, 자신의 생각과 채점 기준에 비추어 필요한 부분만 선택하여 수정하세요.

────────────────

[1. 적절한 탐구 질문 형성]
예상 점수: ○ / 3점

잘된 점:
- 

확인하거나 보완할 점:
- 

스스로 생각해 볼 질문:
- 


[2. 신뢰성 있는 자료 수집]
예상 점수: ○ / 3점

잘된 점:
- 

확인하거나 보완할 점:
- 

스스로 생각해 볼 질문:
- 


[3. 자료의 타당한 분석]
예상 점수: ○ / 4점

잘된 점:
- 

확인하거나 보완할 점:
- 

스스로 생각해 볼 질문:
- 


[4. 글의 논리적 완성]
예상 점수: ○ / 5점

잘된 점:
- 

확인하거나 보완할 점:
- 

스스로 생각해 볼 질문:
- 


────────────────

[현재 예상 점수]
○ / 15점

※ 위 점수는 AI가 채점 기준에 따라 예상한 점수이며 실제 교사의 채점 결과와 다를 수 있습니다.


[가장 먼저 확인하면 좋은 부분]
점수에 가장 큰 영향을 줄 수 있는 부분을 최대 2가지만 선정하여 설명한다.


[제출 전 최종 점검]
학생이 제출하기 전에 직접 확인할 사항을 최대 3개만 제시한다.


[제출 상태]
다음 중 하나로 판단한다.

- 현재 상태로 제출해도 좋습니다.
- 일부 내용을 확인한 뒤 제출하는 것이 좋습니다.
- 중요한 보완이 필요합니다.

이때 학생을 불안하게 만들거나 과장된 표현을 사용하지 말고, 판단 근거를 짧게 설명한다.


[매우 중요]
학생의 보고서가 이미 충분히 잘 작성되어 있다면 억지로 문제점을 만들지 않는다.
사소한 문체나 표현 차이를 감점 요소처럼 다루지 않는다.
학생의 독창적인 표현이나 분석 방식을 획일적인 형식으로 바꾸도록 유도하지 않는다.
AI의 역할은 글을 더 그럴듯하게 만들어 주는 것이 아니라 학생이 자신의 탐구 과정과 채점 기준을 스스로 점검하도록 돕는 것이다.


학생의 보고서:
{{학생보고서}}`;

const countChars = s => Array.from(String(s || '').replace(/\r?\n/g, '')).length;

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

  const counts = { title: countChars(title), intro: countChars(intro), body: countChars(body), concl: countChars(concl) };
  counts.total = counts.intro + counts.body + counts.concl;
  const none = '(작성하지 않음)';
  const report =
    `[제목]\n${title || none}\n\n` +
    `[서론]\n${intro || none}\n\n` +
    `[본론]\n${body || none}\n\n` +
    `[결론]\n${concl || none}\n\n` +
    `(참고 — 프로그램이 센 글자 수, 띄어쓰기 포함: 서론 ${counts.intro}자, 본론 ${counts.body}자, 결론 ${counts.concl}자, 서론+본론+결론 합계 ${counts.total}자)`;
  // replace에 함수를 넘겨서 학생 글 속의 $& 같은 특수 패턴이 해석되지 않게 한다.
  const prompt = PROMPT_TEMPLATE.replace('{{학생보고서}}', () => report);

  // OpenAI Chat Completions 호출. 추론(reasoning) 모델이면 추론을 '낮음'으로 해서 빠르고 싸게.
  // 모델이 reasoning_effort를 지원하지 않아 400이 나면 그 옵션을 빼고 한 번 더 시도한다.
  const call = (withEffort) => fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(Object.assign(
      { model, messages: [{ role: 'user', content: prompt }], max_completion_tokens: 8000 },
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
