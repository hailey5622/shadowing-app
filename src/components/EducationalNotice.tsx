import React, { useState } from 'react';
import { MOVIE_SETTINGS } from '../types';
import { ExternalLink, Info, ChevronDown, ChevronUp, Film, BookOpen, User } from 'lucide-react';

export const OneLineCredit: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <p className={`text-[13px] text-zinc-500 text-center leading-normal ${className}`}>
      Clip: <span className="italic font-medium text-zinc-700">{MOVIE_SETTINGS.titleEn}</span> ({MOVIE_SETTINGS.releaseYear}), {MOVIE_SETTINGS.distributionCompany} / {MOVIE_SETTINGS.productionCompany} · via YouTube · For educational use only
    </p>
  );
};

export const EducationalNoticeCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  // Format seconds to m:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const practiceRangeFormatted = `${formatTime(MOVIE_SETTINGS.practiceStart)} – ${formatTime(MOVIE_SETTINGS.practiceEnd)}`;

  return (
    <div className="w-full bg-white/95 rounded-2xl border border-pink-200/80 shadow-sm p-4 text-slate-700 space-y-3.5">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-pink-600 transition-colors">
              Educational Use & Source / 교육용 고지 및 출처
            </h3>
            <p className="text-[11px] text-slate-500">
              ENG3088 Sungkyunkwan University · Non-commercial learning
            </p>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="pt-2 border-t border-pink-100/80 space-y-3 text-xs leading-relaxed text-slate-600">
          {/* Section 0-2 Notice */}
          <div className="bg-pink-50/60 p-3 rounded-xl border border-pink-100 text-[11.5px] space-y-2">
            <div>
              <span className="font-semibold text-pink-900 block mb-0.5">Educational use only / 교육 목적 전용</span>
              <p className="text-slate-700">
                This app was made <strong>only for non-commercial English learning</strong> in the university course <em>AI and English Language Education</em> (ENG3088, Sungkyunkwan University). The film clip is used <strong>only to practice listening and speaking (shadowing)</strong>. It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.
              </p>
            </div>
            <div className="pt-1.5 border-t border-pink-200/50">
              <p className="text-slate-700">
                이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 <strong>비영리 영어 학습 목적으로만</strong> 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.
              </p>
            </div>
          </div>

          {/* Source lines from 0-1 */}
          <div className="space-y-1.5 pt-1 text-[11.5px]">
            <div className="flex items-start gap-1.5">
              <Film className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-900">Movie Title:</span> {MOVIE_SETTINGS.titleEn} ({MOVIE_SETTINGS.titleKo}, {MOVIE_SETTINGS.releaseYear})
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-5 text-[11px] text-slate-600">
              <div><span className="text-slate-500">Director:</span> {MOVIE_SETTINGS.director}</div>
              <div><span className="text-slate-500">Screenplay:</span> {MOVIE_SETTINGS.screenplay}</div>
              <div className="col-span-full"><span className="text-slate-500">Production:</span> {MOVIE_SETTINGS.productionCompany}</div>
              <div className="col-span-full"><span className="text-slate-500">Distribution:</span> {MOVIE_SETTINGS.distributionCompany}</div>
            </div>

            <div className="flex items-start gap-1.5 pt-1">
              <BookOpen className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-slate-900">Scene Description:</span> {MOVIE_SETTINGS.sceneDescription}
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-1 text-[11px]">
              <div><span className="font-medium text-slate-700">YouTube Title:</span> {MOVIE_SETTINGS.youtubeVideoTitle}</div>
              <div><span className="font-medium text-slate-700">Channel:</span> {MOVIE_SETTINGS.youtubeChannelName}</div>
              <div>
                <span className="font-medium text-slate-700">Practice Range:</span> <span className="font-mono text-pink-700 font-semibold">{practiceRangeFormatted}</span> (0s – 47s)
              </div>
              <div className="pt-0.5">
                <a
                  href={MOVIE_SETTINGS.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 underline font-medium"
                >
                  <span>Watch on YouTube ({MOVIE_SETTINGS.youtubeUrl})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 pl-1 text-[11px] text-slate-500">
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span>Made by (제작자): <strong className="text-slate-800">{MOVIE_SETTINGS.madeBy}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
