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
        <div className="scratcha-widget" style={{
            position: 'relative',
            width: '340px',
            height: '600px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#ffffff',
            color: '#111827',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
            {/* 로딩 오버레이 */}
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">처리 중...</p>
                    </div>
                </div>
            )}

            {/* 결과 오버레이 */}
            {showResult && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
                    <div className="text-center">
                        {result?.success ? (
                            <>
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white text-2xl font-bold">✓</span>
                                </div>
                                <p className="text-green-600 font-medium text-lg">정답입니다!</p>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-white text-2xl font-bold">✗</span>
                                </div>
                                <p className="text-red-600 font-medium text-lg">오답입니다!</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 로고 */}
            <div className="text-center mb-2 w-full">
                <div className="flex items-center justify-center gap-2">
                    <img
                        src={getLogoImagePath()}
                        alt="SCRATCHA"
                        className="w-full h-auto"
                    />
                </div>
            </div>

            {/* Canvas 영역 */}
            <div className="relative mb-2 w-full">
                <div className="flex justify-center">
                    <div className="relative">
                        {/* 실제 이미지 캔버스 (배경) */}
                        <Canvas
                            ref={canvas2Ref}
                            width={300}
                            height={300}
                            className="border border-gray-300 rounded-lg shadow-sm"
                        />

                        {/* 커버 캔버스 (위에 겹쳐서 표시) */}
                        <div className="absolute top-0 left-0 z-10">
                            <Canvas
                                ref={canvas1Ref}
                                width={300}
                                height={300}
                                className="border border-gray-300 rounded-lg opacity-90 shadow-sm"
                                enableScratch={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 지시문 */}
            <div className="mb-2 w-full">
                <div className="bg-blue-50 border border-blue-200 rounded-lg py-2 px-4 w-full relative flex items-center justify-center">
                    <p className="text-[10px] font-bold text-blue-800 text-center">
                        화면을 스크래치하여 정답을 선택해주세요.
                    </p>
                    {/* 새로고침 버튼 */}
                    <button
                        onClick={handleReset}
                        disabled={isLoading}
                        className={`absolute top-1/2 right-3 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isLoading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            }`}
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 정답 선택 버튼들 */}
            <div className="grid grid-cols-2 gap-3 mb-2 w-full">
                {answerOptions.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={isLoading || result}
                        className={`px-4 py-3 rounded-lg font-bold text-sm transition-colors w-full ${selectedAnswer === option
                            ? 'bg-blue-600 text-white'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            } ${isLoading || result ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default ScratchaWidget