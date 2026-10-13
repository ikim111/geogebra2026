// Vercel 서버리스 함수: 배움노트 정리 수행평가 스캔본 올리기(bnadmin.html)에서 Vercel Blob에 사진·목록을 올릴 때 쓰는 일회용 업로드 토큰.
// 선생님만 올릴 수 있도록 Vercel 환경변수 BN_ADMIN_KEY(선생님이 정한 관리 비밀번호)와 같은 값을 보내야 토큰을 준다.
// 올리는 경로: bn/{반}/{번호}/p{쪽}.jpg (학생 답안 사진), bnmap/{반}.json (반 목록: 번호별 총점·사진 주소·공개 여부)
// 모든 파일 이름 뒤에 무작위 꼬리가 붙어서(addRandomSuffix) 주소를 짐작할 수 없다. 목록 파일 주소는 서버(bn-view.js)만 찾을 수 있다.
const { handleUpload } = require('@vercel/blob/client');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  if (!process.env.BLOB_READ_WRITE_TOKEN) { res.status(500).json({ error: '파일 저장소(Vercel Blob)가 연결되지 않았어요.' }); return; }
  const adminKey = (process.env.BN_ADMIN_KEY || '').trim();
  if (!adminKey) { res.status(500).json({ error: 'Vercel 환경변수 BN_ADMIN_KEY(관리 비밀번호)가 아직 없어요.' }); return; }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let p = {}; try { p = JSON.parse(clientPayload || '{}'); } catch (e) {}
        if (String(p.key || '') !== adminKey) throw new Error('관리 비밀번호가 맞지 않아요.');
        if (!/^bn\/[5-8]\/\d{1,2}\/p\d{1,2}\.jpg$/.test(pathname) && !/^bnmap\/[5-8]\.json$/.test(pathname)) throw new Error('올릴 수 없는 경로예요.');
        return { allowedContentTypes: ['image/jpeg', 'application/json'], maximumSizeInBytes: 4 * 1024 * 1024, addRandomSuffix: true };
      }
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: String(e && e.message || e).slice(0, 300) });
  }
};
