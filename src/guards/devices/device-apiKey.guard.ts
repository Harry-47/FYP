import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument, DeviceStatus } from '../../modules/devices/devices.schema';
import * as crypto from 'crypto';

@Injectable()
export class DeviceApiKeyGuard implements CanActivate {
  constructor(
    @InjectModel(Device.name) private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const rawMac = request.headers['x-device-mac'];
    const rawApiKey = request.headers['x-device-api-key'];

    if (!rawMac || !rawApiKey) {
      throw new UnauthorizedException(
        'Missing hardware identification headers (x-device-mac or x-device-api-key)',
      );
    }

    const cleanMac = String(rawMac).toUpperCase().trim();
    const cleanApiKey = String(rawApiKey).trim();

    // 1. Fetch device record
    const device = await this.deviceModel.findOne({ macAddress: cleanMac });
    if (!device) {
      throw new UnauthorizedException('Unrecognized hardware node');
    }

    // 2. Hardware revocation check
    if (device.status === DeviceStatus.REVOKED) {
      throw new ForbiddenException('Device access has been revoked by Administrator');
    }

    // 3. Constant-time secure SHA-256 comparison
    const incomingHash = crypto.createHash('sha256').update(cleanApiKey).digest('hex');
    
    const isKeyValid = crypto.timingSafeEqual(
      Buffer.from(device.apiKeyHash, 'hex'),
      Buffer.from(incomingHash, 'hex'),
    );

    if (!isKeyValid) {
      throw new UnauthorizedException('Invalid Device Hardware Key');
    }

    // Downstream controllers/services ke liye device inject kar do
    request.device = device;

    return true;
  }
}