export interface ProxyItem {
  id: number;
  proxy_type: string;
  package_name: string;
  package_api_key: string;
  auto_renew: boolean;
  time_auto_change_ip?: number;
  public_ip: string;
  public_origin_ip: string;
  http_port: number;
  https_port: number;
  socks_port?: number;
  change_ip_time: number;
  next_change_ip_time: number;
  proxy_auth_type: string;
  proxy_auth_username?: string;
  proxy_auth_password?: string;
  proxy_auth_ip?: string;
  expired_date: string;
  note?: string;
}

export interface GetProxyListResponse {
  Status: 'success' | 'error';
  Message: string;
  Data?: ProxyItem[];
}

export interface ChangeIpResponse {
  Status: 'Success' | 'Error';
  Message: string;
}

export interface LiveProxy {
  id: number;
  proxy_type: string;
  package_api_key: string;
  public_ip: string;
  public_origin_ip: string;
  http_port: number;
  https_port: number;
  socks_port?: number;
  proxy_auth_username?: string;
  proxy_auth_password?: string;
  expired_date: string;
  checked_at: Date;
  is_live: boolean;
}

export interface ProxyCheckJob {
  proxy: ProxyItem;
}
