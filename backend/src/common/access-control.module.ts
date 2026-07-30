import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './services/access-control.service';
import { UsersModule } from '../modules/users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
