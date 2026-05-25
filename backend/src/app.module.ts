import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TestsModule } from './tests/tests.module';
import { AdminModule } from './admin/admin.module';
import { QuestionsModule } from './questions/questions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlansModule } from './plans/plans.module';
import { CheckInsModule } from './checkins/checkins.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    AuthModule,
    UsersModule,
    QuestionsModule,
    TestsModule,
    DashboardModule,
    AdminModule,
    PlansModule,
    CheckInsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
