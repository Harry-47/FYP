import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ScanIngestDto } from './scan-ingest.dto';

export class OfflineSyncDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Sync batch must contain at least one scan record' })
  @ArrayMaxSize(100, { message: 'Sync batch cannot exceed 100 scans per payload' })
  @ValidateNested({ each: true })
  @Type(() => ScanIngestDto)
  scans: ScanIngestDto[];
}