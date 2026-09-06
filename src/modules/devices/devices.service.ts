import { RegisterDeviceDto } from './DTO/registerDto.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device, DeviceCommands, DeviceDocument } from './devices.schema';
import { ConflictException, BadRequestException, Injectable } from '@nestjs/common';
import { DeviceStatus } from './devices.schema';
import * as crypto from 'crypto';
import { HeartbeatDto } from './DTO/heartbeat.dto';
import { OfflineSyncDto } from './DTO/offline-sync.dto';
import { ScanIngestDto } from './DTO/scan-ingest.dto';

@Injectable()
export class DevicesService {

  constructor(
    @InjectModel(Device.name) private readonly deviceModel: Model<DeviceDocument>
  ) {}

  async registerDevice(dto: RegisterDeviceDto) {

    const cleanMac = dto.macAddress.toUpperCase().trim();
    const cleanRoom = dto.roomId.toUpperCase().trim();


    // 1. Check duplicate MAC
    const existingMac = await this.deviceModel.findOne({ macAddress: cleanMac });
    if (existingMac) {
      throw new ConflictException(`Device with MAC ${cleanMac} is already registered`);
    }

    // 2. Check room capacity (Max 2 ACTIVE devices per room in this tenant & department)
    const activeDevicesInRoom: number= await this.deviceModel.countDocuments({
      tenantId: new Types.ObjectId(dto.tenantId),
      roomId: cleanRoom,
      status: { $ne: DeviceStatus.REVOKED }, //Dont count revoked device
    });

   if (activeDevicesInRoom >= 2) {
      throw new BadRequestException(
        `Room ${cleanRoom} already has the maximum allowed devices (2). Revoke or remove an existing device first.`
      );
    }

    //3. if every check passed, create the device
    const rawApiKey = `esp_live_${crypto.randomBytes(32).toString('hex')}`;

    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    // 4. Save to Database
    const newDevice = await this.deviceModel.create({
      macAddress: cleanMac,
      apiKeyHash,
      tenantId: new Types.ObjectId(dto.tenantId),
      university: dto.university.trim(),
      roomId: cleanRoom,
      status: DeviceStatus.ACTIVE,
      lastHeartbeatAt: new Date(),
      firmwareVersion: '1.0.0',
    });


    return {
      success: true,
      message: 'Device registered successfully. Save the raw API key; it will not be shown again.',
      data: {
        deviceId: newDevice._id,
        macAddress: newDevice.macAddress,
        roomId: newDevice.roomId,
        tenantId: newDevice.tenantId,
        university: newDevice.university,
        status: newDevice.status,
        rawApiKey, //to be saved in the flash memory of the ESP32 device. This is the only time it will be shown.
      },
    }

}

  async sendHeartbeat(device: DeviceDocument, dto: HeartbeatDto) {
    device.lastHeartbeatAt = new Date();
    if (dto.firmwareVersion) {
      device.firmwareVersion = dto.firmwareVersion;
    }
    device.status = DeviceStatus.ACTIVE;
    await device.save();

    // 2-Way Channel: Server sends instructions to the specific kiosk
    return {
      success: true,
      command: DeviceCommands.CONTINUE, // Commands: 'CONTINUE' | 'REBOOT' | 'OTA_UPDATE'
      serverEpoch: Math.floor(Date.now() / 1000), // ESP32 internal RTC clock synchronization
    };
  }


  async ingestScan(device: DeviceDocument, dto: ScanIngestDto) {
    const rawData = dto.qrPayload.trim();

    // TODO: Attendance Service will be connected here (Redis Nonce check + Student Session verification)

    // mock validation logic:
    const isValidMock = rawData.length > 10;

    return {
      success: true,
      action: isValidMock ? 'BUZZ_SUCCESS' : 'BUZZ_REJECT', // ESP32 buzzer feedback signal
      status: 'ACCEPTED',
      scannedAt: dto.scannedAt || new Date().toISOString(),
      roomId: device.roomId,
    };
  }


  async syncOffline(device: DeviceDocument, dto: OfflineSyncDto) {
    const totalReceived = dto.scans.length;

    // TODO: Attendance module's bulkWrite({ ordered: false }) will deduplicate data
    const processedCount = totalReceived; 

    return {
      success: true,
      totalReceived,
      processedCount,
      discardedDuplicates: 0,
      timestamp: new Date().toISOString(),
    };
  }
}