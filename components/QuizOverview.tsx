import React from 'react';

interface QuizOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  userAnswers: (string | null)[];
  currentQuestionIndex: number;
  onJumpToQuestion: (index: number) => void;
}

const QuizOverview: React.FC<QuizOverviewProps> = ({
  isOpen,
  onClose,
  totalQuestions,
  userAnswers,
  currentQuestionIndex,
  onJumpToQuestion,
}) => {
  if (!isOpen) return null;

  const getStatusClass = (index: number) => {
    if (index === currentQuestionIndex) {
      return 'bg-purple-600 border-purple-400 text-white ring-2 ring-purple-400'; // Current
    }
    if (userAnswers[index] !== null) {
      return 'bg-green-700/80 border-green-600 text-white'; // Answered
    }
    return 'bg-slate-700 hover:bg-slate-600 border-slate-600'; // Unanswered
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="overview-title"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700 flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="overview-title" className="text-2xl font-bold text-white">Quiz Overview</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close overview"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <button
              key={i}
              onClick={() => onJumpToQuestion(i)}
              className={`w-12 h-12 flex items-center justify-center rounded-md font-bold text-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-400 ${getStatusClass(
                i
              )}`}
              aria-label={`Go to question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizOverview;
