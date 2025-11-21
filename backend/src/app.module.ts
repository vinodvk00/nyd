import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TracksModule } from './tracks/tracks.module';
import { AuditModule } from './audit/audit.module';
import { TimeEntryModule } from './time-entry/time-entry.module';
import { ActivityTemplateModule } from './activity-template/activity-template.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityTemplateService } from './activity-template/activity-template.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // TODO: Set to false in production
      }),
      inject: [ConfigService],
    }),
    TracksModule,
    AuditModule,
    TimeEntryModule,
    ActivityTemplateModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly activityTemplateService: ActivityTemplateService,
  ) {}

  async onModuleInit() {
    await this.activityTemplateService.seedDefaults();
  }
}
