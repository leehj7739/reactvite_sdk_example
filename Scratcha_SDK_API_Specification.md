# Scratcha SDK 이벤트 전송 형식 명세서

## 📋 개요

- **목적**: 마우스 이벤트 데이터를 청크 단위로 전송하여 사용자 행동 패턴 분석
- **전송 방식**: HTTP POST (JSON)
- **타임아웃**: 25초
- **크기 제한**: 10MB (세션당)
- **청크 크기**: 50개 이벤트씩

## 🔗 API 엔드포인트

| 메서드 | 엔드포인트             | 설명             | 헤더                             |
| ------ | ---------------------- | ---------------- | -------------------------------- |
| POST   | `/api/events/chunk`    | 이벤트 청크 전송 | `Content-Type: application/json` |
| POST   | `/api/captcha/problem` | 캡차 문제 요청   | `X-Api-Key: {api_key}`           |
| POST   | `/api/captcha/verify`  | 캡차 정답 검증   | `X-Client-Token: {client_token}` |

## 📊 데이터 구조

### 이벤트 청크 전송 요청

```json
{
  "session_id": "session_1703123456789_abc123def",
  "chunk_index": 0,
  "total_chunks": 3,
  "events": [
    {
      "t": 0,
      "type": "pointerdown",
      "x_raw": 150.5,
      "y_raw": 200.3,
      "target_role": "",
      "target_answer": "",
      "payload": null
    },
    {
      "t": 50,
      "type": "moves",
      "x_raw": null,
      "y_raw": null,
      "target_role": "",
      "target_answer": "",
      "payload": {
        "base_t": 0,
        "dts": [10, 15, 12],
        "xrs": [150.5, 160.2, 172.1],
        "yrs": [200.3, 195.8, 188.4]
      }
    },
    {
      "t": 200,
      "type": "click",
      "x_raw": 180.0,
      "y_raw": 190.0,
      "target_role": "answer-1",
      "target_answer": "A",
      "payload": null
    }
  ],
  "meta": {
    "device": "mouse",
    "viewport": { "w": 1920, "h": 1080 },
    "dpr": 1,
    "ts_resolution_ms": 1,
    "roi_map": {
      "canvas-container": { "left": 100, "top": 200, "w": 300, "h": 300 },
      "answer-1": { "left": 50, "top": 400, "w": 80, "h": 40 }
    }
  },
  "timestamp": 1703123456789
}
```

### 이벤트 청크 전송 응답

```json
{
  "status": "success",
  "chunk_index": 0,
  "received_events": 50,
  "message": "청크 0 수신 완료"
}
```

### 캡차 문제 요청 응답

```json
{
  "clientToken": "captcha_1703123456789_abc12345",
  "imageUrl": "/assets/quiz_images/quiz_001.webp",
  "prompt": "다음 중 정사각형을 선택하세요",
  "options": ["A", "B", "C", "D"]
}
```

### 캡차 정답 검증 요청

```json
{
  "answer": "A",
  "session_id": "session_1703123456789_abc123def",
  "meta": {
    "device": "mouse",
    "viewport": { "w": 1920, "h": 1080 },
    "dpr": 1
  },
  "events": [
    /* 이벤트 배열 (선택사항) */
  ]
}
```

### 캡차 정답 검증 응답

```json
{
  "result": "success",
  "message": "정답입니다!"
}
```

## 📝 필드 설명

### 이벤트 데이터 (EventData)

| 필드            | 타입   | 필수 | 설명                                                                     |
| --------------- | ------ | ---- | ------------------------------------------------------------------------ |
| `t`             | int    | ✅   | 상대 타임스탬프 (밀리초)                                                 |
| `type`          | string | ✅   | 이벤트 타입 (`pointerdown`, `pointerup`, `moves`, `moves_free`, `click`) |
| `x_raw`         | float  | ❌   | 원본 X 좌표 (픽셀)                                                       |
| `y_raw`         | float  | ❌   | 원본 Y 좌표 (픽셀)                                                       |
| `target_role`   | string | ❌   | 클릭 대상 역할 (`answer-1`, `canvas-container` 등)                       |
| `target_answer` | string | ❌   | 클릭 대상 답안 (`A`, `B`, `C`, `D`)                                      |
| `payload`       | object | ❌   | 추가 데이터 (moves 타입에서 사용)                                        |

