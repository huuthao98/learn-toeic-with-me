import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find({}, 'email phone fullName role plan createdAt')
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
      .findById(
        id,
        'email phone fullName role plan targetScore createdAt avatarUrl',
      )
      .exec();

    if (!data) throw new NotFoundException('User not found');
    return data;
  }
}
