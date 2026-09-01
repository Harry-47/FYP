import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDeviceSwitchDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;

  @IsString()
  @IsNotEmpty()
  currentDeviceUUID: string; 
}