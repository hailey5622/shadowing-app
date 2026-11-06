import React, { useState, useRef } from 'react';
import { Sentence, MOVIE_SETTINGS } from '../types';
import { DEFAULT_SENTENCES } from '../data/defaultSentences';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Play,
  Clock,
  Download,
  Upload,
  RotateCcw,
  AlertCircle,
  Check,
  Sparkles,
} from 'lucide-react';

interface EditSentencesScreenProps {
  sentences: Sentence[];
  onSaveSentences: (newSentences: Sentence[]) => void;
  onGoBack: () => void;
}

export const EditSentencesScreen: React.FC<EditSentencesScreenProps> = ({
  sentences,
  onSaveSentences,
  onGoBack,
}) => {
  const playerRef = useRef<YouTubePlayerRef | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [speaker, setSpeaker] = useState('Andy');
  const [text, setText] = useState('');
  const [korean, setKorean] = useState('');
  const [stressInput, setStressInput] = useState('');
  const [startTime, setStartTime] = useState<string>('0.0');
  const [endTime, setEndTime] = useState<string>('3.0');

  // Import / Export JSON modal state
  const [showJsonModal, setShowJsonModal] = useState<'export' | 'import' | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Grab player current time (rounded to 0.1s)
  const handleSetStartNow = () => {
    if (playerRef.current) {
      const now = playerRef.current.getCurrentTime();
      setStartTime(now.toFixed(1));
    }
  };

  const handleSetEndNow = () => {
    if (playerRef.current) {
      const now = playerRef.current.getCurrentTime();
      setEndTime(now.toFixed(1));
    }
  };

  // Test current segment
  const handleTestSegment = () => {
    const s = parseFloat(startTime);
    const e = parseFloat(endTime);
    if (isNaN(s) || isNaN(e) || e <= s) {
      setErrorMessage('End time must be greater than start time.');
      return;
    }
    setErrorMessage(null);
    if (playerRef.current) {
      playerRef.current.playSegment(s, e, false);
    }
  };

  // Form submission: Add or Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const s = parseFloat(startTime);
    const eTime = parseFloat(endTime);

    if (!text.trim()) {
      setErrorMessage('English sentence text is required.');
      return;
    }

    if (isNaN(s) || isNaN(eTime)) {
      setErrorMessage('Please enter valid numeric start and end times.');
      return;
    }

    // Rules: start and end must be between [START] (0) and [END] (47)
    if (s < MOVIE_SETTINGS.practiceStart || eTime > MOVIE_SETTINGS.practiceEnd) {
      setErrorMessage(
        `Start and End must be between ${MOVIE_SETTINGS.practiceStart}s and ${MOVIE_SETTINGS.practiceEnd}s.`
      );
      return;
    }

    // end greater than start
    if (eTime <= s) {
      setErrorMessage('End time must be strictly greater than start time.');
      return;
    }

    const stressWords = stressInput
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    let updatedList: Sentence[] = [];

    if (editingId !== null) {
      // Update existing sentence
      updatedList = sentences.map((item) =>
        item.id === editingId
          ? {
              ...item,
              speaker: speaker.trim() || 'Speaker',
              text: text.trim(),
              korean: korean.trim(),
              stress: stressWords,
              start: Math.round(s * 10) / 10,
              end: Math.round(eTime * 10) / 10,
            }
          : item
      );
      setEditingId(null);
    } else {
      // Add new sentence
      const newId = sentences.length > 0 ? Math.max(...sentences.map((i) => i.id)) + 1 : 1;
      const newSentence: Sentence = {
        id: newId,
        speaker: speaker.trim() || 'Speaker',
        text: text.trim(),
        korean: korean.trim(),
        stress: stressWords,
        start: Math.round(s * 10) / 10,
        end: Math.round(eTime * 10) / 10,
      };
      updatedList = [...sentences, newSentence];
    }

    onSaveSentences(updatedList);
    resetForm();
  };

  const handleEditClick = (sentence: Sentence) => {
    setEditingId(sentence.id);
    setSpeaker(sentence.speaker);
    setText(sentence.text);
    setKorean(sentence.korean);
    setStressInput(sentence.stress.join(', '));
    setStartTime(sentence.start.toString());
    setEndTime(sentence.end.toString());
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: number) => {
    const next = sentences.filter((s) => s.id !== id);
    onSaveSentences(next);
    if (editingId === id) {
      resetForm();
    }
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...sentences];
    const temp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = temp;
    onSaveSentences(next);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === sentences.length - 1) return;
    const next = [...sentences];
    const temp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = temp;
    onSaveSentences(next);
  };

  const resetForm = () => {
    setEditingId(null);
    setText('');
    setKorean('');
    setStressInput('');
    setStartTime('0.0');
    setEndTime('3.0');
    setErrorMessage(null);
  };

  // Warnings
  const sNum = parseFloat(startTime) || 0;
  const eNum = parseFloat(endTime) || 0;
  const segmentDuration = Math.max(0, eNum - sNum);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const showDurationWarning = segmentDuration > 4.0;
  const showWordWarning = wordCount > 12;

  // Export JSON
  const handleOpenExport = () => {
    setJsonText(JSON.stringify(sentences, null, 2));
    setCopySuccess(false);
    setShowJsonModal('export');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Import JSON
  const handleOpenImport = () => {
    setJsonText('');
    setErrorMessage(null);
    setShowJsonModal('import');
  };

  const handleApplyImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of sentences.');
      }
      onSaveSentences(parsed);
      setShowJsonModal(null);
    } catch (e: any) {
      setErrorMessage(`Invalid JSON: ${e.message}`);
    }
  };

  const handleResetToSceneDefaults = () => {
    if (confirm('Load the 10 default interview sentences from The Devil Wears Prada?')) {
      onSaveSentences(DEFAULT_SENTENCES);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all sentences? You can test the empty screen state.')) {
      onSaveSentences([]);
      resetForm();
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-pink-100 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back / 돌아가기</span>
        </button>
        <h2 className="text-sm font-bold text-slate-900">Edit Sentences / 문장 편집</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenExport}
            className="p-1.5 text-slate-600 hover:text-pink-600 bg-white rounded-lg border border-pink-100 text-xs flex items-center gap-1"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleOpenImport}
            className="p-1.5 text-slate-600 hover:text-pink-600 bg-white rounded-lg border border-pink-100 text-xs flex items-center gap-1"
            title="Import JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* Video Player at top */}
      <YouTubePlayer ref={playerRef} />

      {/* Add / Edit Form Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-pink-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-pink-600" />
            <span>
              {editingId !== null ? `Edit Sentence #${editingId}` : 'Add Sentence / 문장 추가'}
            </span>
          </h3>
          {editingId !== null && (
            <button
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel Edit / 취소
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
          {/* Speaker & Stress words */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Speaker / 화자
              </label>
              <select
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-pink-500 focus:outline-none"
              >
                <option value="Miranda">Miranda (편집장 미란다)</option>
                <option value="Andy">Andy (지원자 앤디)</option>
                <option value="Nigel">Nigel (나이젤)</option>
                <option value="Emily">Emily (에밀리)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Stress Words / 강세 단어 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={stressInput}
                onChange={(e) => setStressInput(e.target.value)}
                placeholder="who, you or name, Andy"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* English Text */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              English Sentence / 영어 문장 (3–12 words)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Who are you?"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Korean Meaning */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Korean Meaning / 한국어 뜻
            </label>
            <input
              type="text"
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              placeholder="e.g. 당신은 누구죠?"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Start and End Times with Set Start/End = now buttons */}
          <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Start (s)</label>
                  <button
                    type="button"
                    onClick={handleSetStartNow}
                    className="text-[10px] text-pink-600 hover:text-pink-800 font-bold underline"
                  >
                    Set Start = now
                  </button>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="47"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono text-center focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">End (s)</label>
                  <button
                    type="button"
                    onClick={handleSetEndNow}
                    className="text-[10px] text-pink-600 hover:text-pink-800 font-bold underline"
                  >
                    Set End = now
                  </button>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="47"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-mono text-center focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Test segment playback button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-mono">
                Duration: {segmentDuration.toFixed(1)}s · {wordCount} words
              </span>
              <button
                type="button"
                onClick={handleTestSegment}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-800 font-semibold text-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test / 구간 재생 테스트</span>
              </button>
            </div>
          </div>

          {/* Gentle Warning if > 4s or > 12 words */}
          {(showDurationWarning || showWordWarning) && (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] flex items-start gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Learner Tip: </span>
                {showDurationWarning && 'This segment is longer than 4.0s. '}
                {showWordWarning && 'This sentence has more than 12 words. '}
                Shorter chunks are much easier for high school students to shadow accurately!
              </div>
            </div>
          )}

          {/* Submit Button (at least 48px tall) */}
          <button
            type="submit"
            className="w-full min-h-[48px] h-12 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>
              {editingId !== null ? 'Save Changes / 수정 완료' : 'Add Sentence / 문장 추가하기'}
            </span>
          </button>
        </form>
      </div>

      {/* Current Sentences List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Current Sentences ({sentences.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToSceneDefaults}
              className="text-[11px] text-purple-700 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Clip Defaults</span>
            </button>
            {sentences.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] text-rose-600 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {sentences.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-pink-100 text-slate-500 text-xs">
            No sentences yet. Tap Edit Sentences to add some.
          </div>
        ) : (
          sentences.map((item, idx) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-3 border transition-all ${
                editingId === item.id ? 'border-pink-500 ring-2 ring-pink-100' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-purple-700">
                      {item.speaker}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.start}s – {item.end}s
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 leading-snug">
                    {item.text}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.korean}</p>
                  {item.stress && item.stress.length > 0 && (
                    <p className="text-[11px] text-pink-600 font-medium mt-1">
                      Stress: {item.stress.join(', ')}
                    </p>
                  )}
                </div>

                {/* Action buttons: Test, Edit, Move up/down, Delete */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (playerRef.current) {
                          playerRef.current.playSegment(item.start, item.end, false);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded"
                      title="Play segment"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                      title="Edit sentence"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === sentences.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* JSON Export/Import Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 shadow-xl border border-pink-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {showJsonModal === 'export' ? 'Export Sentences (JSON)' : 'Import Sentences (JSON)'}
              </h3>
              <button
                onClick={() => setShowJsonModal(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close / 닫기
              </button>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              readOnly={showJsonModal === 'export'}
              placeholder="Paste JSON array here..."
              rows={8}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2">
              {showJsonModal === 'export' ? (
                <button
                  onClick={handleCopyJson}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
                </button>
              ) : (
                <button
                  onClick={handleApplyImport}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Apply Import / 가져오기</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
