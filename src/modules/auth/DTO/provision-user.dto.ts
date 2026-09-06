import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
}
export class ProvisionUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Temporary password must be at least 8 characters long' })
  temporaryPassword: string;

  @IsEnum(UserRole, { message: 'Role must be either hod or teacher' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;


  @IsMongoId()
@IsOptional() //super admin will pass it, and for admin it will be in the token
tenantId?: string;

@IsString()
@IsOptional()
university?: string;
}