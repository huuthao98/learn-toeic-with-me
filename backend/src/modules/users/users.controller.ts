import { Controller, Get, Param, Query, UseGuards, Put, Body, Delete, Post, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AdminGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Admin – Users')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/points')
  addPoints(@Param('id') id: string, @Body() body: { category: string, points: number }) {
    return this.usersService.addPoints(id, body.category, body.points);
  }

  @Patch(':id/vip')
  updateVipLevel(@Param('id') id: string, @Body() body: { category: string, vipLevel: string, expiry?: Date }) {
    return this.usersService.updateVipLevel(id, body.category, body.vipLevel, body.expiry);
  }
}
