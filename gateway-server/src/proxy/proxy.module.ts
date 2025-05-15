import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthProxyController } from './auth.proxy.controller';
import { EventProxyController } from './event.proxy.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 10000),
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthProxyController, EventProxyController],
  providers: [],
})
export class ProxyModule {}
