// 2026-10-27: AI 기능·파일 올리기를 우리 사이트(geogebra2026)에서 온 요청만 받는다.
// 브라우저는 POST 요청에 Origin(없으면 Referer) 머리말을 붙이므로, 그 주소가 우리 사이트인지 본다.
// (완벽한 차단은 아니지만 다른 사이트에서 부르거나 가볍게 주소를 따서 쓰는 것은 막는다. 비용 상한은 OpenAI 한도로 지킨다.)
const OK_HOST = /^(geogebra2026(-[\w-]+)?\.vercel\.app|localhost|127\.0\.0\.1)$/i;
function hostOf(u) { try { return new URL(u).hostname; } catch (e) { return ''; } }
function fromOurSite(req) {
  const h = req.headers || {};
  const src = h.origin || h.referer || h.referrer || '';
  return OK_HOST.test(hostOf(src));
}
// 막혔으면 응답까지 보내고 true를 돌려준다
function blockForeign(req, res) {
  if (fromOurSite(req)) return false;
  res.status(403).json({ error: '이 기능은 수업 사이트에서만 쓸 수 있어요.' });
  return true;
}
module.exports = { fromOurSite, blockForeign };
