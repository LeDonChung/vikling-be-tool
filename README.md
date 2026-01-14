## Vikling BE Tool

### 1) Chuẩn bị môi trường

- Node 18+, pnpm
- Docker + Docker Compose

Tạo file `.env` (cùng cấp `docker-compose.yml`):

```
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_HOST=
DB_PORT=

REDIS_PASSWORD=
REDIS_HOST=
REDIS_PORT=

PORT=7000

# S3 / R2 (ví dụ)
S3_ENDPOINT=
S3_REGION=auto
S3_ACCESS_KEY_ID=your_key
S3_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=vikling-videos
S3_PUBLIC_URL=
```

### 2) Chạy hạ tầng Docker (Postgres + Redis)

```
pnpm i
docker compose up -d
```

Kiểm tra:

```
docker compose ps
```

### 3) Setup Whisper.cpp (cho STT - Speech-to-Text)

#### Windows:

```bash
powershell -ExecutionPolicy Bypass -File setup-whisper-windows.ps1
```

#### macOS:

```bash
chmod +x setup-whisper-mac.sh
./setup-whisper-mac.sh
```

#### Linux:

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential git

# Clone and build
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make #window
cmake -B build #macos
cmake --build build -j #macos
cd ..

# Setup directories
mkdir -p whisper-bin whisper-models #window
cp whisper.cpp/main whisper-bin/ #window

cp whisper.cpp/build/bin/whisper-cli whisper-bin/ #macos

# Download model (~466MB)
curl -L -o whisper-models/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

Script sẽ tự động:

- Download model `ggml-small.bin` (~466MB) từ Hugging Face
- Download/build whisper binary
- Setup vào thư mục `whisper-bin/` và `whisper-models/`

### 4) Lệnh TypeORM (đã cấu hình sẵn -d ./src/common/config/typeorm.config.ts)

- Tạo migration (tên ví dụ `CreateJobTable`):

```
pnpm run migration:create -- src/migrations/CreateJobTable
```

- Generate migration từ entities:

```
pnpm run migration:generate -- src/migrations/AutoGen
```

- Chạy migration:

```
pnpm run migration:run
```

- Revert migration gần nhất:

```
pnpm run migration:revert
```

- Xem danh sách migration:

```
pnpm run migration:show
```

### 5) Chạy dự án

- Development mode:

```
pnpm start:dev
```

### 6) API Endpoints

#### TTS (Text-to-Speech)

```bash
POST http://localhost:7000/ttsfree
Content-Type: application/json

{
  "text": "Xin chào Việt Nam",
  "language": "vi-VN",
  "voice": "Hoài My",
  "speed": 1,
  "pitch": 1
}
```

#### STT (Speech-to-Text)

```bash
POST http://localhost:7000/stt/transcribe
Content-Type: multipart/form-data

file: [audio file]
model: small
language: vi
```

#### Translation

```bash
POST http://localhost:7000/translation/translate
Content-Type: application/json

{
  "text": "Hello world",
  "sourceLanguage": "en",
  "targetLanguage": "vi"
}
```
