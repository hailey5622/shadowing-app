import React, { useState } from 'react';
import { Sentence, SentenceProgress } from '../types';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';
import { Eye, EyeOff, Settings2, PlayCircle, Plus, Sparkles, ArrowLeft } from 'lucide-react';

interface SentenceListScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onSelectSentence: (sentence: Sentence, index: number) => void;
  onGoToEdit: () => void;
  onGoToStart: () => void;
  onLoadDefaultSentences: () => void;
  playerRef: React.RefObject<YouTubePlayerRef | null>;
}

export const SentenceListScreen: React.FC<SentenceListScreenProps> = ({
  sentences,
  progressMap,
  onSelectSentence,
  onGoToEdit,
  onGoToStart,
  onLoadDefaultSentences,
  playerRef,
}) => {
  const [hideAllText, setHideAllText] = useState(false);

  // Helper to get progress mark
  const getProgressIcon = (status?: string) => {
    if (status === 'done') {
      return { symbol: '★', label: 'Done', color: 'text-amber-500 font-bold' };
    }
    if (status === 'practiced') {
      return { symbol: '◐', label: 'Practiced', color: 'text-purple-600 font-bold' };
    }
    return { symbol: '☆', label: 'Not started', color: 'text-slate-300' };
  };

  return (
    <div className="w-full flex flex-col space-y-4 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onGoToStart}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <span className="text-xs font-semibold text-pink-600 uppercase tracking-wider">
          Practice Sentences ({sentences.length})
        </span>
        <button
          onClick={onGoToEdit}
          className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Edit / 편집</span>
        </button>
      </div>

      {/* Video Player at top */}
      <YouTubePlayer ref={playerRef} />

      {/* Controls header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h2 className="text-base font-bold text-slate-900">
          Select Sentence to Shadow
        </h2>
        {sentences.length > 0 && (
          <button
            onClick={() => setHideAllText(!hideAllText)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-pink-600 bg-white border border-pink-100 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
          >
            {hideAllText ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{hideAllText ? 'Show Text / 문장 보기' : 'Hide Text / 문장 숨기기'}</span>
          </button>
        )}
      </div>

      {/* Empty list condition */}
      {sentences.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-pink-100 text-center space-y-4 shadow-sm my-4">
          <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">
              No sentences yet. Tap Edit Sentences to add some.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              등록된 문장이 없습니다. 문장 편집 화면에서 문장을 추가해보세요.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
            <button
              onClick={onGoToEdit}
              className="min-h-[48px] px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm"
            >
              Go to Edit Sentences / 문장 편집하기
            </button>
            <button
              onClick={onLoadDefaultSentences}
              className="min-h-[44px] px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Load Default 10 Sentences / 기본 문장 불러오기</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sentences list cards */
        <div className="space-y-2.5">
          {sentences.map((sentence, idx) => {
            const prog = progressMap[sentence.id];
            const mark = getProgressIcon(prog?.status);

            return (
              <div
                key={sentence.id}
                onClick={() => onSelectSentence(sentence, idx)}
                className="group relative bg-white hover:bg-pink-50/40 rounded-2xl p-4 border border-pink-100/90 shadow-2xs hover:shadow-md hover:border-pink-300 transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                      {sentence.speaker}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-lg leading-none ${mark.color}`}
                      title={mark.label}
                    >
                      {mark.symbol}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {sentence.start.toFixed(1)}s – {sentence.end.toFixed(1)}s
                    </span>
                  </div>
                </div>

                {/* Sentence English Text */}
                <div className="mt-2.5">
                  {hideAllText ? (
                    <div className="h-6 flex items-center">
                      <span className="text-xs text-slate-400 italic bg-slate-50 px-2 py-1 rounded">
                        Text hidden · Tap to practice
                      </span>
                    </div>
                  ) : (
                    <p className="text-[17px] font-medium text-slate-900 leading-snug group-hover:text-pink-950 transition-colors">
                      {sentence.text}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {sentence.korean}
                  </p>
                </div>

                {/* Bottom row: CTA hint */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px]">
                    {prog?.recordings ? `${prog.recordings} recording(s)` : 'No recordings yet'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-pink-600 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Practice / 연습</span>
                    <PlayCircle className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
