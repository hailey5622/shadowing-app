import React, { useEffect, useState, useCallback } from 'react';
import { LearningActivity, ActivityType } from '../types';
import {
  fetchLearningActivities,
  computeActivitySummary,
} from '../services/activityService';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Headphones,
  Mic,
  Clock,
  RefreshCw,
  Database,
  LogIn,
  Play,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface ActivitySummaryScreenProps {
  onGoBack: () => void;
  onStartPractice: () => void;
  onOpenLogin: () => void;
}

export const ActivitySummaryScreen: React.FC<ActivitySummaryScreenProps> = ({
  onGoBack,
  onStartPractice,
  onOpenLogin,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [fromSupabase, setFromSupabase] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | ActivityType>('all');

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await fetchLearningActivities(user?.id);
    setActivities(res.activities);
    setFromSupabase(res.fromSupabase);
    if (res.error) setErrorMsg(res.error);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const summary = computeActivitySummary(activities);

  const filteredActivities =
    filterType === 'all'
      ? activities
      : activities.filter((a) => a.activity_type === filterType);

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const maxSentenceActivity = Math.max(
    1,
    ...summary.bySentence.map((s) => s.listenCount + s.shadowingCount)
  );

  return (
    <div className="w-full flex flex-col space-y-5 pb-14">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-pink-100 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back / 홈으로</span>
        </button>

        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-pink-600" />
          <span>활동 기록 요약</span>
        </h2>

        <button
          onClick={loadActivities}
          disabled={isLoading}
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh activities"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>새로고침</span>
        </button>
      </div>

      {/* Header & Supabase Sync Status Banner */}
      <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm space-y-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">
            Learning Activity Summary
          </span>
          <h1 className="font-editorial text-2xl font-bold text-slate-900">
            나의 쉐도잉 활동 요약
          </h1>
          <p className="text-xs text-slate-500">
            듣기 학습 횟수와 쉐도잉 횟수를 타임스탬프와 함께 기록합니다.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-emerald-900 truncate">
                  {fromSupabase ? 'Supabase 데이터베이스 연동 중' : '로컬 백업 표시 중'}
                </p>
                <p className="text-[11px] text-emerald-700 truncate">{user?.email}</p>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-purple-900">
                게스트 모드 (브라우저 임시 기록)
              </p>
              <p className="text-[11px] text-purple-700">
                Google 로그인 시 활동 기록이 Supabase DB에 안전하게 저장됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs whitespace-nowrap shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <p className="text-[11px] text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
            동기화 안내: {errorMsg}
          </p>
        )}
      </div>

      {/* 2 Primary KPI Cards: Listen Count & Shadowing Count */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">듣기 학습 횟수</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-pink-700 font-mono tabular-nums">
            {summary.listenCount}
            <span className="text-sm font-normal text-slate-400 ml-1">회</span>
          </div>
          <p className="text-[11px] text-slate-400">원어민 클립 재생 누적</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">쉐도잉 횟수</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-700 font-mono tabular-nums">
            {summary.shadowingCount}
            <span className="text-sm font-normal text-slate-400 ml-1">회</span>
          </div>
          <p className="text-[11px] text-slate-400">녹음 및 발화 연습 누적</p>
        </div>
      </div>

      {/* Secondary Meta Strip: Total + Last Recorded Timestamp */}
      <div className="bg-white rounded-2xl px-4 py-3 border border-pink-100 shadow-2xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="w-4 h-4 text-pink-500 shrink-0" />
          <span>최근 기록:</span>
          <span className="font-mono text-slate-800 font-semibold">
            {summary.lastRecordedAt ? formatTimestamp(summary.lastRecordedAt) : '기록 없음'}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-purple-700">
          총 {summary.totalCount}회
        </span>
      </div>

      {/* Per-Sentence Listen vs Shadowing Visual Breakdown */}
      {summary.bySentence.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              문장별 학습 분포 / Per-Sentence Breakdown
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-500" /> 듣기
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-600" /> 쉐도잉
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {summary.bySentence.map((item) => {
              const listenPct = Math.round((item.listenCount / maxSentenceActivity) * 100);
              const shadowPct = Math.round((item.shadowingCount / maxSentenceActivity) * 100);
              return (
                <div key={item.sentenceId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 truncate pr-2">
                      <span className="font-mono text-pink-600 font-bold mr-1.5">
                        #{item.sentenceId}
                      </span>
                      {item.sentenceText}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap shrink-0 tabular-nums">
                      듣기 {item.listenCount} · 쉐도잉 {item.shadowingCount}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    {item.listenCount > 0 && (
                      <div
                        className="h-full bg-pink-500 transition-all"
                        style={{ width: `${listenPct}%` }}
                      />
                    )}
                    {item.shadowingCount > 0 && (
                      <div
                        className="h-full bg-purple-600 transition-all"
                        style={{ width: `${shadowPct}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Timeline with Timestamps */}
      <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">
            활동 타임라인 / Activity Log
          </h3>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setFilterType('listen')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterType === 'listen' ? 'bg-white text-pink-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              듣기
            </button>
            <button
              type="button"
              onClick={() => setFilterType('shadowing')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterType === 'shadowing' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              쉐도잉
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            활동 기록을 불러오는 중입니다...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              아직 기록된 학습 활동이 없습니다.
            </p>
            <p className="text-xs text-slate-500">
              문장 연습 화면에서 Play(듣기) 또는 Record(쉐도잉)를 실행하면 이곳에 기록됩니다.
            </p>
            <button
              type="button"
              onClick={onStartPractice}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-semibold shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>연습 시작하기</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => {
              const isListen = act.activity_type === 'listen';
              return (
                <div key={act.id} className="py-3 first:pt-1 last:pb-1 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isListen
                        ? 'bg-pink-50 text-pink-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {isListen ? <Headphones className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isListen ? 'text-pink-700' : 'text-purple-700'
                        }`}
                      >
                        {isListen ? '듣기 학습 (Listen)' : '쉐도잉 (Shadowing)'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums">
                        {formatTimestamp(act.created_at)}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 leading-snug">
                      {act.sentence_text}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      {act.speaker && <span>{act.speaker}</span>}
                      <span aria-hidden="true">·</span>
                      <span>Step {act.step_number || 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{act.playback_speed || 1}×</span>
                      {act.duration_seconds ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{act.duration_seconds}s</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action CTA */}
      <button
        type="button"
        onClick={onStartPractice}
        className="w-full min-h-[50px] h-13 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-[0.98] transition-all"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>Continue Shadowing Practice / 계속 연습하기</span>
      </button>
    </div>
  );
};
