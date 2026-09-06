import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SessionMode {
  TIMED = 'TIMED',
  CONTINUOUS = 'CONTINUOUS',
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type AttendanceSessionDocument = AttendanceSession & Document;

@Schema({ timestamps: true })
export class AttendanceSession {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  university: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  subjectCode: string;

  @Prop({ required: true, trim: true, uppercase: true })
  roomId: string;

  @Prop({ required: true, uppercase: true, trim: true })
  program: string;

  @Prop({ required: true })
  semester: number;

  @Prop({ required: true, uppercase: true, trim: true })
  section: string;

  @Prop({ type: String, enum: SessionMode, default: SessionMode.TIMED })
  mode: SessionMode;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @Prop({ required: true })
  startsAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  presentCount: number;
}

export const AttendanceSessionSchema = SchemaFactory.createForClass(AttendanceSession);

AttendanceSessionSchema.index({ roomId: 1, status: 1 });
AttendanceSessionSchema.index({ tenantId: 1, createdAt: -1 });