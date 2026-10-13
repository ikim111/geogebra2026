// Vercel 서버리스 함수: 배움노트 정리 수행평가 채점 결과 보기(bnview.html)·관리(bnadmin.html)
//
// [학생] POST { cls, num, name, code }
//   반·번호·이름·인증번호(외심내심 수행평가와 같은 휴대전화 뒷 4자리)를 서버에서 확인한 뒤에만
//   그 학생의 총점과 채점된 답안 사진 주소를 돌려준다. → { ok:true, score, pages:[url] }
//   인증번호: rooms/{반}__assess_pa1/students/{번호_이름}/verifyCode (없으면 rooms/{반}__assess_pa1/rosterCodes/{번호_이름})
// [선생님] POST { admin:key, cls } → 그 반의 현재 목록(공개 여부·학생 수) 확인
//
// 반 목록(bnmap/{반}.json)은 무작위 꼬리가 붙은 주소라 서버가 list()로만 찾는다(가장 최근에 올린 것을 쓴다).
const { list } = require('@vercel/blob');
const crypto = require('crypto');
// 관리 비밀번호 확인: Vercel 환경변수 BN_ADMIN_KEY가 있으면 그것과 비교하고, 없으면 아래 해시(SHA-256)와 비교한다.
// (비밀번호 자체는 코드에 없다. 선생님께 따로 알려 드림)
const BN_ADMIN_HASH = '55c0ce3a379b5098808bfca8e9b8eac046872fbd98acf6aa32e738ca17f7b147';
const bnAdminOk = k => { k = String(k || '').trim(); if (!k) return false;
  const env = (process.env.BN_ADMIN_KEY || '').trim(); if (env) return k === env;
  return crypto.createHash('sha256').update(k).digest('hex') === BN_ADMIN_HASH; };

const FB_API_KEY = 'AIzaSyBK7NlpKOr1ozAXF96vS8p7YyjiNaAJlfI'; // 학생 페이지들에 이미 들어 있는 공개용 웹 키
const FB_DB = 'https://brojuntest-default-rtdb.asia-southeast1.firebasedatabase.app';
const sanitize = s => (String(s || '')).trim().replace(/[.#$\[\]\/\s]+/g, '_').slice(0, 30) || 'x';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let tokenCache = { t: '', exp: 0 };
async function fbToken() {
  if (tokenCache.t && Date.now() < tokenCache.exp) return tokenCache.t;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FB_API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true })
  });
  const j = await r.json();
  if (!j.idToken) throw new Error('firebase auth');
  tokenCache = { t: j.idToken, exp: Date.now() + 50 * 60 * 1000 };
  return j.idToken;
}
async function fbGet(path) {
  const t = await fbToken();
  const r = await fetch(`${FB_DB}/${path}.json?auth=${encodeURIComponent(t)}`);
  if (!r.ok) throw new Error('firebase read ' + r.status);
  return r.json();
}
async function loadMap(cls) {
  const { blobs } = await list({ prefix: `bnmap/${cls}` });
  if (!blobs.length) return null;
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const r = await fetch(blobs[0].url, { cache: 'no-store' });
  return r.ok ? r.json() : null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const cls = String(b.cls || '').trim();
  if (!/^[5-8]$/.test(cls)) { res.status(400).json({ error: '5~8반만 볼 수 있어요.' }); return; }
  try {
    // ---- 선생님: 현재 상태 확인
    if (b.admin !== undefined) {
      if (!bnAdminOk(b.admin)) { res.status(403).json({ error: '관리 비밀번호가 맞지 않아요.' }); return; }
      const m = await loadMap(cls);
      res.status(200).json({ ok: true, map: m ? { open: !!m.open, ts: m.ts, count: Object.keys(m.students || {}).length, students: m.students } : null });
      return;
    }
    // ---- 학생
    const num = String(parseInt(b.num, 10) || ''), name = String(b.name || '').trim(), code = String(b.code || '').trim();
    if (!num || !name || !/^\d{4}$/.test(code)) { res.status(400).json({ error: '반·번호·이름·인증번호(숫자 4자리)를 모두 입력해 주세요.' }); return; }
    const key = sanitize(num) + '_' + sanitize(name);
    const room = sanitize(cls) + '__assess_pa1';
    let real = await fbGet(`rooms/${room}/students/${key}/verifyCode`);
    if (real == null) real = await fbGet(`rooms/${room}/rosterCodes/${key}`);
    if (real == null) { await sleep(400); res.status(404).json({ error: '해당 반·번호·이름을 찾을 수 없어요. 다시 확인해 주세요.' }); return; }
    if (String(real).trim() !== code) { await sleep(800); res.status(403).json({ error: '인증번호가 일치하지 않아요. 다시 확인해 주세요.' }); return; }
    const m = await loadMap(cls);
    if (!m || !m.open) { res.status(200).json({ ok: true, closed: true }); return; }
    const s = (m.students || {})[num];
    if (!s) { res.status(200).json({ ok: true, none: true }); return; }
    res.status(200).json({ ok: true, score: s.score, max: m.max || 20, pages: s.pages || [] });
  } catch (e) {
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.', detail: String(e && e.message || e).slice(0, 200) });
  }
};
