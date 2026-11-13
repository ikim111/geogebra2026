// 📋 2026-11-13 교사 화면(tpa3)에 2부 채점 기준표(자세한 버전)를 보여 주려고 — AI 채점에 실제로 쓰는 기준 글을 그대로 돌려준다(읽기만).
const { rubricText } = require('./_report-common');
module.exports = async (req, res) => {
  if (require('./_guard').blockForeign(req, res)) return;
  res.setHeader('cache-control', 'no-store');
  res.status(200).json({ text: rubricText() });
};
