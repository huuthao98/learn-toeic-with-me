import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ToeicModule } from './modules/toeic/toeic.module';
import { InterviewModule } from './modules/interview/interview.module';
import { VocabularyModule } from './modules/vocabulary/vocabulary.module';
import { AdminModule } from './modules/admin/admin.module';
import { PlansModule } from './modules/plans/plans.module';
import { UploadModule } from './modules/upload/upload.module';
import { CheckInsModule } from './modules/checkins/checkins.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { TransactionsModule } from './modules/transactions/transactions.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TopicsModule } from './modules/topics/topics.module';
import { B1Module } from './modules/b1/b1.module';
import { JLPTModule } from './modules/JLPT/JLPT.module';
import { AccessControlModule } from './common/access-control.module';

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
    AdminModule,
    UsersModule,
    DashboardModule,

    //mobile
    PlansModule,
    CheckInsModule,
    TransactionsModule,
    
    //Practice
    B1Module,
    JLPTModule,
    ToeicModule,
    InterviewModule,
    VocabularyModule,
    
    TopicsModule,
    UploadModule,
    FirebaseModule,
    NotificationsModule,
    
    //common
    AccessControlModule,
  ],
})
export class AppModule {}
