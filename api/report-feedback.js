// Vercel 서버리스 함수: teacher23.html의 "🤖 AI 피드백 보내기" 버튼이 호출하는 엔드포인트.
// 학생 보고서를 받아 선생님이 정한 프롬프트(api/_report-common.js의 PROMPT_TEMPLATE)로 OpenAI에게
// 학생용 피드백을 받아 돌려준다. (API 키·모델 설정은 _report-common.js 맨 위 설명 참고)
//
// 요청 형식(POST, JSON): { title, intro, body, concl, sources:[{name, link}] }
// 응답 형식(JSON): { text, counts:{title,intro,body,concl,total}, model }
const { PROMPT_TEMPLATE, parseReport, callOpenAI } = require('./_report-common');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  const rep = parseReport(req.body);
  if (rep.empty) { res.status(400).json({ error: '피드백할 보고서 내용이 비어 있습니다.' }); return; }
  // replace에 함수를 넘겨서 학생 글 속의 $& 같은 특수 패턴이 해석되지 않게 한다.
  const prompt = PROMPT_TEMPLATE.replace('{{학생보고서}}', () => rep.report);
  const r = await callOpenAI(prompt, { maxTokens: 6000 });
  if (!r.ok) { res.status(r.status).json({ error: r.error, detail: r.detail }); return; }
  res.status(200).json({ text: r.text, counts: rep.counts, model: r.model });
};
