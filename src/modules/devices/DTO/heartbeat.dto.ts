import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class HeartbeatDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevel?: number; // Li-ion percentage

  @IsOptional()
  @IsString()
  firmwareVersion?: string; // e.g. "1.0.1"

  @IsOptional()
  @IsNumber()
  freeHeap?: number; // Internal ESP32 SRAM health check in bytes
}