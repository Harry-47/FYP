import { ConflictException, NotFoundException, ForbiddenException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from './DTO/provision-user.dto';
import { RegisterDto } from './DTO/register.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from "bcrypt"
import { LoginDto } from './DTO/login.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import { ResetPassDto } from './DTO/reset-pass.dto';
import { RequestDeviceSwitchDto } from './DTO/request-device-switch.dto';
import { VerifyDeviceSwitchDto } from './DTO/verify-device-swtich.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument, TenantStatus } from './tenant.schema';
import { CreateTenantDto } from './DTO/tenant.dto';
import { UpdatePlanDto } from './DTO/update-plan.dto';
import { ConfigService } from '@nestjs/config';
import { ProvisionUserDto } from './DTO/provision-user.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService:UsersService,
    private readonly jwtService : JwtService,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ){}


  //to generate tokens for loggin in users
 async generateTokens(user: {
  _id: string;
  role: string;
  tenantId?: string;
  rollNo?: string;
  university?: string,
  isSus?: boolean;
}) {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    tenantId: user.tenantId || null,
    university: user.university || null,  
    rollNo: user.role === 'student' ? user.rollNo : null,
    isSus: user.role === 'student' ? Boolean(user.isSus) : false,
  };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'YOUR_ACCESS_SECRET',
      expiresIn: '15m',
    }),
    this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_SECRET') || 'YOUR_REFRESH_SECRET_KEY',
      expiresIn: '7d',
    }),
  ]);

  return { accessToken, refreshToken };
}

