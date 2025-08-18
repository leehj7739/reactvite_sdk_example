# Scratcha SDK 개발 가이드

## 개요

이 문서는 Scratcha SDK의 개발, 빌드, 배포 과정을 단계별로 설명합니다.

## 프로젝트 구조

```
scratcha-sdk/
├── src/
│   ├── components/          # React 컴포넌트들
│   ├── hooks/              # 커스텀 React 훅들
│   ├── utils/              # 유틸리티 함수들
│   ├── App.jsx             # 개발용 테스트 앱
│   ├── main.jsx            # React 앱 진입점
│   └── index.js            # SDK 메인 엔트리
├── public/                 # 정적 파일들 (이미지 등)
├── dist/                   # 빌드 결과물
├── scripts/                # 빌드 스크립트들
├── vite.config.js          # Vite 설정 (개발용)
├── vite.lib.config.js      # Vite 설정 (SDK 빌드용)
└── package.json            # 프로젝트 설정
```

## 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

- `http://localhost:5173`에서 개발 중인 SDK를 확인할 수 있습니다.

### 3. 린트 검사

```bash
npm run lint
```

## SDK 빌드

### 1. 라이브러리 빌드

```bash
npm run build:lib
```

- `dist/index.esm` (ES 모듈)
- `dist/index.js` (CommonJS)
- TypeScript 타입 정의 파일들이 생성됩니다.

### 2. 전체 빌드 (앱 + 라이브러리)

```bash
npm run build
```

## 로컬 테스트

### 1. 패키지 패킹

```bash
npm pack
```

- `scratcha-sdk-1.0.x.tgz` 파일이 생성됩니다.

### 2. Example 프로젝트에서 테스트

```bash
cd ../example/example
npm install ../../scratcha-sdk/scratcha-sdk-1.0.x.tgz
npm run dev
```

## 주요 컴포넌트

### ScratchaWidget

메인 SDK 컴포넌트로, 캡차 기능을 제공합니다.

**Props:**

- `mode`: 'demo' | 'normal' - 동작 모드
- `apiKey`: string - API 키 (normal 모드에서 필요)
- `endpoint`: string - API 엔드포인트

**사용 예시:**

```jsx
import { ScratchaWidget } from "scratcha-sdk";

function App() {
  return (
    <ScratchaWidget
      mode="demo"
      apiKey="your-api-key"
      endpoint="https://api.scratcha.com"
    />
  );
}
```

### useScratchaAPI

API 통신을 담당하는 커스텀 훅입니다.

**반환값:**

- `isConnected`: 연결 상태
- `isLoading`: 로딩 상태
- `lastResponse`: 마지막 응답
- `error`: 에러 정보
- `sendRequest`: API 요청 함수

## 유틸리티 함수들

### imageUtils.js

이미지 관련 유틸리티 함수들을 제공합니다.

### demoData.js

Demo 모드에서 사용되는 목 데이터를 제공합니다.

### helpers.js

공통 유틸리티 함수들을 제공합니다.

## 빌드 프로세스

### 1. Tailwind CSS 인라인 변환

빌드 시 Tailwind CSS 클래스들이 인라인 스타일로 변환됩니다.

- `scripts/vite-tw-to-css.js` 플러그인이 사용됩니다.
- `tw-to-css` 패키지를 활용합니다.

### 2. 이미지 Base64 인코딩

정적 이미지들이 Base64로 인코딩되어 JavaScript 번들에 포함됩니다.

- `scripts/encode-images.js` 스크립트가 사용됩니다.

## 배포 준비

### 1. 버전 업데이트

`package.json`의 `version` 필드를 업데이트합니다.

### 2. 빌드 및 패킹

```bash
npm run build:lib
npm pack
```

### 3. npm 배포

```bash
npm publish
```

## 문제 해결

### 이미지 로딩 실패

- `public/images/` 폴더에 이미지 파일들이 있는지 확인
- `npm run encode-images` 실행하여 Base64 인코딩

### 스타일 적용 안됨

- Tailwind CSS 클래스가 올바르게 인라인 변환되었는지 확인
- `dist/index.esm` 파일에서 `style:` 속성 확인

### API 연결 실패

- Demo 모드에서는 항상 연결된 것으로 간주
- Normal 모드에서는 API 키와 엔드포인트 확인

## 개발 팁

1. **Demo 모드 활용**: API 서버 없이도 기능 테스트 가능
2. **Example 프로젝트**: 실제 사용 환경에서의 동작 확인
3. **린트 검사**: 코드 품질 유지를 위해 정기적으로 실행
4. **TypeScript**: 타입 안정성을 위해 `.d.ts` 파일 활용
