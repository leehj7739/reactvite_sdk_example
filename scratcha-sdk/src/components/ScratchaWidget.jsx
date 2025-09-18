import React, { useState, useRef, useEffect, useCallback } from 'react'
import Canvas from './Canvas'
import Button from './Button'
import { useScratchaAPI } from '../hooks/useScratchaAPI'
import { getCoverImagePath, getLogoImagePath } from '../utils/imageUtils'
import { useEventTracking } from './inputevent'

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
    const [apiError, setApiError] = useState(null)
    const [showErrorCover, setShowErrorCover] = useState(false)
    const [isProblemLoaded, setIsProblemLoaded] = useState(false)
    const [isChunkSending, setIsChunkSending] = useState(false)
    const [problemLoadTime, setProblemLoadTime] = useState(null) // 문제 로드 시간 추적

    const canvas1Ref = useRef(null)
    const canvas2Ref = useRef(null)

    // 이벤트 추적 설정
    const eventTracking = useEventTracking({
        enableTracking: mode === 'normal',
        isProblemLoaded: isProblemLoaded
    })

    const { isLoading, getCaptchaProblem, verifyAnswer, chunkSender } = useScratchaAPI({
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

                        // 문제 로드 완료 상태 설정 (이벤트 추적 시작)
                        setIsProblemLoaded(true)
                        setProblemLoadTime(Date.now()) // 문제 로드 완료 시간 기록
                        console.log('ScratchaWidget: 문제 로드 완료 - 이벤트 추적 시작')
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

            // API 에러 상태 설정
            setApiError(err)
            setShowErrorCover(true)

            if (mode === 'normal') {
                setIsImageLoading(false)
            }

            // 에러 콜백 호출
            onError?.(err)
        }
    }, [mode, getCaptchaProblem, onError])

    // 검증시 전송할 추가 데이터 수집 함수
    const collectVerificationData = useCallback(() => {
        const currentTime = Date.now()

        // 1. 캔버스 지워진 정도 퍼센트 (소숫점 없이 올림)
        const scratchedPercentage = canvas1Ref.current?.getScratchedPercentage?.() || 0

        // 2. 로드~정답선택까지 걸린 시간 (ms 단위)
        const timeToAnswer = problemLoadTime ? currentTime - problemLoadTime : 0

        const verificationData = {
            scratchedPercentage,
            scratchedTime: timeToAnswer
        }

        console.log('ScratchaWidget: 검증 데이터 수집 완료', {
            scratchedPercentage: scratchedPercentage,  // 숫자만 (단위 없음)
            scratchedTime: timeToAnswer,               // 숫자만 (단위 없음)
            problemLoadTime: problemLoadTime ? new Date(problemLoadTime).toISOString() : 'null',
            currentTime: new Date(currentTime).toISOString()
        })

        return verificationData
    }, [problemLoadTime])

    // 컴포넌트 마운트 시 및 mode 변경 시 캡차 문제 초기화
    useEffect(() => {
        // mode가 변경되면 모든 상태 초기화
        setSelectedAnswer(null)
        setShowResult(false)
        setResult(null)
        setAnswerOptions([])
        setClientToken('')
        setIsImageLoading(false)
        setApiError(null)
        setShowErrorCover(false)
        setIsProblemLoaded(false)
        setProblemLoadTime(null) // 문제 로드 시간 초기화

        // Canvas 초기화
        if (canvas1Ref.current) {
            canvas1Ref.current.clear()
        }
        if (canvas2Ref.current) {
            canvas2Ref.current.clear()
        }

        // 이벤트 추적 시작 (노말 모드에서만)
        if (mode === 'normal') {
            eventTracking.startTracking()
        }

        const timer = setTimeout(() => {
            initializeProblem()
        }, 100)
        return () => clearTimeout(timer)
    }, [initializeProblem, mode]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnswerSelect = async (answer) => {
        if (isLoading || isChunkSending || result) return

        const startTime = Date.now()
        console.log('ScratchaWidget: 정답 검증 시작', {
            selectedAnswer: answer,
            clientToken: clientToken,
            mode: mode
        })

        setSelectedAnswer(answer)

        // 검증 데이터 수집 (캔버스 지워진 정도 + 소요 시간)
        const verificationData = collectVerificationData()

        try {
            // 이벤트 데이터 수집 및 청크 전송 (노말 모드에서만)
            if (mode === 'normal') {
                const eventData = eventTracking.getEventData()
                console.log('ScratchaWidget: 이벤트 데이터 수집 완료', {
                    eventCount: eventData.events.length,
                    meta: eventData.meta
                })

                // 청크 전송 시작 - 로딩 상태 활성화
                setIsChunkSending(true)
                chunkSender.startNewSession()
                chunkSender.setClientToken(clientToken)  // 클라이언트 토큰 설정
                const isDataValid = chunkSender.setEventData(eventData)
                if (!isDataValid) {
                    setIsChunkSending(false)  // 에러 시 로딩 상태 해제
                    throw new Error('이벤트 데이터 크기가 제한을 초과했습니다.')
                }
                await chunkSender.sendAllChunks()
                console.log('ScratchaWidget: 이벤트 데이터 청크 전송 완료')
                setIsChunkSending(false)  // 청크 전송 완료 시 로딩 상태 해제
            }

            const response = await verifyAnswer(clientToken, answer, verificationData)
            const verificationTime = Date.now() - startTime

            console.log('ScratchaWidget: 정답 검증 완료', {
                success: response.success,
                loadTime: `${verificationTime}ms`,
                selectedAnswer: answer,
                result: response.result,
                message: response.message,
                mode: mode
            })

            // 캡차 검증 응답 상세 로그
            console.log('ScratchaWidget: 캡차 검증 응답 상세', {
                result: response.result,
                message: response.message,
                confidence: response.confidence,
                verdict: response.verdict,
                fullResponse: response
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

        } catch (err) {
            const errorTime = Date.now() - startTime
            console.error('ScratchaWidget: 정답 검증 실패', {
                error: err.message,
                loadTime: `${errorTime}ms`,
                selectedAnswer: answer,
                mode: mode
            })

            setIsChunkSending(false)  // 에러 시 청크 전송 상태 해제
            setShowResult(true)
            onError?.(err)
        }
    }

    const handleReset = () => {
        setSelectedAnswer(null)
        setShowResult(false)
        setResult(null)
        setApiError(null)
        setShowErrorCover(false)
        setIsProblemLoaded(false)
        setProblemLoadTime(null) // 문제 로드 시간 초기화

        // 이벤트 추적은 InputEvent.jsx에서 새로고침 버튼 클릭 시 자동으로 초기화됨

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

    // API 에러 복구 시도
    const handleRetry = () => {
        setApiError(null)
        setShowErrorCover(false)
        initializeProblem()
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

    // SDK 내부 드래그 방지 이벤트 핸들러
    const handleDragStart = (e) => {
        e.preventDefault()
        return false
    }

    const handleMouseDown = (e) => {
        e.preventDefault()
        return false
    }

    const handleContextMenu = (e) => {
        e.preventDefault()
        return false
    }

    return (
        <div
            className="scratcha-widget"
            data-role="scratcha-container"
            onDragStart={handleDragStart}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
        >
            {/* API 에러 커버 오버레이 */}
            {showErrorCover && (
                <div className="overlay error-cover">
                    <div className="overlay-content error-content">
                        <div className="error-logo">
                            <img
                                src={getLogoImagePath()}
                                alt="SCRATCHA"
                                draggable={false}
                                onDragStart={handleDragStart}
                            />
                        </div>
                        <h3 className="error-title">잠시만요!</h3>
                        <p className="error-message">
                            {apiError?.message?.includes('timeout')
                                ? '연결 시간이 초과되었어요. 잠시 후 다시 시도해주세요.'
                                : apiError?.message?.includes('network') || apiError?.message?.includes('fetch')
                                    ? '네트워크 연결에 문제가 있어요. 인터넷 연결을 확인해주세요.'
                                    : apiError?.message?.includes('unauthorized') || apiError?.message?.includes('401')
                                        ? '인증에 문제가 있어요. 관리자에게 문의해주세요.'
                                        : '서버와 연결하는데 문제가 있어요. 잠시 후 다시 시도해주세요.'
                            }
                        </p>
                        <div className="error-actions">
                            <button
                                className="retry-button"
                                onClick={handleRetry}
                            >
                                다시 시도
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 로딩 오버레이 */}
            {(isLoading || isChunkSending || (mode === 'normal' && isImageLoading)) && !showErrorCover && (
                <div className="overlay">
                    <div className="overlay-content">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">
                            {isChunkSending ? '데이터 전송 중...' : isLoading ? '검증 중...' : '이미지 로딩 중...'}
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
                        draggable={false}
                        onDragStart={handleDragStart}
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
                        disabled={isLoading || isChunkSending || (mode === 'normal' && isImageLoading)}
                        className="refresh-button"
                        data-role="refresh-button"
                        aria-label="새로고침"
                        title="새로고침"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                        disabled={isLoading || isChunkSending || result || (mode === 'normal' && isImageLoading)}
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