import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getStats(userId: string) {
    // Get user's test results
    const { data: results } = await this.supabase
      .from('test_results')
      .select('score, listening_score, reading_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const latest = results?.[0];

    // Get streak
    const { data: streak } = await this.supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_study_date')
      .eq('user_id', userId)
      .single();

    return {
      estimatedScore: latest?.score || 0,
      listeningScore: latest?.listening_score || 0,
      readingScore: latest?.reading_score || 0,
      targetScore: 850,
      streak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
    };
  }

  async getTodayPlan(userId: string) {
    const { data } = await this.supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', new Date().toISOString().split('T')[0]);

    return data || [];
  }

  async getScoreProgression(userId: string) {
    const { data } = await this.supabase
      .from('test_results')
      .select('score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return (data || []).reverse().map((r) => ({
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: r.score,
    }));
  }

  async getRecentTests(userId: string) {
    const { data } = await this.supabase
      .from('test_results')
      .select(`
        id, score, listening_score, reading_score, duration_minutes,
        created_at, status,
        test_sets (name, total_questions, parts_count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return data || [];
  }
}
