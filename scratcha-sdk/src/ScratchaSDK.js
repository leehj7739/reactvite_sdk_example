import { logger, validationUtils, imageUtils } from './utils/helpers'

class ScratchaSDK {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey,
      endpoint: config.endpoint || 'https://api.scratcha.com',
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      ...config
    }

    this.isInitialized = false
    this.eventListeners = new Map()

    // 설정 검증
    this.validateConfig()
  }

  // 설정 검증
  validateConfig() {
    if (!this.config.apiKey) {
      throw new Error('API 키가 필요합니다.')
    }

    if (!validationUtils.isValidApiKey(this.config.apiKey)) {
      throw new Error('유효하지 않은 API 키입니다.')
    }

    if (!validationUtils.isValidUrl(this.config.endpoint)) {
      throw new Error('유효하지 않은 엔드포인트 URL입니다.')
    }
  }

  // SDK 초기화
  async init() {
    try {
      logger.info('ScratchaSDK 초기화 시작')

      // 연결 테스트
      await this.testConnection()

      this.isInitialized = true
      logger.info('ScratchaSDK 초기화 완료')

      this.emit('initialized', { success: true })

    } catch (error) {
      logger.error('SDK 초기화 실패', error)
      this.emit('error', error)
      throw error
    }
  }

  // 연결 테스트
  async testConnection() {
    const response = await fetch(`${this.config.endpoint}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    })

    if (!response.ok) {
      throw new Error(`연결 테스트 실패: ${response.status}`)
    }

    return response.json()
  }

  // 이미지 처리 (실제 이미지 파일 경로 지원)
  async processImages(images, options = {}) {
    this.checkInitialization()

    try {
      logger.info('이미지 처리 시작', { imageCount: images.length })

      // 이미지 데이터 전처리
      const processedImages = await Promise.all(
        images.map(async (imageData, index) => {
          let processedImage = imageData

          // 이미지 파일 경로인 경우 로딩
          if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
            try {
              processedImage = await imageUtils.loadImageFile(imageData)
            } catch (error) {
              logger.warn(`이미지 파일 로딩 실패: ${imageData}`, error)
              // 실패 시 원본 경로 유지
            }
          }

          // 이미지 압축 (옵션)
          if (options.compress) {
            processedImage = await imageUtils.compressImage(processedImage, options.quality || 0.8)
          }

          // 이미지 크기 조정 (옵션)
          if (options.resize) {
            processedImage = await imageUtils.resizeImage(
              processedImage,
              options.maxWidth || 800,
              options.maxHeight || 600
            )
          }

          return {
            id: `image_${index}`,
            data: processedImage,
            type: 'base64'
          }
        })
      )

      const requestData = {
        images: processedImages,
        options,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      const response = await this.sendRequest('/process', requestData)

      logger.info('이미지 처리 완료')
      this.emit('imagesProcessed', response)

      return response

    } catch (error) {
      logger.error('이미지 처리 실패', error)
      this.emit('error', error)
      throw error
    }
  }

  // 텍스트 처리
  async processText(text, options = {}) {
    this.checkInitialization()

    try {
      logger.info('텍스트 처리 시작')

      const requestData = {
        text,
        options,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      const response = await this.sendRequest('/text', requestData)

      logger.info('텍스트 처리 완료')
      this.emit('textProcessed', response)

      return response

    } catch (error) {
      logger.error('텍스트 처리 실패', error)
      this.emit('error', error)
      throw error
    }
  }

  // 배열 데이터 처리
  async processArray(arrayData, options = {}) {
    this.checkInitialization()

    try {
      logger.info('배열 데이터 처리 시작')

      const requestData = {
        array: arrayData,
        options,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      const response = await this.sendRequest('/array', requestData)

      logger.info('배열 데이터 처리 완료')
      this.emit('arrayProcessed', response)

      return response

    } catch (error) {
      logger.error('배열 데이터 처리 실패', error)
      this.emit('error', error)
      throw error
    }
  }

  // 배치 처리
  async processBatch(requests) {
    this.checkInitialization()

    try {
      logger.info('배치 처리 시작', { requestCount: requests.length })

      const requestData = {
        requests,
        timestamp: Date.now(),
        version: '1.0.0'
      }

      const response = await this.sendRequest('/batch', requestData)

      logger.info('배치 처리 완료')
      this.emit('batchProcessed', response)

      return response

    } catch (error) {
      logger.error('배치 처리 실패', error)
      this.emit('error', error)
      throw error
    }
  }

  // 일반 API 요청
  async sendRequest(endpoint, data) {
    this.checkInitialization()

    let lastError

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${this.config.endpoint}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(this.config.timeout)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()

      } catch (error) {
        lastError = error
        logger.warn(`API 요청 실패 (시도 ${attempt}/${this.config.retryAttempts})`, error)

        if (attempt < this.config.retryAttempts) {
          // 지수 백오프
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        }
      }
    }

    throw lastError
  }

  // 초기화 상태 확인
  checkInitialization() {
    if (!this.isInitialized) {
      throw new Error('SDK가 초기화되지 않았습니다. init() 메서드를 먼저 호출하세요.')
    }
  }

  // 이벤트 리스너 등록
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  // 이벤트 리스너 제거
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 이벤트 발생
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          logger.error(`이벤트 리스너 오류 (${event})`, error)
        }
      })
    }
  }

  // 설정 업데이트
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.validateConfig()
    logger.info('설정 업데이트됨', this.config)
  }

  // SDK 상태 정보
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      config: { ...this.config, apiKey: '***' }, // API 키 숨김
      endpoint: this.config.endpoint,
      version: '1.0.0'
    }
  }

  // SDK 정리
  destroy() {
    this.isInitialized = false
    this.eventListeners.clear()
    logger.info('ScratchaSDK 정리 완료')
  }
}

export default ScratchaSDK
