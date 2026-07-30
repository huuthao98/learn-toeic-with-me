import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { REQUIRE_VIP_ACCESS_KEY, VipAccessOptions } from '../decorators/require-vip-access.decorator';
import { UsersService } from '@/modules/users/users.service';

@Injectable()
export class VipAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectConnection() private connection: Connection,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<VipAccessOptions>(
      REQUIRE_VIP_ACCESS_KEY,
      context.getHandler(),
    );

    if (!options) return true; // Nếu API không gắn Decorator -> Cho qua

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const testSetId = request.params.id;

    if (!testSetId) return true;

    // 1. Lấy Model động từ Mongoose Connection
    const Model = this.connection.model(options.modelName);
    const testSet = await Model.findById(testSetId).exec();

    if (!testSet) throw new NotFoundException('Không tìm thấy bộ đề');

    const requiredAccess = testSet.accessLevel || 'external';

    // 2. Logic kiểm tra quyền
    if (requiredAccess === 'external') {
      request.testSet = testSet; // Gắn vào request để tái sử dụng
      return true;
    }

    if (!user) {
      throw new ForbiddenException('Vui lòng đăng nhập để truy cập nội dung này');
    }

    if (user.role === 'admin') {
      request.testSet = testSet;
      return true;
    }

    const dbUser = await this.usersService.findOne(user.sub);
    const userPkg = dbUser.vipPackages?.find((pkg: any) => pkg.category === options.category);

    if (requiredAccess === 'internal') {
      if (!userPkg || !['vip1', 'vip2', 'vip3'].includes(userPkg.vipLevel)) {
        throw new ForbiddenException(`Yêu cầu tài khoản VIP phân hệ ${options.category} để truy cập`);
      }
    }

    request.testSet = testSet;
    return true;
  }
}
