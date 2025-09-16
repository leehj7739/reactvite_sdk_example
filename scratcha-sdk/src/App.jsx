import React, { useState } from 'react'
import ScratchaWidget from './components/ScratchaWidget'
import './index.css'

function App() {
    const [mode, setMode] = useState('normal')

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">Scratcha SDK 테스트</h1>

                {/* 모드 선택 */}
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={() => setMode('demo')}
                        className={`px-4 py-2 rounded-lg font-medium ${mode === 'demo'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Demo 모드
                    </button>
                    {/* <button
                        onClick={() => setMode('normal')}
                        className={`px-4 py-2 rounded-lg font-medium ${mode === 'normal'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Normal 모드
                    </button> */}
                </div>

                {/* SDK 위젯 */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <ScratchaWidget
                        mode={mode}
                        apiKey={mode === 'normal' ? '' : undefined}
                        endpoint="https://api.scratcha.cloud"
                    />
                </div>
            </div>
        </div>
    )
}

export default App
