// Vercel 서버리스 함수: teacherpa1.html의 "AI로 이유·방법 채점" 버튼이 호출하는 엔드포인트.
// Gemini API 키를 브라우저에 노출하지 않기 위해, 키는 이 서버 함수 안(Vercel 환경변수)에만
// 두고, 채점 요청/응답만 브라우저와 주고받는다. (2.5 Flash-Lite는 Google AI Studio 무료
// 티어로도 충분히 쓸 수 있어서, 이 단순한 채점 용도에는 비용이 거의/전혀 들지 않는다.)
//
// [설정 방법] Vercel 프로젝트 설정 > Settings > Environment Variables 에서
//   이름: GEMINI_API_KEY
//   값:   Google AI Studio(aistudio.google.com/apikey)에서 발급한 API 키
// 를 등록하고 다시 배포(재배포)하면 이 함수가 그 키를 쓸 수 있다.
//
// 요청 형식(POST, JSON): { centerType: '외심'|'내심', reason: string, method: string }
// 응답 형식(JSON): { reasonCorrect, reasonFeedback, methodCorrect, methodFeedback }

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

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

  // [과제2] 외심 채점 기준: (2) 세 점으로부터 거리가 같아야 하기 때문이다. (3) 세 변의
  // 수직이등분선의 교점을 그린다.
  // [과제4] 내심 채점 기준: (2) 세 변으로부터 거리가 같아야 하기 때문이다. (3) 세 각의
  // 이등분선의 교점을 그린다.
  const expectedReason = centerType === '내심'
    ? '세 변으로부터 거리가 같아야 하기 때문이다.'
    : '세 점으로부터 거리가 같아야 하기 때문이다.';
  const expectedMethod = centerType === '내심'
    ? '세 각의 이등분선의 교점을 그린다.'
    : '세 변의 수직이등분선의 교점을 그린다.';

  const prompt = `당신은 중학교 수학(삼각형의 외심과 내심) 수행평가 서술형 답안을 채점하는 선생님입니다.
학생이 이번 문제에서 찾아야 하는 점: ${centerType}

[이유 문항] 모범 답안: "${expectedReason}"
[방법 문항] 모범 답안: "${expectedMethod}"

학생 답안:
② 이유: "${reason || '(작성 안 함)'}"
③ 방법: "${method || '(작성 안 함)'}"

채점 기준: 표현이 다르더라도 모범 답안과 핵심 개념(무엇으로부터 거리가 같은지 / 어떤 선의 교점을 그리는지)이 통하면 정답(true), 핵심 개념이 빠졌거나 틀렸으면 오답(false)으로 판정하세요.
각 문항에 대해 학생에게 보여줄 짧은 한국어 피드백도 한 줄씩 작성하세요.`;

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
              methodCorrect: { type: 'boolean' },
              methodFeedback: { type: 'string' }
            },
            required: ['reasonCorrect', 'reasonFeedback', 'methodCorrect', 'methodFeedback']
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
      methodCorrect: !!parsed.methodCorrect,
      methodFeedback: parsed.methodFeedback || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
};
