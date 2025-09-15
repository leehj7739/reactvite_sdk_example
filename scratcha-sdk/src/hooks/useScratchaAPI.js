import { useState, useCallback } from 'react'
import { getRandomQuiz, generateQuizAnswerOptions } from '../utils/captchaData'
import { getQuizImagePath } from '../utils/imageUtils'

// 헤더 값을 안전하게 처리하는 함수
const sanitizeHeaderValue = (value) => {
  if (typeof value !== 'string') {
    return String(value)
  }
  // ASCII 범위의 문자만 허용 (0-127)
  return value.split('').filter(char => char.charCodeAt(0) <= 127).join('')
}

export const useScratchaAPI = ({
  apiKey,
  endpoint,
  mode = 'normal' // 'demo' | 'normal'
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState(null)
  const [error, setError] = useState(null)

  // 캡차 문제 요청
  const getCaptchaProblem = useCallback(async () => {
    if (mode === 'demo') {
      setError(null)

      // 데모 모드에서는 기존 퀴즈 데이터 사용
      const quiz = getRandomQuiz()
      const options = generateQuizAnswerOptions(quiz)

      // clientToken에 정답 정보를 포함 (정답 검증용)
      const demoResponse = {
        clientToken: `demo-token-${Date.now()}-${quiz.answer}`,
        imageUrl: getQuizImagePath(quiz.image_url),
        prompt: quiz.prompt,
        options: options
      }

      setLastResponse(demoResponse)
      return demoResponse
    }

    if (!apiKey) {
      throw new Error('API 키가 필요합니다.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${endpoint}/api/captcha/problem`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': sanitizeHeaderValue(apiKey)
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // API 응답에 clientToken이 포함되어 있으므로 그대로 반환
      setLastResponse(result)
      return result

    } catch (err) {
      const errorMessage = err.message || '캡차 문제 요청 중 오류가 발생했습니다.'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, endpoint, mode])

  // 정답 검증 요청
  const verifyAnswer = useCallback(async (clientToken, selectedAnswer, eventData = null) => {
    if (mode === 'demo') {
      setError(null)

      // 데모 모드에서 실제 정답 검증 (clientToken에서 정답 추출)
      const correctAnswer = clientToken.split('-').pop() // clientToken의 마지막 부분이 정답
      const isCorrect = selectedAnswer === correctAnswer

      const demoResponse = {
        success: isCorrect,
        result: {
          clientToken: clientToken,
          selectedAnswer: selectedAnswer,
          isCorrect: isCorrect,
          timestamp: Date.now(),
          processingTime: Math.random() * 500 + 500, // 500-1000ms
          eventData: eventData // 이벤트 데이터 포함
        },
        message: isCorrect ? '정답입니다!' : '오답입니다. 다시 시도해주세요.'
      }

      setLastResponse(demoResponse)
      return demoResponse
    }

    if (!apiKey) {
      throw new Error('API 키가 필요합니다.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const requestPayload = {
        answer: selectedAnswer,
        ...(eventData && { meta: eventData.meta, events: eventData.events })
      }

      console.log('useScratchaAPI: 검증 요청 페이로드', {
        answer: selectedAnswer,
        hasEventData: !!eventData,
        eventCount: eventData?.events?.length || 0,
        metaKeys: eventData?.meta ? Object.keys(eventData.meta) : [],
        payload: requestPayload
      })

      const response = await fetch(`${endpoint}/api/captcha/verify`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Client-Token': sanitizeHeaderValue(clientToken),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // API 응답 형식을 SDK 형식으로 변환
      const convertedResult = {
        success: result.result === 'success',
        result: {
          clientToken: clientToken,
          selectedAnswer: selectedAnswer,
          isCorrect: result.result === 'success',
          timestamp: Date.now(),
          processingTime: Math.random() * 500 + 500,
          eventData: eventData // 이벤트 데이터 포함
        },
        message: result.message
      }

      setLastResponse(convertedResult)
      return convertedResult

    } catch (err) {
      const errorMessage = err.message || '정답 검증 중 오류가 발생했습니다.'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, endpoint, mode])

  return {
    // 상태
    isLoading,
    lastResponse,
    error,

    // 메서드
    getCaptchaProblem,
    verifyAnswer
  }
}