//for provsioning teacher and admin accounts
async provisionUser(
    creator: {sub: string; role: string; tenantId?: string; university?: string },
    dto: ProvisionUserDto,
  ) {
    const cleanEmail = dto.email.toLowerCase().trim();

    // 1. Check duplicate email
    const existingUser = await this.userService.findByRollnoOrEmailOrId(cleanEmail)

    if (existingUser) {
      throw new ConflictException(`User with email ${cleanEmail} already exists`);
    }

    let finalTenantId: string;
    let finalUniversity: string;
    let targetRole: string;

    // 2. Scenario A: Super-Admin execution flow
    if (creator.role === 'super-admin') {
      const allowedRolesForSuperAdmin = [UserRole.ADMIN, UserRole.TEACHER];

      if (!allowedRolesForSuperAdmin.includes(dto.role)) {
        throw new ForbiddenException(
          'Super-Admin can only provision management accounts (Admin or Teacher)',
        );
      }

      if (!dto.tenantId || !dto.university) {
        throw new BadRequestException(
          'tenantId and departmentId are mandatory when Super-Admin provisions an account',
        );
      }

      finalTenantId = dto.tenantId;
      finalUniversity = dto.university;
      targetRole = dto.role;
    } 
    // 3. Scenario B: HOD execution flow
    else if (creator.role === 'admin') {
      if (dto.role !== UserRole.TEACHER) {
        throw new ForbiddenException(
          'HODs are strictly authorized to provision Teacher accounts only',
        );
      }

      if (!creator.tenantId || !creator.university) {
        throw new ForbiddenException(
          'HOD token lacks tenant or department mapping. Contact Super-Admin.',
        );
      }

      // Hard lock to HOD's own jurisdiction (ignore incoming payload IDs)
      finalTenantId = creator.tenantId;
finalUniversity = creator.university;      
targetRole = 'teacher';
    } 
    else {
      throw new ForbiddenException('You do not have permission to provision accounts');
    }

    // 4. Hash temporary credentials
    const hashedPassword = await bcrypt.hash(dto.temporaryPassword, 10);

    // 5. Create user record 
    const newUser = await this.userService.createUser({
      username: dto.fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: targetRole,
      tenantId: finalTenantId,
      university: finalUniversity,
    });

    return {
      success: true,
      message: `${targetRole.toUpperCase()} account provisioned successfully`,
      data: {
        userId: newUser._id,
        fullName: newUser.username,
        email: newUser.email,
        role: newUser.role,
        tenantId: newUser.tenantId,
        university: newUser.university,
      },
    };
  }

  //registration logic
  async register(registerData: RegisterDto){
    const duplicate = await this.userService.findByRollnoOrEmailOrId(registerData.email);
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
    const user = await this.userService.findByRollnoOrEmailOrId(loginData.identifier);
    if (!user) throw new UnauthorizedException('Invalid Credentials!');

    const isMatching = await bcrypt.compare(loginData.password, user.password);
    if (!isMatching) throw new UnauthorizedException('Invalid Credentials!');

    let isSus = false;

if (user.role === 'student') {
  if (!user.deviceUUID || user.deviceUUID.toLowerCase().trim() !== loginData.deviceUUID.toLowerCase().trim()) {
    isSus = true; // Honeypot trigger
  }
} else {
  // Super-admin, HOD, Teacher are exempted from device UUID check
  isSus = false;
}

    const tokens = await this.generateTokens({
  _id: user._id.toString(),
  rollNo: user.rollNo,
  role: user.role,
  tenantId: user.tenantId,
  university: user.university,
  isSus,
});

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
        university: user.university,
      },
    };
  }

  async rotateTokens(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token missing in header');
    }

    try {
      const payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: this.configService.get<string>("REFRESH_SECRET") || 'YOUR_REFRESH_SECRET_KEY',
      });

      const user = await this.userService.findByRollnoOrEmailOrId(payload.sub);
    if (!user) {
      console.error('User not found for sub:', payload.sub);
      throw new ForbiddenException('User associated with token not found');
    }

    if (!user.refreshToken) {
      console.error('No refresh token stored in DB for user:', user._id);
      throw new ForbiddenException('Session expired / Logged out');
    }

    const isTokenMatch = await bcrypt.compare(
      rawRefreshToken,
      user.refreshToken,
    );
    if (!isTokenMatch) {
      console.error('Bcrypt mismatch for refresh token');
      throw new ForbiddenException('Invalid Refresh Token');
    }

      const tokens = await this.generateTokens({
  _id: user._id.toString(),
  rollNo: user.rollNo,
  role: user.role,
  tenantId: user.tenantId,
  university: user.university,
  isSus: payload.isSus ??  false
});

      const salt = await bcrypt.genSalt(10);
      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, salt);
      await this.userService.updateRefreshToken(user._id.toString(), hashedRefreshToken);

      return tokens;
    } catch {
      throw new ForbiddenException('Invalid or Expired Refresh Token');
    }
  }

  async logout(userId: string) {

  // DB mein user ka refreshToken null ya empty set karo
  await this.userService.updateRefreshToken(userId, null );

  return {
    success: true,
    message: 'Logged out successfully',
  };
}

  async handleForgotPassword(email: string) {
    const user = await this.userService.findByRollnoOrEmailOrId(email);

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
  const user = await this.userService.findByRollnoOrEmailOrId(dto.identifier);
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

// Mobile App Triggered Verify
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
async createTenant(dto: CreateTenantDto){

  const existingTenant = await this.tenantModel.findOne({
    $or: [{name: dto.name}, {code: dto.code.toLowerCase()}]}
  );

  if(existingTenant){
    throw new ConflictException('Tenant with this name or code already exists');
  }

  const tenant = await this.tenantModel.create({
    ...dto,
    code: dto.code.toLowerCase(),
  })

  return {
    success : true,
    message : 'Department onboarded successfully',
    data : tenant
  }
}

async getAllTenantsHealth() {
    const tenants = await this.tenantModel.find().lean();

    const formattedTenants = tenants.map((tenant) => ({
      id: tenant._id,
      name: tenant.name,
      code: tenant.code,
      adminEmail: tenant.adminEmail,
      plan: tenant.plan,
      status: tenant.status,
      health: {
        totalStudents: tenant.totalStudents,
        totalHardwareNodes: tenant.totalHardwareNodes,
        systemStatus: tenant.status === 'ACTIVE' ? 'HEALTHY' : 'DEGRADED',
      },
      createdAt: (tenant as any).createdAt,
    }));

    return {
      success: true,
      count: formattedTenants.length,
      data: formattedTenants,
    };
  }

  async updateSubscriptionPlan(id: string, dto: UpdatePlanDto) {
    const tenant = await this.tenantModel.findByIdAndUpdate(
      id,
      { plan: dto.plan },
      { new: true },
    );

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      success: true,
      message: `Subscription plan updated to ${dto.plan}`,
      data: tenant,
    };
  }

  async getActiveDepartments(){
    const activeTenants = await this.tenantModel
    .find({ status: TenantStatus.ACTIVE }, { name: 1, code: 1,university: 1, _id: 1 })
    .lean();

  if (activeTenants && activeTenants.length > 0) {
    return {
      success: true,
      data: activeTenants
    };
  }


  }
}
