import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  getStats(@Request() req: any) {
    return this.dashboardService.getStats(req.user.sub);
  }

  @Get('today-plan')
  @ApiOperation({ summary: "Get today's study plan" })
  getTodayPlan(@Request() req: any) {
    return this.dashboardService.getTodayPlan(req.user.sub);
  }

  @Get('score-progression')
  @ApiOperation({ summary: 'Get score progression for chart' })
  getScoreProgression(@Request() req: any) {
    return this.dashboardService.getScoreProgression(req.user.sub);
  }

  @Get('recent-tests')
  @ApiOperation({ summary: 'Get recent test results' })
  getRecentTests(@Request() req: any) {
    return this.dashboardService.getRecentTests(req.user.sub);
  }
}
