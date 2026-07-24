import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    return user || null;
  }
}

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    return result;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new ForbiddenException();
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return user;
  }
}
