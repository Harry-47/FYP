import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
}

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'AttendanceSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  rollNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  university: string;

  @Prop({ required: true, uppercase: true, trim: true })
  roomId: string;

  @Prop({ type: String, enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Prop({ default: false })
  isSus: boolean; // Honeypot / Proxy flag

  @Prop({ type: Date, default: Date.now })
  scannedAt: Date;

  @Prop({ default: false })
  isManualOverride: boolean; // Agar teacher ne portal se Present lagaya
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Duplicate attendance rokne ke liye unique compound index
AttendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
AttendanceSchema.index({ studentId: 1, createdAt: -1 });