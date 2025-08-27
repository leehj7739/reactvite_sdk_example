import { useState } from 'react'
import { ScratchaWidget } from 'scratcha-sdk'
import './App.css'

function App() {
  const [mode, setMode] = useState('demo')

  const handleSuccess = (result) => {
    console.log('성공:', result)
    alert(`성공! 선택한 답안: ${result.result.selectedAnswer}`)
  }

  const handleError = (error) => {
    console.error('오류:', error)
    alert(`오류: ${error.message || '알 수 없는 오류'}`)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎯 Scratcha SDK 테스트</h1>
        <div className="mode-selector">
          <button
            className={mode === 'demo' ? 'active' : ''}
            onClick={() => setMode('demo')}
          >
            데모 모드
          </button>
          <button
            className={mode === 'normal' ? 'active' : ''}
            onClick={() => setMode('normal')}
          >
            일반 모드
          </button>
        </div>
      </header>

      <main className="App-main">
        <div className="widget-container">
          <ScratchaWidget
            mode={mode}
            apiKey={mode === 'normal' ? '9e73159d-ab7b-4d80-bc42-ff999e5f5a1e' : undefined}
            endpoint="https://api.scratcha.cloud"
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </main>

      <footer className="App-footer">
        <p>현재 모드: <strong>{mode === 'demo' ? '데모 모드' : '일반 모드'}</strong></p>
        <p>브라우저 콘솔에서 로그를 확인하세요.</p>
      </footer>
    </div>
  )
}

export default App
