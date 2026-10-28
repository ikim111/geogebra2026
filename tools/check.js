// 🔍 배포 전 점검 (2026-10-29) — 저장소 맨 위에서 `node tools/check.js` 로 실행한다.
//   1) 모든 .html 안의 <script> 와 공통 .js·api/*.js 문법 검사 (node --check)
//   2) 학생 화면(student*.html) 휴대폰 폭(390px) 점검: 페이지 오류, 가로 넘침
//   3) 글상자 잘림 점검: 긴 글을 넣고 넓은 화면 → 휴대폰 폭으로 줄였을 때 글이 잘리는지
// 2)·3)은 playwright가 있어야 한다(없으면 1번만 하고 알려 준다). Firebase·CDN 연결 실패로 생기는 오류는 무시한다.
// 문제가 하나라도 있으면 종료 코드 1.
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
let bad = 0;
const fail = (...a) => { bad++; console.log('❌', ...a); };

// 1) 문법 검사
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chk-'));
const check = (file, label) => { try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch (e) { fail('문법 오류', label, String(e.stderr || e.message).split('\n').slice(0, 4).join(' ')); } };
const htmls = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
for (const f of htmls) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /<script(?![^>]*\bsrc=)(?![^>]*type="(?:module|application\/json|text\/template)")[^>]*>([\s\S]*?)<\/script>/g;
  let m, i = 0;
  while ((m = re.exec(s))) { const p = path.join(tmp, f + '.' + (i++) + '.js'); fs.writeFileSync(p, m[1]); check(p, `${f} (<script> ${i}번째)`); }
}
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.js'))) check(path.join(ROOT, f), f);
for (const f of fs.readdirSync(path.join(ROOT, 'api')).filter(f => f.endsWith('.js'))) check(path.join(ROOT, 'api', f), 'api/' + f);
console.log(`1) 문법 검사: html ${htmls.length}개 + js 끝`);

// 2)·3) 화면 점검
let pw; try { pw = require('playwright'); } catch (e) { console.log('⚠️ playwright가 없어 화면 점검(2·3)은 건너뜀'); finish(); return; }
(async () => {
  const b = await pw.chromium.launch();
  const IGNORE = /firebase|XLSX|katex|GGB|ggb|Failed to fetch|NetworkError|net::/i;
  const students = htmls.filter(f => /^student.*\.html$/.test(f));
  for (const f of students) {
    const url = 'file://' + path.join(ROOT, f) + '?preview=1';
    // 2) 휴대폰 폭
    let p = await b.newPage({ viewport: { width: 390, height: 800 } }); const errs = [];
    p.on('pageerror', e => { if (!IGNORE.test(e.message)) errs.push(e.message); });
    await p.goto(url).catch(() => {}); await p.waitForTimeout(800);
    const w = await p.evaluate(() => document.documentElement.scrollWidth);
    if (errs.length) fail(f, '페이지 오류:', errs.slice(0, 2).join(' | '));
    if (w > 400) fail(f, `가로 넘침 ${w}px (390px 화면)`);
    await p.close();
    // 3) 글상자 잘림
    p = await b.newPage({ viewport: { width: 1200, height: 900 } });
    await p.goto(url).catch(() => {}); await p.waitForTimeout(700);
    const n = await p.evaluate(() => { const ts = [...document.querySelectorAll('textarea')].filter(x => x.offsetParent && !x.disabled);
      ts.forEach(t => { t.value = '가나다라마바사아자차 '.repeat(50); t.dispatchEvent(new Event('input', { bubbles: true })); }); return ts.length; });
    if (n) {
      await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(500);
      const clip = await p.evaluate(() => [...document.querySelectorAll('textarea')].filter(t => t.offsetParent && getComputedStyle(t).overflowY === 'hidden' && t.scrollHeight > t.clientHeight + 4).map(t => (t.dataset.k || t.id || 'textarea') + ` ${t.clientHeight}/${t.scrollHeight}px`));
      if (clip.length) fail(f, '글상자 잘림:', clip.slice(0, 3).join(', '));
    }
    await p.close();
  }
  await b.close();
  console.log(`2)·3) 학생 화면 ${students.length}개 점검 끝`);
  finish();
})();
function finish() { fs.rmSync(tmp, { recursive: true, force: true }); console.log(bad ? `\n문제 ${bad}개 — 고친 뒤 다시 실행하세요.` : '\n✅ 모두 통과'); process.exitCode = bad ? 1 : 0; }
