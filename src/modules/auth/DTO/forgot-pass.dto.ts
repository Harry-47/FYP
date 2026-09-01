import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPassDto {
  @IsString()
  @IsNotEmpty({message:  'Email is required' })
  email: string;
}