import React, { useState, useRef, useEffect, useCallback } from 'react'
import Canvas from './Canvas'
import Button from './Button'
import { useScratchaAPI } from '../hooks/useScratchaAPI'
import { getCoverImagePath, getLogoImagePath } from '../utils/imageUtils'

const ScratchaWidget = ({
    apiKey,
    endpoint,
    onSuccess,
    onError,
    mode = 'normal' // 'demo' | 'normal'
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [result, setResult] = useState(null)
    const [answerOptions, setAnswerOptions] = useState([])
    const [clientToken, setClientToken] = useState('')
    const [isImageLoading, setIsImageLoading] = useState(false)

    const canvas1Ref = useRef(null)
    const canvas2Ref = useRef(null)

    const { isLoading, getCaptchaProblem, verifyAnswer } = useScratchaAPI({
        apiKey,
        endpoint,
        mode
    })

    // 캡차 문제 초기화
    const initializeProblem = useCallback(async () => {
        const startTime = Date.now()
        console.log('ScratchaWidget: 캡차 문제 초기화 시작')

        try {
            // normal 모드에서만 이미지 로딩 상태 표시
            if (mode === 'normal') {
                setIsImageLoading(true)
            }

            const problemData = await getCaptchaProblem()
            const apiLoadTime = Date.now() - startTime
            console.log('ScratchaWidget: API 응답 수신 완료', {
                loadTime: `${apiLoadTime}ms`,
                clientToken: problemData.clientToken,
                imageUrl: problemData.imageUrl,
                options: problemData.options,
                mode: mode
            })

            setClientToken(problemData.clientToken)
            setAnswerOptions(problemData.options)

            // 커버 이미지 먼저 로드, 완료 후 실제 이미지 로드
            if (canvas1Ref.current && canvas2Ref.current) {
                const coverStartTime = Date.now()
                canvas1Ref.current.loadImage(getCoverImagePath(), true, () => {
                    const coverLoadTime = Date.now() - coverStartTime
                    console.log('ScratchaWidget: 커버 이미지 로딩 완료', {
                        loadTime: `${coverLoadTime}ms`,
                        imagePath: getCoverImagePath()
                    })

                    // 커버 이미지 로딩 완료 후 실제 이미지 로드
                    const mainImageStartTime = Date.now()
                    canvas2Ref.current.loadImage(problemData.imageUrl, false, () => {
                        const mainImageLoadTime = Date.now() - mainImageStartTime
                        const totalLoadTime = Date.now() - startTime
                        console.log('ScratchaWidget: 메인 이미지 로딩 완료', {
                            loadTime: `${mainImageLoadTime}ms`,
                            totalLoadTime: `${totalLoadTime}ms`,
                            imageUrl: problemData.imageUrl
                        })

                        // 모든 이미지 로딩 완료
                        if (mode === 'normal') {
                            setIsImageLoading(false)
                        }
                    })
                })
            }
        } catch (err) {
            const errorTime = Date.now() - startTime
            console.error('ScratchaWidget: 캡차 문제 로드 실패', {
                error: err.message,
                loadTime: `${errorTime}ms`,
                mode: mode
            })
            if (mode === 'normal') {
                setIsImageLoading(false)
            }
        }
    }, [mode, getCaptchaProblem])

    // 컴포넌트 마운트 시 캡차 문제 초기화
    useEffect(() => {
        const timer = setTimeout(() => {
            initializeProblem()
        }, 100)
        return () => clearTimeout(timer)
    }, [initializeProblem])

    const handleAnswerSelect = async (answer) => {
        if (isLoading || result) return

        const startTime = Date.now()
        console.log('ScratchaWidget: 정답 검증 시작', {
            selectedAnswer: answer,
            clientToken: clientToken,
            mode: mode
        })

        setSelectedAnswer(answer)

        try {
            const response = await verifyAnswer(clientToken, answer)
            const verificationTime = Date.now() - startTime

            console.log('ScratchaWidget: 정답 검증 완료', {
                success: response.success,
                loadTime: `${verificationTime}ms`,
                selectedAnswer: answer,
                result: response.result,
                message: response.message,
                mode: mode
            })

            if (response.success) {
                setResult(response)
                setShowResult(true)
                onSuccess?.(response)
            } else {
                setResult(response)
                setShowResult(true)
                onError?.(response)
            }

            // 데모 모드에서 1초 후 자동 새로고침
            if (mode === 'demo') {
                setTimeout(() => {
                    handleReset()
                }, 1000)
            }
        } catch (err) {
            const errorTime = Date.now() - startTime
            console.error('ScratchaWidget: 정답 검증 실패', {
                error: err.message,
                loadTime: `${errorTime}ms`,
                selectedAnswer: answer,
                mode: mode
            })
            setShowResult(true)
            onError?.(err)
        }
    }

    const handleReset = () => {
        setSelectedAnswer(null)
        setShowResult(false)
        setResult(null)

        // Canvas 초기화
        if (canvas1Ref.current) {
            canvas1Ref.current.clear()
        }
        if (canvas2Ref.current) {
            canvas2Ref.current.clear()
        }

        // 새로운 캡차 문제 로드 (약간의 지연을 두어 버튼 상태가 해제되도록 함)
        setTimeout(() => {
            initializeProblem()
        }, 50)
    }

    // 결과 표시 후 자동으로 선택 상태 초기화
    useEffect(() => {
        if (showResult) {
            const timer = setTimeout(() => {
                setSelectedAnswer(null)
            }, 100) // 결과 표시 후 100ms 후에 선택 상태 초기화
            return () => clearTimeout(timer)
        }
    }, [showResult])

    return (
        <div className="scratcha-widget" data-role="scratcha-container">
            {/* 로딩 오버레이 */}
            {(isLoading || (mode === 'normal' && isImageLoading)) && (
                <div className="overlay">
                    <div className="overlay-content">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">
                            {isLoading ? '처리 중...' : '이미지 로딩 중...'}
                        </p>
                    </div>
                </div>
            )}

            {/* 결과 오버레이 */}
            {showResult && (
                <div className="overlay">
                    <div className="overlay-content">
                        {result?.success ? (
                            <>
                                <div className="result-icon success">✓</div>
                                <p className="result-text success">정답입니다!</p>
                            </>
                        ) : (
                            <>
                                <div className="result-icon error">✗</div>
                                <p className="result-text error">오답입니다!</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 로고 */}
            <div className="logo-container">
                <div className="logo-wrapper">
                    <img
                        src={getLogoImagePath()}
                        alt="SCRATCHA"
                    />
                </div>
            </div>

            {/* Canvas 영역 */}
            <div className="canvas-area">
                <div className="canvas-wrapper">
                    <div className="canvas-container" data-role="canvas-container">
                        {/* 실제 이미지 캔버스 (배경) */}
                        <Canvas
                            ref={canvas2Ref}
                            width={300}
                            height={300}
                        />

                        {/* 커버 캔버스 (위에 겹쳐서 표시) */}
                        <div className="cover-canvas">
                            <Canvas
                                ref={canvas1Ref}
                                width={300}
                                height={300}
                                enableScratch={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 지시문 */}
            <div className="instruction-area" data-role="instruction-area">
                <div className="instruction-container" data-role="instruction-container">
                    <p className="instruction-text" data-role="instruction-text">
                        화면을 스크래치하여 정답을 선택해주세요.
                    </p>
                    {/* 새로고침 버튼 */}
                    <button
                        onClick={handleReset}
                        disabled={isLoading || (mode === 'normal' && isImageLoading)}
                        className="refresh-button"
                        data-role="refresh-button"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 정답 선택 버튼들 */}
            <div className="answer-buttons" data-role="answer-container">
                {answerOptions.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={isLoading || result || (mode === 'normal' && isImageLoading)}
                        className={`answer-button ${selectedAnswer === option ? 'selected' : ''}`}
                        data-role={`answer-${index + 1}`}
                        data-answer={option}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default ScratchaWidget