// Vercel 서버리스 함수: 배움노트 정리 수행평가 채점 결과 보기(bnview.html)·관리(bnadmin.html)
//
// [학생] POST { cls, num, name, code }
//   반·번호·이름·인증번호(외심내심 수행평가와 같은 휴대전화 뒷 4자리)를 서버에서 확인한 뒤에만
//   그 학생의 총점과 채점된 답안 사진 주소를 돌려준다. → { ok:true, score, pages:[url] }
//   선생님 목차(mgmt)에서 그 반의 33번 잠금이 열려 있을 때만 보여 준다(rooms/{반}__access/units/33 === true).
//   인증번호: rooms/{반}__assess_pa1/students/{번호_이름}/verifyCode (없으면 rooms/{반}__assess_pa1/rosterCodes/{번호_이름})
// [선생님] POST { admin:key, cls } → 그 반의 현재 목록(공개 여부·학생 수·인증번호 없는 학생) 확인
// [인증번호 변경] POST { edit:pw, cls, num, name, newCode } → 외심내심 수행평가와 같은 저장소의 인증번호를 바꾸거나(없으면) 등록
//
// 반 목록(bnmap/{반}.json)은 무작위 꼬리가 붙은 주소라 서버가 list()로만 찾는다(모두 읽어 합친다, loadMap 참고).
const { list } = require('@vercel/blob');
const crypto = require('crypto');
// 관리 비밀번호 확인: Vercel 환경변수 BN_ADMIN_KEY가 있으면 그것과 비교하고, 없으면 아래 값(PBKDF2-SHA256, 30만 번 반복)과 비교한다.
// (비밀번호 자체는 코드에 없다. 틀리면 1초 늦게 답해서 마구 넣어 보기를 느리게 한다)
const BN_ADMIN_SALT = '9089f93260bf5b2ce0b06ea8f4164d27', BN_ADMIN_HASH = 'af4151bdef4c178346335af0930eaa1e30500a2637b3741aeefd589684345ae8';
const bnAdminOk = k => { k = String(k || '').trim(); if (!k) return false;
  const env = (process.env.BN_ADMIN_KEY || '').trim(); if (env) return k === env;
  return crypto.pbkdf2Sync(k, Buffer.from(BN_ADMIN_SALT, 'hex'), 300000, 32, 'sha256').toString('hex') === BN_ADMIN_HASH; };

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
async function fbPut(path, value) {
  const t = await fbToken();
  const r = await fetch(`${FB_DB}/${path}.json?auth=${encodeURIComponent(t)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) });
  if (!r.ok) throw new Error('firebase write ' + r.status);
}
// 반 목록: 올릴 때마다 새 파일(무작위 꼬리)이 생기고 지우지 않으므로, 있는 파일을 모두 읽어 합친다(같은 번호는 더 나중 것).
// Blob의 list()는 올린 직후 잠깐 최신 파일이 안 보일 수 있어서, 가장 최근 것 하나만 쓰면 그 전에 올린 학생이 빠질 수 있었다.
async function loadMap(cls) {
  const { blobs } = await list({ prefix: `bnmap/${cls}.json` });
  if (!blobs.length) return null;
  const maps = (await Promise.all(blobs.map(async b => { try { const r = await fetch(b.url, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; } })))
    .filter(m => m && m.students).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  if (!maps.length) return null;
  const out = { cls, max: 20, ts: 0, students: {} };
  maps.forEach(m => { if (m.max) out.max = m.max; out.ts = Math.max(out.ts, m.ts || 0); Object.assign(out.students, m.students); });
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const cls = String(b.cls || '').trim();
  if (!/^[5-8]$/.test(cls)) { res.status(400).json({ error: '5~8반만 볼 수 있어요.' }); return; }
  try {
    // ---- 선생님: 현재 상태 확인
    if (b.admin !== undefined) {
      if (!bnAdminOk(b.admin)) { await sleep(1000); res.status(403).json({ error: '관리 비밀번호가 맞지 않아요.' }); return; }
      const m = await loadMap(cls);
      // 인증번호가 없는 학생 찾기: 외심내심 수행평가 방(__assess_pa1)의 students/{번호_이름}/verifyCode 또는 rosterCodes/{번호_이름}
      let noCode = [];
      if (m && m.students) {
        const room = sanitize(cls) + '__assess_pa1';
        const [stu, roster] = await Promise.all([fbGet(`rooms/${room}/students`), fbGet(`rooms/${room}/rosterCodes`)]);
        const has = new Set();
        Object.keys(stu || {}).forEach(k => { if (stu[k] && stu[k].verifyCode) has.add(k.split('_')[0]); });
        Object.keys(roster || {}).forEach(k => { if (roster[k]) has.add(k.split('_')[0]); });
        noCode = Object.keys(m.students).filter(n => !has.has(String(parseInt(n, 10)))).sort((a, b) => a - b);
      }
      res.status(200).json({ ok: true, noCode, unitOpen: (await fbGet(`rooms/${sanitize(cls)}__access/units/33`)) === true, map: m ? { ts: m.ts, count: Object.keys(m.students || {}).length, students: m.students } : null });
      return;
    }
    // ---- 인증번호 변경·등록(비밀번호 보호, 외심내심 결과 보기의 「인증번호 변경하기」와 같은 비밀번호)
    //      students/{번호_이름}이 있으면 그 verifyCode를 바꾸고, 없으면(아직 등록 안 된 학생) rosterCodes/{번호_이름}에 넣는다.
    //      외심내심 수행평가와 같은 곳을 쓰므로 여기서 바꾸면 둘 다 바뀐다.
    if (b.edit !== undefined) {
      if (!bnAdminOk(b.edit)) { await sleep(1000); res.status(403).json({ error: '비밀번호가 맞지 않아요.' }); return; }
      const num = String(parseInt(b.num, 10) || ''), name = String(b.name || '').trim(), newCode = String(b.newCode || '').trim();
      if (!num || !name || !/^\d{4}$/.test(newCode)) { res.status(400).json({ error: '번호·이름·새 인증번호(숫자 4자리)를 모두 입력해 주세요.' }); return; }
      const key = sanitize(num) + '_' + sanitize(name), room = sanitize(cls) + '__assess_pa1';
      const exists = (await fbGet(`rooms/${room}/students/${key}/data`)) != null || (await fbGet(`rooms/${room}/students/${key}/verifyCode`)) != null;
      if (exists) await fbPut(`rooms/${room}/students/${key}/verifyCode`, newCode);
      else await fbPut(`rooms/${room}/rosterCodes/${key}`, newCode);
      res.status(200).json({ ok: true, registered: !exists });
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
    // 공개 여부 = 선생님 목차(mgmt)에서 그 반의 33번(배움노트 결과 보기) 잠금을 열었는지
    const unitOpen = (await fbGet(`rooms/${sanitize(cls)}__access/units/33`)) === true;
    if (!unitOpen) { res.status(200).json({ ok: true, closed: true }); return; }
    const m = await loadMap(cls);
    if (!m) { res.status(200).json({ ok: true, none: true }); return; }
    const s = (m.students || {})[num];
    if (!s) { res.status(200).json({ ok: true, none: true }); return; }
    res.status(200).json({ ok: true, score: s.score, max: m.max || 20, pages: s.pages || [] });
  } catch (e) {
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.', detail: String(e && e.message || e).slice(0, 200) });
  }
};
