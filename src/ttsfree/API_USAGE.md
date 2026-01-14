# TTSFree API - Hướng dẫn sử dụng

API để crawl trang ttsfree.com và chuyển đổi text sang speech (TTS) tiếng Việt.

## Cài đặt

```bash
pnpm add puppeteer uuid
```

## API Endpoints

### POST /ttsfree

Chuyển đổi text thành audio MP3.

**Request Body:**

```json
{
  "text": "Xin chào các bạn",
  "language": "vi-VN",
  "voice": "vi-VN-HoaiMyNeural",
  "voiceSpeed": 0,
  "speechPitch": 0
}
```

**Parameters:**

- `text` (string, required): Text cần chuyển đổi (tối đa 500 ký tự)
- `language` (string, optional): Ngôn ngữ - mặc định "vi-VN" (tiếng Việt)
- `voice` (string, optional): Giọng nói
  - `vi-VN-HoaiMyNeural`: **Hoài My (nữ, AI-2)** - mặc định
  - `vi-VN-NamMinhNeural`: **Nam Minh (nam, AI-2)**
  - `vi-VN-Standard-A`: Standard-A (nữ, AI-1)
  - `vi-VN-Standard-B`: Standard-B (nam, AI-1)
  - `vi-VN-Standard-C`: Standard-C (nữ, AI-1)
  - `vi-VN-Standard-D`: Standard-D (nam, AI-1)
- `voiceSpeed` (number, optional): Tốc độ giọng nói (-100 đến 100, mặc định 0)
- `speechPitch` (number, optional): Cao độ giọng nói (-100 đến 100, mặc định 0)

**Response:**

```json
{
  "success": true,
  "message": "TTS conversion completed successfully",
  "data": {
    "filename": "tts_abc-123.mp3",
    "filepath": "D:\\path\\to\\uploads\\tts_abc-123.mp3",
    "size": 123456,
    "text": "Xin chào các bạn",
    "voice": "vi-VN-HoaiMyNeural",
    "language": "vi-VN"
  }
}
```

### GET /ttsfree

Lấy danh sách tất cả các file audio đã tạo.

**Response:**

```json
{
  "success": true,
  "count": 5,
  "files": [
    {
      "filename": "tts_abc-123.mp3",
      "size": 123456,
      "created": "2026-01-14T10:30:00.000Z"
    }
  ]
}
```

## Ví dụ sử dụng

### cURL

```bash
# Tạo TTS với giọng Hoài My (mặc định)
curl -X POST http://localhost:3000/ttsfree \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Xin chào các bạn, đây là bài test text to speech"
  }'

# Tạo TTS với giọng Nam Minh
curl -X POST http://localhost:3000/ttsfree \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Xin chào các bạn, đây là giọng Nam Minh",
    "voice": "vi-VN-NamMinhNeural",
    "voiceSpeed": 10,
    "speechPitch": -5
  }'

# Lấy danh sách file
curl http://localhost:3000/ttsfree
```

### Postman

1. Tạo request mới với method POST
2. URL: `http://localhost:3000/ttsfree`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "text": "Xin chào các bạn, đây là test TTS",
  "voice": "vi-VN-HoaiMyNeural"
}
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/ttsfree', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Xin chào các bạn',
    voice: 'vi-VN-HoaiMyNeural',
    voiceSpeed: 0,
    speechPitch: 0
  })
});

const result = await response.json();
console.log(result.data.filename);
```

## Lưu ý quan trọng

- **File lưu trữ**: Audio sẽ được lưu vào thư mục `uploads/` ở root project
- **Thời gian xử lý**: Vì sử dụng Puppeteer để crawl, quá trình có thể mất 10-30 giây
- **Giới hạn text**: Tối đa 500 ký tự (giới hạn của ttsfree.com cho user miễn phí)
- **Giọng nói phổ biến**: 
  - **Hoài My** (vi-VN-HoaiMyNeural) - giọng nữ tự nhiên
  - **Nam Minh** (vi-VN-NamMinhNeural) - giọng nam tự nhiên
- **Voice Speed**: 
  - Âm (-100 đến -1): Chậm hơn
  - 0: Bình thường
  - Dương (1 đến 100): Nhanh hơn
- **Speech Pitch**:
  - Âm (-100 đến -1): Giọng trầm hơn
  - 0: Bình thường
  - Dương (1 đến 100): Giọng cao hơn
