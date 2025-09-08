import { useState } from 'react'
import { ScratchaWidget } from 'scratcha-sdk'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('main') // 'main', 'captcha', 'login'
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState(null)
  const [isCaptchaCompleted, setIsCaptchaCompleted] = useState(false)

  const handleLoginClick = () => {
    setCurrentPage('captcha')
    setIsCaptchaCompleted(false)
  }

  const handleSuccess = (result) => {
    console.log('성공:', result)
    setIsCaptchaCompleted(true) // 캡차 완료 상태로 설정
    setModalData({
      type: 'success',
      title: '로그인 성공!',
      message: `캡차 인증이 완료되었습니다.`,
      buttonText: '로그인 페이지로 이동',
      onButtonClick: () => {
        setShowModal(false)
        setCurrentPage('login')
      }
    })
    setShowModal(true)
  }

  const handleError = (error) => {
    console.error('오류:', error)
    setIsCaptchaCompleted(true) // 캡차 완료 상태로 설정 (실패/에러도 완료로 간주)

    // API 에러인 경우
    if (error.message && !error.result) {
      setModalData({
        type: 'error',
        title: '연결 오류',
        message: '서버와의 연결에 문제가 발생했습니다.',
        buttonText: '메인 페이지로 돌아가기',
        onButtonClick: () => {
          setShowModal(false)
          setCurrentPage('main')
        }
      })
    } else {
      // 캡차 실패인 경우
      setModalData({
        type: 'failure',
        title: '캡차 실패',
        message: '캡차 인증에 실패했습니다. 다시 시도해주세요.',
        buttonText: '메인 페이지로 돌아가기',
        onButtonClick: () => {
          setShowModal(false)
          setCurrentPage('main')
        }
      })
    }
    setShowModal(true)
  }

  const handleBackToMain = () => {
    setCurrentPage('main')
  }

  const renderMainPage = () => (
    <div className="main-page">
      <div className="main-content">
        <h1>🎯 Scratcha 로그인</h1>
        <p>캡차 인증을 통해 안전하게 로그인하세요</p>
        <button className="login-button" onClick={handleLoginClick}>
          로그인 시작
        </button>
      </div>
    </div>
  )

  const renderCaptchaPage = () => (
    <div className="captcha-page">
      <div className="captcha-header">
        <button className="back-button" onClick={handleBackToMain}>
          ← 돌아가기
        </button>
        <h2>캡차 인증</h2>
      </div>
      <div className="widget-container">
        {!isCaptchaCompleted && (
          <ScratchaWidget
            mode="normal"
            apiKey=""
            endpoint="https://api.scratcha.cloud"
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}
        {isCaptchaCompleted && (
          <div className="captcha-completed">
            <div className="completed-message">
              <h3>캡차 인증 완료</h3>
              <p>결과를 확인해주세요.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderLoginPage = () => (
    <div className="login-page">
      <div className="login-content">
        <h1>✅ 로그인 완료</h1>
        <p>캡차 인증이 성공적으로 완료되었습니다!</p>
        <div className="user-info">
          <p>환영합니다, 사용자님!</p>
        </div>
        <button className="logout-button" onClick={handleBackToMain}>
          로그아웃
        </button>
      </div>
    </div>
  )

  const renderModal = () => {
    if (!showModal || !modalData) return null

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className={`modal-icon ${modalData.type}`}>
            {modalData.type === 'success' && '✅'}
            {modalData.type === 'failure' && '❌'}
            {modalData.type === 'error' && '⚠️'}
          </div>
          <h3 className="modal-title">{modalData.title}</h3>
          <p className="modal-message">{modalData.message}</p>
          <button
            className={`modal-button ${modalData.type}`}
            onClick={modalData.onButtonClick}
          >
            {modalData.buttonText}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {currentPage === 'main' && renderMainPage()}
      {currentPage === 'captcha' && renderCaptchaPage()}
      {currentPage === 'login' && renderLoginPage()}
      {renderModal()}
    </div>
  )
}

export default App
