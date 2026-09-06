import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScanIngestDto {
  @IsNotEmpty({ message: 'QR payload string cannot be empty' })
  @IsString()
  qrPayload: string; // Dynamic TOTP payload rendered on student phone

  @IsOptional()
  @IsISO8601()
  scannedAt?: string; // Optional RTC timestamp
}