import React, { useState, useRef, useEffect } from 'react'
import Canvas from './Canvas'
import Button from './Button'
import { useScratchaAPI } from '../hooks/useScratchaAPI'
import { getRandomQuiz, generateQuizAnswerOptions } from '../utils/captchaData'
import { getCoverImagePath, getQuizImagePath, getLogoImagePath } from '../utils/imageUtils'

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
    const [currentQuiz, setCurrentQuiz] = useState(null)
    const [correctAnswer, setCorrectAnswer] = useState('')

    const canvas1Ref = useRef(null)
    const canvas2Ref = useRef(null)

    const { isLoading, sendRequest } = useScratchaAPI({
        apiKey,
        endpoint,
        mode
    })

    // 퀴즈 초기화
    const initializeQuiz = () => {
        const quiz = getRandomQuiz()
        const options = generateQuizAnswerOptions(quiz)

        setCurrentQuiz(quiz)
        setCorrectAnswer(quiz.answer)
        setAnswerOptions(options)

        // 커버 이미지 먼저 로드, 완료 후 실제 이미지 로드
        if (canvas1Ref.current && canvas2Ref.current) {
            canvas1Ref.current.loadImage(getCoverImagePath(), true, () => {
                // 커버 이미지 로딩 완료 후 실제 이미지 로드
                canvas2Ref.current.loadImage(getQuizImagePath(quiz.image_url), false)
            })
        }
    }

    // 컴포넌트 마운트 시 퀴즈 초기화
    useEffect(() => {
        const timer = setTimeout(() => {
            initializeQuiz()
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    const handleAnswerSelect = async (answer) => {
        if (isLoading || result) return

        setSelectedAnswer(answer)

        try {
            const response = await sendRequest({
                quizId: currentQuiz.id,
                selectedAnswer: answer,
                correctAnswer: correctAnswer
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

        // 새로운 퀴즈 로드
        initializeQuiz()
    }

    return (
        <div className="scratcha-widget" data-role="scratcha-container">
            {/* 로딩 오버레이 */}
            {isLoading && (
                <div className="overlay">
                    <div className="overlay-content">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">처리 중...</p>
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
                        disabled={isLoading}
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
                        disabled={isLoading || result}
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