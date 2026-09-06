import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument} from './users.schema';
import { Model } from 'mongoose';
import { RegisterDto } from '../auth/DTO/register.dto';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel:Model<UserDocument>){}


  async findByRollnoOrEmailOrId(identifier: string) {
    const cleanIdentifier = identifier.trim();

    const conditions: any[] = [
      { rollNo: cleanIdentifier.toUpperCase() },
      { email: cleanIdentifier.toLowerCase() },
      { rollNo: { $regex: new RegExp(`^${cleanIdentifier}$`, 'i') } },
    ];

    // Agar valid 24-character hex ObjectId hai to _id mein bhi check karo
    if (Types.ObjectId.isValid(cleanIdentifier)) {
      conditions.push({ _id: new Types.ObjectId(cleanIdentifier) });
    }

    return this.userModel.findOne({ $or: conditions });
  }

  async createUser(userData : Partial<User>): Promise<UserDocument>{
      const savedUserWithoutPassword = await this.userModel.create(userData)
      return savedUserWithoutPassword
  }

  async updateRefreshToken(userId: string, hashedRefreshToken: string | null) {
  return this.userModel.findByIdAndUpdate(
    userId,
    { refreshToken: hashedRefreshToken },
    { new: true }
  );
}

async setPasswordResetToken(userId: string, token: string, expires: Date) {
  return this.userModel.findByIdAndUpdate(userId, {
    resetPasswordToken: token,
    resetPasswordExpires: expires,
  });
}

// to find user by reset token and check if it's still valid (not expired)
async findByResetToken(token: string) {
  return this.userModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }, // Check expiry > current time
  });
}

//  update password and reset the reset token and expiry after successful password reset
async updatePassword(userId: string, hashedPassword: string) {
  return this.userModel.findByIdAndUpdate(userId, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });
}
//to store device switch request token, expiry for verification of device switch request
async setDeviceSwitchRequest(userId: string, token: string, expires: Date) {
  return this.userModel.findByIdAndUpdate(userId, {
    deviceSwitchToken: token,
    deviceSwitchExpires: expires,
  });
}

// to find user by device switch token and check if it's still valid (not expired, for device switching verification) 
async findByDeviceSwitchToken(token: string) {
  return this.userModel.findOne({
    deviceSwitchToken: token,
    deviceSwitchExpires: { $gt: new Date() },
  });
}

// to finally migrate user's UUID to a new device
async updateDeviceUUID(userId: string, newDeviceUUID: string) {
  return this.userModel.findByIdAndUpdate(userId, {
    deviceUUID: newDeviceUUID,
    deviceSwitchToken: null,
    deviceSwitchExpires: null,
    lastDeviceSwitchAt: new Date(),
  });
}
}
