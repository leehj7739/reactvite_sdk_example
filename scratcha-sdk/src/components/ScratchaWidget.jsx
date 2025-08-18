import React, { useState, useRef } from 'react'
import Canvas from './Canvas'
import Button from './Button'
import TextDisplay from './TextDisplay'
import { useScratchaAPI } from '../hooks/useScratchaAPI'
import {
    getRandomQuiz,
    generateQuizAnswerOptions,
    validateQuiz
} from '../utils/captchaData'
import { getCoverImagePath, getQuizImagePath, getLogoImagePath } from '../utils/imageUtils'

const ScratchaWidget = ({
    apiKey,
    endpoint,
    onSuccess,
    onError,
    className = '',
    theme = 'light',
    mode = 'normal' // 'demo' | 'normal'
}) => {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [selectedAnswer, setSelectedAnswer] = useState('')
    const [instruction, setInstruction] = useState('')
    const [answerOptions, setAnswerOptions] = useState([])
    const [currentQuiz, setCurrentQuiz] = useState(null)
    const [correctAnswer, setCorrectAnswer] = useState('')
    const [showResult, setShowResult] = useState(false)

    const canvas1Ref = useRef(null)
    const canvas2Ref = useRef(null)

    const { isConnected } = useScratchaAPI({
        apiKey,
        endpoint,
        mode
    })

    // CSS 키프레임 추가
    React.useEffect(() => {
        if (!document.getElementById('scratcha-keyframes')) {
            const style = document.createElement('style')
            style.id = 'scratcha-keyframes'
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `
            document.head.appendChild(style)
        }
    }, [])

    // 퀴즈 초기화
    const initializeQuiz = () => {
        const quiz = getRandomQuiz()
        const options = generateQuizAnswerOptions(quiz)

        setCurrentQuiz(quiz)
        setCorrectAnswer(quiz.answer)
        setAnswerOptions(options)
        setInstruction(quiz.prompt || '캔버스에 표시된 이미지를 확인하고 정답을 선택해주세요.')

        // 이미지를 Canvas에 로드
        if (canvas1Ref.current && canvas2Ref.current) {
            console.log('ScratchaWidget: 퀴즈 초기화 - 커버 이미지 로드 시작')
            // 커버 이미지 로드
            canvas1Ref.current.loadImage(getCoverImagePath())
            console.log('ScratchaWidget: 퀴즈 초기화 - 퀴즈 이미지 로드 시작:', quiz.image_url)
            // 퀴즈 이미지 로드
            canvas2Ref.current.loadImage(getQuizImagePath(quiz.image_url))
        } else {
            console.warn('ScratchaWidget: Canvas ref가 아직 준비되지 않음')
        }
    }

    // 컴포넌트 마운트 시 퀴즈 초기화
    React.useEffect(() => {
        // Canvas가 준비될 때까지 잠시 대기
        const timer = setTimeout(() => {
            initializeQuiz()
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    const handleAnswerSelect = async (answer) => {
        if (isLoading || result) {
            return
        }

        setSelectedAnswer(answer)
        setIsLoading(true)
        setError(null)
        setInstruction('이미지를 처리 중입니다...')

        try {
            // 데모 모드에서는 1초 대기
            if (mode === 'demo') {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }

            // 퀴즈 검증
            const validation = validateQuiz(answer, correctAnswer)

            if (validation.success) {
                setResult({
                    success: true,
                    message: validation.message,
                    selectedAnswer: answer,
                    correctAnswer: correctAnswer,
                    quizId: currentQuiz?.id
                })
                setShowResult(true)
                setInstruction('✅ 정답입니다! 퀴즈를 성공적으로 완료했습니다.')
                onSuccess?.({
                    success: true,
                    selectedAnswer: answer,
                    correctAnswer: correctAnswer,
                    quizId: currentQuiz?.id
                })

                // 1초 후 자동 새로고침
                setTimeout(() => {
                    handleReset()
                }, 1000)
            } else {
                setError(validation.error)
                setShowResult(true)
                setInstruction('❌ 오답입니다. 다시 시도해주세요.')
                onError?.({
                    success: false,
                    selectedAnswer: answer,
                    correctAnswer: correctAnswer,
                    error: validation.error
                })

                // 1초 후 자동 새로고침
                setTimeout(() => {
                    handleReset()
                }, 1000)
            }

        } catch (err) {
            const errorMessage = err.message || '처리 중 오류가 발생했습니다.'
            setError(errorMessage)
            setInstruction('❌ 처리 중 오류가 발생했습니다.')
            onError?.(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        canvas1Ref.current?.clear()
        canvas2Ref.current?.clear()
        setResult(null)
        setError(null)
        setSelectedAnswer('')
        setShowResult(false)
        initializeQuiz()
    }

    const themeClasses = {
        light: 'bg-white text-gray-900 border-gray-200',
        dark: 'bg-gray-900 text-white border-gray-700'
    }

    const getStateStyles = () => {
        if (result) return 'border-green-500 bg-green-50'
        if (error) return 'border-red-500 bg-red-50'
        if (isLoading) return 'border-blue-500 bg-blue-50'
        return ''
    }

    return (
        <div className={`scratcha-widget ${themeClasses[theme]} border rounded-lg p-6 shadow-lg ${className} ${getStateStyles()} relative h-[950px] w-[600px]`}>
            {/* 전체 로딩 스피너 오버레이 */}
            {isLoading === true && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-white flex items-center justify-center z-50 rounded-lg w-full h-full">
                    <div className="bg-white rounded-lg flex flex-col items-center shadow-lg w-96 h-96 p-12">
                        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-600 mb-6 flex-shrink-0"></div>
                        <p className="text-black font-medium text-lg text-center w-48 flex-shrink-0">처리 중...</p>
                    </div>
                </div>
            )}

            {/* 전체 성공/실패 표시 오버레이 */}
            {showResult === true && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-white flex items-center justify-center z-50 rounded-lg w-full h-full">
                    <div className="bg-white rounded-lg flex flex-col items-center shadow-lg w-96 h-96 p-12">
                        {result ? (
                            <>
                                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 flex-shrink-0">
                                    <span className="text-white text-4xl font-bold">✓</span>
                                </div>
                                <p className="text-black font-medium text-lg text-center w-48 flex-shrink-0">정답입니다!</p>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6 flex-shrink-0">
                                    <span className="text-white text-4xl font-bold">✗</span>
                                </div>
                                <p className="text-black font-medium text-lg text-center w-48 flex-shrink-0">오답입니다!</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* SCRATCHA 로고 */}
            <div className="text-center mb-0 mt-0">
                <div className="flex items-center justify-center gap-3">
                    <img
                        src={getLogoImagePath()}
                        alt="SCRATCHA"
                        className="h-24 w-auto"
                    />
                    {mode === 'demo' && (
                        <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-black rounded-full font-medium">
                            DEMO 모드
                        </span>
                    )}
                </div>
            </div>

            {/* 상태 표시 */}
            <div className="flex items-center justify-center mb-6">
                {result && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                {error && <div className="w-3 h-3 rounded-full bg-red-500"></div>}
                {isLoading && <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>}
                {!result && !error && !isLoading && mode === 'demo' && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                {!result && !error && !isLoading && mode !== 'demo' && isConnected && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
                {!result && !error && !isLoading && mode !== 'demo' && !isConnected && <div className="w-3 h-3 rounded-full bg-red-500"></div>}
                <span className="text-sm ml-2 text-black">
                    {result ? '처리 완료' :
                        error ? '처리 실패' :
                            isLoading ? '처리 중...' :
                                mode === 'demo' ? 'Demo 연결됨' : (isConnected ? '연결됨' : '연결 안됨')}
                </span>
            </div>

            {/* Canvas 영역 */}
            <div className="relative mb-6">
                <div className="flex justify-center">
                    <div className="relative">
                        {/* 실제 이미지 캔버스 (배경) */}
                        <Canvas
                            ref={canvas2Ref}
                            width={500}
                            height={500}
                            className="border border-blue-300 rounded"
                        />

                        {/* 커버 캔버스 (위에 겹쳐서 표시) */}
                        <div className="absolute top-0 left-0 z-10">
                            <Canvas
                                ref={canvas1Ref}
                                width={500}
                                height={500}
                                className="border border-gray-300 rounded opacity-90"
                                enableScratch={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 지시문 텍스트 필드 */}
            <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-black text-center">
                        {instruction}
                    </p>
                </div>
            </div>

            {/* 정답 선택 버튼 4개 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {answerOptions.map((option, index) => (
                    <Button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={false}
                        variant={selectedAnswer === option ? 'primary' : 'secondary'}
                        className="h-12 text-lg font-medium"
                    >
                        {isLoading && selectedAnswer === option ? '처리 중...' : option}
                    </Button>
                ))}
            </div>

            {/* 새로고침 버튼 */}
            <div className="flex justify-center mb-6">
                <Button
                    onClick={handleReset}
                    disabled={isLoading}
                    variant="secondary"
                    className={`px-8 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? '처리 중...' : '새로고침'}
                </Button>
            </div>


        </div>
    )
}

export default ScratchaWidget