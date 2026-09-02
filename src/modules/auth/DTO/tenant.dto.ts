import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '../tenant.schema';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Department code is required (e.g. cs-dept)' })
  code: string;

  @IsEmail({}, { message: 'Valid admin email is required' })
  adminEmail: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan, { message: 'Plan must be FREE, BASIC, PREMIUM, or ENTERPRISE' })
  plan?: SubscriptionPlan;
}