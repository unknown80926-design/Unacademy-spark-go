
import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { QuizQuestion, AppState, SavedQuiz, User, QuestionType } from './types';
import { extractTextFromPdf, generateQuiz } from './services/geminiService';
import * as quizStorage from './services/quizStorageService';
import * as authService from './services/authService';
import BottomNav from './components/BottomNav';


const PdfUploadForm = lazy(() => import('./components/PdfUploadForm'));
const QuizView = lazy(() => import('./components/QuizView'));
const ResultsView = lazy(() => import('./components/ResultsView'));
const LoadingIndicator = lazy(() => import('./components/LoadingIndicator'));
const BrowseQuizzes = lazy(() => import('./components/BrowseQuizzes'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const QuizOverview = lazy(() => import('./components/QuizOverview'));


const LOCAL_STORAGE_KEY = 'pdfQuizProgress';

// Default Guest User since we removed login
const GUEST_USER: User = {
    id: 'guest_user',
    name: 'Student',
    email: 'guest@student.com',
    picture: 'https://api.dicebear.com/8.x/notionists/svg?seed=Student'
};

const SimpleSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center text-slate-400">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
        <h2 className="text-xl font-semibold mt-6 text-slate-300">Loading...</h2>
    </div>
);


export default function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [currentQuizName, setCurrentQuizName] = useState('');
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizExpiryTime, setQuizExpiryTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Always logged in as Guest
  const user = GUEST_USER;
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);

  // Load saved quiz progress
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedProgress) {
        const { quizData, userAnswers, currentQuestionIndex, quizName, quizExpiryTime } = JSON.parse(savedProgress);
        if (quizData && userAnswers && quizName) {
          setQuizData(quizData);
          setUserAnswers(userAnswers);
          setCurrentQuestionIndex(currentQuestionIndex || 0);
          setCurrentQuizName(quizName);
          setQuizExpiryTime(quizExpiryTime || null);
          setAppState('quiz');
        }
      }
    } catch (e) {
      console.error("Failed to load quiz progress", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Save quiz progress
  useEffect(() => {
    if (appState === 'quiz' && quizData.length > 0) {
      const progress = {
        quizData,
        userAnswers,
        currentQuestionIndex,
        quizName: currentQuizName,
        quizExpiryTime
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [appState, quizData, userAnswers, currentQuestionIndex, currentQuizName, quizExpiryTime]);

  const handleGenerateQuiz = useCallback(async (
      file: File, 
      numQuestions: number, 
      quizName: string, 
      difficulty: string, 
      timeLimit: number,
      questionType: QuestionType,
      examContext: string
    ) => {
    
    setAppState('loading');
    setError(null);
    try {
      const pdfText = await extractTextFromPdf(file);
      const questions = await generateQuiz(pdfText, numQuestions, difficulty, questionType, examContext);
      
      setQuizData(questions);
      setCurrentQuizName(quizName);
      setUserAnswers(new Array(questions.length).fill(null));
      setCurrentQuestionIndex(0);
      
      const expiry = timeLimit > 0 ? Date.now() + (timeLimit * 60 * 1000) : null;
      setQuizExpiryTime(expiry);

      setAppState('quiz');
      quizStorage.saveQuiz(quizName, questions, user, difficulty, timeLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState('setup');
    }
  }, [user]);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState('results');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setQuizData([]);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentQuizName('');
    setQuizExpiryTime(null);
    setError(null);
    setAppState('setup');
  };
  
  const handleStartQuiz = (quiz: SavedQuiz) => {
    setQuizData(quiz.questions);
    setCurrentQuizName(quiz.name);
    setUserAnswers(new Array(quiz.questions.length).fill(null));
    setCurrentQuestionIndex(0);
    
    if (quiz.timeLimit && quiz.timeLimit > 0) {
        setQuizExpiryTime(Date.now() + (quiz.timeLimit * 60 * 1000));
    } else {
        setQuizExpiryTime(null);
    }

    setAppState('quiz');
  };

  const handleTimeUp = () => {
    setAppState('results');
  };

  // No logout logic needed for guest mode, just reset to browse
  const handleLogout = () => {
    setAppState('browse');
  };

  const handleNavigate = (page: AppState) => {
    if (page === 'setup') {
      resetQuiz();
    } else {
      setAppState(page);
    }
  };

  const handleToggleOverview = () => {
    setIsOverviewOpen(prev => !prev);
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsOverviewOpen(false); 
  };

  const renderContent = () => {
    // Direct access logic, no login prompt
    switch (appState) {
      case 'setup':
        return <PdfUploadForm onGenerate={handleGenerateQuiz} error={error} />;
      case 'loading':
        return <LoadingIndicator estimatedTime={15} />;
      case 'quiz':
        if (quizData.length > 0) {
          return (
            <>
              <QuizView
                question={quizData[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={quizData.length}
                userAnswer={userAnswers[currentQuestionIndex]}
                onAnswerSelect={handleAnswerSelect}
                onNext={handleNextQuestion}
                onBack={handlePreviousQuestion}
                onToggleOverview={handleToggleOverview}
                expiryTime={quizExpiryTime}
                onTimeUp={handleTimeUp}
              />
              <QuizOverview
                isOpen={isOverviewOpen}
                onClose={handleToggleOverview}
                totalQuestions={quizData.length}
                userAnswers={userAnswers}
                currentQuestionIndex={currentQuestionIndex}
                onJumpToQuestion={handleJumpToQuestion}
              />
            </>
          );
        }
        resetQuiz();
        return <PdfUploadForm onGenerate={handleGenerateQuiz} error={"Quiz data not found. Please create a new quiz."} />;
      case 'results':
        return (
          <ResultsView
            quizData={quizData}
            userAnswers={userAnswers}
            quizName={currentQuizName}
            onReset={resetQuiz}
            onBrowse={() => setAppState('browse')}
          />
        );
      case 'browse':
        return <BrowseQuizzes onStartQuiz={handleStartQuiz} />;
      case 'profile':
        return <ProfilePage user={user} onLogout={handleLogout} onStartQuiz={handleStartQuiz} />;
      default:
        return <PdfUploadForm onGenerate={handleGenerateQuiz} error={error} />;
    }
  };

  return (
    <div className="bg-slate-800 text-slate-200 min-h-screen font-sans flex flex-col items-center">
      <main className="w-full max-w-2xl mx-auto p-4 sm:p-6 flex-grow flex flex-col items-center justify-center relative pb-24">
        <header className="w-full text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                Unacademy Spark Pro
            </h1>
            <p className="text-slate-400 mt-2">Board-Ready Exam Generator</p>
        </header>
        <Suspense fallback={<SimpleSpinner />}>
          {renderContent()}
        </Suspense>
      </main>
      <BottomNav activePage={appState} onNavigate={handleNavigate} />
    </div>
  );
}
