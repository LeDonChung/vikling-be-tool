# TTSFree API - Text to Speech Service

API để chuyển đổi văn bản thành giọng nói sử dụng ttsfree.com

## Endpoints

### 1. Tạo audio từ text (TTS Conversion)
**POST** `/ttsfree`

#### Request Body:
```json
{
  "text": "Xin chào, đây là ví dụ về chuyển đổi văn bản thành giọng nói",
  "language": "vi-VN",
  "voice": "vi-VN-HoaiMyNeural",
  "voiceSpeed": 0,
  "speechPitch": 0
}
```

#### Các tham số:
- **text** (string, required): Văn bản cần chuyển đổi (tối đa 500 ký tự)
- **language** (string, required): Ngôn ngữ - hiện tại chỉ hỗ trợ `"vi-VN"`
- **voice** (string, required): Giọng đọc
  - `"vi-VN-HoaiMyNeural"` - Giọng nữ Hoài My
  - `"vi-VN-NamMinhNeural"` - Giọng nam Nam Minh
- **voiceSpeed** (number, required): Tốc độ giọng nói (-50 đến 50)
  - 0: Tốc độ bình thường
  - Số dương: Nói nhanh hơn
  - Số âm: Nói chậm hơn
- **speechPitch** (number, required): Cao độ giọng nói (-50 đến 50)
  - 0: Cao độ bình thường
  - Số dương: Giọng cao hơn
  - Số âm: Giọng thấp hơn

#### Response Success:
```json
{
  "success": true,
  "message": "TTS conversion completed successfully",
  "data": {
    "filename": "tts_123e4567-e89b-12d3-a456-426614174000.mp3",
    "filepath": "D:\\mmo\\vikling\\vikling-be-tool\\uploads\\tts_123e4567-e89b-12d3-a456-426614174000.mp3",
    "size": 45678,
    "text": "Xin chào, đây là ví dụ về chuyển đổi văn bản...",
    "voice": "vi-VN-HoaiMyNeural",
    "language": "vi-VN"
  }
}
```

---

### 2. Lấy danh sách tất cả file audio đã tạo
**GET** `/ttsfree`

#### Response:
```json
{
  "success": true,
  "count": 3,
  "files": [
    {
      "filename": "tts_123e4567-e89b-12d3-a456-426614174000.mp3",
      "size": 45678,
      "created": "2025-01-14T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Tải xuống file audio
**GET** `/ttsfree/download/:filename`

Ví dụ: `GET /ttsfree/download/tts_123e4567-e89b-12d3-a456-426614174000.mp3`

Response: File MP3 audio để download

---

## Ví dụ sử dụng với cURL

### 1. Tạo TTS với giọng nữ Hoài My:
```bash
curl -X POST http://localhost:3000/ttsfree \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Xin chào, tôi là Hoài My",
    "language": "vi-VN",
    "voice": "vi-VN-HoaiMyNeural",
    "voiceSpeed": 0,
    "speechPitch": 0
  }'
```

### 2. Tạo TTS với giọng nam Nam Minh, giọng nhanh hơn:
```bash
curl -X POST http://localhost:3000/ttsfree \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Xin chào, tôi là Nam Minh",
    "language": "vi-VN",
    "voice": "vi-VN-NamMinhNeural",
    "voiceSpeed": 20,
    "speechPitch": 0
  }'
```

### 3. Lấy danh sách file:
```bash
curl http://localhost:3000/ttsfree
```

### 4. Tải xuống file:
```bash
curl -O http://localhost:3000/ttsfree/download/tts_123e4567-e89b-12d3-a456-426614174000.mp3
```

---

## Ví dụ với JavaScript/TypeScript

```typescript
// Tạo TTS
const response = await fetch('http://localhost:3000/ttsfree', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Xin chào, đây là test TTS',
    language: 'vi-VN',
    voice: 'vi-VN-HoaiMyNeural',
    voiceSpeed: 0,
    speechPitch: 0,
  }),
});

const result = await response.json();
console.log(result.data.filename); // Tên file đã tạo

// Tải xuống file
const downloadUrl = `http://localhost:3000/ttsfree/download/${result.data.filename}`;
window.location.href = downloadUrl; // Browser sẽ tự động download
```

---

## Lưu ý

- File audio được lưu trong thư mục `uploads/` ở root của project
- Format file: MP3
- Giới hạn text: 500 ký tự
- API sẽ tự động tạo thư mục `uploads` nếu chưa tồn tại
- File được đặt tên theo format: `tts_[uuid].mp3`
