import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ type: String, required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
university: string; // e.g. "University of Sargodha"

  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  code: string; // e.g. "cs-uos", "se-uos"

  @Prop({ type: String, required: true })
  adminEmail: string;

  @Prop({ type: String, enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  plan: SubscriptionPlan;

  @Prop({ type: String, enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Prop({ type: Number, default: 0 })
  totalStudents: number;

  @Prop({ type: Number, default: 0 })
  totalHardwareNodes: number; // ESP32 devices count
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);