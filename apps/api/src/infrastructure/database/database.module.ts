import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './database.config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres' as const,
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 5432),
        username: configService.getOrThrow<string>('database.username'),
        password: configService.get<string>('database.password', ''),
        database: configService.getOrThrow<string>('database.database'),
        autoLoadModels: true,
        synchronize: false,
        logging: false,
      }),
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
