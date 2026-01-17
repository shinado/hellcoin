import { Module } from '@nestjs/common';
import BirdeyeService from './birdeye.service';
import { ThirdPartyModule } from '../../third-party/third-party.module';

@Module({
  imports: [ThirdPartyModule],
  providers: [BirdeyeService],
  exports: [BirdeyeService],
})
export class BirdeyeModule {}

