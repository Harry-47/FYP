import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class ExtendSessionDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(60)
  extendByMinutes: number; // e.g +2 or +5 minutes
}