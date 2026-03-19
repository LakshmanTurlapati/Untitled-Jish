/** A kaavya/purana document stored in the library */
export interface Kaavya {
  id?: number;
  title: string;
  author?: string;
  sourceType: 'pdf' | 'pasted';
  rawText: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Reading progress for a kaavya */
export interface ReadingState {
  id?: number;
  kaavyaId: number;
  currentPage: number;
  totalPages: number;
  lastReadAt: Date;
}

/** A user's shloka interpretation with AI hints received */
export interface ShlokaInterpretation {
  id?: number;
  kaavyaId: number;
  shlokaText: string;
  userInterpretation: string;
  hintsReceived: string[];
  createdAt: Date;
}
