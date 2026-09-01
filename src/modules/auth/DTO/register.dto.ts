import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { isNotEmittedStatement } from 'typescript';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Roll number is required' })
  rollNo: string;

  @IsString()
  @IsNotEmpty({message: "device UUID is required"})
  deviceUUID:string

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  department: string;

  @IsString()
  @IsNotEmpty({ message: 'Program is required' })
  program: string;

  @IsString()
  @IsNotEmpty({ message: 'Session is required' })
  session: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Semester is required' })
  semester: number;

  @IsString()
  @IsNotEmpty({ message: 'Section is required' })
  section: string;
}