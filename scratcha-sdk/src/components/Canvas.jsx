import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react'

const Canvas = forwardRef(({
  width = 500,
  height = 500,
  onImageLoad,
  enableScratch = false
}, ref) => {
  const canvasRef = useRef(null)
  const [context, setContext] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [originalImage, setOriginalImage] = useState(null)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)

  useImperativeHandle(ref, () => ({
    getImageData: () => {
      if (!canvasRef.current) return null
      return canvasRef.current.toDataURL('image/png')
    },
    getSize: () => ({ width, height }),
    clear: () => {
      if (context) {
        context.clearRect(0, 0, width, height)
      }
    },
    loadImage: async (imageUrl, isCoverImage = false, callback) => {
      const startTime = Date.now()
      console.log('Canvas: 이미지 로딩 시작:', {
        imageUrl: imageUrl,
        isCoverImage: isCoverImage,
        timestamp: new Date().toISOString()
      })

      const drawImageToCanvas = (img) => {
        const loadTime = Date.now() - startTime
        console.log('Canvas: 이미지 로딩 성공:', {
          imageUrl: imageUrl,
          loadTime: `${loadTime}ms`,
          isCoverImage: isCoverImage,
          imageSize: `${img.width}x${img.height}`,
          timestamp: new Date().toISOString()
        })

        if (context) {
          context.clearRect(0, 0, width, height)

          // 커버 이미지인 경우 검정색 배경 설정
          if (isCoverImage) {
            context.fillStyle = '#000000'
            context.fillRect(0, 0, width, height)
          }

          context.drawImage(img, 0, 0, width, height)

          // 스크래치 기능이 활성화된 경우 원본 이미지 저장
          if (enableScratch) {
            setOriginalImage(img)
          }

          onImageLoad?.(imageUrl)

          // 콜백 함수가 있으면 실행
          if (callback && typeof callback === 'function') {
            callback()
          }
        }
      }

      // 외부 URL인 경우 직접 fetch를 사용하여 로딩
      if (imageUrl.startsWith('http')) {
        console.log('Canvas: 외부 이미지 fetch로 로딩 시도:', imageUrl)

        const fetchStartTime = Date.now()

        try {
          const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
              'Accept': 'image/*'
            }
          })

          const fetchResponseTime = Date.now() - fetchStartTime

          if (!response.ok) {
            throw new Error(`HTTP 오류: ${response.status}`)
          }

          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)

          const img = new Image()
          img.onload = () => {
            URL.revokeObjectURL(objectUrl) // 메모리 정리
            const totalFetchTime = Date.now() - fetchStartTime
            console.log('Canvas: fetch로 이미지 로딩 성공:', {
              imageUrl: imageUrl,
              responseTime: `${fetchResponseTime}ms`,
              totalTime: `${totalFetchTime}ms`,
              blobSize: `${(blob.size / 1024).toFixed(2)}KB`
            })
            drawImageToCanvas(img)
          }
          img.onerror = (error) => {
            URL.revokeObjectURL(objectUrl)
            const totalFetchTime = Date.now() - fetchStartTime
            console.error('Canvas: fetch 이미지 로딩 실패:', {
              imageUrl: imageUrl,
              error: error.message,
              responseTime: `${fetchResponseTime}ms`,
              totalTime: `${totalFetchTime}ms`
            })
            // fallback 시도
            fallbackImageLoad()
          }
          img.src = objectUrl
          return // 성공하면 종료

        } catch (error) {
          const totalFetchTime = Date.now() - fetchStartTime
          console.error('Canvas: fetch 요청 실패:', {
            imageUrl: imageUrl,
            error: error.message,
            time: `${totalFetchTime}ms`
          })
          // fallback 시도
          fallbackImageLoad()
        }
      } else {
        // 로컬 이미지인 경우 직접 로드
        fallbackImageLoad()
      }

      // fallback 함수: 직접 이미지 로드 시도
      function fallbackImageLoad() {
        console.log('Canvas: fallback 이미지 로딩 시도:', imageUrl)

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          console.log('Canvas: fallback 이미지 로딩 성공')
          drawImageToCanvas(img)
        }
        img.onerror = (error) => {
          console.error('Canvas: fallback 이미지 로딩도 실패:', error)
          console.error('Canvas: 모든 이미지 로딩 방법 실패:', imageUrl)
        }
        img.src = imageUrl
      }
    },
    drawImage: (imageElement) => {
      if (context && imageElement) {
        context.clearRect(0, 0, width, height)
        context.drawImage(imageElement, 0, 0, width, height)
      }
    }
  }))

  // 스크래치 기능 관련 함수들
  const getEventPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    let x, y

    if (e.touches && e.touches.length > 0) {
      // 터치 이벤트
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      // 마우스 이벤트
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    return { x, y }
  }

  const startScratching = (e) => {
    if (!enableScratch || !context || !originalImage) return

    // 마우스 이벤트인 경우에만 preventDefault 호출
    if (!e.touches) {
      e.preventDefault()
    }

    setIsDrawing(true)
    const { x, y } = getEventPos(e)
    setLastX(x)
    setLastY(y)
    scratchAt(x, y)
  }

  const scratchAt = (x, y) => {
    if (!context || !originalImage) return

    // 원형으로 투명하게 만들기
    const radius = 30
    context.globalCompositeOperation = 'destination-out'
    context.beginPath()
    context.arc(x, y, radius, 0, 2 * Math.PI)
    context.fill()
    context.globalCompositeOperation = 'source-over'
  }

  const scratchLine = useCallback((x1, y1, x2, y2) => {
    if (!context || !originalImage) return

    const radius = 30
    const dx = x2 - x1
    const dy = y2 - y1
    const distance = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.ceil(distance / (radius / 2))

    context.globalCompositeOperation = 'destination-out'

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = x1 + t * dx
      const y = y1 + t * dy

      context.beginPath()
      context.arc(x, y, radius, 0, 2 * Math.PI)
      context.fill()
    }

    context.globalCompositeOperation = 'source-over'
  }, [context, originalImage])

  const continueScratching = useCallback((e) => {
    if (!enableScratch || !isDrawing || !context) return

    // 마우스 이벤트인 경우에만 preventDefault 호출
    if (!e.touches) {
      e.preventDefault()
    }

    const { x, y } = getEventPos(e)

    // 캔버스 영역 내에서만 스크래치 처리
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      // 이전 위치와 현재 위치 사이를 선으로 연결하여 부드러운 스크래치 효과
      scratchLine(lastX, lastY, x, y)
    }

    setLastX(x)
    setLastY(y)
  }, [enableScratch, isDrawing, context, width, height, lastX, lastY, scratchLine])

  const stopScratching = useCallback((e) => {
    if (e && !e.touches) {
      e.preventDefault()
    }
    setIsDrawing(false)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      setContext(ctx)

      // 기본 설정
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2

      // 터치 이벤트를 non-passive로 등록하여 preventDefault 사용 가능하게 함
      if (enableScratch) {
        const touchOptions = { passive: false }

        canvas.addEventListener('touchstart', (e) => {
          e.preventDefault()
        }, touchOptions)

        canvas.addEventListener('touchmove', (e) => {
          e.preventDefault()
        }, touchOptions)

        canvas.addEventListener('touchend', (e) => {
          e.preventDefault()
        }, touchOptions)

        canvas.addEventListener('touchcancel', (e) => {
          e.preventDefault()
        }, touchOptions)

        // 전역 마우스 이벤트로 드래그 중 캔버스 밖으로 나가도 계속 드래그 가능하게 함
        const handleGlobalMouseMove = (e) => {
          if (isDrawing) {
            continueScratching(e)
          }
        }

        const handleGlobalMouseUp = (e) => {
          if (isDrawing) {
            stopScratching(e)
          }
        }

        // 전역 이벤트 리스너 등록
        document.addEventListener('mousemove', handleGlobalMouseMove)
        document.addEventListener('mouseup', handleGlobalMouseUp)

        // 클린업 함수
        return () => {
          document.removeEventListener('mousemove', handleGlobalMouseMove)
          document.removeEventListener('mouseup', handleGlobalMouseUp)
        }
      }
    }
  }, [enableScratch, isDrawing, continueScratching, stopScratching])

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={enableScratch ? 'scratch-enabled' : ''}
        onMouseDown={enableScratch ? startScratching : undefined}
        onTouchStart={enableScratch ? startScratching : undefined}
        onTouchMove={enableScratch ? continueScratching : undefined}
        onTouchEnd={enableScratch ? stopScratching : undefined}
        onTouchCancel={enableScratch ? stopScratching : undefined}
        style={{ touchAction: 'none' }}
      />
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
