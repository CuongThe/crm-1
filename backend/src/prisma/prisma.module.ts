import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // Đánh dấu Global để không phải import lại PrismaModule ở mọi module khác
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}