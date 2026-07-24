import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private calculateVipLevelFromPoints(points: number): string {
    if (points >= 30000) return 'vip2';
    if (points >= 10000) return 'vip1';
    return 'vip0';
  }

  private async evaluateUser(user: UserDocument | any): Promise<any> {
    let changed = false;

    if (!user.vipPackages) user.vipPackages = [];

    for (const pkg of user.vipPackages) {
      if (pkg.vipLevel === 'vip3' && pkg.vip3Expiry) {
        if (new Date() > new Date(pkg.vip3Expiry)) {
          pkg.vipLevel = this.calculateVipLevelFromPoints(pkg.points || 0);
          pkg.vip3Expiry = undefined;
          changed = true;
        }
      } else if (pkg.vipLevel !== 'vip3') {
        const expectedVip = this.calculateVipLevelFromPoints(pkg.points || 0);
        if (expectedVip > pkg.vipLevel) {
          pkg.vipLevel = expectedVip;
          changed = true;
        }
      }
    }

    if (changed && typeof user.save === 'function') {
      user.markModified('vipPackages');
      await user.save();
    }
    return user;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find({}, 'email phone fullName role vipPackages createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const data = await this.userModel
      .findById(id, 'email phone fullName role vipPackages targetScore createdAt avatarUrl')
      .exec();

    if (!data) throw new NotFoundException('User not found');
    
    return this.evaluateUser(data);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-passwordHash')
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');
    return this.evaluateUser(updatedUser);
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  async addPoints(id: string, category: string, pointsToAdd: number) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    if (!user.vipPackages) user.vipPackages = [];
    let pkg = user.vipPackages.find(p => p.category === category);
    if (!pkg) {
      pkg = { category, vipLevel: 'vip0', points: 0 };
      user.vipPackages.push(pkg);
    }
    
    pkg.points += pointsToAdd;
    user.markModified('vipPackages');
    await user.save();
    
    return this.evaluateUser(user);
  }

  async updateVipLevel(id: string, category: string, vipLevel: string, expiry?: Date) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    if (!user.vipPackages) user.vipPackages = [];
    let pkg = user.vipPackages.find(p => p.category === category);
    if (!pkg) {
      pkg = { category, vipLevel: 'vip0', points: 0 };
      user.vipPackages.push(pkg);
    }

    pkg.vipLevel = vipLevel;
    if (vipLevel === 'vip3') {
      pkg.vip3Expiry = expiry;
    } else {
      pkg.vip3Expiry = undefined;
    }
    
    user.markModified('vipPackages');
    await user.save();
    return user;
  }
}
