// Vercel 서버리스 함수: student22(1부 step3)·student23(2부 자료 카드)의 파일 첨부(이미지·PDF)를 Vercel Blob에 올릴 때 쓰는 일회용 업로드 토큰을 만들어 준다.
// 파일은 브라우저에서 Blob으로 바로 올라가므로(이 함수를 거치지 않음) 10MB 파일도 된다.
// 필요한 환경변수: BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob 저장소를 이 프로젝트에 연결하면 자동으로 생김)
const { handleUpload } = require('@vercel/blob/client');

const MAX_BYTES = 10 * 1024 * 1024; // 파일당 10MB (2026-10-12 선생님 결정)

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  if (!process.env.BLOB_READ_WRITE_TOKEN) { res.status(500).json({ error: '파일 저장소(Vercel Blob)가 아직 연결되지 않았어요. 선생님께 알려 주세요.' }); return; }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^prob3[23]\/[\w.-]+\/[\w.-]+\/[\w.-]+$/.test(pathname)) throw new Error('올릴 수 없는 파일 경로예요.');
        return { allowedContentTypes: ['image/*', 'application/pdf'], maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
      }
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: String(e && e.message || e).slice(0, 300) });
  }
};
