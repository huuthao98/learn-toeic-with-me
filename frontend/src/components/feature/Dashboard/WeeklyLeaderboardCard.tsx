'use client';

import { Trophy, User, Crown, Flame } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  isMe?: boolean;
}

const LEADERBOARD_USERS: LeaderboardUser[] = [
  { rank: 1, name: 'Trần Linh', xp: 5240 },
  { rank: 2, name: 'Lê Hoàng', xp: 4980 },
  { rank: 3, name: 'Nguyễn Minh Tuấn', xp: 4750, isMe: true },
  { rank: 4, name: 'Phạm Khoa', xp: 4120 },
];

export function WeeklyLeaderboardCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-chart-4/10 p-2 rounded-xl text-chart-4 border border-chart-4/20">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Xếp hạng tuần</h3>
            <p className="text-xs text-muted-foreground">Bảng Kim Cương • Nhóm 48 bạn</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {LEADERBOARD_USERS.map(user => {
          const isTop1 = user.rank === 1;
          const isTop2 = user.rank === 2;
          const isTop3 = user.rank === 3;

          return (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                user.isMe
                  ? 'bg-primary/10 border border-primary/25 shadow-xs font-semibold'
                  : 'hover:bg-muted/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Rank Badge */}
                <div className="w-5 text-center shrink-0">
                  {isTop1 ? (
                    <Crown className="w-4 h-4 text-amber-500 mx-auto" />
                  ) : (
                    <span
                      className={`text-xs font-black ${
                        isTop2
                          ? 'text-slate-400'
                          : isTop3
                          ? 'text-amber-700 dark:text-amber-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      #{user.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    user.isMe
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {user.isMe ? 'NT' : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Name */}
                <span
                  className={`text-xs truncate ${
                    user.isMe ? 'text-primary font-bold' : 'text-foreground font-medium'
                  }`}
                >
                  {user.name} {user.isMe && '(Tôi)'}
                </span>
              </div>

              {/* XP */}
              <div className="flex items-center gap-1 shrink-0 text-right">
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {user.xp.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
