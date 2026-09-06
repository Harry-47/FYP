import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  OFFLINE = 'OFFLINE',
  REVOKED = 'REVOKED',
}

export enum DeviceCommands {
  CONTINUE = 'CONTINUE',
  REBOOT = 'REBOOT',
  OTA_UPDATE = 'OTA_UPDATE',
  ARM_SCANNER = 'ARM_SCANNER',       // Start class: Beep + Green LED on + Camera active
  DISARM_SCANNER = 'DISARM_SCANNER' // End class: 2 Beeps + Red LED + Idle mode
}

export type DeviceDocument = Device & Document;

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  macAddress: string;

  @Prop({ required: true })
  apiKeyHash: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({required: true, trim: true})
  university: string;


  @Prop({ required: true, trim: true, uppercase: true })
  roomId: string;

  @Prop({ type: String, enum: DeviceStatus, default: DeviceStatus.ACTIVE })
  status: DeviceStatus;

  @Prop({ type: Date, default: Date.now })
  lastHeartbeatAt: Date;

  @Prop({ type: String, default: '1.0.0' })
  firmwareVersion: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Fast Lookup Indexes
DeviceSchema.index({ tenantId: 1, roomId: 1 });