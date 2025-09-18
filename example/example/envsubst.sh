#!/bin/sh
echo "=== 환경변수 치환 시작 ==="
echo "API_KEY: ${VITE_SCRATCHA_API_KEY:0:10}..."
echo "ENDPOINT: ${VITE_SCRATCHA_ENDPOINT}"

# 모든 JS 파일에서 환경변수 치환
find /usr/share/nginx/html -name "*.js" -type f | while read file; do
  echo "치환 중: $file"
  sed -i "s|__RUNTIME_API_KEY__|${VITE_SCRATCHA_API_KEY}|g" "$file" 2>/dev/null || echo "API_KEY 치환 실패: $file"
  sed -i "s|__RUNTIME_ENDPOINT__|${VITE_SCRATCHA_ENDPOINT}|g" "$file" 2>/dev/null || echo "ENDPOINT 치환 실패: $file"
done

echo "=== 환경변수 치환 완료 ==="
