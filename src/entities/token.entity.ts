import { LicenseType } from 'src/common/shared/LicenseType';
import { TokenStatus } from 'src/common/shared/TokenStatus';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TokenDevice } from './token-device.entity';

/**
 * Bảng tokens (license key)
 *
 * Lưu key bản quyền mà người dùng nhập vào app.
 * Mỗi key là một "hợp đồng sử dụng" với quy tắc riêng (lifetime/monthly, số thiết bị tối đa…).
 */
@Entity('tokens')
export class Token {
  /**
   * Khóa chính nội bộ, dùng làm FK sang bảng khác.
   * Không dùng token string thật làm PK để tránh lộ/khó đổi.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Phân biệt đúng 2 gói:
   * - LICENSE_LIFETIME_BYO: lifetime, user tự cấu hình proxy + API key.
   * - LICENSE_MONTHLY_FULL: trả theo tháng, backend cấp dịch vụ.
   */
  @Column({
    type: 'enum',
    enum: LicenseType,
  })
  type: LicenseType;

  /**
   * Không lưu token plain-text để tránh rò rỉ DB là lộ toàn bộ key.
   * Khi user nhập key: server hash key đó và so với token_hash.
   * unique đảm bảo không có 2 token trùng nhau.
   * Thực tế: nên dùng hash có "pepper" (secret server) để chống rainbow-table.
   */
  @Column({ unique: true })
  @Index()
  tokenHash: string;

  /**
   * - ACTIVE: cho dùng.
   * - SUSPENDED: khoá thủ công (chargeback, abuse…).
   * - EXPIRED: hết hạn (chủ yếu cho monthly).
   * Khi check license, ưu tiên status trước, rồi mới check expires_at.
   */
  @Column({
    type: 'enum',
    enum: TokenStatus,
    default: TokenStatus.ACTIVE,
  })
  status: TokenStatus;

  /**
   * Audit: key tạo lúc nào.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Dùng khi muốn key "chưa kích hoạt cho tới ngày X",
   * hoặc "tính từ lần activate đầu tiên".
   * Nếu không cần thì có thể bỏ, hoặc để null mặc định.
   */
  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date | null;

  /**
   * - Lifetime: NULL nghĩa là không hết hạn.
   * - Monthly: set ngày hết hạn, gia hạn thì update.
   * Khi verify token: nếu expires_at != null và now > expires_at → hết hạn.
   */
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  /**
   * Giới hạn số thiết bị được "gắn" với key đó.
   * Ví dụ: 3 thiết bị. Nếu thiết bị thứ 4 activate → bị chặn (trừ khi revoke 1 thiết bị cũ).
   */
  @Column({ type: 'int', default: 1 })
  maxDevices: number;

  /**
   * Chứa các info phụ không cần cột riêng:
   * tên khách, note nội bộ, pricing, sale channel,…
   * Giúp không phải đổi schema liên tục.
   */
  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, any> | null;

  /**
   * Lần cuối token được dùng (để thống kê, phát hiện key bị bỏ, abuse…).
   */
  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  /**
   * Relation: Một token có thể dùng trên nhiều thiết bị.
   */
  @OneToMany(() => TokenDevice, (tokenDevice) => tokenDevice.token)
  devices: TokenDevice[];
}
