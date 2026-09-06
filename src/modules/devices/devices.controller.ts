import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Req } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Roles } from '../../decorators/roles/roles.decorator';
import { RegisterDeviceDto } from './DTO/registerDto.dto'
import { OfflineSyncDto } from './DTO/offline-sync.dto';
import { ScanIngestDto } from './DTO/scan-ingest.dto';
import { HeartbeatDto } from './DTO/heartbeat.dto';
import { Public } from '../../decorators/public/public.decorator';
import { DeviceApiKeyGuard } from '../../guards/devices/device-apiKey.guard'
@Controller('devices')
export class DevicesController {

  constructor(
    private readonly devicesService: DevicesService
  ){}

 @Roles('super-admin')
 @Post('/register')
 @HttpCode(HttpStatus.CREATED)
  registerDevice(@Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(dto);
}

// Hardware Heartbeat Ping (Har 60s par ESP32 hit karega)
  @Public()
  @UseGuards(DeviceApiKeyGuard)
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Req() req: any, @Body() dto: HeartbeatDto) {
    return this.devicesService.sendHeartbeat(req.device, dto);
  }

  // Live Student Scan Ingestion
  @Public()
  @UseGuards(DeviceApiKeyGuard)
  @Post('scan-ingest')
  @HttpCode(HttpStatus.OK)
  async scanIngest(@Req() req: any, @Body() dto: ScanIngestDto) {
    return this.devicesService.ingestScan(req.device, dto);
  }

  // MicroSD Offline Recovery Dump
  @Public()
  @UseGuards(DeviceApiKeyGuard)
  @Post('offline-sync')
  @HttpCode(HttpStatus.OK)
  async offlineSync(@Req() req: any, @Body() dto: OfflineSyncDto) {
    return this.devicesService.syncOffline(req.device, dto);
  }
}
