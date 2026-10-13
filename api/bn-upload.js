// Vercel 서버리스 함수: 배움노트 정리 수행평가 스캔본 올리기(bnadmin.html)에서 Vercel Blob에 사진·목록을 올릴 때 쓰는 일회용 업로드 토큰.
// 선생님만 올릴 수 있도록 관리 비밀번호(bnAdminOk)가 맞아야 토큰을 준다.
// 올리는 경로: bn/{반}/{번호}/p{쪽}.jpg (학생 답안 사진), bnmap/{반}.json (반 목록: 번호별 총점·사진 주소·공개 여부)
// 모든 파일 이름 뒤에 무작위 꼬리가 붙어서(addRandomSuffix) 주소를 짐작할 수 없다. 목록 파일 주소는 서버(bn-view.js)만 찾을 수 있다.
const { handleUpload } = require('@vercel/blob/client');
const crypto = require('crypto');
// 관리 비밀번호 확인: Vercel 환경변수 BN_ADMIN_KEY가 있으면 그것과 비교하고, 없으면 아래 값(PBKDF2-SHA256, 30만 번 반복)과 비교한다.
// (비밀번호 자체는 코드에 없다. 틀리면 1초 늦게 답해서 마구 넣어 보기를 느리게 한다)
const BN_ADMIN_SALT = '9089f93260bf5b2ce0b06ea8f4164d27', BN_ADMIN_HASH = 'af4151bdef4c178346335af0930eaa1e30500a2637b3741aeefd589684345ae8';
const bnAdminOk = k => { k = String(k || '').trim(); if (!k) return false;
  const env = (process.env.BN_ADMIN_KEY || '').trim(); if (env) return k === env;
  return crypto.pbkdf2Sync(k, Buffer.from(BN_ADMIN_SALT, 'hex'), 300000, 32, 'sha256').toString('hex') === BN_ADMIN_HASH; };

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  if (!process.env.BLOB_READ_WRITE_TOKEN) { res.status(500).json({ error: '파일 저장소(Vercel Blob)가 연결되지 않았어요.' }); return; }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let p = {}; try { p = JSON.parse(clientPayload || '{}'); } catch (e) {}
        if (!bnAdminOk(p.key)) { await new Promise(r => setTimeout(r, 1000)); throw new Error('관리 비밀번호가 맞지 않아요.'); }
        if (!/^bn\/[5-8]\/\d{1,2}\/p\d{1,2}\.jpg$/.test(pathname) && !/^bnmap\/[5-8]\.json$/.test(pathname)) throw new Error('올릴 수 없는 경로예요.');
        return { allowedContentTypes: ['image/jpeg', 'application/json'], maximumSizeInBytes: 4 * 1024 * 1024, addRandomSuffix: true };
      }
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: String(e && e.message || e).slice(0, 300) });
  }
};
