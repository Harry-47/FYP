import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: function (this: User) {
      return this.role === 'student';
    },
    uppercase: true,
    trim: true,
    sparse: true,
  })
  rollNo?: string

  @Prop({
    required: function (this: User) {
      return this.role === 'student';
    },
    trim: true,
    sparse: true,
  })
  deviceUUID?: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    default: 'student',
    enum: ['student', 'teacher', 'admin', 'super-admin'],
    lowercase: true,
    trim: true,
  })
  role: string;

  @Prop({ lowercase: true, trim: true, default: null })
  tenantId?: string;

  @Prop({
    required: function (this: User) {
      return this.role === 'student' || this.role === 'admin' || this.role === 'teacher';
    },
    trim: true,
  })
  university?: string;

  @Prop({
    required: function (this: User) {
      return this.role === 'student';
    },
    trim: true,
  })
  program?: string;

  @Prop({
    required: function (this: User) {
      return this.role === 'student';
    },
    trim: true,
  })
  session?: string;

  @Prop({
    required: function (this: User) {
      return this.role === 'student';
    },
  })
  semester?: number;

  @Prop({
    required: function (this: User) {
      return this.role === 'student';
    },
    trim: true,
  })
  section?: string;

  @Prop({ default: null })
  refreshToken?: string;

  @Prop({ default: null })
  resetPasswordToken?: string;

  @Prop({ default: null })
  resetPasswordExpires?: Date;

  @Prop({ type: String, default: null })
  deviceSwitchToken?: string | null;

  @Prop({ type: Date, default: null })
  deviceSwitchExpires?: Date | null;

  @Prop({ type: String, default: null })
  pendingDeviceUUID?: string | null;

  @Prop({ type: Date, default: null })
  lastDeviceSwitchAt?: Date | null;
  
  @Prop({ default: null })  //for sending push notifications
  pushToken?: string;
}

export const userSchema = SchemaFactory.createForClass(User);

// Fast lookups & sparse uniqueness
userSchema.index({ tenantId: 1, university: 1, role: 1 });