# 이미지 폴더

이 폴더에는 실제 퀴즈 이미지들이 저장됩니다.

## 사용법

1. 이 폴더에 실제 이미지 파일들을 넣으세요
2. 지원되는 형식: JPG, PNG, GIF, WEBP
3. 권장 크기: 500x500 픽셀
4. 파일명 예시: quiz_*.webp

## 필수 파일

### image_cover.png
- **위치**: `public/images/image_cover.png`
- **용도**: 모든 퀴즈 문제의 배경 이미지로 사용
- **크기**: 500x500 픽셀 권장
- **설명**: 이 이미지는 모든 문제에서 고정으로 사용되는 커버 이미지입니다.

## 퀴즈 이미지 폴더 구조

```
public/
├── images/
│   ├── image_cover.png    # 필수: 모든 문제의 배경 이미지
│   └── README.md
└── quiz_images/
    ├── low/               # 난이도 낮음 (difficulty: 0)
    │   ├── quiz_0022f1d2-0c14-409f-ab67-5e7c12fa4130.webp
    │   └── ...
    ├── middle/            # 난이도 중간 (difficulty: 1)
    │   ├── quiz_0032a29a-9e9e-4771-924a-24dbd864a7d3.webp
    │   └── ...
    └── high/              # 난이도 높음 (difficulty: 2)
        ├── quiz_002e8c48-26a5-49ad-bf7f-c21707905a4f.webp
        ├── quiz_004095c7-88c9-41db-a220-8f4a3fd46f43.webp
        └── ...
```

## 코드에서 사용

`src/utils/captchaData.js` 파일에서 퀴즈 데이터를 관리합니다.

```javascript
// 커버 이미지 (모든 문제에서 사용)
export const getCoverImage = () => {
  return "/images/image_cover.png";
};

// 실제 퀴즈 데이터
export const quizData = [
  {
    id: 1,
    image_url: "quiz_images/low/quiz_0022f1d2-0c14-409f-ab67-5e7c12fa4130.webp",
    answer: "시계",
    prompt: "스크래치 후 정답을 선택하세요. 노이즈 44% 알파블랜드 15%",
    difficulty: 0,
    wrong_answer_1: "자동차",
    wrong_answer_2: "고양이",
    wrong_answer_3: "곰"
  },
  // ... 더 많은 퀴즈 데이터
];
```

새로운 퀴즈를 추가할 때는 `quizData` 배열에 퀴즈 객체를 추가하세요.
