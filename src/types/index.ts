export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  start: number;
  end: number;
}

export type ProgressStatus = 'new' | 'practiced' | 'done';

export type SelfRating = 'great' | 'good' | 'needs_work' | null;

export interface SentenceProgress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfRating, SelfRating, SelfRating];
  status: ProgressStatus;
}

export type ScreenType = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export type ShadowingStepId = 1 | 2 | 3 | 4;

export interface ShadowingStepInfo {
  id: ShadowingStepId;
  nameEn: string;
  nameKo: string;
  shortDescEn: string;
  shortDescKo: string;
  defaultHideText: boolean;
}

export interface MovieSettings {
  titleEn: string;
  titleKo: string;
  releaseYear: number;
  director: string;
  screenplay: string;
  productionCompany: string;
  distributionCompany: string;
  sceneDescription: string;
  youtubeVideoTitle: string;
  youtubeChannelName: string;
  youtubeUrl: string;
  videoId: string;
  practiceStart: number;
  practiceEnd: number;
  madeBy: string;
}

export const MOVIE_SETTINGS: MovieSettings = {
  titleEn: 'The Devil Wears Prada',
  titleKo: '악마는 프라다를 입는다',
  releaseYear: 2006,
  director: 'David Frankel',
  screenplay: 'Aline Brosh McKenna',
  productionCompany: 'Fox 2000 Pictures, Dune Entertainment, Major Studio Partners',
  distributionCompany: '20th Century Fox',
  sceneDescription: "Andy's job interview with Miranda Priestly for the assistant position at Runway magazine.",
  youtubeVideoTitle: "The Devil Wears Prada (2006) – Andy’s Interview",
  youtubeChannelName: 'Movieclips',
  youtubeUrl: 'https://youtu.be/b2f2Kqt_KcE?si=hUcV7CEAvtUxJCNL',
  videoId: 'b2f2Kqt_KcE',
  practiceStart: 0,
  practiceEnd: 47,
  madeBy: '서혜솔',
};

export const ONE_LINE_CREDIT = `Clip: ${MOVIE_SETTINGS.titleEn} (${MOVIE_SETTINGS.releaseYear}), ${MOVIE_SETTINGS.distributionCompany} / ${MOVIE_SETTINGS.productionCompany} · via YouTube · For educational use only`;
