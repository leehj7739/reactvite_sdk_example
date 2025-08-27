import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react'

const Canvas = forwardRef(({
  width = 500,
  height = 500,
  className = '',
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
    loadImage: (imageUrl, isCoverImage = false, callback) => {
      console.log('Canvas: 이미지 로딩 시작:', imageUrl, isCoverImage ? '(커버 이미지)' : '')
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        console.log('Canvas: 이미지 로딩 성공:', imageUrl)
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
      img.onerror = (error) => {
        console.error('Canvas: 이미지 로딩 실패:', imageUrl, error)
      }
      img.src = imageUrl
    },
    drawImage: (imageElement) => {
      if (context && imageElement) {
        context.clearRect(0, 0, width, height)
        context.drawImage(imageElement, 0, 0, width, height)
      }
    }
  }))

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
    }
  }, [])

  // 스크래치 기능 관련 함수들
  const startScratching = (e) => {
    if (!enableScratch || !context || !originalImage) return

    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
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

  const scratchLine = (x1, y1, x2, y2) => {
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
  }

  const continueScratching = (e) => {
    if (!enableScratch || !isDrawing || !context) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 이전 위치와 현재 위치 사이를 선으로 연결하여 부드러운 스크래치 효과
    scratchLine(lastX, lastY, x, y)

    setLastX(x)
    setLastY(y)
  }

  const stopScratching = () => {
    setIsDrawing(false)
  }





  return (
    <div className={`canvas-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`border border-gray-300 rounded ${enableScratch ? 'cursor-crosshair' : ''}`}
        onMouseDown={enableScratch ? startScratching : undefined}
        onMouseMove={enableScratch ? continueScratching : undefined}
        onMouseUp={enableScratch ? stopScratching : undefined}
        onMouseLeave={enableScratch ? stopScratching : undefined}
      />
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
