# Scratcha SDK

React 애플리케이션을 위한 Scratcha SDK입니다. 캔버스 기반 이미지 처리, 퀴즈 시스템, API 통신 기능을 제공합니다.

## 🚀 설치

```bash
npm install scratcha-sdk
```

## 📦 주요 기능

- **캔버스 기반 이미지 처리**: 스크래치 기능이 있는 캔버스 컴포넌트
- **퀴즈 시스템**: 이미지 기반 퀴즈 및 정답 검증
- **API 통신**: 이미지, 배열, 텍스트 데이터 송수신
- **데모 모드**: 내부 데이터로 테스트 가능
- **반응형 UI**: Tailwind CSS 기반 모던한 디자인
- **TypeScript 지원**: 완전한 타입 정의 제공

## 🎯 빠른 시작

### 기본 사용법

```jsx
import React from "react";
import { ScratchaWidget } from "scratcha-sdk";

function App() {
  const handleSuccess = (result) => {
    console.log("성공:", result);
  };

  const handleError = (error) => {
    console.error("오류:", error);
  };

  return (
    <div className="App">
      <ScratchaWidget
        mode="demo"
        onSuccess={handleSuccess}
        onError={handleError}
        theme="light"
      />
    </div>
  );
}

export default App;
```

### 실제 API 사용

```jsx
import React from "react";
import { ScratchaWidget } from "scratcha-sdk";

function App() {
  return (
    <ScratchaWidget
      apiKey="your-api-key"
      endpoint="https://api.your-domain.com"
      mode="normal"
      onSuccess={(result) => console.log("성공:", result)}
      onError={(error) => console.error("오류:", error)}
    />
  );
}
```

## 🔧 Props

### ScratchaWidget Props

| Prop        | 타입                    | 기본값     | 설명                         |
| ----------- | ----------------------- | ---------- | ---------------------------- |
| `apiKey`    | `string`                | -          | API 인증 키                  |
| `endpoint`  | `string`                | -          | API 엔드포인트 URL           |
| `mode`      | `'demo' \| 'normal'`    | `'normal'` | 데모 모드 또는 실제 API 모드 |
| `theme`     | `'light' \| 'dark'`     | `'light'`  | UI 테마                      |
| `className` | `string`                | -          | 추가 CSS 클래스              |
| `onSuccess` | `(result: any) => void` | -          | 성공 시 콜백                 |
| `onError`   | `(error: any) => void`  | -          | 오류 시 콜백                 |

## 🎨 컴포넌트

### ScratchaWidget

메인 위젯 컴포넌트로, 전체 캡차 서비스를 제공합니다.

```jsx
import { ScratchaWidget } from "scratcha-sdk";

<ScratchaWidget
  mode="demo"
  theme="light"
  onSuccess={handleSuccess}
  onError={handleError}
/>;
```

### Canvas

스크래치 기능이 있는 캔버스 컴포넌트입니다.

```jsx
import { Canvas } from "scratcha-sdk";

<Canvas
  width={500}
  height={500}
  enableScratch={true}
  className="border rounded"
/>;
```

### Button

재사용 가능한 버튼 컴포넌트입니다.

```jsx
import { Button } from "scratcha-sdk";

<Button onClick={handleClick} variant="primary" disabled={false}>
  클릭하세요
</Button>;
```

### TextDisplay

데이터를 표시하는 컴포넌트입니다.

```jsx
import { TextDisplay } from "scratcha-sdk";

<TextDisplay data={{ message: "Hello World", status: "success" }} />;
```

## 🔌 API 훅

### useScratchaAPI

API 통신을 위한 커스텀 훅입니다.

```jsx
import { useScratchaAPI } from "scratcha-sdk";

function MyComponent() {
  const { isConnected, sendRequest } = useScratchaAPI({
    apiKey: "your-api-key",
    endpoint: "https://api.example.com",
    mode: "normal",
  });

  const handleSubmit = async () => {
    const result = await sendRequest({
      image: "base64-image-data",
      text: "some text",
      array: [1, 2, 3],
    });
  };

  return (
    <div>
      <p>연결 상태: {isConnected ? "연결됨" : "연결 안됨"}</p>
      <button onClick={handleSubmit}>전송</button>
    </div>
  );
}
```

## 🛠️ 유틸리티 함수

### 퀴즈 관련 함수

```jsx
import {
  getRandomQuiz,
  generateQuizAnswerOptions,
  validateQuiz,
} from "scratcha-sdk";

// 랜덤 퀴즈 가져오기
const quiz = getRandomQuiz();

// 답안 옵션 생성
const options = generateQuizAnswerOptions(quiz);

// 답안 검증
const validation = validateQuiz("사용자 답안", "정답");
```

## 🎯 데모 모드

데모 모드에서는 실제 API 없이도 SDK를 테스트할 수 있습니다.

```jsx
<ScratchaWidget
  mode="demo"
  onSuccess={(result) => {
    console.log("데모 성공:", result);
  }}
/>
```

## 📁 파일 구조

```
scratcha-sdk/
├── dist/                 # 빌드된 파일들
│   ├── index.js         # CommonJS 번들
│   ├── index.esm        # ES 모듈 번들
│   ├── index.d.ts       # TypeScript 타입 정의
│   └── images/          # 이미지 파일들
├── src/
│   ├── components/      # React 컴포넌트들
│   ├── hooks/          # 커스텀 훅들
│   ├── utils/          # 유틸리티 함수들
│   └── index.js        # 메인 진입점
└── package.json
```

## 🚀 빌드

SDK를 빌드하려면:

```bash
npm run build:lib
```

## 📦 배포

npm에 배포하려면:

```bash
npm publish
```

## 🔧 개발

개발 서버 실행:

```bash
npm run dev
```

린트 검사:

```bash
npm run lint
```

## 📄 라이선스

MIT License

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.

## 🔄 버전 히스토리

- **v1.0.0**: 초기 릴리스
  - 캔버스 기반 이미지 처리
  - 퀴즈 시스템
  - API 통신
  - 데모 모드
  - TypeScript 지원
