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

### 3) Lệnh TypeORM (đã cấu hình sẵn -d ./src/common/config/typeorm.config.ts)
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

### 4) Chạy dự án
- Development mode:
```
pnpm start:dev
```