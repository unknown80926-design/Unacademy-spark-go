import React, { useState, useEffect } from 'react';
import { User, SavedQuiz } from '../types';
import { LogoutIcon } from './Icons';
import * as quizStorage from '../services/quizStorageService';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onStartQuiz: (quiz: SavedQuiz) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onStartQuiz }) => {
  const [myQuizzes, setMyQuizzes] = useState<SavedQuiz[]>([]);

  useEffect(() => {
    setMyQuizzes(quizStorage.getQuizzesByCreator(user.id));
  }, [user.id]);

  return (
    <div className="w-full flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={user.picture}
            alt="User avatar"
            className="w-16 h-16 rounded-full border-2 border-purple-400"
          />
          <div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-300 transition-colors"
        >
          <LogoutIcon className="w-5 h-5" />
          Logout
        </button>
      </div>

      <h3 className="text-xl font-bold mb-4 text-purple-300">My Quizzes</h3>
      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        {myQuizzes.length > 0 ? (
          myQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className="bg-slate-700 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h4 className="font-bold text-white">{quiz.name}</h4>
                <p className="text-sm text-slate-400">{quiz.questions.length} questions</p>
              </div>
              <button
                onClick={() => onStartQuiz(quiz)}
                className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Start
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-400 py-10">
            <p className="font-semibold">You haven't created any quizzes yet.</p>
            <p className="text-sm">Click the 'Create' tab to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;