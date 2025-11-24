
import React, { useState, useEffect, useMemo } from 'react';
import { SavedQuiz } from '../types';
import * as quizStorage from '../services/quizStorageService';
import { ProfileIcon } from './Icons';

interface BrowseQuizzesProps {
  onStartQuiz: (quiz: SavedQuiz) => void;
}

const BrowseQuizzes: React.FC<BrowseQuizzesProps> = ({ onStartQuiz }) => {
  const [allQuizzes, setAllQuizzes] = useState<SavedQuiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setAllQuizzes(quizStorage.getQuizzes());
  }, []);

  const filteredQuizzes = useMemo(() => {
    if (!searchQuery) {
      return allQuizzes;
    }
    return allQuizzes.filter(quiz =>
      quiz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.creatorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allQuizzes, searchQuery]);

  return (
    <div className="w-full flex flex-col h-full animate-fade-in">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by quiz name or creator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
        />
      </div>
      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className="bg-slate-700 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-white">{quiz.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                        <ProfileIcon className="w-4 h-4" />
                        {quiz.creatorName}
                    </span>
                    <span className="text-slate-500 hidden sm:inline">&#8226;</span>
                    <span>{quiz.questions.length} Qs</span>
                    {quiz.difficulty && (
                        <>
                            <span className="text-slate-500">&#8226;</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                                quiz.difficulty === 'Easy' ? 'bg-green-900 text-green-200' :
                                quiz.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-200' :
                                quiz.difficulty === 'Hard' ? 'bg-red-900 text-red-200' :
                                'bg-purple-900 text-purple-200'
                            }`}>
                                {quiz.difficulty}
                            </span>
                        </>
                    )}
                    {quiz.timeLimit && quiz.timeLimit > 0 && (
                        <>
                             <span className="text-slate-500">&#8226;</span>
                             <span>⏱ {quiz.timeLimit}m</span>
                        </>
                    )}
                </div>
              </div>
              <button
                onClick={() => onStartQuiz(quiz)}
                className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors shrink-0 ml-2"
              >
                Start
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-400 py-10">
            <p className="font-semibold">No Quizzes Found</p>
            <p className="text-sm">
                {allQuizzes.length > 0 ? "Try a different search term." : "Create a quiz to see it here!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseQuizzes;
