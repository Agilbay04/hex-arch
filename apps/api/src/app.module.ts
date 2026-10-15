import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './infrastructure/auth/auth.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { SportMasterDataModule } from './modules/sport-master-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    AuthModule,
    DatabaseModule,
    SportMasterDataModule,
  ],
})
export class AppModule {}
