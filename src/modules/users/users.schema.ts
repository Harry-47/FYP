import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  rollNo: string;

  @Prop({ required: true, trim: true })
  deviceUUID: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'student', enum: ['student', 'teacher', 'admin'], lowercase: true, trim: true })
  role: string;

  @Prop({ lowercase: true, trim: true, default: null })
  tenantId: string;

  @Prop({ required: true, trim: true })
  department: string;

  @Prop({ required: true, trim: true })
  program: string;

  @Prop({ required: true, trim: true })
  session: string;

  @Prop({ required: true })
  semester: number;

  @Prop({ required: true, trim: true })
  section: string;

  @Prop({ default: null })
  refreshToken: string;

  @Prop({ default: null })
  resetPasswordToken: string;

  @Prop({ default: null })
  resetPasswordExpires: Date;

  @Prop({ type:String, default: null })
  deviceSwitchToken: string | null;

  @Prop({ type:String, default: null })
  deviceSwitchExpires: Date | null;

  @Prop({ type:String, default: null })
  pendingDeviceUUID: string | null;

  @Prop({ type:String, default: null })
   lastDeviceSwitchAt: Date | null;
}

export const userSchema = SchemaFactory.createForClass(User);