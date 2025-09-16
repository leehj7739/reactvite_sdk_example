// JWT 토큰 관리 유틸리티 (5분 유효)
const CAPTCHA_TOKEN_KEY = 'captcha_session_token';
const CAPTCHA_EXPIRES_KEY = 'captcha_session_expires';
const TOKEN_DURATION = 5 * 60 * 1000; // 5분

/**
 * 캡차 세션 토큰 생성
 * @param {string} userId - 사용자 ID (기본값: 'anonymous')
 * @returns {Object} 세션 데이터
 */
export const createCaptchaToken = (userId = 'anonymous') => {
  const sessionData = {
    userId,
    captchaVerified: true,
    timestamp: Date.now(),
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    expires: Date.now() + TOKEN_DURATION
  };

  // Base64로 인코딩하여 저장
  const token = btoa(JSON.stringify(sessionData));
  const expires = sessionData.expires;

  localStorage.setItem(CAPTCHA_TOKEN_KEY, token);
  localStorage.setItem(CAPTCHA_EXPIRES_KEY, expires.toString());

  console.log('캡차 토큰 생성:', sessionData);
  return sessionData;
};

/**
 * 캡차 세션 토큰 검증
 * @returns {Object|null} 유효한 세션 데이터 또는 null
 */
export const getCaptchaToken = () => {
  try {
    const token = localStorage.getItem(CAPTCHA_TOKEN_KEY);
    const expires = localStorage.getItem(CAPTCHA_EXPIRES_KEY);

    if (!token || !expires) return null;

    // 만료 시간 체크
    if (Date.now() > parseInt(expires)) {
      clearCaptchaToken();
      return null;
    }

    // 토큰 디코딩
    const sessionData = JSON.parse(atob(token));
    return sessionData;
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    clearCaptchaToken();
    return null;
  }
};

/**
 * 캡차 세션 토큰 유효성 검사 (토큰 삭제하지 않음)
 * @returns {boolean} 토큰 유효 여부
 */
export const isCaptchaTokenValid = () => {
  try {
    const token = localStorage.getItem(CAPTCHA_TOKEN_KEY);
    const expires = localStorage.getItem(CAPTCHA_EXPIRES_KEY);

    if (!token || !expires) return false;

    // 만료 시간만 체크하고 토큰은 삭제하지 않음
    return Date.now() <= parseInt(expires);
  } catch (error) {
    console.error('토큰 유효성 검사 오류:', error);
    return false;
  }
};

/**
 * 캡차 세션 토큰 삭제
 */
export const clearCaptchaToken = () => {
  localStorage.removeItem(CAPTCHA_TOKEN_KEY);
  localStorage.removeItem(CAPTCHA_EXPIRES_KEY);
  console.log('캡차 토큰 삭제됨');
};

/**
 * 토큰 남은 시간 계산 (초 단위)
 * @returns {number} 남은 시간 (초)
 */
export const getTokenTimeLeft = () => {
  const expires = localStorage.getItem(CAPTCHA_EXPIRES_KEY);
  if (!expires) return 0;

  const timeLeft = parseInt(expires) - Date.now();
  return Math.max(0, Math.floor(timeLeft / 1000));
};

/**
 * 토큰 남은 시간을 분:초 형식으로 포맷
 * @returns {string} MM:SS 형식의 시간
 */
export const formatTokenTimeLeft = () => {
  const seconds = getTokenTimeLeft();
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * 토큰 정보 가져오기 (UI 표시용, 토큰 삭제하지 않음)
 * @returns {Object} 토큰 정보
 */
export const getTokenInfo = () => {
  try {
    const token = localStorage.getItem(CAPTCHA_TOKEN_KEY);
    const expires = localStorage.getItem(CAPTCHA_EXPIRES_KEY);

    if (!token || !expires) {
      return {
        exists: false,
        isValid: false,
        timeLeft: 0,
        formattedTime: '0:00',
        sessionId: null,
        data: null
      };
    }

    const isExpired = Date.now() > parseInt(expires);
    const timeLeft = Math.max(0, Math.floor((parseInt(expires) - Date.now()) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = timeLeft % 60;
    const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

    let sessionData = null;
    try {
      sessionData = JSON.parse(atob(token));
    } catch (error) {
      console.error('토큰 디코딩 오류:', error);
    }

    return {
      exists: true,
      isValid: !isExpired,
      timeLeft,
      formattedTime,
      sessionId: sessionData?.sessionId || null,
      data: sessionData
    };
  } catch (error) {
    console.error('토큰 정보 가져오기 오류:', error);
    return {
      exists: false,
      isValid: false,
      timeLeft: 0,
      formattedTime: '0:00',
      sessionId: null,
      data: null
    };
  }
};
