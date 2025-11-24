
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { ShareIcon } from './Icons';

interface ResultsViewProps {
  quizData: QuizQuestion[];
  userAnswers: (string | null)[];
  quizName: string;
  onReset: () => void;
  onBrowse: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ quizData, userAnswers, quizName, onReset, onBrowse }) => {
  const [isCopied, setIsCopied] = useState(false);

  const score = userAnswers.reduce((acc, answer, index) => {
    if (answer === quizData[index].correctAnswer) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const percentage = Math.round((score / quizData.length) * 100);

  const handleShare = () => {
    const shareText = `I scored ${score}/${quizData.length} (${percentage}%) on the "${quizName}" quiz on Unacademy Spark Pro! 🧠`;
    navigator.clipboard.writeText(shareText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy results: ', err);
    });
  };

  return (
    <div className="w-full text-center flex flex-col items-center animate-fade-in">
      <h2 className="text-3xl font-bold text-purple-400 mb-2">Quiz Complete!</h2>
      <p className="text-slate-300 text-lg mb-6">Here's how you did on "{quizName}":</p>
      
      <div className="bg-slate-900 rounded-full w-40 h-40 flex items-center justify-center border-8 border-purple-500 mb-8">
        <div className="text-center">
            <span className="text-4xl font-extrabold text-white">{score}</span>
            <span className="text-xl text-slate-400">/{quizData.length}</span>
        </div>
      </div>

      <p className="text-2xl font-bold mb-8">You scored {percentage}%</p>
      
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onReset}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
        >
          Create Another Quiz
        </button>
        <button
          onClick={onBrowse}
          className="w-full bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-all duration-300"
        >
          Browse Quizzes
        </button>
        <button
          onClick={handleShare}
          className="w-full bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isCopied ? (
            '✅ Copied!'
          ) : (
            <>
              <ShareIcon className="w-5 h-5" />
              Share Results
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResultsView;