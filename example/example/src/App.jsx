import { useState, useEffect } from 'react'
import { ScratchaWidget } from 'scratcha-sdk'
import TokenStatus from './components/TokenStatus'
import { createCaptchaToken, clearCaptchaToken, getTokenInfo } from './utils/captchaToken'
import './App.css'



function App() {
  const [currentPage, setCurrentPage] = useState('main') // 'main', 'captcha', 'login'
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState(null)
  const [isCaptchaCompleted, setIsCaptchaCompleted] = useState(false)
  const [tokenInfo, setTokenInfo] = useState(getTokenInfo())

  const apiKey = import.meta.env.VITE_SCRATCHA_API_KEY
  const endpoint = import.meta.env.VITE_SCRATCHA_ENDPOINT

  // 토큰 상태 업데이트 (위젯이 로드되지 않은 경우에만)
  useEffect(() => {
    // 위젯이 로드된 상태에서는 토큰 상태 업데이트를 하지 않음
    const tokenInfo = getTokenInfo();
    const isWidgetLoaded = currentPage === 'captcha' && !isCaptchaCompleted && !tokenInfo.isValid;

    if (isWidgetLoaded) {
      return; // 위젯이 로드된 상태에서는 업데이트 중단
    }

    const interval = setInterval(() => {
      const newTokenInfo = getTokenInfo();
      setTokenInfo(newTokenInfo);

      // 토큰이 만료되었고 현재 로그인 페이지에 있으면 메인 페이지로 리다이렉트
      if (currentPage === 'login' && newTokenInfo.exists && !newTokenInfo.isValid) {
        console.log('토큰 만료됨 - 메인 페이지로 리다이렉트');
        clearCaptchaToken();
        setCurrentPage('main');
        setIsCaptchaCompleted(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPage, isCaptchaCompleted]);

  const handleLoginClick = () => {
    // 토큰이 유효하면 바로 로그인 페이지로
    const tokenInfo = getTokenInfo();
    if (tokenInfo.isValid) {
      setCurrentPage('login');
      setTokenInfo(tokenInfo);
    } else {
      setCurrentPage('captcha');
      setIsCaptchaCompleted(false);
    }
  }

  const handleSuccess = (result) => {
    console.log('성공:', result)

    // 캡차 성공 시 토큰 생성
    createCaptchaToken();
    setTokenInfo(getTokenInfo());
    setIsCaptchaCompleted(true);

    setModalData({
      type: 'success',
      title: '로그인 성공!',
      message: `캡차 인증이 완료되었습니다. 5분간 유효한 토큰이 발급되었습니다.`,
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

    // 에러 시 토큰 삭제
    clearCaptchaToken();
    setTokenInfo(getTokenInfo());
    setIsCaptchaCompleted(true);

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
    setTokenInfo(getTokenInfo())
  }

  const handleLogout = () => {
    // 로그아웃 시 토큰 삭제
    clearCaptchaToken();
    setTokenInfo(getTokenInfo());
    setCurrentPage('main');
  }

  const renderMainPage = () => (
    <div className="main-page">
      <div className="main-content">
        <h1>🎯 Scratcha 로그인</h1>
        <p>캡차 인증을 통해 안전하게 로그인하세요</p>
        {tokenInfo.isValid && (
          <div className="token-notice">
            <p>✅ 유효한 캡차 토큰이 있습니다. 바로 로그인할 수 있습니다.</p>
          </div>
        )}
        <button className="login-button" onClick={handleLoginClick}>
          {tokenInfo.isValid ? '바로 로그인' : '로그인 시작'}
        </button>
      </div>
    </div>
  )

  const renderCaptchaPage = () => {
    // 위젯이 로드되어야 하는지 확인
    const tokenInfo = getTokenInfo();
    const shouldShowWidget = !isCaptchaCompleted && !tokenInfo.isValid;

    return (
      <div className="captcha-page">
        <div className="captcha-header">
          <button className="back-button" onClick={handleBackToMain}>
            ← 돌아가기
          </button>
          <h2>캡차 인증</h2>
        </div>
        <div className="widget-container">
          {shouldShowWidget && (
            <ScratchaWidget
              mode="normal"
              apiKey={apiKey}
              endpoint={endpoint}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}
          {!shouldShowWidget && (
            <div className="captcha-completed">
              <div className="completed-message">
                <h3>캡차 인증 완료</h3>
                <p>{tokenInfo.isValid ? '유효한 토큰이 있습니다.' : '결과를 확인해주세요.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderLoginPage = () => (
    <div className="login-page">
      <div className="login-content">
        <h1>✅ 로그인 완료</h1>
        <p>캡차 인증이 성공적으로 완료되었습니다!</p>
        <div className="user-info">
          <p>환영합니다, 사용자님!</p>
        </div>
        <div className="login-actions">
          <button className="main-button" onClick={() => setCurrentPage('main')}>
            메인으로
          </button>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
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
      <TokenStatus />
    </div>
  )
}

export default App
