import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPassDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword: string;

  @IsString()
  @MinLength(6, { message: 'Confirm password must be at least 6 characters' })
  confirmPassword: string;
}