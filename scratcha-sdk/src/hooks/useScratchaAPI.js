import { useState, useEffect, useCallback } from 'react'
import {
  simulateApiDelay
} from '../utils/demoData'

export const useScratchaAPI = ({
  apiKey,
  endpoint = 'https://api.scratcha.com',
  mode = 'normal' // 'demo' | 'normal'
}) => {
  const [isConnected, setIsConnected] = useState(mode === 'demo' ? true : false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState(null)
  const [error, setError] = useState(null)

  // 연결 상태 확인
  const checkConnection = useCallback(async () => {
    if (mode === 'demo') {
      // Demo 모드에서는 항상 연결된 것으로 간주
      setIsConnected(true)
      return
    }

    if (!apiKey) {
      setIsConnected(false)
      return
    }

    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      setIsConnected(response.ok)
    } catch (err) {
      setIsConnected(false)
      console.warn('API 연결 확인 실패:', err.message)
    }
  }, [apiKey, endpoint, mode])

  // 초기 연결 확인
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // 주기적 연결 상태 확인 (30초마다)
  useEffect(() => {
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [checkConnection])

  // API 요청 전송
  const sendRequest = useCallback(async (data) => {
    if (mode === 'demo') {
      setIsLoading(true)
      setError(null)

      try {
        // Demo 모드에서는 지연 시간 시뮬레이션
        await simulateApiDelay()

        // 데모 모드에서 실제 정답 검증
        const isCorrect = data.selectedAnswer === data.correctAnswer

        const demoResponse = {
          success: isCorrect,
          result: {
            quizId: data.quizId,
            selectedAnswer: data.selectedAnswer,
            correctAnswer: data.correctAnswer,
            isCorrect: isCorrect,
            timestamp: Date.now(),
            processingTime: Math.random() * 500 + 500 // 500-1000ms
          },
          message: isCorrect ? '정답입니다!' : '오답입니다. 다시 시도해주세요.'
        }

        setLastResponse(demoResponse)
        return demoResponse

      } catch (err) {
        const errorMessage = err.message || 'Demo 모드 요청 중 오류가 발생했습니다.'
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    }

    if (!apiKey) {
      throw new Error('API 키가 필요합니다.')
    }

    if (!isConnected) {
      throw new Error('API 서버에 연결할 수 없습니다.')
    }

    setIsLoading(true)
    setError(null)

    try {
      // 이미지 데이터 처리
      const processedData = {
        ...data,
        images: data.images?.map((imageData, index) => ({
          id: `image_${index}`,
          data: imageData,
          type: 'base64'
        })) || [],
        timestamp: Date.now(),
        version: '1.0.0'
      }

      const response = await fetch(`${endpoint}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setLastResponse(result)
      return result

    } catch (err) {
      const errorMessage = err.message || 'API 요청 중 오류가 발생했습니다.'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, endpoint, isConnected, mode])

  // 텍스트 전용 요청
  const sendTextRequest = useCallback(async (text, options = {}) => {
    return sendRequest({
      text,
      type: 'text',
      ...options
    })
  }, [sendRequest])

  // 배열 데이터 요청
  const sendArrayRequest = useCallback(async (arrayData, options = {}) => {
    return sendRequest({
      array: arrayData,
      type: 'array',
      ...options
    })
  }, [sendRequest])

  // 이미지 전용 요청
  const sendImageRequest = useCallback(async (images, options = {}) => {
    return sendRequest({
      images,
      type: 'image',
      ...options
    })
  }, [sendRequest])

  // 배치 요청 (여러 요청을 한번에 처리)
  const sendBatchRequest = useCallback(async (requests) => {
    if (!apiKey) {
      throw new Error('API 키가 필요합니다.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${endpoint}/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setLastResponse(result)
      return result

    } catch (err) {
      const errorMessage = err.message || '배치 요청 중 오류가 발생했습니다.'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, endpoint])

  // 연결 재시도
  const retryConnection = useCallback(() => {
    checkConnection()
  }, [checkConnection])

  return {
    // 상태
    isConnected,
    isLoading,
    lastResponse,
    error,

    // 메서드
    sendRequest,
    sendTextRequest,
    sendArrayRequest,
    sendImageRequest,
    sendBatchRequest,
    retryConnection,
    checkConnection
  }
}
