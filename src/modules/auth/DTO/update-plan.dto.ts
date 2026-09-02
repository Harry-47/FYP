import { IsEnum, IsNotEmpty } from 'class-validator';
import { SubscriptionPlan } from '../tenant.schema';

export class UpdatePlanDto {
  @IsNotEmpty({ message: 'Subscription plan is required' })
  @IsEnum(SubscriptionPlan, {
    message: 'Plan must be FREE, BASIC, PREMIUM, or ENTERPRISE',
  })
  plan: SubscriptionPlan;
}