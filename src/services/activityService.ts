import { createClient } from '@/lib/supabase/client';
import { ActivityType, LearningActivity } from '../types';

const LOCAL_ACTIVITY_STORAGE_KEY = 'fluent_shadowing_local_activities_v1';

export interface LogActivityParams {
  userId?: string | null;
  activityType: ActivityType;
  sentenceId: number;
  sentenceText: string;
  speaker?: string;
  stepNumber?: number;
  playbackSpeed?: number;
  durationSeconds?: number;
}

export interface SentenceActivityBreakdown {
  sentenceId: number;
  sentenceText: string;
  speaker: string;
  listenCount: number;
  shadowingCount: number;
  lastTimestamp: string;
}

export interface ActivitySummaryStats {
  listenCount: number;
  shadowingCount: number;
  totalCount: number;
  totalDurationSeconds: number;
  lastRecordedAt: string | null;
  bySentence: SentenceActivityBreakdown[];
}

function readLocalActivities(): LearningActivity[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalActivities(items: LearningActivity[]) {
  try {
    // Keep latest 200 items locally
    localStorage.setItem(LOCAL_ACTIVITY_STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
  } catch (err) {
    console.warn('Failed to write local activities:', err);
  }
}

export async function logLearningActivity(
  params: LogActivityParams
): Promise<LearningActivity | null> {
  const timestamp = new Date().toISOString();

  if (params.userId) {
    try {
      const supabase = createClient();
      const payload = {
        user_id: params.userId,
        activity_type: params.activityType,
        sentence_id: params.sentenceId,
        sentence_text: params.sentenceText,
        speaker: params.speaker ?? null,
        step_number: params.stepNumber ?? 1,
        playback_speed: params.playbackSpeed ?? 1.0,
        duration_seconds: params.durationSeconds ?? 0,
        created_at: timestamp,
      };

      const { data, error } = await supabase
        .from('learning_activities')
        .insert(payload)
        .select('*')
        .single();

      if (!error && data) {
        return {
          ...(data as LearningActivity),
          source: 'supabase',
        };
      }
      if (error) {
        console.warn('Supabase insert learning_activities error:', error.message);
      }
    } catch (err) {
      console.warn('Failed to log activity to Supabase:', err);
    }
  }

  // Fallback / guest storage in localStorage with timestamp
  const localItem: LearningActivity = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    activity_type: params.activityType,
    sentence_id: params.sentenceId,
    sentence_text: params.sentenceText,
    speaker: params.speaker ?? null,
    step_number: params.stepNumber ?? 1,
    playback_speed: params.playbackSpeed ?? 1.0,
    duration_seconds: params.durationSeconds ?? 0,
    created_at: timestamp,
    source: 'local',
  };

  const existing = readLocalActivities();
  writeLocalActivities([localItem, ...existing]);
  return localItem;
}

export async function syncLocalActivitiesToSupabase(userId: string): Promise<number> {
  const localItems = readLocalActivities();
  if (localItems.length === 0) return 0;

  try {
    const supabase = createClient();
    const rows = localItems.map((item) => ({
      user_id: userId,
      activity_type: item.activity_type,
      sentence_id: item.sentence_id,
      sentence_text: item.sentence_text,
      speaker: item.speaker ?? null,
      step_number: item.step_number ?? 1,
      playback_speed: item.playback_speed ?? 1.0,
      duration_seconds: item.duration_seconds ?? 0,
      created_at: item.created_at,
    }));

    const { error } = await supabase.from('learning_activities').insert(rows);
    if (!error) {
      writeLocalActivities([]);
      return rows.length;
    }
    console.warn('Could not sync guest activities to Supabase:', error.message);
    return 0;
  } catch (err) {
    console.warn('Failed syncing guest activities:', err);
    return 0;
  }
}

export async function fetchLearningActivities(
  userId?: string | null
): Promise<{ activities: LearningActivity[]; fromSupabase: boolean; error?: string }> {
  if (!userId) {
    return {
      activities: readLocalActivities(),
      fromSupabase: false,
    };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return {
        activities: readLocalActivities(),
        fromSupabase: false,
        error: error.message,
      };
    }

    const supabaseRows = ((data as LearningActivity[]) || []).map((row) => ({
      ...row,
      source: 'supabase' as const,
    }));

    return {
      activities: supabaseRows,
      fromSupabase: true,
    };
  } catch (err: any) {
    return {
      activities: readLocalActivities(),
      fromSupabase: false,
      error: err?.message || '데이터를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

export function computeActivitySummary(activities: LearningActivity[]): ActivitySummaryStats {
  let listenCount = 0;
  let shadowingCount = 0;
  let totalDurationSeconds = 0;
  let lastRecordedAt: string | null = null;

  const sentenceMap = new Map<number, SentenceActivityBreakdown>();

  for (const act of activities) {
    if (act.activity_type === 'listen') {
      listenCount += 1;
    } else if (act.activity_type === 'shadowing') {
      shadowingCount += 1;
    }

    if (act.duration_seconds && act.duration_seconds > 0) {
      totalDurationSeconds += act.duration_seconds;
    }

    if (!lastRecordedAt || act.created_at > lastRecordedAt) {
      lastRecordedAt = act.created_at;
    }

    const existing = sentenceMap.get(act.sentence_id);
    if (existing) {
      if (act.activity_type === 'listen') existing.listenCount += 1;
      if (act.activity_type === 'shadowing') existing.shadowingCount += 1;
      if (act.created_at > existing.lastTimestamp) {
        existing.lastTimestamp = act.created_at;
      }
    } else {
      sentenceMap.set(act.sentence_id, {
        sentenceId: act.sentence_id,
        sentenceText: act.sentence_text,
        speaker: act.speaker || 'Speaker',
        listenCount: act.activity_type === 'listen' ? 1 : 0,
        shadowingCount: act.activity_type === 'shadowing' ? 1 : 0,
        lastTimestamp: act.created_at,
      });
    }
  }

  const bySentence = Array.from(sentenceMap.values()).sort((a, b) => a.sentenceId - b.sentenceId);

  return {
    listenCount,
    shadowingCount,
    totalCount: listenCount + shadowingCount,
    totalDurationSeconds,
    lastRecordedAt,
    bySentence,
  };
}
