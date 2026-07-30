import { Injectable } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class AccessControlService {
  constructor(private usersService: UsersService) {}

  async getAccessFilterQuery(user: any, category: 'TOEIC' | 'B1' | 'VOCAB') {
    if (user?.role === 'admin') return {};

    const allowedLevels = ['external'];

    if (user) {
      allowedLevels.push('vip0');
      try {
        const dbUser = await this.usersService.findOne(user.sub);
        const pkg = dbUser.vipPackages?.find((p: any) => p.category === category);
        const vipLevel = pkg?.vipLevel || 'vip0';

        if (vipLevel === 'vip1') allowedLevels.push('vip1');
        else if (vipLevel === 'vip2') allowedLevels.push('vip1', 'vip2');
        else if (vipLevel === 'vip3') allowedLevels.push('vip1', 'vip2', 'vip3');
      } catch (e) {
        // Mặc định vip0 nếu có lỗi
      }
    }

    return {
      $or: [
        { accessLevel: { $in: allowedLevels } },
        { accessLevel: { $exists: false } },
        { accessLevel: null }
      ]
    };
  }
}
