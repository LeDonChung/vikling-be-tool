export class ImportKeysResponseDto {
  success: boolean;
  message: string;
  totalImported: number;
}

export class ExportKeysResponseDto {
  success: boolean;
  data: string[];
  count: number;
}


export class PopKeyResponseDto {
  success: boolean;
  data: string[];
  remaining: number;
}
