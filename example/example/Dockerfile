# === Build Stage ===
FROM node:18-alpine as builder

# 보안 업데이트 및 필수 도구 설치
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 (캐싱 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm ci && npm cache clean --force

# 소스 코드 복사
COPY . .

# 템플릿용 환경변수로 빌드 (런타임에 치환됨)
ENV VITE_SCRATCHA_API_KEY=__RUNTIME_API_KEY__
ENV VITE_SCRATCHA_ENDPOINT=__RUNTIME_ENDPOINT__

# 애플리케이션 빌드
RUN npm run build

# === Production Stage ===
FROM nginx:1.25-alpine

# 보안 업데이트 및 필요한 패키지 설치
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 빌드된 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 환경변수 치환 스크립트 복사
COPY envsubst.sh /docker-entrypoint.d/30-envsubst-custom.sh
RUN chmod +x /docker-entrypoint.d/30-envsubst-custom.sh

# nginx 설정 파일 생성 (SPA + 캐싱 최적화)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
        access_log off; \
    } \
    location ~* \.html$ { \
        expires -1; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
    } \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
}' > /etc/nginx/conf.d/default.conf

# 보안을 위해 nginx 사용자로 소유권 설정
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# 포트 80 노출
EXPOSE 80

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# nginx 시작
CMD ["nginx", "-g", "daemon off;"]
