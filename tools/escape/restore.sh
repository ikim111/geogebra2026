#!/bin/bash
# 방탈출 카드 도구를 /tmp/claude-0/escape 로 되살리기
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
R=/tmp/claude-0/escape
mkdir -p "$R"/{print,art/out,sim,shots,fonts}
cp "$SRC"/print/* "$R"/print/
cp "$SRC"/art/* "$R"/art/
cp "$SRC"/sim/* "$R"/sim/
cd "$R"/fonts
for p in hahmlet gowun-dodum; do
  [ -d fontsource-$p-5.3.0 ] && continue
  npm pack @fontsource/$p@5.3.0 >/dev/null 2>&1
  mkdir -p fontsource-$p-5.3.0 && tar xzf fontsource-$p-5.3.0.tgz -C fontsource-$p-5.3.0
done
echo "준비 끝: $R  (그림 zip은 $R/art/ 에 풀어 주세요)"
