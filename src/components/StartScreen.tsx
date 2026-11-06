import React from 'react';
import { EducationalNoticeCard } from './EducationalNotice';
import { Play, Settings2, Sparkles, Volume2, Mic, Repeat } from 'lucide-react';
import { MOVIE_SETTINGS } from '../types';

interface StartScreenProps {
  onStart: () => void;
  onEditSentences: () => void;
  sentenceCount: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onEditSentences,
  sentenceCount,
}) => {
  return (
    <div className="w-full flex flex-col space-y-6 pb-8">
      {/* Editorial Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-pink-600" />
          <span>Movie-Clip Shadowing</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
          Fluent Shadowing
        </h1>
        <p className="text-lg font-medium text-pink-600 font-serif italic">
          {MOVIE_SETTINGS.titleEn}
        </p>
        <p className="text-slate-600 text-base font-medium pt-1">
          Listen. Copy. Speak at the same time.
        </p>
        <p className="text-xs text-slate-500">
          원어민의 소리를 듣고, 즉시 따라 말하는 가장 효과적인 스피킹 훈련
        </p>
      </div>

      {/* "What is shadowing?" Card (3 bullet points, simple English + Korean) */}
      <div className="bg-white/95 rounded-2xl p-5 border border-purple-100 shadow-sm space-y-3.5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500"></span>
          <span>What is Shadowing? / 쉐도잉이란?</span>
        </h2>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                1. Listen to a native speaker and repeat almost at the same time.
              </p>
              <p className="text-xs text-slate-500">
                원어민의 음성을 들으며 그림자처럼 거의 동시에 따라 말합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                2. Copy rhythm, stress, and intonation naturally.
              </p>
              <p className="text-xs text-slate-500">
                원어민의 자연스러운 리듬, 핵심 강세, 말의 높낮이를 복제하듯 익힙니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                3. Train your ear and speech muscles together.
              </p>
              <p className="text-xs text-slate-500">
                소리 기억력과 입 근육을 함께 단련하여 영어 회화 순발력을 키웁니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={onStart}
          className="w-full min-h-[52px] h-14 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold text-lg flex flex-col items-center justify-center shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            <span>Start Practice</span>
          </div>
          <span className="text-xs font-normal text-pink-100/90 -mt-0.5">
            연습 시작 ({sentenceCount}문장)
          </span>
        </button>

        <div className="text-center pt-1">
          <button
            onClick={onEditSentences}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors"
          >
            <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-pink-500" />
            <span>Edit Sentences / 문장 편집</span>
          </button>
        </div>
      </div>

      {/* Educational Use Notice Card (Section 0-3) */}
      <div className="pt-2">
        <EducationalNoticeCard />
      </div>
    </div>
  );
};
