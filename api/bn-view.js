// Vercel 서버리스 함수: 배움노트 정리 수행평가 채점 결과 보기(bnview.html)·관리(bnadmin.html)
//
// [학생] POST { cls, num, name, pin }
//   반·번호·이름·비밀번호(학생 목차 student.html에서 만든 4자리, 2026-10-19부터 인증번호 대신)를 서버에서 확인한 뒤에만
//   그 학생의 총점과 채점된 답안 사진 주소를 돌려준다. → { ok:true, score, pages:[url] }
//   선생님 목차(mgmt)에서 그 반의 33번 잠금이 열려 있을 때만 보여 준다(rooms/{반}__access/units/33 === true).
//   비밀번호: rooms/{반}__pins/{번호_이름} = {h} — h = SHA-256('ggb|반|번호_이름|비밀번호') (student.html과 같은 계산)
//   비밀번호를 아직 만들지 않은 학생은 목차에서 처음 비밀번호 0000으로 들어가 새로 만든 뒤 오게 한다.
// [선생님] POST { admin:key, cls } → 그 반의 현재 목록(공개 여부·학생 수·비밀번호를 아직 안 만든 학생) 확인
// 1~8반 모두 쓸 수 있다(2026-10-19 1~4반 추가).
//
// 반 목록(bnmap/{반}.json)은 무작위 꼬리가 붙은 주소라 서버가 list()로만 찾는다(모두 읽어 합친다, loadMap 참고).
const { list } = require('@vercel/blob');
const crypto = require('crypto');
// 1~4반: 스캔본 표지에서 읽은 항목별 점수(선생님 화면 「표지 점수 채우기」용, 학생에게는 저장된 것만 보임). 공개 폴더가 아닌 함수 안에만 들어간다.
let BN_PRESET = {}; try { BN_PRESET = require('./_bnpreset.json'); } catch (e) {}
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
  // 실제 파일 이름은 bnmap/8-xxxx.json처럼 무작위 꼬리가 .json 앞에 붙으므로 prefix는 bnmap/8 까지만
  const { blobs } = await list({ prefix: `bnmap/${cls}` });
  const mine = blobs.filter(b => new RegExp(`^bnmap/${cls}(-[A-Za-z0-9_-]+)?\\.json$`).test(b.pathname));
  if (!mine.length) return null;
  const maps = (await Promise.all(mine.map(async b => { try { const r = await fetch(b.url, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; } })))
    .filter(m => m && m.students).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  if (!maps.length) return null;
  const out = { cls, max: 20, ts: 0, students: {} };
  maps.forEach(m => { if (m.max) out.max = m.max; out.ts = Math.max(out.ts, m.ts || 0); Object.assign(out.students, m.students); });
  return out;
}

// 1~4반: 선생님이 아직 저장하지 않은 학생은 표지에서 읽은 항목별 점수(_bnpreset.json)를 기본값으로 쓴다.
// 선생님이 「배움노트 채점본 올리기」에서 저장한 학생(반 목록에 있는 학생)은 저장한 값이 우선한다.
function withPreset(cls, m) {
  const pre = BN_PRESET[cls]; if (!pre) return m;
  const out = m ? Object.assign({}, m, { students: Object.assign({}, m.students || {}) }) : { cls, max: 20, ts: 0, students: {} };
  Object.keys(pre).forEach(n => { if (!out.students[n]) out.students[n] = { score: pre[n].reduce((a, x) => a + x, 0), items: pre[n], pages: [], preset: true }; });
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST 요청만 지원합니다.' }); return; }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const cls = String(b.cls || '').trim();
  if (!/^[1-8]$/.test(cls)) { res.status(400).json({ error: '1~8반만 볼 수 있어요.' }); return; }
  try {
    // ---- 선생님: 현재 상태 확인
    if (b.admin !== undefined) {
      if (!bnAdminOk(b.admin)) { await sleep(1000); res.status(403).json({ error: '관리 비밀번호가 맞지 않아요.' }); return; }
      const m = withPreset(cls, await loadMap(cls));
      // 비밀번호를 아직 만들지 않은 학생: rooms/{반}__pins 에 그 번호의 기록이 없는 학생
      let noPin = [];
      if (m && m.students) {
        const pins = (await fbGet(`rooms/${sanitize(cls)}__pins`)) || {};
        const has = new Set(Object.keys(pins).filter(k => pins[k] && pins[k].h).map(k => String(parseInt(k.split('_')[0], 10))));
        noPin = Object.keys(m.students).filter(n => !has.has(String(parseInt(n, 10)))).sort((a, b) => a - b);
      }
      res.status(200).json({ ok: true, noPin, preset: BN_PRESET[cls] || null, unitOpen: (await fbGet(`rooms/${sanitize(cls)}__access/units/33`)) === true, map: m ? { ts: m.ts, count: Object.keys(m.students || {}).length, students: m.students } : null });
      return;
    }
    // ---- 학생
    const raw = String(b.num || '').trim(), num = String(parseInt(raw, 10) || ''), name = String(b.name || '').trim(), pin = String(b.pin || '').trim();
    if (!num || !name || !/^\d{4}$/.test(pin)) { res.status(400).json({ error: '반·번호·이름·비밀번호(숫자 4자리)를 모두 입력해 주세요.' }); return; }
    const c = sanitize(cls), keys = [...new Set([sanitize(raw) + '_' + sanitize(name), sanitize(num) + '_' + sanitize(name)])];
    let key = '', rec = null;
    for (const k of keys) { const r = await fbGet(`rooms/${c}__pins/${k}`); if (r && r.h) { key = k; rec = r; break; } }
    if (!rec) { await sleep(400); res.status(404).json({ error: '아직 비밀번호를 만들지 않았어요. 학생 목차(🏠)에서 반·번호·이름과 처음 비밀번호 0000을 넣고 새 비밀번호를 만든 뒤 다시 와 주세요.' }); return; }
    if (pin === '0000' || crypto.createHash('sha256').update(`ggb|${c}|${key}|${pin}`).digest('hex') !== rec.h) { await sleep(800); res.status(403).json({ error: '비밀번호가 맞지 않아요. 번호·이름도 다시 확인해 주세요. 잊었으면 학생 목차에서 「비밀번호를 잊었어요」를 눌러 선생님께 초기화를 부탁해요.' }); return; }
    // 공개 여부 = 선생님 목차(mgmt)에서 그 반의 33번(배움노트 결과 보기) 잠금을 열었는지
    const unitOpen = (await fbGet(`rooms/${sanitize(cls)}__access/units/33`)) === true;
    if (!unitOpen) { res.status(200).json({ ok: true, closed: true }); return; }
    const m = withPreset(cls, await loadMap(cls));
    if (!m) { res.status(200).json({ ok: true, none: true }); return; }
    const s = (m.students || {})[num];
    if (!s) { res.status(200).json({ ok: true, none: true }); return; }
    res.status(200).json({ ok: true, score: s.score, max: m.max || 20, pages: s.pages || [], items: Array.isArray(s.items) ? s.items : null });
  } catch (e) {
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.', detail: String(e && e.message || e).slice(0, 200) });
  }
};
