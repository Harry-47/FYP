import { ConflictException, NotFoundException, ForbiddenException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { RegisterDto } from './DTO/register.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from "bcrypt"
import { LoginDto } from './DTO/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { ResetPassDto } from './DTO/reset-pass.dto';
import { RequestDeviceSwitchDto } from './DTO/request-device-switch.dto';
import { VerifyDeviceSwitchDto } from './DTO/verify-device-swtich.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService:UsersService,
    private readonly jwtService : JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ){}


  //to generate tokens for loggin in users
  async generateTokens(userId: string, rollNo: string, role: string, tenantId: string, isSus: boolean) {
    const payload = { sub: userId, rollNo, role, tenantId, isSus };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'YOUR_ACCESS_SECRET_KEY',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'YOUR_REFRESH_SECRET_KEY',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  //registration logic
  async register(registerData: RegisterDto){
    const duplicate = await this.userService.findByRollnoOrEmail(registerData.email);
    if (duplicate !== null) {
      throw new ConflictException('User with these credentials already exists!');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerData.password, salt);
    

    const createdUser = await this.userService.createUser({
      ...registerData,
      password: hashedPassword,
    });

    const userObj = createdUser.toObject();
    delete userObj.password;

    return {
      success: true,
      message: 'Student registered successfully!',
      data: userObj,
    };
  }

  async login(loginData: LoginDto) {
    const user = await this.userService.findByRollnoOrEmail(loginData.identifier);
    if (!user) throw new UnauthorizedException('Invalid Credentials!');

    const isMatching = await bcrypt.compare(loginData.password, user.password);
    if (!isMatching) throw new UnauthorizedException('Invalid Credentials!');

    const isSus = loginData.deviceUUID !== user.deviceUUID;

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.rollNo,
      user.role,
      user.tenantId,
      isSus,
    );

    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, salt);
    await this.userService.updateRefreshToken(user._id.toString(), hashedRefreshToken);

    return {
      tokens,
      user: {
        id: user._id,
        username: user.username,
        rollNo: user.rollNo,
        role: user.role,
        department: user.department,
      },
    };
  }

  async rotateTokens(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token missing in header');
    }

    try {
      const payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'YOUR_REFRESH_SECRET_KEY',
      });

      const user = await this.userService.findByRollnoOrEmail(payload.rollNo);
      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Session expired');
      }

      const isTokenMatch = await bcrypt.compare(rawRefreshToken, user.refreshToken);
      if (!isTokenMatch) {
        throw new ForbiddenException('Invalid Refresh Token');
      }

      const tokens = await this.generateTokens(
        user._id.toString(),
        user.rollNo,
        user.role,
        user.tenantId,
        payload.isSus ?? false,
      );

      const salt = await bcrypt.genSalt(10);
      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, salt);
      await this.userService.updateRefreshToken(user._id.toString(), hashedRefreshToken);

      return tokens;
    } catch {
      throw new ForbiddenException('Invalid or Expired Refresh Token');
    }
  }

  async logout(rawAccessToken: string) {
    if (!rawAccessToken) {
      throw new UnauthorizedException('Access token missing in header');
    }

    try {
      const payload = await this.jwtService.verifyAsync(rawAccessToken, {
        secret: process.env.JWT_ACCESS_SECRET || 'YOUR_ACCESS_SECRET_KEY',
      });

      await this.userService.updateRefreshToken(payload.sub, null);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch {
      throw new UnauthorizedException('Invalid Access Token');
    }
  }

  async handleForgotPassword(email: string) {
    const user = await this.userService.findByRollnoOrEmail(email);

    if(!user){
      throw new NotFoundException('User with this email does not exist');
    }

    // generate a random reset token in hexadecimal format
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // hash the reset token before storing it in the database for security reasons
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes expiry

    await this.userService.setPasswordResetToken(user._id.toString(), hashedToken, tokenExpiry)
     //Mock email sending logic
    await this.emailService.sendResetLink(email, resetToken);

    return {
      success: true,
      message: 'Password reset link sent to registered email',
    };
}

async resetPassword(resetPasswordDto: ResetPassDto) {
    const { token, newPassword } = resetPasswordDto;

    // hash and match incoming token with the one stored in the database and check if it's still valid (not expired)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userService.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // encrypt the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userService.updatePassword(user._id.toString(), hashedPassword);

    return {
      success: true,
      message: 'Password reset successfully!',
    };
  }

  async requestDeviceSwitch(dto: RequestDeviceSwitchDto) {
  const user = await this.userService.findByRollnoOrEmail(dto.identifier);
  if (!user) {
    throw new NotFoundException('Student not found');
  }

  // 7 Days cool-down check
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  if (user.lastDeviceSwitchAt && (Date.now() - new Date(user.lastDeviceSwitchAt).getTime() < SEVEN_DAYS)) {
    throw new BadRequestException('Device switch allowed only once every 7 days.');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 Mins

  await this.userService.setDeviceSwitchRequest(
    user._id.toString(),
    hashedToken,
    tokenExpiry,
  );

  await this.emailService.sendDeviceSwitchMail(user.email, rawToken);

  return {
    success: true,
    message: `Verification link sent to student email: ${user.email}`,
  };
}

// 2. Mobile App Triggered Verify
async verifyDeviceSwitch(dto: VerifyDeviceSwitchDto) {
  const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');
  const user = await this.userService.findByDeviceSwitchToken(hashedToken);

  if (!user) {
    throw new BadRequestException('Invalid or expired device switch link');
  }

  // Naye phone ki UUID direct lock karo
  await this.userService.updateDeviceUUID(user._id.toString(), dto.currentDeviceUUID);

  return {
    success: true,
    message: 'New device locked successfully. You can now login.',
  };
}
}