export enum TokenStatus {
  ACTIVE = 'ACTIVE', // Cho dùng
  SUSPENDED = 'SUSPENDED', // Khoá thủ công (chargeback, abuse...)
  EXPIRED = 'EXPIRED', // Hết hạn (chủ yếu cho monthly)
}
