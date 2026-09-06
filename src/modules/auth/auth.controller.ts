import { Body, Controller, HttpCode, HttpStatus, Post, Headers, Param, Patch, Get, Req } from '@nestjs/common';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';
import { ForgotPassDto } from './DTO/forgot-pass.dto';
import { ResetPassDto } from './DTO/reset-pass.dto';
import { RequestDeviceSwitchDto } from './DTO/request-device-switch.dto';
import { ProvisionUserDto } from './DTO/provision-user.dto'
import { VerifyDeviceSwitchDto } from './DTO/verify-device-swtich.dto';
import { CreateTenantDto } from './DTO/tenant.dto';
import { UpdatePlanDto } from './DTO/update-plan.dto';
import { AuthService } from './auth.service';
import { Res } from '@nestjs/common';
import { type Response } from 'express';
import { Public } from '../../decorators/public/public.decorator';
import { Roles } from '../../decorators/roles/roles.decorator';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService){}
  

  @Public()
  @Post("/register")
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() userData:RegisterDto){
      return this.authService.register(userData)
  }

  @Public()
  @Post("/login")
  @HttpCode(HttpStatus.OK)
    async loginUser(@Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ){
      const result = await this.authService.login(dto)
      
      //Set headers after logging in
      res.setHeader('Authorization', `Bearer ${result.tokens.accessToken}`);
      res.setHeader('x-refresh-token', result.tokens.refreshToken);

      return {
          success: true,
          message: 'Login successful!',
          user: result.user,
        };
    }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: any) {

    const userId = req.user.sub || req.user.userId || req.user._id;
    return this.authService.logout(userId);
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshTokens(
    @Headers('x-refresh-token') customRefreshHeader: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    //x-refresh-token header
    const token = customRefreshHeader
    const tokens = await this.authService.rotateTokens(token);

    // Naye tokens response headers mein set karo
    res.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
    res.setHeader('x-refresh-token', tokens.refreshToken);

    return {
      success: true,
      message: 'Tokens rotated successfully via headers',
    };
  }


  @Public()
  @Post("/forgot-pass")
  @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPassDto){
       return this.authService.handleForgotPassword(dto.email)
    }
   @Public()
  @Post("/reset-pass")
    async handleResetPassword(@Body() dto:ResetPassDto){
      return this.authService.resetPassword(dto)
    }
  
  @Roles('admin', 'super-admin')
  @HttpCode(HttpStatus.OK)
  @Post('device-switch/request')
  async requestDeviceSwitch(@Body() dto: RequestDeviceSwitchDto) {
    return this.authService.requestDeviceSwitch(dto);
  }
@Public()
@HttpCode(HttpStatus.OK)
@Post('device-switch/verify')
async verifyDeviceSwitch(@Body() dto: VerifyDeviceSwitchDto) {
  return this.authService.verifyDeviceSwitch(dto);
}

@HttpCode(HttpStatus.CREATED)
@Post('tenants')
async createTenant(@Body() dto: CreateTenantDto) {
  return this.authService.createTenant(dto);
}

@HttpCode(HttpStatus.OK)
@Patch('tenants/:tenantId/plan')
async updateTenantPlan(
  @Param('tenantId') tenantId: string,
  @Body() dto: UpdatePlanDto,
) {
  return this.authService.updateSubscriptionPlan(tenantId, dto);
}

@HttpCode(HttpStatus.OK)
@Get('tenants')
async getTenantsHealth(){
  return this.authService.getAllTenantsHealth()
}

@Post('provision-user')
@Roles('super-admin', 'admin')
@HttpCode(HttpStatus.CREATED)
async provisionUser(@Req() req:any ,@Body() dto: ProvisionUserDto) {
  return this.authService.provisionUser(req.user, dto);
}


@Public()
@Get('departments/active')
@HttpCode(HttpStatus.OK)
async getActiveDepartments() {
  return this.authService.getActiveDepartments();
}
}