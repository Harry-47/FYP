import { IsMongoId, IsNotEmpty, IsString, Matches } from 'class-validator';

export class RegisterDeviceDto {
  @IsNotEmpty({ message: "Device's MAC address is required" })
  @IsString({ message: 'MAC address must be a string' })
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'Invalid MAC address format. Example: 24:6F:28:7A:B2:C0 or 24-6F-28-7A-B2-C0',
  })
  macAddress: string;

  @IsNotEmpty({ message: 'Room ID is required' })
  @IsString({ message: 'Room ID must be a string' })
  roomId: string;

  @IsNotEmpty({ message: 'University name is required' })
  university: string;

  @IsNotEmpty({ message: 'Tenant ID is required' })
  @IsMongoId({ message: 'Tenant ID must be a valid MongoDB ObjectId' })
  tenantId: string;
}