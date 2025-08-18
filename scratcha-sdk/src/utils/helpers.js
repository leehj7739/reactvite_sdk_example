// 이미지 관련 유틸리티
export const imageUtils = {
  // Base64 이미지를 Blob으로 변환
  base64ToBlob: (base64, mimeType = 'image/png') => {
    const byteCharacters = atob(base64.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  },

  // Blob을 Base64로 변환
  blobToBase64: (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  },

  // 이미지 크기 조정
  resizeImage: (imageData, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = imageData
    })
  },

  // 이미지 압축
  compressImage: (imageData, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = imageData
    })
  }
}

// 데이터 변환 유틸리티
export const dataUtils = {
  // 객체를 FormData로 변환
  objectToFormData: (obj) => {
    const formData = new FormData()

    Object.entries(obj).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item)
        })
      } else if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value)
      }
    })

    return formData
  },

  // FormData를 객체로 변환
  formDataToObject: (formData) => {
    const obj = {}

    for (const [key, value] of formData.entries()) {
      if (key.includes('[') && key.includes(']')) {
        // 배열 처리
        const arrayKey = key.split('[')[0]
        const index = parseInt(key.match(/\[(\d+)\]/)[1])

        if (!obj[arrayKey]) {
          obj[arrayKey] = []
        }

        obj[arrayKey][index] = value
      } else {
        obj[key] = value
      }
    }

    return obj
  },

  // 깊은 복사
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (obj instanceof Array) {
      return obj.map(item => dataUtils.deepClone(item))
    }

    if (typeof obj === 'object') {
      const cloned = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = dataUtils.deepClone(obj[key])
        }
      }
      return cloned
    }
  }
}

// 검증 유틸리티
export const validationUtils = {
  // 이메일 검증
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // URL 검증
  isValidUrl: (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  // 이미지 파일 검증
  isValidImageFile: (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    return validTypes.includes(file.type) && file.size <= maxSize
  },

  // API 키 검증
  isValidApiKey: (apiKey) => {
    return typeof apiKey === 'string' && apiKey.length >= 10
  }
}

// 네트워크 유틸리티
export const networkUtils = {
  // 타임아웃이 있는 fetch
  fetchWithTimeout: async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다.')
      }
      throw error
    }
  },

  // 재시도 로직이 있는 fetch
  fetchWithRetry: async (url, options = {}, maxRetries = 3) => {
    let lastError

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetch(url, options)
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
    }

    throw lastError
  }
}

// 로깅 유틸리티
export const logger = {
  info: (message, data = null) => {
    console.log(`[ScratchaSDK] ${message}`, data)
  },

  warn: (message, data = null) => {
    console.warn(`[ScratchaSDK] ${message}`, data)
  },

  error: (message, error = null) => {
    console.error(`[ScratchaSDK] ${message}`, error)
  },

  debug: (message, data = null) => {
    // 개발 환경에서만 디버그 로그 출력
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`[ScratchaSDK Debug] ${message}`, data)
    }
  }
}

// 디바운스 유틸리티
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 스로틀 유틸리티
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
