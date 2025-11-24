
export type QuestionType = 
  | 'MCQ' 
  | 'FillBlanks' 
  | 'VeryShort' 
  | 'Short' 
  | 'Long' 
  | 'CaseBased' 
  | 'ExtractBased';

export interface QuizQuestion {
  type: QuestionType;
  question: string;
  options?: string[]; // Only for MCQ
  correctAnswer?: string; // For MCQ and FillBlanks
  modelAnswer?: string; // For Subjective types (Topper answer)
  context?: string; // For Case/Extract based
  explanation?: string; // General concept explanation
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface SavedQuiz {
  id: string;
  name: string;
  questions: QuizQuestion[];
  creatorId: string;
  creatorName: string;
  difficulty?: string;
  timeLimit?: number;
  questionType?: string;
}

export interface EvaluationResult {
  score: number;
  maxMarks: number;
  mistakes: string[];
  feedback: string;
}

export type AppState = 'setup' | 'loading' | 'quiz' | 'results' | 'browse' | 'profile';
