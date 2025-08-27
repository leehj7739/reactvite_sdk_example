// 캡차 관련 데이터 및 유틸리티
export const captchaData = {
  // 캡차 이미지 (실제 이미지 파일 경로 사용)
  captchaImages: [
    // 실제 이미지 파일 경로들
    '/images/scratcha_logo_processed.png',
    '/images/image_cover.png',
    '/images/scratchalogo.svg'
  ],

  // 캡차 정답 (Demo용)
  captchaAnswers: {
    'captcha_1': '1234',
    'captcha_2': 'ABCD',
    'captcha_3': '5678'
  },

  // 캡차 타입별 설정
  captchaTypes: {
    number: {
      length: 4,
      pattern: /^[0-9]+$/,
      placeholder: '숫자 4자리를 입력하세요'
    },
    text: {
      length: 4,
      pattern: /^[A-Za-z]+$/,
      placeholder: '영문 4자리를 입력하세요'
    },
    mixed: {
      length: 6,
      pattern: /^[A-Za-z0-9]+$/,
      placeholder: '영문+숫자 6자리를 입력하세요'
    }
  }
}

// 캡차 ID 생성
export const generateCaptchaId = () => {
  return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 커버 이미지 (모든 문제에서 사용) - imageAssets.js에서 제공됨
// export const getCoverImage = () => {
//   return '/images/image_cover.png'
// }

// 캡차 이미지 랜덤 선택
export const getRandomCaptchaImage = () => {
  const randomIndex = Math.floor(Math.random() * captchaData.captchaImages.length)
  return captchaData.captchaImages[randomIndex]
}

// 실제 퀴즈 데이터
export const quizData = [
  {
    id: 1,
    image_url: "quiz_images/low/quiz_0022f1d2-0c14-409f-ab67-5e7c12fa4130.webp",
    answer: "시계",
    prompt: "스크래치 후 정답을 선택하세요. 노이즈 44% 알파블랜드 15%",
    created_at: "2025-08-12 08:20:54",
    expires_at: "2025-08-13 08:20:54",
    difficulty: 0,
    wrong_answer_1: "자동차",
    wrong_answer_2: "고양이",
    wrong_answer_3: "곰"
  },
  {
    id: 2,
    image_url: "quiz_images/high/quiz_002e8c48-26a5-49ad-bf7f-c21707905a4f.webp",
    answer: "소",
    prompt: "스크래치 후 정답을 선택하세요. 노이즈 79% 알파블랜드 34%",
    created_at: "2025-08-12 08:04:04",
    expires_at: "2025-08-13 08:04:04",
    difficulty: 2,
    wrong_answer_1: "코끼리",
    wrong_answer_2: "시계",
    wrong_answer_3: "배"
  },
  {
    id: 3,
    image_url: "quiz_images/middle/quiz_0032a29a-9e9e-4771-924a-24dbd864a7d3.webp",
    answer: "고양이",
    prompt: "스크래치 후 정답을 선택하세요. 노이즈 51% 알파블랜드 23%",
    created_at: "2025-08-12 08:17:23",
    expires_at: "2025-08-13 08:17:23",
    difficulty: 1,
    wrong_answer_1: "개",
    wrong_answer_2: "배",
    wrong_answer_3: "쥐"
  },
  {
    id: 4,
    image_url: "quiz_images/high/quiz_004095c7-88c9-41db-a220-8f4a3fd46f43.webp",
    answer: "소",
    prompt: "스크래치 후 정답을 선택하세요. 노이즈 96% 알파블랜드 34%",
    created_at: "2025-08-12 08:09:24",
    expires_at: "2025-08-13 08:09:24",
    difficulty: 2,
    wrong_answer_1: "시계",
    wrong_answer_2: "코끼리",
    wrong_answer_3: "침대"
  }
]

// 실제 이미지 목록 (퀴즈 데이터에서 추출)
export const getRealImageList = () => {
  return quizData.map(quiz => quiz.image_url)
}

// 랜덤 퀴즈 선택
export const getRandomQuiz = () => {
  const randomIndex = Math.floor(Math.random() * quizData.length)
  return quizData[randomIndex]
}

// 실제 이미지 랜덤 선택 (기존 호환성 유지)
export const getRandomRealImage = () => {
  const quiz = getRandomQuiz()
  return quiz.image_url
}

// 퀴즈 정답 옵션 생성
export const generateQuizAnswerOptions = (quiz) => {
  const options = [
    quiz.answer,
    quiz.wrong_answer_1,
    quiz.wrong_answer_2,
    quiz.wrong_answer_3
  ]
  return options.sort(() => Math.random() - 0.5)
}

// 캡차 정답 생성 (Demo용 - 기존 호환성 유지)
export const generateCaptchaAnswer = (type = 'number') => {
  const config = captchaData.captchaTypes[type]
  const chars = type === 'number' ? '0123456789' :
    type === 'text' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' :
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  let result = ''
  for (let i = 0; i < config.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 퀴즈 검증
export const validateQuiz = (userInput, correctAnswer) => {
  if (userInput === correctAnswer) {
    return {
      success: true,
      message: '정답입니다! 퀴즈를 성공적으로 완료했습니다.'
    }
  } else {
    return {
      success: false,
      error: '오답입니다. 다시 시도해주세요.',
      attempts: 1
    }
  }
}

// 캡차 검증 (Demo용 - 기존 호환성 유지)
export const validateCaptcha = (userInput, correctAnswer, type = 'number') => {
  const config = captchaData.captchaTypes[type]

  // 패턴 검증
  if (!config.pattern.test(userInput)) {
    return {
      success: false,
      error: '입력 형식이 올바르지 않습니다.',
      expectedFormat: config.placeholder
    }
  }

  // 길이 검증
  if (userInput.length !== config.length) {
    return {
      success: false,
      error: `정확히 ${config.length}자리를 입력해주세요.`,
      expectedLength: config.length
    }
  }

  // 정답 검증
  if (userInput.toUpperCase() === correctAnswer.toUpperCase()) {
    return {
      success: true,
      message: '캡차 인증이 완료되었습니다!'
    }
  } else {
    return {
      success: false,
      error: '캡차가 일치하지 않습니다. 다시 시도해주세요.',
      attempts: 1
    }
  }
}

// 캡차 시뮬레이션 지연
export const simulateCaptchaProcessing = (minDelay = 1000, maxDelay = 3000) => {
  const delay = Math.random() * (maxDelay - minDelay) + minDelay
  return new Promise(resolve => setTimeout(resolve, delay))
}

// 캡차 상태 관리
export const captchaStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFRESHING: 'refreshing'
}
