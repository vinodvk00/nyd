import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TracksModule } from './tracks/tracks.module';
import { AuditModule } from './audit/audit.module';
import { TimeEntryModule } from './time-entry/time-entry.module';
import { ActivityTemplateModule } from './activity-template/activity-template.module';
import { AuthModule } from './auth/auth.module';
import { GoalsModule } from './goals/goals.module';
import { CommonModule } from './common/common.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityTemplateService } from './activity-template/activity-template.service';
import { DataSource } from 'typeorm';

const DB_RETRY_CONFIG = {
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  multiplier: 2,
};

async function createDataSourceWithRetry(
  options: any,
  logger: Logger,
): Promise<DataSource> {
  let attempt = 0;
  let delayMs = DB_RETRY_CONFIG.initialDelayMs;

  while (true) {
    attempt++;
    try {
      const dataSource = new DataSource(options);
      await dataSource.initialize();
      logger.log(`Database connected after ${attempt} attempt(s)`);
      return dataSource;
    } catch (error) {
      logger.warn(`DB connection attempt ${attempt} failed: ${error.message}. Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * DB_RETRY_CONFIG.multiplier, DB_RETRY_CONFIG.maxDelayMs);
    }
  }
}

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
        autoLoadEntities: true,
        keepConnectionAlive: true,
        logging:
          configService.get('NODE_ENV') === 'development'
            ? ['error', 'warn']
            : false,
      }),
      inject: [ConfigService],
      dataSourceFactory: async (options) => {
        const logger = new Logger('DatabaseConnection');
        return createDataSourceWithRetry(options, logger);
      },
    }),
    CommonModule,
    TracksModule,
    AuditModule,
    TimeEntryModule,
    ActivityTemplateModule,
    AuthModule,
    GoalsModule,
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
