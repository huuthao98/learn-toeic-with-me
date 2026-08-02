import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { REQUIRE_VIP_ACCESS_KEY, VipAccessOptions } from '../decorators/require-vip-access.decorator';
import { AccessControlService } from '../services/access-control.service';

@Injectable()
export class VipAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectConnection() private connection: Connection,
    private accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<VipAccessOptions>(
      REQUIRE_VIP_ACCESS_KEY,
      context.getHandler(),
    );

    // Nếu route không gắn @RequireVipAccess → cho qua
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const testSetId = request.params.id;

    if (!testSetId) return true;

    // Lấy resource từ DB bằng dynamic model
    const Model = this.connection.model(options.modelName);
    const testSet = await Model.findById(testSetId).exec();

    if (!testSet) throw new NotFoundException('Không tìm thấy bộ đề');

    const requiredAccess: string = testSet.accessLevel || 'external';

    // Ủy quyền kiểm tra cho AccessControlService (single source of truth)
    await this.accessControlService.checkResourceAccess(requiredAccess, user, options.category);

    // Gắn testSet vào request để controller/service tái sử dụng, tránh fetch lại
    request.testSet = testSet;
    return true;
  }
}
