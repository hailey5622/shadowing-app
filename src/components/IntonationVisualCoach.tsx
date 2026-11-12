import React, { useState } from 'react';
import { Sentence } from '../types';
import { getIntonationCoaching, IntonationCoaching } from '../data/intonationCoaching';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Volume2,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface IntonationVisualCoachProps {
  sentence: Sentence;
  hasRecording: boolean;
  recordedAudioDuration?: number;
}

export const IntonationVisualCoach: React.FC<IntonationVisualCoachProps> = ({
  sentence,
  hasRecording,
  recordedAudioDuration,
}) => {
  const [activeTab, setActiveTab] = useState<'contour' | 'words' | 'mistakes'>('contour');
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const coaching: IntonationCoaching = getIntonationCoaching(sentence);

  // Generate SVG path for model pitch contour
  const points = coaching.modelPitchContour;
  const svgWidth = 320;
  const svgHeight = 110;
  const paddingX = 25;
  const paddingY = 20;

  const getSvgCoordinates = (pts: number[]) => {
    const stepX = (svgWidth - paddingX * 2) / (pts.length - 1);
    return pts.map((val, idx) => ({
      x: paddingX + idx * stepX,
      // value 0 to 100 -> higher value means higher pitch (smaller y in SVG)
      y: svgHeight - paddingY - (val / 100) * (svgHeight - paddingY * 2),
      val,
    }));
  };

  const modelCoords = getSvgCoordinates(points);

  // Build SVG bezier path
  const buildSmoothPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const modelCurvePath = buildSmoothPath(modelCoords);

  return (
    <div className="w-full bg-white rounded-2xl border border-purple-200/90 shadow-sm overflow-hidden text-slate-800 transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                Intonation & Stress Visual Coach
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                시각적 억양·강세 분석
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              배우의 음성 높낮이(Pitch)와 강세 리듬을 시각적으로 비교·교정
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          title={isExpanded ? '접기' : '펼치기'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Tone Overview Banner */}
          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide block">
                Target Vocal Delivery / 목표 억양 패턴
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {coaching.overallTone}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {coaching.endingToneDesc}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-800 font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                {coaching.endingTone === 'falling' ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>하강조 (Fall ↘)</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-pink-600" />
                    <span>상승조 (Rise ↗)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Sub-Tabs: 1. Contour Graph, 2. Stress Map, 3. Detailed Fixes */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('contour')}
              className={`py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'contour'
                  ? 'bg-white text-purple-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              억양 곡선 (Pitch Graph)
            </button>
            <button
              onClick={() => setActiveTab('words')}
              className={`py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'words'
                  ? 'bg-white text-purple-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              단어별 강세 지도
            </button>
            <button
              onClick={() => setActiveTab('mistakes')}
              className={`py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'mistakes'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              수정할 점 디테일
            </button>
          </div>

          {/* TAB 1: Visual Pitch Contour Chart */}
          {activeTab === 'contour' && (
            <div className="space-y-3">
              <div className="relative bg-gradient-to-b from-[#1C1524] to-[#120E18] rounded-xl p-3 text-white overflow-hidden shadow-inner border border-purple-900/40">
                {/* Graph Title & Legend */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span>
                    <span className="font-semibold text-rose-200">배우의 목표 억양 곡선 (Target Pitch)</span>
                  </div>
                  {hasRecording && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                      <span className="text-emerald-300 font-medium">내 음성 감지됨</span>
                    </div>
                  )}
                </div>

                {/* SVG Pitch Chart */}
                <div className="relative w-full h-28 flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-full overflow-visible"
                  >
                    <defs>
                      <linearGradient id="pitchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#EC4899" />
                        <stop offset="50%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EC4899" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal pitch guideline lines */}
                    <line
                      x1={paddingX}
                      y1={paddingY}
                      x2={svgWidth - paddingX}
                      y2={paddingY}
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="3 3"
                    />
                    <text x={paddingX - 4} y={paddingY + 4} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="end">
                      High
                    </text>

                    <line
                      x1={paddingX}
                      y1={svgHeight / 2}
                      x2={svgWidth - paddingX}
                      y2={svgHeight / 2}
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="3 3"
                    />
                    <text x={paddingX - 4} y={svgHeight / 2 + 4} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="end">
                      Mid
                    </text>

                    <line
                      x1={paddingX}
                      y1={svgHeight - paddingY}
                      x2={svgWidth - paddingX}
                      y2={svgHeight - paddingY}
                      stroke="rgba(255,255,255,0.1)"
                      strokeDasharray="3 3"
                    />
                    <text x={paddingX - 4} y={svgHeight - paddingY + 4} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="end">
                      Low
                    </text>

                    {/* Gradient Area under curve */}
                    <path
                      d={`${modelCurvePath} L ${modelCoords[modelCoords.length - 1].x} ${svgHeight - paddingY} L ${modelCoords[0].x} ${svgHeight - paddingY} Z`}
                      fill="url(#areaGradient)"
                    />

                    {/* Main Target Curve */}
                    <path
                      d={modelCurvePath}
                      fill="none"
                      stroke="url(#pitchGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Node points on the curve */}
                    {modelCoords.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4.5"
                          fill="#FFFFFF"
                          stroke="#EC4899"
                          strokeWidth="2"
                        />
                        {/* Word label below node if matches words count */}
                        {coaching.words[idx] && (
                          <text
                            x={pt.x}
                            y={svgHeight - 4}
                            fill={coaching.words[idx].isStressed ? '#F472B6' : '#9CA3AF'}
                            fontSize="9"
                            fontWeight={coaching.words[idx].isStressed ? 'bold' : 'normal'}
                            textAnchor="middle"
                          >
                            {coaching.words[idx].word.replace(/[.,?!]/g, '')}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span><strong>강세 정점(Peak):</strong> {coaching.stressSummary}</span>
                  </div>
                </div>
              </div>

              {/* Recorded Feedback Card if user recorded their voice */}
              {hasRecording ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>녹음 음성 분석 완료! (Voice Recorded)</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    내 음성이 성공적으로 캡처되었습니다! 아래 <strong>'단어별 강세 지도'</strong>와 <strong>'수정할 점 디테일'</strong>을 확인하며 배우의 억양과 차이나는 부분을 하나씩 좁혀보세요.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    아래 녹음 버튼을 눌러 내 음성을 녹음하면 실시간 억양/강세 정밀 피드백이 연동됩니다.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Word-by-word Stress & Energy Map */}
          {activeTab === 'words' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                각 단어의 <strong className="text-pink-600">목표 에너지 바(높이)</strong>와 발음 팁을 확인하세요. 단어를 탭하면 상세 교정 설명이 열립니다.
              </p>

              {/* Word Cards Horizontal Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {coaching.words.map((item, idx) => {
                  const isSelected = selectedWordIdx === idx;
                  const isPrimary = item.stressType === 'primary';
                  const isSecondary = item.stressType === 'secondary';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedWordIdx(isSelected ? null : idx)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/70 shadow-sm ring-2 ring-purple-100'
                          : isPrimary
                          ? 'border-pink-200 bg-pink-50/40 hover:bg-pink-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Top row: Word + Contour icon */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold truncate ${
                            isPrimary
                              ? 'text-pink-700'
                              : isSecondary
                              ? 'text-purple-700'
                              : 'text-slate-600 font-medium'
                          }`}
                        >
                          {item.word}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                            item.pitchLevel === 'high'
                              ? 'bg-pink-100 text-pink-700'
                              : item.pitchLevel === 'mid'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.contourIcon} {item.pitchLevel.toUpperCase()}
                        </span>
                      </div>

                      {/* Energy Bar */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Target Energy</span>
                          <span>{item.targetEnergyPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPrimary
                                ? 'bg-gradient-to-r from-pink-500 to-rose-600'
                                : isSecondary
                                ? 'bg-purple-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${item.targetEnergyPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Tip snippet */}
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-tight">
                        {item.phoneticTip}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Selected Word Full Explanation Card */}
              {selectedWordIdx !== null && coaching.words[selectedWordIdx] && (
                <div className="p-3 bg-purple-900 text-white rounded-xl text-xs space-y-1 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-pink-300 text-sm">
                      단어 발음 정밀 코칭: "{coaching.words[selectedWordIdx].word}"
                    </span>
                    <span className="text-[10px] text-purple-200">
                      {coaching.words[selectedWordIdx].stressType === 'primary'
                        ? '★ 핵심 제1강세'
                        : coaching.words[selectedWordIdx].stressType === 'secondary'
                        ? '보조 강세'
                        : '약화(축약) 단어'}
                    </span>
                  </div>
                  <p className="text-purple-100 text-[11.5px] leading-relaxed">
                    {coaching.words[selectedWordIdx].phoneticTip}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Detailed Mistakes & Actionable Fixes */}
          {activeTab === 'mistakes' && (
            <div className="space-y-3.5">
              {/* Common Mistakes */}
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>한국인 학습자가 가장 자주 하는 실수 (Watch-outs)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-rose-950/90 pl-1">
                  {coaching.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11.5px] leading-relaxed">
                      <span className="text-rose-600 font-bold shrink-0">✕</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detailed Fixes */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>구체적인 수정 & 교정 가이드 (Actionable Fixes)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-950 pl-1">
                  {coaching.detailedFixes.map((fix, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11.5px] leading-relaxed">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actor Vocal Nuance */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">배우 캐릭터 보컬 뉘앙스:</span>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {coaching.characterVocalStyle}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
