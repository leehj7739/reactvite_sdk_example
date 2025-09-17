# Scratcha SDK

React 애플리케이션을 위한 Scratcha SDK입니다. 캔버스 기반 이미지 처리, 캡차 시스템, API 통신 기능을 제공합니다.

## 🚀 설치

```bash
npm install scratcha-sdk
```

## 📦 주요 기능

- **캔버스 기반 이미지 처리**: 스크래치 기능이 있는 캔버스 컴포넌트
- **캡차 시스템**: 이미지 기반 캡차 및 정답 검증
- **API 통신**: 캡차 문제 요청 및 정답 검증
- **토큰 관리**: 5분 유효한 캡차 토큰 시스템
- **데모 모드**: 내부 데이터로 테스트 가능
- **반응형 UI**: 순수 CSS 기반 모던한 디자인
- **CORS 지원**: 외부 이미지 로딩 지원
- **로딩 상태**: 이미지 로딩 및 API 요청 상태 표시
- **환경변수 지원**: Vite 환경변수로 설정 관리

## 🎯 빠른 시작

### 기본 사용법 (데모 모드)

```jsx
import React from "react";
import { ScratchaWidget } from "scratcha-sdk";

function App() {
  const handleSuccess = (result) => {
    console.log("성공:", result);
    // result.result.selectedAnswer로 선택한 답안에 접근
    alert(`성공! 선택한 답안: ${result.result.selectedAnswer}`);
  };

  const handleError = (error) => {
    console.error("오류:", error);
    alert(`오류: ${error.message || "알 수 없는 오류"}`);
  };

  return (
    <div className="App">
      <ScratchaWidget
        mode="demo"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}

export default App;
```

### 실제 API 사용 (직접 설정)

```jsx
import React from "react";
import { ScratchaWidget } from "scratcha-sdk";

function App() {
  const handleSuccess = (result) => {
    console.log("성공:", result);
    alert(`성공! 선택한 답안: ${result.result.selectedAnswer}`);
  };

  const handleError = (error) => {
    console.error("오류:", error);
    alert(`오류: ${error.message || "알 수 없는 오류"}`);
  };

  return (
    <ScratchaWidget
      apiKey="your-api-key"
      endpoint="https://api.your-domain.com"
      mode="normal"
      onSuccess={handleSuccess}
      onError={handleError}
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
| `onSuccess` | `(result: any) => void` | -          | 성공 시 콜백                 |
| `onError`   | `(error: any) => void`  | -          | 오류 시 콜백                 |

## 🔐 토큰 관리 시스템

SDK는 캡차 인증 성공 시 자동으로 5분 유효한 토큰을 생성합니다.

## 📡 API 응답 구조

### 성공 응답 (정답)

```javascript
{
  success: true,
  result: {
    clientToken: "token-123",
    selectedAnswer: "사과",        // 사용자가 선택한 답안
    isCorrect: true,
    timestamp: 1234567890,
    processingTime: 750
  },
  message: "정답입니다!"
}
```

### 실패 응답 (오답)

```javascript
{
  success: false,
  result: {
    clientToken: "token-123",
    selectedAnswer: "바나나",      // 사용자가 선택한 답안
    isCorrect: false,
    timestamp: 1234567890,
    processingTime: 750
  },
  message: "오답입니다. 다시 시도해주세요."
}
```

### 캡차 문제 요청 응답

```javascript
{
  clientToken: "token-123",
  imageUrl: "https://example.com/image.jpg",
  prompt: "화면을 스크래치하여 정답을 선택해주세요.",
  options: ["사과", "바나나", "오렌지", "포도"]
}
```

## ⚠️ 에러 처리 가이드

### 에러 타입별 처리

```jsx
const handleError = (error) => {
  console.error("Scratcha 에러:", error);

  // API 연결 에러 (네트워크 문제)
  if (error.message && !error.result) {
    console.log("API 연결 에러");
    // 서버 연결 실패, 네트워크 문제 등
    alert("서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  // 캡차 검증 실패 (오답)
  if (error.result && !error.success) {
    console.log("캡차 검증 실패");
    console.log("선택한 답안:", error.result.selectedAnswer);
    console.log("정답 여부:", error.result.isCorrect);
    alert(
      `캡차 인증에 실패했습니다. 선택한 답안: ${error.result.selectedAnswer}`
    );
    return;
  }

  // 기타 에러
  alert(`알 수 없는 오류가 발생했습니다: ${error.message || "Unknown error"}`);
};
```

### 일반적인 에러 상황

1. **네트워크 에러**: 인터넷 연결 문제 또는 서버 다운
2. **API 키 에러**: 잘못된 API 키 또는 권한 문제
3. **캡차 실패**: 사용자가 잘못된 답안 선택
4. **CORS 에러**: 도메인 설정 문제

## 🎨 컴포넌트

### ScratchaWidget

메인 위젯 컴포넌트로, 전체 캡차 서비스를 제공합니다.

```jsx
import { ScratchaWidget } from "scratcha-sdk";

<ScratchaWidget mode="demo" onSuccess={handleSuccess} onError={handleError} />;
```

### Canvas

스크래치 기능이 있는 캔버스 컴포넌트입니다.

```jsx
import { Canvas } from "scratcha-sdk";

<Canvas
  width={300}
  height={300}
  enableScratch={true}
  onImageLoad={(url) => console.log("이미지 로드됨:", url)}
/>;
```

### Button

재사용 가능한 버튼 컴포넌트입니다.

```jsx
import { Button } from "scratcha-sdk";

<Button onClick={handleClick} variant="primary" size="medium" disabled={false}>
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
  const { isLoading, getCaptchaProblem, verifyAnswer } = useScratchaAPI({
    apiKey: import.meta.env.VITE_SCRATCHA_API_KEY,
    endpoint: import.meta.env.VITE_SCRATCHA_ENDPOINT,
    mode: "normal",
  });

  const handleGetProblem = async () => {
    try {
      const problem = await getCaptchaProblem();
      console.log("캡차 문제:", problem);
    } catch (error) {
      console.error("문제 가져오기 실패:", error);
    }
  };

  const handleVerify = async (clientToken, answer) => {
    try {
      const result = await verifyAnswer(clientToken, answer);
      console.log("검증 결과:", result);
    } catch (error) {
      console.error("검증 실패:", error);
    }
  };

  return (
    <div>
      <p>로딩 상태: {isLoading ? "로딩 중..." : "완료"}</p>
      <button onClick={handleGetProblem}>문제 가져오기</button>
    </div>
  );
}
```

## 🛠️ 유틸리티 함수

### 캡차 관련 함수

```jsx
import {
  getRandomQuiz,
  generateQuizAnswerOptions,
  getCoverImagePath,
  getLogoImagePath,
  getQuizImagePath,
} from "scratcha-sdk";

// 랜덤 퀴즈 가져오기
const quiz = getRandomQuiz();

// 답안 옵션 생성
const options = generateQuizAnswerOptions(quiz);

// 이미지 경로 가져오기
const coverImage = getCoverImagePath();
const logoImage = getLogoImagePath();
const quizImage = getQuizImagePath(quiz.image_url);
```

## 🎯 데모 모드

데모 모드에서는 실제 API 없이도 SDK를 테스트할 수 있습니다.

```jsx
<ScratchaWidget
  mode="demo"
  onSuccess={(result) => {
    console.log("데모 성공:", result);
    // result.result.selectedAnswer로 접근
    console.log("선택한 답안:", result.result.selectedAnswer);
  }}
/>
```

## 🔧 고급 기능

### 이미지 로딩 상태 관리

```jsx
// normal 모드에서 이미지 로딩 중에는 상호작용이 차단됩니다
<ScratchaWidget
  mode="normal"
  apiKey={import.meta.env.VITE_SCRATCHA_API_KEY}
  endpoint={import.meta.env.VITE_SCRATCHA_ENDPOINT}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### CORS 이미지 로딩

SDK는 자동으로 CORS 문제를 해결하여 외부 이미지를 로딩합니다.

### 콘솔 로깅

개발 모드에서 이미지 로딩 시간과 API 응답 결과가 콘솔에 표시됩니다.

## 📁 파일 구조

```
scratcha-sdk/
├── dist/                 # 빌드된 파일들
│   ├── index.js         # ES 모듈 번들
│   ├── index.umd.cjs    # UMD 번들
│   └── vite.svg         # 빌드 아이콘
├── src/
│   ├── components/      # React 컴포넌트들
│   │   ├── ScratchaWidget.jsx
│   │   ├── Canvas.jsx
│   │   ├── Button.jsx
│   │   └── TextDisplay.jsx
│   ├── hooks/          # 커스텀 훅들
│   │   └── useScratchaAPI.js
│   ├── utils/          # 유틸리티 함수들
│   │   ├── captchaData.js
│   │   ├── demoData.js
│   │   ├── helpers.js
│   │   ├── imageAssets.js
│   │   └── imageUtils.js
│   ├── index.js        # 메인 진입점 (CSS 포함)
│   └── index.css       # 스타일 정의
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
