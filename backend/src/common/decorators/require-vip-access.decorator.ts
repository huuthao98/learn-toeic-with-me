import { SetMetadata } from '@nestjs/common';

export interface VipAccessOptions {
  category: 'TOEIC' | 'B1' | 'VOCAB' | 'INTERVIEW' | 'JLPT'; // Phân hệ để check VIP
  modelName: string;                     // Tên Mongoose Schema (vd: 'ToeicSet', 'B1Set')
}

export const REQUIRE_VIP_ACCESS_KEY = 'vip_access_meta';

export const RequireVipAccess = (options: VipAccessOptions) =>
  SetMetadata(REQUIRE_VIP_ACCESS_KEY, options);
