import { Sentence, SentenceProgress, ProgressStatus, SelfRating } from '../types';
import { DEFAULT_SENTENCES } from '../data/defaultSentences';

const STORAGE_KEY_SENTENCES = 'fluent_shadowing_sentences_v1';
const STORAGE_KEY_PROGRESS = 'fluent_shadowing_progress_v1';

// In-memory audio recordings cache (blobs cannot be reliably stored in localStorage)
const audioRecordingsMemory = new Map<number, string>();

let memorySentencesFallback: Sentence[] = [...DEFAULT_SENTENCES];
let memoryProgressFallback: Record<number, SentenceProgress> = {};

export function getStoredSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SENTENCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // If first time, store default sentences
    localStorage.setItem(STORAGE_KEY_SENTENCES, JSON.stringify(DEFAULT_SENTENCES));
    return DEFAULT_SENTENCES;
  } catch (err) {
    console.warn('localStorage read failed, using memory fallback:', err);
    return memorySentencesFallback;
  }
}

export function saveStoredSentences(sentences: Sentence[]): boolean {
  memorySentencesFallback = [...sentences];
  try {
    localStorage.setItem(STORAGE_KEY_SENTENCES, JSON.stringify(sentences));
    return true;
  } catch (err) {
    console.warn('localStorage write failed, stored in memory:', err);
    return false;
  }
}

export function getStoredProgress(): Record<number, SentenceProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
    return {};
  } catch (err) {
    console.warn('localStorage read failed for progress, using memory fallback:', err);
    return memoryProgressFallback;
  }
}

export function saveStoredProgress(progressMap: Record<number, SentenceProgress>): boolean {
  memoryProgressFallback = { ...progressMap };
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressMap));
    return true;
  } catch (err) {
    console.warn('localStorage write failed for progress:', err);
    return false;
  }
}

export function getSentenceProgress(sentenceId: number): SentenceProgress {
  const all = getStoredProgress();
  if (all[sentenceId]) {
    return all[sentenceId];
  }
  return {
    id: sentenceId,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
}

export function recordPlayCount(sentenceId: number): SentenceProgress {
  const all = getStoredProgress();
  const current = all[sentenceId] || {
    id: sentenceId,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };

  const updated: SentenceProgress = {
    ...current,
    plays: current.plays + 1,
  };

  all[sentenceId] = updated;
  saveStoredProgress(all);
  return updated;
}

export function recordVoiceRecording(
  sentenceId: number,
  stepNumber: number,
  audioUrl?: string
): SentenceProgress {
  const all = getStoredProgress();
  const current = all[sentenceId] || {
    id: sentenceId,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };

  const newRecordings = current.recordings + 1;
  let newStatus: ProgressStatus = current.status;

  if (stepNumber === 4) {
    newStatus = 'done';
  } else if (newStatus === 'new') {
    newStatus = 'practiced';
  }

  const updated: SentenceProgress = {
    ...current,
    recordings: newRecordings,
    status: newStatus,
  };

  all[sentenceId] = updated;
  saveStoredProgress(all);

  if (audioUrl) {
    audioRecordingsMemory.set(sentenceId, audioUrl);
  }

  return updated;
}

export function updateSelfCheck(
  sentenceId: number,
  criterionIndex: 0 | 1 | 2,
  rating: SelfRating
): SentenceProgress {
  const all = getStoredProgress();
  const current = all[sentenceId] || {
    id: sentenceId,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };

  const newSelfCheck = [...current.selfCheck] as [SelfRating, SelfRating, SelfRating];
  newSelfCheck[criterionIndex] = rating;

  const updated: SentenceProgress = {
    ...current,
    selfCheck: newSelfCheck,
  };

  all[sentenceId] = updated;
  saveStoredProgress(all);
  return updated;
}

export function getAudioRecordingUrl(sentenceId: number): string | undefined {
  return audioRecordingsMemory.get(sentenceId);
}

export function setAudioRecordingUrl(sentenceId: number, url: string) {
  // Free old URL if exists
  const oldUrl = audioRecordingsMemory.get(sentenceId);
  if (oldUrl && oldUrl.startsWith('blob:')) {
    URL.revokeObjectURL(oldUrl);
  }
  audioRecordingsMemory.set(sentenceId, url);
}

export function resetProgress() {
  memoryProgressFallback = {};
  audioRecordingsMemory.clear();
  try {
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
  } catch (err) {
    console.warn('Failed to clear progress:', err);
  }
}
