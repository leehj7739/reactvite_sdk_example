import { useCallback, useLayoutEffect, useRef } from 'react'

/** ms 단위 상대 타임스탬프 */
function nowMs() {
    return (performance?.now?.() ?? Date.now())
}

// ---- 타이밍 설정 ----
const MOVE_FLUSH_MS = 50
const FREE_FLUSH_MS = 120

// ---- DOM 유틸리티 ----
function getElByRole(role) {
    return document.querySelector(`[data-role="${role}"]`)
}

function getRoleAtPoint(x, y) {
    const el = document.elementFromPoint(x, y)
    if (!el) return ''
    const hit = el.closest('[data-role]')
    return hit?.getAttribute?.('data-role') || ''
}

// ---- ROI 유틸리티 ----
function rectOfRole(role) {
    const el = document.querySelector(`[data-role="${role}"]`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, w: r.width, h: r.height }
}

// ---- 이벤트 추적 훅 ----
export function useEventTracking(options = {}) {
    const { enableTracking = true, isProblemLoaded = false } = options

    const t0Ref = useRef(nowMs())
    const canvasRef = useRef(null)

    useLayoutEffect(() => {
        canvasRef.current = getElByRole('canvas-container') || canvasRef.current
    }, [])

    const eventsRef = useRef([])
    const moveBufRef = useRef([])
    const freeBufRef = useRef([])
    const moveTimerRef = useRef(null)
    const freeTimerRef = useRef(null)
    const isDraggingRef = useRef(false)
    const deviceRef = useRef('unknown')

    const stopMoveTimer = useCallback(() => {
        if (moveTimerRef.current) {
            clearInterval(moveTimerRef.current);
            moveTimerRef.current = null
        }
    }, [])

    const stopFreeMoveTimer = useCallback(() => {
        if (freeTimerRef.current) {
            clearInterval(freeTimerRef.current);
            freeTimerRef.current = null
        }
    }, [])

    // 좌표 정규화 함수
    const toNorm = useCallback((clientX, clientY) => {
        const canvasEl = canvasRef.current || getElByRole('canvas-container')
        if (!canvasEl) return null
        const r = canvasEl.getBoundingClientRect()
        const x_raw = clientX, y_raw = clientY
        const xr = (x_raw - r.left) / Math.max(1, r.width)
        const yr = (y_raw - r.top) / Math.max(1, r.height)
        const oob = (xr < 0 || xr > 1 || yr < 0 || yr > 1) ? 1 : 0
        const x = Math.min(1, Math.max(0, xr))
        const y = Math.min(1, Math.max(0, yr))
        const on_canvas = oob ? 0 : 1
        return { x, y, x_raw, y_raw, on_canvas, oob }
    }, [])

    // ROI 맵 빌드
    const buildRoiMap = useCallback(() => {
        const roles = [
            'scratcha-container',
            'canvas-container',
            'instruction-area',
            'instruction-container',
            'refresh-button',
            'answer-container',
            'answer-1', 'answer-2', 'answer-3', 'answer-4',
        ]
        const rm = {}
        for (const k of roles) {
            const rr = rectOfRole(k)
            if (rr && rr.w > 0 && rr.h > 0) rm[k] = rr
        }
        delete rm['instruction-container']
        return rm
    }, [])

    // 이동 데이터 플러시
    const flushMoves = useCallback(() => {
        const buf = moveBufRef.current
        if (!buf.length) return
        const base_t = Math.round(buf[0].t - t0Ref.current)
        const xrs = [], yrs = [], dts = []
        for (let i = 0; i < buf.length; i++) {
            const cur = buf[i]
            const prevT = i === 0 ? buf[0].t : buf[i - 1].t
            xrs.push(cur.x_raw)
            yrs.push(cur.y_raw)
            dts.push(Math.max(1, Math.round(cur.t - prevT)))
        }
        eventsRef.current.push({ type: 'moves', payload: { base_t, dts, xrs, yrs } })
        moveBufRef.current = []
    }, [])

    const flushFreeMoves = useCallback(() => {
        const buf = freeBufRef.current
        if (!buf.length) return
        const base_t = Math.round(buf[0].t - t0Ref.current)
        const xrs = [], yrs = [], dts = []
        for (let i = 0; i < buf.length; i++) {
            const cur = buf[i]
            const prevT = i === 0 ? buf[0].t : buf[i - 1].t
            xrs.push(cur.x_raw)
            yrs.push(cur.y_raw)
            dts.push(Math.max(1, Math.round(cur.t - prevT)))
        }
        eventsRef.current.push({ type: 'moves_free', payload: { base_t, dts, xrs, yrs } })
        freeBufRef.current = []
    }, [])

    // 타이머 시작 함수들 (flushMoves, flushFreeMoves 정의 후)
    const startMoveTimer = useCallback(() => {
        if (!moveTimerRef.current) {
            moveTimerRef.current = setInterval(() => flushMoves(), MOVE_FLUSH_MS)
        }
    }, [flushMoves])

    const startFreeMoveTimer = useCallback(() => {
        if (!freeTimerRef.current) {
            freeTimerRef.current = setInterval(() => flushFreeMoves(), FREE_FLUSH_MS)
        }
    }, [flushFreeMoves])

    // 이벤트 추적 시작
    const startTracking = useCallback(() => {
        if (!enableTracking) return
        eventsRef.current = []
        moveBufRef.current = []
        freeBufRef.current = []
        isDraggingRef.current = false
        t0Ref.current = nowMs()
    }, [enableTracking])

    // 이벤트 추적 중지
    const stopTracking = useCallback(() => {
        stopMoveTimer()
        stopFreeMoveTimer()
    }, [stopMoveTimer, stopFreeMoveTimer])

    // 수집된 이벤트 데이터 가져오기
    const getEventData = useCallback(() => {
        const roiMap = buildRoiMap()
        const meta = {
            device: deviceRef.current,
            viewport: { w: window.innerWidth, h: window.innerHeight },
            dpr: window.devicePixelRatio || 1,
            ts_resolution_ms: 1,
            roi_map: roiMap || {},
        }
        return {
            meta,
            events: [...eventsRef.current]
        }
    }, [buildRoiMap])

    // 이벤트 핸들러들
    const onPointerDown = useCallback((e) => {
        if (!enableTracking || !isProblemLoaded) return
        deviceRef.current = String(e.pointerType || 'unknown')
        const n = toNorm(e.clientX, e.clientY)
        if (!n) return
        const t = nowMs()
        isDraggingRef.current = true
        startMoveTimer()
        moveBufRef.current = []
        freeBufRef.current = []
        eventsRef.current.push({ t: Math.round(t - t0Ref.current), type: 'pointerdown', x_raw: n.x_raw, y_raw: n.y_raw })
        moveBufRef.current.push({ t, x: n.x, y: n.y, x_raw: n.x_raw, y_raw: n.y_raw })
    }, [enableTracking, isProblemLoaded, toNorm, startMoveTimer])

    const onPointerMove = useCallback((e) => {
        if (!enableTracking || !isProblemLoaded) return
        if (e.pointerType) deviceRef.current = String(e.pointerType)
        const n = toNorm(e.clientX, e.clientY)
        if (!n) return
        const t = nowMs()
        if (isDraggingRef.current) {
            moveBufRef.current.push({ t, x: n.x, y: n.y, x_raw: n.x_raw, y_raw: n.y_raw })
        } else {
            startFreeMoveTimer()
            freeBufRef.current.push({ t, x: n.x, y: n.y, x_raw: n.x_raw, y_raw: n.y_raw })
        }
    }, [enableTracking, isProblemLoaded, toNorm, startFreeMoveTimer])

    const onPointerUp = useCallback((e) => {
        if (!enableTracking || !isProblemLoaded) return
        const n = toNorm(e.clientX, e.clientY)
        if (!n) {
            isDraggingRef.current = false
            stopMoveTimer()
            flushMoves()
            return
        }
        const t = nowMs()
        if (isDraggingRef.current) {
            moveBufRef.current.push({ t, x: n.x, y: n.y, x_raw: n.x_raw, y_raw: n.y_raw })
        }
        isDraggingRef.current = false
        stopMoveTimer()
        flushMoves()
        freeBufRef.current = []
        eventsRef.current.push({ t: Math.round(t - t0Ref.current), type: 'pointerup', x_raw: n.x_raw, y_raw: n.y_raw })
    }, [enableTracking, isProblemLoaded, toNorm, stopMoveTimer, flushMoves])

    const onPointerCancel = useCallback(() => {
        if (!enableTracking || !isProblemLoaded) return
        isDraggingRef.current = false
        stopMoveTimer()
        flushMoves()
    }, [enableTracking, isProblemLoaded, stopMoveTimer, flushMoves])

    const onClick = useCallback((e) => {
        if (!enableTracking || !isProblemLoaded) return
        const role = getRoleAtPoint(e.clientX, e.clientY)
        const answerText = (e.target?.getAttribute?.('data-answer') || '').trim() || null
        const n = toNorm(e.clientX, e.clientY)
        if (!n) return
        const t = Math.round(nowMs() - t0Ref.current)
        eventsRef.current.push({
            t, type: 'click', x_raw: n.x_raw, y_raw: n.y_raw,
            target_role: String(role || ''), target_answer: String(answerText || '')
        })

        // 새로고침 버튼 클릭 시 이벤트 배열 초기화 및 추적 재시작
        if (role === 'refresh-button') {
            console.log('InputEvent: 새로고침 버튼 클릭 - 이벤트 배열 초기화 및 추적 재시작')
            eventsRef.current = []
            moveBufRef.current = []
            freeBufRef.current = []
            isDraggingRef.current = false
            t0Ref.current = nowMs()
        }
    }, [enableTracking, isProblemLoaded, toNorm])

    // 이벤트 리스너 등록
    useLayoutEffect(() => {
        if (!enableTracking) return

        const optWin = { passive: true, capture: true }
        window.addEventListener('pointerdown', onPointerDown, optWin)
        window.addEventListener('pointermove', onPointerMove, optWin)
        window.addEventListener('pointerup', onPointerUp, optWin)
        window.addEventListener('pointercancel', onPointerCancel, optWin)
        window.addEventListener('click', onClick, optWin)

        return () => {
            window.removeEventListener('pointerdown', onPointerDown, optWin)
            window.removeEventListener('pointermove', onPointerMove, optWin)
            window.removeEventListener('pointerup', onPointerUp, optWin)
            window.removeEventListener('pointercancel', onPointerCancel, optWin)
            window.removeEventListener('click', onClick, optWin)
            stopMoveTimer()
            stopFreeMoveTimer()
        }
    }, [enableTracking, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick, stopMoveTimer, stopFreeMoveTimer])

    return {
        // 이벤트 추적 제어
        startTracking,
        stopTracking,
        getEventData,
    }
}

export default useEventTracking