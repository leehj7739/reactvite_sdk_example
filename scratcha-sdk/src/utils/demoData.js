// Demo 모드용 내부 데이터
export const demoData = {
    // 샘플 이미지 (Base64)
    sampleImages: [
        // 간단한 테스트 이미지 1
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        // 간단한 테스트 이미지 2
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    ],

    // Demo API 응답 데이터
    mockResponses: {
        process: {
            success: true,
            result: {
                processedImages: 2,
                confidence: 0.95,
                analysis: {
                    image1: {
                        type: 'sample_image',
                        features: ['demo_feature_1', 'demo_feature_2'],
                        score: 0.92
                    },
                    image2: {
                        type: 'sample_image',
                        features: ['demo_feature_3', 'demo_feature_4'],
                        score: 0.88
                    }
                },
                timestamp: Date.now(),
                processingTime: 1250
            },
            message: 'Demo 모드: 이미지 처리 완료'
        },

        text: {
            success: true,
            result: {
                processedText: 'Hello World',
                analysis: {
                    sentiment: 'positive',
                    language: 'ko',
                    keywords: ['hello', 'world'],
                    confidence: 0.89
                },
                timestamp: Date.now()
            },
            message: 'Demo 모드: 텍스트 처리 완료'
        },

        array: {
            success: true,
            result: {
                processedArray: [1, 2, 3, 4, 5],
                analysis: {
                    sum: 15,
                    average: 3,
                    min: 1,
                    max: 5,
                    count: 5
                },
                timestamp: Date.now()
            },
            message: 'Demo 모드: 배열 처리 완료'
        }
    },

    // Demo 연결 상태
    connectionStatus: {
        isConnected: true,
        endpoint: 'demo://localhost',
        latency: 50
    }
}

// Demo 모드에서 지연 시간 시뮬레이션
export const simulateApiDelay = (minDelay = 800, maxDelay = 2000) => {
    const delay = Math.random() * (maxDelay - minDelay) + minDelay
    return new Promise(resolve => setTimeout(resolve, delay))
}

// Demo 모드에서 랜덤 응답 선택
export const getRandomDemoResponse = (type = 'process') => {
    const responses = demoData.mockResponses[type]
    if (!responses) {
        return {
            success: false,
            error: 'Demo 응답을 찾을 수 없습니다.',
            timestamp: Date.now()
        }
    }

    // 실제 API처럼 약간의 랜덤성 추가
    const response = { ...responses }
    if (response.result && response.result.confidence) {
        response.result.confidence = Math.random() * 0.1 + 0.85 // 0.85 ~ 0.95
    }

    return response
}

// Demo 모드에서 샘플 이미지 가져오기
export const getDemoImage = (index = 0) => {
    return demoData.sampleImages[index % demoData.sampleImages.length]
}

// Demo 모드에서 연결 상태 확인
export const checkDemoConnection = () => {
    return Promise.resolve(demoData.connectionStatus)
}