### 메타데이터 (Meta)

| 필드               | 타입   | 설명                                |
| ------------------ | ------ | ----------------------------------- |
| `device`           | string | 입력 장치 (`mouse`, `touch`, `pen`) |
| `viewport`         | object | 브라우저 뷰포트 크기                |
| `dpr`              | number | 디바이스 픽셀 비율                  |
| `ts_resolution_ms` | number | 타임스탬프 해상도                   |
| `roi_map`          | object | 관심 영역 좌표 정보                 |

## 🔄 전송 플로우

### 정상 플로우

```
1. 캡차 문제 요청 → 문제 데이터 수신
2. 사용자 마우스 조작 → 이벤트 수집
3. 정답 선택 → 이벤트 데이터 청크 분할
4. 청크 순차 전송 (100ms 간격)
5. 정답 검증 요청 → 결과 수신
```

### 청크 전송 순서

```
청크 0: 이벤트 0-49   (100ms 후)
청크 1: 이벤트 50-99  (200ms 후)
청크 2: 이벤트 100-149 (300ms 후)
...
```

## ⚠️ 에러 처리

### 타임아웃 (25초)

```json
{
  "error": "청크 전송 시간이 초과되었습니다. 네트워크 연결을 확인해주세요."
}
```

### 크기 초과 (10MB)

```json
{
  "error": "데이터 크기가 너무 큽니다 (12.5MB > 10MB). 이벤트를 줄여서 다시 시도해주세요."
}
```

### HTTP 상태 코드

- `200`: 성공
- `413`: 페이로드 크기 초과
- `500`: 서버 내부 오류
- `404`: 세션을 찾을 수 없음

## 💻 구현 예시

### FastAPI 서버 (Python)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class EventData(BaseModel):
    t: int
    type: str
    x_raw: Optional[float] = None
    y_raw: Optional[float] = None
    target_role: Optional[str] = None
    target_answer: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None

class EventChunk(BaseModel):
    session_id: str
    chunk_index: int
    total_chunks: int
    events: List[EventData]
    meta: Dict[str, Any]
    timestamp: int

@app.post("/api/events/chunk")
async def receive_event_chunk(chunk: EventChunk):
    # 청크 처리 로직
    return {"status": "success", "chunk_index": chunk.chunk_index}
```

### Node.js 서버

```javascript
const express = require("express");
const app = express();

app.post("/api/events/chunk", (req, res) => {
  const { session_id, chunk_index, total_chunks, events, meta, timestamp } =
    req.body;
  // 청크 처리 로직
  res.json({ status: "success", chunk_index });
});
```

## 🧪 테스트 데이터

### 샘플 이벤트 시퀀스

```json
[
  { "t": 0, "type": "pointerdown", "x_raw": 150, "y_raw": 200 },
  {
    "t": 50,
    "type": "moves",
    "payload": {
      "base_t": 0,
      "dts": [10, 15],
      "xrs": [150, 160],
      "yrs": [200, 190]
    }
  },
  { "t": 200, "type": "pointerup", "x_raw": 180, "y_raw": 190 },
  {
    "t": 300,
    "type": "click",
    "x_raw": 180,
    "y_raw": 190,
    "target_role": "answer-1",
    "target_answer": "A"
  }
]
```

## ⚠️ 주의사항

1. **세션 ID**: 고유해야 하며, 클라이언트에서 생성
2. **청크 순서**: `chunk_index` 순서대로 전송
3. **타임아웃**: 25초 내에 모든 청크 전송 완료
4. **크기 제한**: 세션당 최대 10MB
5. **좌표 정규화**: `x_raw`, `y_raw`는 실제 픽셀 좌표

---

**문의사항이 있으시면 언제든 연락주세요!** 📞
