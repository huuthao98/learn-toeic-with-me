import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';

export type VipCategory = 'TOEIC' | 'B1' | 'VOCAB' | 'INTERVIEW' | 'JLPT';
export type VipLevel = 'vip0' | 'vip1' | 'vip2' | 'vip3';

export const VIP_LEVEL_MAP: Record<string, number> = {
  vip0: 0,
  vip1: 1,
  vip2: 2,
  vip3: 3,
};

@Injectable()
export class AccessControlService {
  constructor(private usersService: UsersService) {}

  /**
   * Lấy VIP level của user theo từng phân hệ (TOEIC, B1, VOCAB).
   * - Admin → trả về 'vip3' (full access).
   * - Chưa đăng nhập → 'vip0'.
   * - Đã đăng nhập nhưng không có gói VIP → 'vip0'.
   */
  async getUserVipLevel(user: any, category: VipCategory): Promise<VipLevel> {
    if (!user) return 'vip0';
    if (user.role === 'admin') return 'vip3';

    try {
      const dbUser = await this.usersService.findOne(user.sub);
      const pkg = dbUser.vipPackages?.find((p: any) => p.category === category);
      return (pkg?.vipLevel as VipLevel) || 'vip0';
    } catch {
      return 'vip0';
    }
  }

  /**
   * Kiểm tra user có đủ quyền truy cập resource hay không.
   * Ném ForbiddenException nếu không đủ quyền.
   *
   * @param requiredAccess - accessLevel của resource ('external' | 'vip0' | 'vip1' | 'vip2' | 'vip3')
   * @param user - JWT payload từ request (có thể undefined nếu anonymous)
   * @param category - Phân hệ VIP cần kiểm tra
   */
  async checkResourceAccess(
    requiredAccess: string,
    user: any,
    category: VipCategory,
  ): Promise<void> {
    // External content: mọi người đều truy cập được
    if (!requiredAccess || requiredAccess === 'external') return;

    // Nội dung VIP bất kỳ → cần đăng nhập
    if (!user) {
      throw new ForbiddenException('Vui lòng đăng nhập để truy cập nội dung này');
    }

    // Admin luôn có quyền
    if (user.role === 'admin') return;

    // vip0 = bất kỳ user đã đăng nhập
    if (requiredAccess === 'vip0') return;

    // Kiểm tra VIP level cụ thể theo numeric score
    const userVipLevel = await this.getUserVipLevel(user, category);
    const userScore = VIP_LEVEL_MAP[userVipLevel] ?? 0;
    const requiredScore = VIP_LEVEL_MAP[requiredAccess] ?? 0;

    if (userScore < requiredScore) {
      throw new ForbiddenException(
        `Yêu cầu tài khoản đạt cấp độ ${requiredAccess.toUpperCase()} phân hệ ${category} để truy cập nội dung này`,
      );
    }
  }

  /**
   * Xây dựng Mongoose filter query để lọc danh sách resource theo quyền của user.
   * Dùng trong aggregate/find khi cần lọc nhiều documents cùng lúc.
   */
  async getAccessFilterQuery(user: any, category: VipCategory) {
    if (user?.role === 'admin') return {};

    const userVipLevel = await this.getUserVipLevel(user, category);
    const allowedLevels: string[] = ['external'];

    if (user) {
      allowedLevels.push('vip0');

      if (userVipLevel === 'vip1') allowedLevels.push('vip1');
      else if (userVipLevel === 'vip2') allowedLevels.push('vip1', 'vip2');
      else if (userVipLevel === 'vip3') allowedLevels.push('vip1', 'vip2', 'vip3');
    }

    return {
      $or: [
        { accessLevel: { $in: allowedLevels } },
        { accessLevel: { $exists: false } },
        { accessLevel: null },
      ],
    };
  }
}
