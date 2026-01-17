import { Platform } from 'src/common/shared/Platform';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Token } from './token.entity';

/**
 * Bảng token_devices (binding thiết bị)
 *
 * Một token có thể dùng trên nhiều thiết bị, nên cần bảng riêng để:
 * - Biết token đang gắn với những máy nào.
 * - Enforce max_devices.
 * - Cho phép revoke 1 thiết bị.
 */
@Entity('token_devices')
export class TokenDevice {
  /**
   * PK của record thiết bị, dễ revoke theo id.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Thiết bị thuộc token nào.
   */
  @Column('uuid')
  tokenId: string;

  /**
   * Lưu device fingerprint plain-text để admin dễ quản lý và tra cứu.
   * Chỉ admin có quyền đọc field này.
   */
  @Column({ type: 'varchar', nullable: true })
  deviceFpPlain: string | null;

  /**
   * "Dấu vân tay" thiết bị (device fingerprint) nhưng đã hash.
   * Index để lookup nhanh khi thiết bị gọi lên: "thiết bị này đã activate chưa?"
   * Không lưu raw fingerprint để giảm rủi ro lộ thông tin máy.
   */
  @Column()
  @Index()
  deviceFpHash: string;

  /**
   * Hiển thị cho user/admin dễ nhận biết: "PC ở nhà", "Laptop công ty".
   */
  @Column({ type: 'varchar', nullable: true })
  deviceName: string;

  /**
   * Phân biệt môi trường chạy (win/mac).
   */
  @Column({
    type: 'enum',
    enum: Platform,
    nullable: true,
  })
  platform: Platform | null;

  /**
   * Biết thiết bị đang chạy bản nào (debug/support).
   */
  @Column({ type: 'varchar', nullable: true })
  appVersion: string;

  /**
   * Lần đầu activate.
   */
  @CreateDateColumn()
  firstSeenAt: Date;

  /**
   * Lần gần nhất dùng token (heartbeat mỗi X giờ hoặc mỗi request quan trọng).
   */
  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date | null;

  /**
   * Nếu set thời điểm revoke → coi như thiết bị bị gỡ khỏi token.
   * Ưu điểm: giữ lịch sử (audit) thay vì xoá hẳn record.
   */
  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  /**
   * Relation: Thiết bị thuộc về một token.
   */
  @ManyToOne(() => Token, (token) => token.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tokenId' })
  token: Token;
}
