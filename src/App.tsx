import React, { useState, useEffect, useRef } from 'react';
import { Sentence, SentenceProgress, ScreenType, MOVIE_SETTINGS } from './types';
import {
  getStoredSentences,
  saveStoredSentences,
  getStoredProgress,
  resetProgress,
} from './services/storage';
import { DEFAULT_SENTENCES } from './data/defaultSentences';
import { StartScreen } from './components/StartScreen';
import { SentenceListScreen } from './components/SentenceListScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { EditSentencesScreen } from './components/EditSentencesScreen';
import { FinishScreen } from './components/FinishScreen';
import { YouTubePlayerRef } from './components/YouTubePlayer';
import { Sparkles, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('start');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [progressMap, setProgressMap] = useState<Record<number, SentenceProgress>>({});
  const listPlayerRef = useRef<YouTubePlayerRef | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedSentences = getStoredSentences();
    setSentences(loadedSentences);
    setProgressMap(getStoredProgress());
  }, []);

  const refreshProgress = () => {
    setProgressMap(getStoredProgress());
  };

  const handleSaveSentences = (newSentences: Sentence[]) => {
    setSentences(newSentences);
    saveStoredSentences(newSentences);
    if (currentSentenceIndex >= newSentences.length) {
      setCurrentSentenceIndex(Math.max(0, newSentences.length - 1));
    }
  };

  const handleLoadDefaultSentences = () => {
    handleSaveSentences(DEFAULT_SENTENCES);
  };

  // Navigation transitions
  const handleStartPractice = () => {
    if (sentences.length === 0) {
      setCurrentScreen('list');
    } else {
      setCurrentSentenceIndex(0);
      setCurrentScreen('practice');
    }
  };

  const handleSelectSentence = (sentence: Sentence, index: number) => {
    setCurrentSentenceIndex(index);
    setCurrentScreen('practice');
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex((prev) => prev + 1);
    } else {
      setCurrentScreen('finish');
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex((prev) => prev - 1);
    }
  };

  const currentSentence = sentences[currentSentenceIndex] || sentences[0];
  const currentSentenceProg: SentenceProgress = currentSentence
    ? progressMap[currentSentence.id] || {
        id: currentSentence.id,
        plays: 0,
        recordings: 0,
        selfCheck: [null, null, null],
        status: 'new' as const,
      }
    : {
        id: 0,
        plays: 0,
        recordings: 0,
        selfCheck: [null, null, null],
        status: 'new' as const,
      };

  return (
    <div className="min-h-screen bg-[#FAF5F7] text-slate-800 flex flex-col items-center">
      {/* Outer Mobile Shell Container (max-w-[480px] centered on larger viewports) */}
      <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-white/70 shadow-xl border-x border-pink-100/60 relative">
        {/* Top Runway-chic Navigation Bar */}
        <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md px-4 py-3 border-b border-pink-100/80 flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen('start')}
            className="flex items-center gap-2 group text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center font-editorial font-bold text-base shadow-sm">
              F
            </div>
            <div>
              <span className="font-editorial font-bold text-sm tracking-tight text-slate-900 group-hover:text-pink-600 transition-colors block leading-tight">
                Fluent Shadowing
              </span>
              <span className="text-[10px] text-pink-600 font-semibold tracking-wide uppercase leading-tight block">
                The Devil Wears Prada
              </span>
            </div>
          </button>

          {/* Quick Nav Badges */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {currentScreen !== 'start' && (
              <button
                onClick={() => setCurrentScreen('list')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  currentScreen === 'list'
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Sentence List"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sentences</span>
              </button>
            )}

            {currentScreen !== 'edit' && (
              <button
                onClick={() => setCurrentScreen('edit')}
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                title="Edit Sentences"
              >
                <span className="text-[11px]">Edit / 문장편집</span>
              </button>
            )}
          </div>
        </header>

        {/* Screen Routing */}
        <main className="flex-1 px-4 py-3">
          {currentScreen === 'start' && (
            <StartScreen
              onStart={handleStartPractice}
              onEditSentences={() => setCurrentScreen('edit')}
              sentenceCount={sentences.length}
            />
          )}

          {currentScreen === 'list' && (
            <SentenceListScreen
              sentences={sentences}
              progressMap={progressMap}
              onSelectSentence={handleSelectSentence}
              onGoToEdit={() => setCurrentScreen('edit')}
              onGoToStart={() => setCurrentScreen('start')}
              onLoadDefaultSentences={handleLoadDefaultSentences}
              playerRef={listPlayerRef}
            />
          )}

          {currentScreen === 'practice' && currentSentence && (
            <PracticeScreen
              sentence={currentSentence}
              index={currentSentenceIndex}
              totalSentences={sentences.length}
              progress={currentSentenceProg}
              onNext={handleNextSentence}
              onPrev={handlePrevSentence}
              onGoToList={() => setCurrentScreen('list')}
              onFinishPractice={() => setCurrentScreen('finish')}
              onProgressUpdated={refreshProgress}
            />
          )}

          {currentScreen === 'practice' && !currentSentence && (
            <div className="text-center py-12 space-y-4">
              <p className="text-slate-600 font-medium">
                No sentences yet. Tap Edit Sentences to add some.
              </p>
              <button
                onClick={() => setCurrentScreen('edit')}
                className="px-4 py-2 bg-pink-600 text-white rounded-xl text-sm"
              >
                Go to Edit Sentences
              </button>
            </div>
          )}

          {currentScreen === 'edit' && (
            <EditSentencesScreen
              sentences={sentences}
              onSaveSentences={handleSaveSentences}
              onGoBack={() => setCurrentScreen(sentences.length > 0 ? 'list' : 'start')}
            />
          )}

          {currentScreen === 'finish' && (
            <FinishScreen
              sentences={sentences}
              progressMap={progressMap}
              onPracticeSentence={(s, idx) => {
                setCurrentSentenceIndex(idx);
                setCurrentScreen('practice');
              }}
              onRestartAll={() => {
                setCurrentSentenceIndex(0);
                setCurrentScreen('practice');
              }}
              onGoHome={() => setCurrentScreen('start')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
