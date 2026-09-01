import { IsNotEmpty, IsString } from 'class-validator';

export class RequestDeviceSwitchDto {
  @IsString()
  @IsNotEmpty({ message: 'Roll number or Email is required' })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: 'New Device UUID is required' })
  newDeviceUUID: string;
}