// Vercel 서버리스 함수: teacherpa1.html의 "AI로 이유·방법 채점" 버튼이 호출하는 엔드포인트.
// Gemini API 키를 브라우저에 노출하지 않기 위해, 키는 이 서버 함수 안(Vercel 환경변수)에만
// 두고, 채점 요청/응답만 브라우저와 주고받는다. (Flash-Lite는 Google AI Studio 무료
// 티어로도 충분히 쓸 수 있어서, 이 단순한 채점 용도에는 비용이 거의/전혀 들지 않는다.)
//
// [설정 방법] Vercel 프로젝트 설정 > Settings > Environment Variables 에서
//   이름: GEMINI_API_KEY
//   값:   Google AI Studio(aistudio.google.com/apikey)에서 발급한 API 키
// 를 등록하고 다시 배포(재배포)하면 이 함수가 그 키를 쓸 수 있다.
//
// 요청 형식(POST, JSON): { centerType: '외심'|'내심', reason: string, method: string }
// 응답 형식(JSON): { reasonCorrect, reasonFeedback, methodPart1Correct, methodPart2Correct,
//                    methodPart3Correct, methodFeedback }
// - reasonCorrect: ②이유 문항 정답 여부(2점, 전부-아니면-0점)
// - methodPart1/2/3Correct: ③방법 문항을 세 요소로 나눠 채점(각 1점, 부분점수 가능).
//   외심이면 [변]/[수직이등분선]/[교점], 내심이면 [각]/[이등분선]/[교점] 순서.

const GEMINI_MODEL = 'gemini-3.5-flash-lite';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 지원합니다.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. Vercel 프로젝트 환경변수를 확인해주세요.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const centerType = (body && body.centerType) === '내심' ? '내심' : '외심';
  const reason = (body && body.reason) || '';
  const method = (body && body.method) || '';

  if (!reason.trim() && !method.trim()) {
    res.status(400).json({ error: '채점할 이유/방법 답안이 비어 있습니다.' });
    return;
  }

  // [과제2] 외심 채점 기준: (2) 세 점(꼭짓점)으로부터 거리가 같아야 하기 때문이다. (3) 세 변의
  // 수직이등분선의 교점을 그린다 → [변]/[수직이등분선]/[교점] 세 요소가 모두 들어가야 만점.
  // [과제4] 내심 채점 기준: (2) 세 변으로부터 거리가 같아야 하기 때문이다. (3) 세 각의
  // 이등분선의 교점을 그린다 → [각]/[이등분선]/[교점] 세 요소가 모두 들어가야 만점.
  const expectedReason = centerType === '내심'
    ? '세 변으로부터 거리가 같아야 하기 때문이다.'
    : '세 점(꼭짓점)으로부터 거리가 같아야 하기 때문이다.';
  const methodParts = centerType === '내심'
    ? ['각(세 내각)을 이등분한다는 내용', '(각의) 이등분선이라는 내용', '그 이등분선들의 교점을 찾는다는 내용']
    : ['변(세 변)을 이등분한다는 내용', '수직이등분선이라는 내용(변에 수직으로 이등분)', '그 수직이등분선들의 교점을 찾는다는 내용'];
  const expectedMethod = centerType === '내심'
    ? '세 각의 이등분선의 교점을 그린다.'
    : '세 변의 수직이등분선의 교점을 그린다.';

  const prompt = `당신은 중학교 수학(삼각형의 외심과 내심) 수행평가 서술형 답안을 채점하는 선생님입니다.
학생이 이번 문제에서 찾아야 하는 점: ${centerType}

[이유 문항] 모범 답안: "${expectedReason}" — 표현이 다르더라도 핵심 개념(무엇으로부터 거리가 같은지)이 통하면 정답(true)으로 판정하세요.

[방법 문항] 모범 답안: "${expectedMethod}" — 이 문항은 아래 세 가지 요소가 각각 들어있는지 따로따로 채점합니다(부분점수 가능). 표현이 다르더라도 의미가 통하면 정답으로 인정하세요.
  1번 요소(part1): ${methodParts[0]}
  2번 요소(part2): ${methodParts[1]}
  3번 요소(part3): ${methodParts[2]}
주의: 답안이 완전히 다른 개념(예: ${centerType==='내심' ? '수직이등분선/외심' : '각의 이등분선/내심'} 관련 설명)을 쓴 경우, 그 요소들은 겉으로 비슷한 단어가 있더라도 정답으로 인정하지 마세요(예: "변의 수직이등분선"이라는 답은 [각]/[이등분선(각의)] 요소를 만족하지 않습니다).

학생 답안:
② 이유: "${reason || '(작성 안 함)'}"
③ 방법: "${method || '(작성 안 함)'}"

각 문항에 대해 학생에게 보여줄 짧은 한국어 피드백도 한 줄씩 작성하세요(방법 문항은 세 요소 중 무엇이 부족한지 짚어주세요).`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              reasonCorrect: { type: 'boolean' },
              reasonFeedback: { type: 'string' },
              methodPart1Correct: { type: 'boolean' },
              methodPart2Correct: { type: 'boolean' },
              methodPart3Correct: { type: 'boolean' },
              methodFeedback: { type: 'string' }
            },
            required: ['reasonCorrect', 'reasonFeedback', 'methodPart1Correct', 'methodPart2Correct', 'methodPart3Correct', 'methodFeedback']
          }
        }
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      res.status(502).json({ error: 'Gemini API 호출 실패', detail: errText });
      return;
    }

    const data = await r.json();
    const text = data && data.candidates && data.candidates[0] &&
      data.candidates[0].content && data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

    if (!text) {
      res.status(502).json({ error: 'Gemini 응답에 채점 결과가 없습니다.', raw: data });
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      res.status(502).json({ error: 'AI 응답을 해석하지 못했습니다.', raw: text });
      return;
    }

    res.status(200).json({
      reasonCorrect: !!parsed.reasonCorrect,
      reasonFeedback: parsed.reasonFeedback || '',
      methodPart1Correct: !!parsed.methodPart1Correct,
      methodPart2Correct: !!parsed.methodPart2Correct,
      methodPart3Correct: !!parsed.methodPart3Correct,
      methodFeedback: parsed.methodFeedback || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
};
