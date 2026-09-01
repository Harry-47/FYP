import { Body, Controller, HttpCode, HttpStatus, Post, Headers } from '@nestjs/common';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';
import { ForgotPassDto } from './DTO/forgot-pass.dto';
import { ResetPassDto } from './DTO/reset-pass.dto';
import { RequestDeviceSwitchDto } from './DTO/request-device-switch.dto';
import { VerifyDeviceSwitchDto } from './DTO/verify-device-swtich.dto';
import { AuthService } from './auth.service';
import { Res } from '@nestjs/common';
import { type Response } from 'express';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService){}

  @Post("/register")
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() userData:RegisterDto){
      return this.authService.register(userData)
  }

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
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshTokens(
    @Headers('authorization') authHeader: string,
    @Headers('x-refresh-token') customRefreshHeader: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Agar Bearer token bheja hai ya x-refresh-token header
    const token = customRefreshHeader || authHeader?.replace('Bearer ', '');
    const tokens = await this.authService.rotateTokens(token);

    // Naye tokens response headers mein set karo
    res.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
    res.setHeader('x-refresh-token', tokens.refreshToken);

    return {
      success: true,
      message: 'Tokens rotated successfully via headers',
    };
  }

  @Post("/forgot-pass")
  @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPassDto){
       return this.authService.handleForgotPassword(dto.email)
    }

  @Post("/reset-pass")
    async handleResetPassword(@Body() dto:ResetPassDto){
      return this.authService.resetPassword(dto)
    }

  @HttpCode(HttpStatus.OK)
@Post('device-switch/request')
async requestDeviceSwitch(@Body() dto: RequestDeviceSwitchDto) {
  return this.authService.requestDeviceSwitch(dto);
}

@HttpCode(HttpStatus.OK)
@Post('device-switch/verify')
async verifyDeviceSwitch(@Body() dto: VerifyDeviceSwitchDto) {
  return this.authService.verifyDeviceSwitch(dto);

}
}
