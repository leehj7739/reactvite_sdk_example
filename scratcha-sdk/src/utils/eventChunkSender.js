// 이벤트 청크 전송 유틸리티 (25초 타임아웃)
class EventChunkSender {
    constructor(config = {}) {
        this.chunkSize = config.chunkSize || 50; // 한 번에 보낼 이벤트 개수
        this.apiEndpoint = config.apiEndpoint;
        this.sessionId = this.generateSessionId();
        this.timeout = config.timeout || 25000; // 25초 타임아웃
        this.maxTotalSize = config.maxTotalSize || 10 * 1024 * 1024; // 10MB 총 크기 제한
        this.onTimeout = config.onTimeout || (() => { });
        this.onSuccess = config.onSuccess || (() => { });
        this.onError = config.onError || (() => { });
        this.onSizeExceeded = config.onSizeExceeded || (() => { });

        // 청크 전송 상태
        this.events = [];
        this.meta = null;
        this.chunkIndex = 0;
        this.totalChunks = 0;
        this.isSending = false;
        this.clientToken = null; // 문제 생성 시 받은 클라이언트 토큰
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 클라이언트 토큰 설정
    setClientToken(clientToken) {
        this.clientToken = clientToken;
        console.log('EventChunkSender: 클라이언트 토큰 설정', { clientToken });
    }

    // 이벤트 데이터 설정
    setEventData(eventData) {
        this.events = eventData.events || [];
        this.meta = eventData.meta || {};

        // 총 크기 계산 및 제한 확인
        const totalSize = this.calculateTotalSize();
        if (totalSize > this.maxTotalSize) {
            console.warn(`EventChunkSender: 총 크기 초과 (${this.formatBytes(totalSize)} > ${this.formatBytes(this.maxTotalSize)})`);
            this.onSizeExceeded({
                actualSize: totalSize,
                maxSize: this.maxTotalSize,
                eventCount: this.events.length
            });
            return false; // 크기 초과로 설정 실패
        }

        this.totalChunks = Math.ceil(this.events.length / this.chunkSize);
        this.chunkIndex = 0;
        this.isSending = false;

        console.log('EventChunkSender: 이벤트 데이터 설정', {
            eventCount: this.events.length,
            chunkSize: this.chunkSize,
            totalChunks: this.totalChunks,
            totalSize: this.formatBytes(totalSize),
            sessionId: this.sessionId
        });

        return true; // 설정 성공
    }

    // 모든 청크 전송 시작
    async sendAllChunks() {
        if (!this.events || this.events.length === 0) {
            console.warn('EventChunkSender: 전송할 이벤트가 없습니다.');
            return;
        }

        if (this.isSending) {
            console.warn('EventChunkSender: 이미 전송 중입니다.');
            return;
        }

        // Strict Mode에서 중복 실행 방지
        if (this._sendingPromise) {
            console.log('EventChunkSender: 이미 전송 중인 Promise가 있습니다. 기존 Promise 반환');
            return this._sendingPromise;
        }

        // 크기 제한 재확인
        const totalSize = this.calculateTotalSize();
        if (totalSize > this.maxTotalSize) {
            console.error('EventChunkSender: 크기 제한 초과로 전송 불가');
            this.onSizeExceeded({
                actualSize: totalSize,
                maxSize: this.maxTotalSize,
                eventCount: this.events.length
            });
            return;
        }

        this.isSending = true;
        console.log('EventChunkSender: 청크 전송 시작', {
            totalChunks: this.totalChunks,
            totalSize: this.formatBytes(totalSize),
            sessionId: this.sessionId
        });

        // Promise 생성 및 저장
        this._sendingPromise = new Promise((resolve, reject) => {
            const executeChunks = async () => {
                try {
                    // 모든 청크가 완료될 때까지 기다림
                    await new Promise((innerResolve, innerReject) => {
                        this.onSuccess = (result) => {
                            console.log('EventChunkSender: 모든 청크 전송 완료', result);
                            innerResolve(result);
                        };
                        this.onError = (error) => {
                            console.error('EventChunkSender: 청크 전송 실패', error);
                            this.isSending = false;
                            innerReject(error);
                        };

                        // 첫 번째 청크 전송 시작
                        this.sendChunk().catch(innerReject);
                    });

                    resolve();
                } catch (error) {
                    console.error('EventChunkSender: 청크 전송 실패', error);
                    this.isSending = false;
                    this.onError(error);
                    reject(error);
                } finally {
                    // Promise 완료 후 정리
                    this._sendingPromise = null;
                }
            };

            // 비동기 실행
            executeChunks();
        });

        return this._sendingPromise;
    }

    // 개별 청크 전송
    async sendChunk() {
        if (this.chunkIndex >= this.totalChunks) {
            console.log('EventChunkSender: 모든 청크 전송 완료');
            this.isSending = false;
            this.onSuccess({
                sessionId: this.sessionId,
                totalChunks: this.totalChunks
            });
            return;
        }

        const startIndex = this.chunkIndex * this.chunkSize;
        const endIndex = Math.min(startIndex + this.chunkSize, this.events.length);
        const chunkEvents = this.events.slice(startIndex, endIndex);

        const chunkData = {
            client_token: this.clientToken,  // 문제 생성 시 받은 클라이언트 토큰 사용
            chunk_index: this.chunkIndex,
            total_chunks: this.totalChunks,
            events: chunkEvents,
            meta: this.meta,
            timestamp: Date.now()
        };

        const chunkSize = JSON.stringify(chunkData).length;

        console.log(`EventChunkSender: 청크 ${this.chunkIndex + 1}/${this.totalChunks} 전송 시작`, {
            eventCount: chunkEvents.length,
            startIndex,
            endIndex,
            chunkSizeBytes: chunkSize,
            chunkSizeFormatted: this.formatBytes(chunkSize),
            chunkData: chunkData
        });

        // 실제 전송할 JSON 데이터 로그
        const jsonPayload = JSON.stringify({
            client_token: this.clientToken,  // 문제 생성 시 받은 클라이언트 토큰 사용
            chunk_index: this.chunkIndex,
            total_chunks: this.totalChunks,
            events: chunkEvents,
            meta: this.meta,
            timestamp: Date.now()
        });
        console.log('EventChunkSender: 실제 전송할 JSON 데이터:', jsonPayload);

        // AbortController로 타임아웃 제어
        const controller = new AbortController();
        let timeoutId = null;

        try {
            timeoutId = setTimeout(() => {
                controller.abort();
            }, this.timeout);

            const response = await fetch(`${this.apiEndpoint}/api/events/chunk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonPayload,
                signal: controller.signal
            });

            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => '응답 텍스트를 읽을 수 없음');
                console.error(`EventChunkSender: HTTP ${response.status} 에러`, {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: errorText,
                    chunkIndex: this.chunkIndex,
                    totalChunks: this.totalChunks,
                    eventCount: chunkEvents.length
                });
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log(`EventChunkSender: 청크 ${this.chunkIndex + 1}/${this.totalChunks} 전송 완료`, result);

            this.chunkIndex++;

            // 다음 청크 전송 (100ms 간격)
            if (this.chunkIndex < this.totalChunks) {
                setTimeout(() => {
                    this.sendChunk().catch(error => {
                        console.error('EventChunkSender: 다음 청크 전송 실패', error);
                        this.isSending = false;
                        this.onError(error);
                    });
                }, 100);
            } else {
                console.log('EventChunkSender: 모든 청크 전송 완료');
                this.isSending = false;
                this.onSuccess({
                    sessionId: this.sessionId,
                    totalChunks: this.totalChunks
                });
            }

        } catch (error) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if (error.name === 'AbortError') {
                console.error(`EventChunkSender: 청크 ${this.chunkIndex + 1} 전송 타임아웃 (${this.timeout}ms)`);
                this.isSending = false;
                this.onTimeout('청크 전송 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
            } else {
                console.error(`EventChunkSender: 청크 ${this.chunkIndex + 1} 전송 실패`, error);
                this.isSending = false;
                this.onError(error);
            }
        }
    }

    // 새 세션 시작
    startNewSession() {
        this.sessionId = this.generateSessionId();
        this.chunkIndex = 0;
        this.totalChunks = 0;
        this.events = [];
        this.meta = null;
        this.isSending = false;

        console.log('EventChunkSender: 새 세션 시작', { sessionId: this.sessionId });
    }

    // 세션 ID 반환
    getSessionId() {
        return this.sessionId;
    }

    // 전송 상태 반환
    getStatus() {
        const totalSize = this.calculateTotalSize();
        return {
            sessionId: this.sessionId,
            totalChunks: this.totalChunks,
            sentChunks: this.chunkIndex,
            isSending: this.isSending,
            isComplete: this.chunkIndex >= this.totalChunks,
            totalSize: totalSize,
            totalSizeFormatted: this.formatBytes(totalSize),
            maxSize: this.maxTotalSize,
            maxSizeFormatted: this.formatBytes(this.maxTotalSize),
            sizeRatio: (totalSize / this.maxTotalSize * 100).toFixed(1) + '%'
        };
    }

    // 총 크기 계산 (JSON 직렬화 크기 추정)
    calculateTotalSize() {
        try {
            const dataToSend = {
                session_id: this.sessionId,
                chunk_index: 0, // 예시
                total_chunks: this.totalChunks,
                events: this.events,
                meta: this.meta,
                timestamp: Date.now()
            };

            // JSON 직렬화 크기 계산
            const jsonString = JSON.stringify(dataToSend);
            return new Blob([jsonString]).size;
        } catch (error) {
            console.warn('EventChunkSender: 크기 계산 실패, 기본값 사용', error);
            // 대략적인 크기 추정 (이벤트당 평균 100바이트)
            return this.events.length * 100 + (this.meta ? JSON.stringify(this.meta).length : 0);
        }
    }

    // 바이트를 읽기 쉬운 형태로 포맷팅
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export default EventChunkSender;
