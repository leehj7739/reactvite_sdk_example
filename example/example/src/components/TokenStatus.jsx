import React, { useState, useEffect } from 'react';
import { getTokenInfo, clearCaptchaToken } from '../utils/captchaToken';
import './TokenStatus.css';

const TokenStatus = () => {
    const [tokenInfo, setTokenInfo] = useState(getTokenInfo());
    const [isVisible, setIsVisible] = useState(true);

    // 1초마다 토큰 상태 업데이트
    useEffect(() => {
        const interval = setInterval(() => {
            setTokenInfo(getTokenInfo());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleDeleteToken = () => {
        if (window.confirm('캡차 토큰을 삭제하시겠습니까?')) {
            clearCaptchaToken();
            setTokenInfo(getTokenInfo());
        }
    };

    const handleToggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    if (!isVisible) {
        return (
            <div className="token-status-minimized">
                <button
                    className="token-toggle-btn"
                    onClick={handleToggleVisibility}
                    title="토큰 상태 보기"
                >
                    🔐
                </button>
            </div>
        );
    }

    return (
        <div className="token-status">
            <div className="token-status-header">
                <h4>🔐 캡차 토큰 상태</h4>
                <button
                    className="token-toggle-btn"
                    onClick={handleToggleVisibility}
                    title="토큰 상태 숨기기"
                >
                    ✕
                </button>
            </div>

            <div className="token-status-content">
                <div className="token-info-row">
                    <span className="token-label">토큰 존재:</span>
                    <span className={`token-value ${tokenInfo.exists ? 'valid' : 'invalid'}`}>
                        {tokenInfo.exists ? '✅ 있음' : '❌ 없음'}
                    </span>
                </div>

                <div className="token-info-row">
                    <span className="token-label">유효성:</span>
                    <span className={`token-value ${tokenInfo.valid ? 'valid' : 'invalid'}`}>
                        {tokenInfo.valid ? '✅ 유효' : '❌ 무효'}
                    </span>
                </div>

                {tokenInfo.exists && (
                    <>
                        <div className="token-info-row">
                            <span className="token-label">남은 시간:</span>
                            <span className={`token-value ${tokenInfo.timeLeft > 60 ? 'valid' : tokenInfo.timeLeft > 30 ? 'warning' : 'invalid'}`}>
                                {tokenInfo.formattedTime}
                            </span>
                        </div>

                        <div className="token-info-row">
                            <span className="token-label">세션 ID:</span>
                            <span className="token-value session-id">
                                {tokenInfo.data?.sessionId?.substring(0, 20)}...
                            </span>
                        </div>

                        <div className="token-info-row">
                            <span className="token-label">생성 시간:</span>
                            <span className="token-value">
                                {new Date(tokenInfo.data?.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </>
                )}

                <div className="token-actions">
                    <button
                        className="token-delete-btn"
                        onClick={handleDeleteToken}
                        disabled={!tokenInfo.exists}
                    >
                        🗑️ 토큰 삭제
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TokenStatus;
