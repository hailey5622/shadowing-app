import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sentence, SentenceProgress, ShadowingStepId, SelfRating } from '../types';
import { SHADOWING_STEPS } from '../data/defaultSentences';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';
import {
  recordPlayCount,
  recordVoiceRecording,
  updateSelfCheck,
  getAudioRecordingUrl,
  setAudioRecordingUrl,
} from '../services/storage';
import {
  Play,
  Pause,
  Repeat,
  Mic,
  Square,
  Volume2,
  ChevronLeft,
  ChevronRight,
  List,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface PracticeScreenProps {
  sentence: Sentence;
  index: number;
  totalSentences: number;
  progress: SentenceProgress;
  onNext: () => void;
  onPrev: () => void;
  onGoToList: () => void;
  onFinishPractice: () => void;
  onProgressUpdated: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  sentence,
  index,
  totalSentences,
  progress,
  onNext,
  onPrev,
  onGoToList,
  onFinishPractice,
  onProgressUpdated,
}) => {
  const playerRef = useRef<YouTubePlayerRef | null>(null);

  // Practice state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentStep, setCurrentStep] = useState<ShadowingStepId>(1);
  const [isTextHidden, setIsTextHidden] = useState(true);
  const [isKoreanHidden, setIsKoreanHidden] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingMyVoice, setIsPlayingMyVoice] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech Recognition state
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [recognizedWords, setRecognizedWords] = useState<string[] | null>(null);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);

  // Load existing audio recording for this sentence if available
  useEffect(() => {
    const existingAudio = getAudioRecordingUrl(sentence.id);
    setRecordedAudioUrl(existingAudio || null);
    setRecognizedWords(null);
    setSpeechFeedback(null);
    setIsPlaying(false);
    setIsRecording(false);
    setIsPlayingMyVoice(false);
  }, [sentence.id]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);
  }, []);

  // Update text hidden default when step changes
  const handleSelectStep = (stepId: ShadowingStepId) => {
    setCurrentStep(stepId);
    const stepInfo = SHADOWING_STEPS.find((s) => s.id === stepId);
    if (stepInfo) {
      setIsTextHidden(stepInfo.defaultHideText);
    }
  };

  // Play sentence segment
  const handleTogglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      recordPlayCount(sentence.id);
      onProgressUpdated();
      setIsPlaying(true);
      playerRef.current.playSegment(sentence.start, sentence.end, isLooping, () => {
        if (!isLooping) {
          setIsPlaying(false);
        }
      });
    }
  };

  // Speed change
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Loop toggle
  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    // If currently playing, update segment playback loop state
    if (isPlaying && playerRef.current) {
      playerRef.current.playSegment(sentence.start, sentence.end, nextLoop, () => {
        if (!nextLoop) {
          setIsPlaying(false);
        }
      });
    }
  };

  // Recording functionality:
  // "plays the sentence once and records the learner's voice at the same time.
  // Recording stops 1 second after the sentence ends. (Loop is ignored while recording.)"
  const handleStartRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermissionDenied(false);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        setAudioRecordingUrl(sentence.id, audioUrl);

        // Update progress in storage
        recordVoiceRecording(sentence.id, currentStep, audioUrl);
        onProgressUpdated();

        // Release mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Play video sentence once (loop ignored during recording)
      if (playerRef.current) {
        setIsPlaying(true);
        playerRef.current.playSegment(sentence.start, sentence.end, false, () => {
          setIsPlaying(false);
          // Wait 1 second after sentence ends before stopping recording
          setTimeout(() => {
            stopRecording();
          }, 1000);
        });
      }
    } catch (err: any) {
      console.warn('Microphone access failed:', err);
      setMicPermissionDenied(true);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recorder:', e);
      }
    }
    setIsRecording(false);
  };

  // Play user's recorded voice
  const handlePlayMyVoice = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingMyVoice) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      setIsPlayingMyVoice(false);
      return;
    }

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(recordedAudioUrl);
    } else {
      audioPlayerRef.current.src = recordedAudioUrl;
    }

    setIsPlayingMyVoice(true);
    audioPlayerRef.current.onended = () => {
      setIsPlayingMyVoice(false);
    };
    audioPlayerRef.current.onerror = () => {
      setIsPlayingMyVoice(false);
    };
    audioPlayerRef.current.play().catch(() => setIsPlayingMyVoice(false));
  };

  // Replay original clip segment immediately
  const handlePlayOriginal = () => {
    if (!playerRef.current) return;
    setIsPlaying(true);
    playerRef.current.playSegment(sentence.start, sentence.end, false, () => {
      setIsPlaying(false);
    });
  };

  // Self-check handlers
  const handleSelfCheckRating = (criterionIndex: 0 | 1 | 2, rating: SelfRating) => {
    updateSelfCheck(sentence.id, criterionIndex, rating);
    onProgressUpdated();
  };

  // Speech Recognition (Check My Words)
  const handleCheckMyWords = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningSpeech(true);
      setSpeechFeedback('Listening... Speak the sentence now!');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript || '';
        const recognizedTokens = transcript
          .toLowerCase()
          .replace(/[.,?!'"]/g, '')
          .split(/\s+/)
          .filter(Boolean);

        setRecognizedWords(recognizedTokens);

        const targetWords = sentence.text
          .toLowerCase()
          .replace(/[.,?!'"]/g, '')
          .split(/\s+/)
          .filter(Boolean);

        const matchedCount = targetWords.filter((w) => recognizedTokens.includes(w)).length;
        setSpeechFeedback(
          `You said ${matchedCount} of ${targetWords.length} words! Wonderful effort! ✨`
        );
        setIsListeningSpeech(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListeningSpeech(false);
        setSpeechFeedback('Could not hear clearly. Try speaking closer to the microphone.');
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListeningSpeech(false);
      setSpeechFeedback('Speech recognition unavailable in this browser session.');
    }
  };

  // Render sentence with stress words in bold
  const renderSentenceWithStress = () => {
    if (isTextHidden) {
      return (
        <div className="py-6 px-4 text-center rounded-xl bg-pink-50/50 border border-dashed border-pink-200">
          <p className="text-slate-400 text-sm font-medium">
            Text is hidden for this shadowing step
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            자막을 숨기고 소리와 리듬에만 집중해보세요.
          </p>
        </div>
      );
    }

    // Split text into words/tokens
    const words = sentence.text.split(/(\s+)/);
    const stressPhrases = sentence.stress.map((s) => s.toLowerCase().trim());

    // Clean word comparator for Web Speech API word check
    const cleanWord = (w: string) => w.toLowerCase().replace(/[.,?!'"]/g, '');

    return (
      <div className="text-[23px] sm:text-[25px] font-medium text-slate-900 leading-snug tracking-tight">
        {words.map((word, i) => {
          if (!word.trim()) return <span key={i}>{word}</span>;

          const cleaned = cleanWord(word);
          const isStressed = stressPhrases.some(
            (sp) => sp === cleaned || sp.split(/\s+/).includes(cleaned)
          );

          // Word check matching logic
          let wordCheckStyle = '';
          if (recognizedWords) {
            if (recognizedWords.includes(cleaned)) {
              wordCheckStyle = 'text-emerald-700 bg-emerald-100/80 px-1 py-0.5 rounded';
            } else {
              wordCheckStyle = 'text-slate-400 underline decoration-slate-400/80 decoration-2';
            }
          }

          if (isStressed) {
            return (
              <strong
                key={i}
                className={`font-black text-pink-700 underline decoration-pink-300 decoration-2 ${wordCheckStyle}`}
              >
                {word}
              </strong>
            );
          }

          return (
            <span key={i} className={wordCheckStyle}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  const currentStepData = SHADOWING_STEPS.find((s) => s.id === currentStep) || SHADOWING_STEPS[0];
  const isLastSentence = index === totalSentences - 1;

  return (
    <div className="w-full flex flex-col space-y-4 pb-16">
      {/* Top Bar with back to list and navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onGoToList}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-pink-100 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
        >
          <List className="w-3.5 h-3.5 text-pink-500" />
          <span>All Sentences / 전체 목록</span>
        </button>

        {/* Sentence Counter: "Sentence 3 / 8" with ◀ ▶ arrows */}
        <div className="flex items-center gap-1.5 bg-white border border-pink-100 rounded-xl px-2 py-1 shadow-2xs">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-pink-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Previous sentence"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-1 font-mono">
            Sentence {index + 1} / {totalSentences}
          </span>
          <button
            onClick={onNext}
            disabled={isLastSentence}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-pink-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Next sentence"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Player (16:9) with mandatory one-line credit underneath */}
      <YouTubePlayer
        ref={playerRef}
        isLooping={isLooping}
        currentSpeed={playbackSpeed}
        onSegmentFinished={() => {
          if (!isLooping) {
            setIsPlaying(false);
          }
        }}
      />

      {/* 4-Step Guide Tabs */}
      <div className="bg-white rounded-2xl p-2.5 border border-pink-100/90 shadow-2xs space-y-2">
        <div className="grid grid-cols-4 gap-1 p-1 bg-purple-50/70 rounded-xl">
          {SHADOWING_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => handleSelectStep(step.id)}
                className={`min-h-[46px] py-1.5 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-white text-pink-700 shadow-sm font-bold border border-pink-200'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="text-xs leading-none whitespace-nowrap">Step {step.id}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 leading-none whitespace-nowrap">
                  {step.id === 1 ? '듣기' : step.id === 2 ? '웅얼' : step.id === 3 ? '보고' : '실전'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active step instruction line (English + Korean) */}
        <div className="px-2 py-1 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <span className="text-pink-600">{currentStepData.nameEn}:</span>
            <span>{currentStepData.shortDescEn}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {currentStepData.shortDescKo}
          </p>
        </div>
      </div>

      {/* Sentence Display Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-pink-100 shadow-sm space-y-3">
        {/* Speaker Badge & Controls */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-lg bg-pink-100 text-pink-800 text-xs font-bold tracking-wide">
            {sentence.speaker}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTextHidden(!isTextHidden)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-pink-600 px-2 py-1 rounded-md bg-slate-50 border border-slate-200/70 transition-colors"
            >
              {isTextHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isTextHidden ? 'Show Text / 문장 보기' : 'Hide Text / 문장 숨기기'}</span>
            </button>
          </div>
        </div>

        {/* English Sentence Text (font size >= 22px, stress in bold) */}
        <div className="py-1 min-h-[64px] flex items-center">
          {renderSentenceWithStress()}
        </div>

        {/* Korean Meaning (small, gray, toggleable) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <p className={`text-slate-500 transition-opacity ${isKoreanHidden ? 'opacity-0' : 'opacity-100'}`}>
            {sentence.korean}
          </p>
          <button
            onClick={() => setIsKoreanHidden(!isKoreanHidden)}
            className="text-[11px] text-slate-400 hover:text-slate-600 whitespace-nowrap ml-2"
          >
            {isKoreanHidden ? '한국어 뜻 보기' : '뜻 숨기기'}
          </button>
        </div>
      </div>

      {/* Video Control Row: Play, Loop, Speed (Buttons at least 48px tall) */}
      <div className="bg-white rounded-2xl p-3 border border-pink-100 shadow-2xs space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {/* Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            className={`min-h-[48px] h-12 rounded-xl font-semibold text-sm flex flex-col items-center justify-center transition-all ${
              isPlaying
                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/20 active:scale-95'
            }`}
          >
            <div className="flex items-center gap-1.5 leading-none">
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </div>
            <span className="text-[10px] font-normal opacity-90 leading-none mt-0.5">
              {isPlaying ? '일시정지' : '재생'}
            </span>
          </button>

          {/* Loop Button */}
          <button
            onClick={handleToggleLoop}
            className={`min-h-[48px] h-12 rounded-xl font-semibold text-sm flex flex-col items-center justify-center transition-all border ${
              isLooping
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1.5 leading-none">
              <Repeat className={`w-4 h-4 ${isLooping ? 'animate-spin' : ''}`} />
              <span>{isLooping ? 'Loop ON' : 'Loop OFF'}</span>
            </div>
            <span className="text-[10px] font-normal opacity-90 leading-none mt-0.5">
              1.5초 간격 반복
            </span>
          </button>

          {/* Playback Rate Segmented Control */}
          <div className="min-h-[48px] h-12 bg-slate-100 p-1 rounded-xl flex items-center justify-between border border-slate-200">
            {[0.5, 0.75, 1.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`flex-1 h-full rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                  playbackSpeed === rate
                    ? 'bg-white text-pink-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{rate}×</span>
                <span className="text-[9px] font-normal text-slate-400 leading-none">
                  {rate === 1.0 ? '정속' : '느림'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Record Area */}
      <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-pink-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Record & Compare / 녹음 및 비교
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {progress.recordings} recording(s) completed
          </span>
        </div>

        {/* Mic permission warning */}
        {micPermissionDenied && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mic is off. You can still listen and shadow out loud.</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                마이크 권한이 꺼져 있어도 영상을 들으며 직접 소리 내어 쉐도잉할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Big Record Button (at least 48px) */}
        <button
          onClick={handleStartRecording}
          className={`w-full min-h-[50px] h-13 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-md ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30'
              : 'bg-purple-900 hover:bg-purple-950 text-white shadow-purple-900/20 active:scale-[0.99]'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>Recording in progress... (Tap to Stop)</span>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-pink-500/30 flex items-center justify-center">
                <Mic className="w-4 h-4 text-pink-300" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold leading-tight">Record / 녹음하기</div>
                <div className="text-[10px] text-purple-200 font-normal leading-tight">
                  배우의 음성과 함께 녹음 후 1초 뒤 자동 종료
                </div>
              </div>
            </>
          )}
        </button>

        {/* Audio Playback Row: My Voice vs Original */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* My Voice */}
          <button
            onClick={handlePlayMyVoice}
            disabled={!recordedAudioUrl}
            className={`min-h-[48px] h-12 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all border ${
              !recordedAudioUrl
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                : isPlayingMyVoice
                ? 'bg-pink-100 text-pink-700 border-pink-300'
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <div className="flex items-center gap-1.5 leading-none">
              <Volume2 className="w-3.5 h-3.5 text-pink-500" />
              <span>▶ My Voice / 내 목소리</span>
            </div>
            <span className="text-[10px] font-normal opacity-80 leading-none mt-0.5">
              {recordedAudioUrl ? '녹음된 내 음성 재생' : '녹음 후 활성화'}
            </span>
          </button>

          {/* Original */}
          <button
            onClick={handlePlayOriginal}
            className="min-h-[48px] h-12 rounded-xl text-xs font-semibold flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all active:scale-98"
          >
            <div className="flex items-center gap-1.5 leading-none">
              <Play className="w-3.5 h-3.5 text-pink-600 fill-current" />
              <span>▶ Original / 원본 듣기</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500 leading-none mt-0.5">
              배우의 원본 클립 재생
            </span>
          </button>
        </div>

        {/* Optional Web Speech API Word Check */}
        {isSpeechSupported && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={handleCheckMyWords}
              disabled={isListeningSpeech}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-all ${
                isListeningSpeech
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                  : 'bg-slate-50 hover:bg-pink-50/60 text-slate-700 border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-600" />
              <span>
                {isListeningSpeech
                  ? 'Listening in en-US... 말해주세요!'
                  : 'Check My Words / 발음 단어 확인 (Web Speech)'}
              </span>
            </button>

            {speechFeedback && (
              <div className="p-2.5 rounded-lg bg-pink-50/70 border border-pink-100 text-xs text-slate-700 text-center">
                <p className="font-medium text-pink-800">{speechFeedback}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  초록색: 인식된 단어 / 밑줄: 더 크고 또렷하게 말해보세요
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Self-check (after recording) */}
      <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-2xs space-y-3">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-pink-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Self-Check / 스스로 점검하기
          </h3>
        </div>

        {/* 3 Criteria with 😀 / 🙂 / 😐 buttons */}
        <div className="space-y-2.5">
          {/* Criterion 1: Speed */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2">
            <div className="text-xs">
              <p className="font-semibold text-slate-800">
                1. Did I keep up with the speed?
              </p>
              <p className="text-[11px] text-slate-500">배우의 속도를 잘 따라갔나요?</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(['great', 'good', 'needs_work'] as SelfRating[]).map((rating) => {
                const isSelected = progress.selfCheck[0] === rating;
                const emoji = rating === 'great' ? '😀' : rating === 'good' ? '🙂' : '😐';
                return (
                  <button
                    key={rating}
                    onClick={() => handleSelfCheckRating(0, rating)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-pink-500 text-white scale-110 shadow-sm'
                        : 'bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={rating || ''}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Criterion 2: Stress */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2">
            <div className="text-xs">
              <p className="font-semibold text-slate-800">
                2. Did I stress the bold words?
              </p>
              <p className="text-[11px] text-slate-500">굵은 강세 단어에 힘을 주었나요?</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(['great', 'good', 'needs_work'] as SelfRating[]).map((rating) => {
                const isSelected = progress.selfCheck[1] === rating;
                const emoji = rating === 'great' ? '😀' : rating === 'good' ? '🙂' : '😐';
                return (
                  <button
                    key={rating}
                    onClick={() => handleSelfCheckRating(1, rating)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-pink-500 text-white scale-110 shadow-sm'
                        : 'bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={rating || ''}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Criterion 3: Intonation */}
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2">
            <div className="text-xs">
              <p className="font-semibold text-slate-800">
                3. Did my voice go up and down like the actor?
              </p>
              <p className="text-[11px] text-slate-500">배우의 높낮이(억양)를 잘 살렸나요?</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(['great', 'good', 'needs_work'] as SelfRating[]).map((rating) => {
                const isSelected = progress.selfCheck[2] === rating;
                const emoji = rating === 'great' ? '😀' : rating === 'good' ? '🙂' : '😐';
                return (
                  <button
                    key={rating}
                    onClick={() => handleSelfCheckRating(2, rating)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-pink-500 text-white scale-110 shadow-sm'
                        : 'bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={rating || ''}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer: Next ▶ Button */}
      <div className="pt-2">
        {isLastSentence ? (
          <button
            onClick={onFinishPractice}
            className="w-full min-h-[50px] h-13 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-all"
          >
            <span>Finish Practice / 연습 완료 🎉</span>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full min-h-[50px] h-13 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 active:scale-[0.98] transition-all"
          >
            <span>Next Sentence ▶ / 다음 문장</span>
          </button>
        )}
      </div>
    </div>
  );
};
