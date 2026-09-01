import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Roll number or Email is required' })
  identifier: string; // User rollNo ya email dono mein se kuch bhi bhej sakta hai

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  deviceUUID: string;

}