import React from 'react';
import { Sentence, SentenceProgress } from '../types';
import { OneLineCredit } from './EducationalNotice';
import { Trophy, RotateCcw, Home, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface FinishScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onPracticeSentence: (sentence: Sentence, index: number) => void;
  onRestartAll: () => void;
  onGoHome: () => void;
}

export const FinishScreen: React.FC<FinishScreenProps> = ({
  sentences,
  progressMap,
  onPracticeSentence,
  onRestartAll,
  onGoHome,
}) => {
  // Count stats
  const completedSentences = sentences.filter(
    (s) => progressMap[s.id]?.status === 'done' || progressMap[s.id]?.status === 'practiced'
  ).length;

  const totalRecordings = Object.values(progressMap).reduce(
    (acc, curr) => acc + (curr.recordings || 0),
    0
  );

  // Find sentences marked with 😐 in selfCheck
  const sentencesNeedingWork = sentences.filter((s) => {
    const prog = progressMap[s.id];
    if (!prog || !prog.selfCheck) return false;
    return prog.selfCheck.includes('needs_work');
  });

  return (
    <div className="w-full flex flex-col space-y-6 pb-12 pt-4">
      {/* Celebration Header */}
      <div className="text-center space-y-3 bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-md">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-pink-500/25">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">
            Session Completed!
          </span>
          <h1 className="font-editorial text-3xl font-bold text-slate-900">
            Great Job! / 훌륭해요!
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            You shadowed Andy & Miranda's interview scene with passion!
          </p>
        </div>

        {/* Stats badges */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="bg-pink-50/80 rounded-2xl p-3 border border-pink-100 text-center">
            <span className="text-2xl font-bold text-pink-700 font-mono">
              {completedSentences} / {sentences.length}
            </span>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Sentences Practiced / 연습 문장
            </p>
          </div>

          <div className="bg-purple-50/80 rounded-2xl p-3 border border-purple-100 text-center">
            <span className="text-2xl font-bold text-purple-700 font-mono">
              {totalRecordings}
            </span>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Total Voice Recordings / 녹음 횟수
            </p>
          </div>
        </div>
      </div>

      {/* Review Section: sentences marked 😐 */}
      {sentencesNeedingWork.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Sentences to Polish / 복습이 필요한 문장 (😐)
              </h2>
              <p className="text-xs text-slate-500">
                스스로 점검에서 아쉬웠던 문장들입니다. 한 번 더 연습해보세요!
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {sentencesNeedingWork.map((sentence) => {
              const originalIndex = sentences.findIndex((s) => s.id === sentence.id);
              return (
                <div
                  key={sentence.id}
                  className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-purple-700">
                        {sentence.speaker}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        #{originalIndex + 1}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {sentence.text}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{sentence.korean}</p>
                  </div>
                  <button
                    onClick={() => onPracticeSentence(sentence, originalIndex)}
                    className="min-h-[40px] px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Practice Again / 다시 연습</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons (at least 48px) */}
      <div className="space-y-2.5">
        <button
          onClick={onRestartAll}
          className="w-full min-h-[48px] h-13 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-[0.98] transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Review Sentences from Start / 처음부터 복습하기</span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full min-h-[48px] h-12 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-200 transition-colors"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Go to Home / 처음 화면으로</span>
        </button>
      </div>

      {/* Mandatory one-line credit at bottom of finish screen */}
      <div className="pt-4 border-t border-pink-100">
        <OneLineCredit />
      </div>
    </div>
  );
};
