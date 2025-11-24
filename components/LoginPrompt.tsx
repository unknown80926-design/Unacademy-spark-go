
import React, { useState } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';
import { EmailIcon, LockIcon, ProfileIcon } from './Icons';

interface LoginPromptProps {
  onAuthSuccess: (user: User) => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let user: User;
      if (mode === 'signup') {
        user = await authService.signUp(name, email, password);
      } else {
        user = await authService.signIn(email, password);
      }
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => (prev === 'login' ? 'signup' : 'login'));
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  };
  
  return (
    <div className="w-full flex flex-col items-center justify-center text-center animate-fade-in p-4">
      <h2 className="text-2xl font-bold text-slate-200 mb-2">
        {mode === 'login' ? 'Welcome Back!' : 'Create an Account'}
      </h2>
      <p className="text-slate-400 mb-6">
        {mode === 'login' ? 'Sign in to continue.' : 'Get started by creating your account.'}
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm" role="alert">
                {error}
            </div>
        )}
        {mode === 'signup' && (
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <ProfileIcon className="w-5 h-5 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
        )}
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <EmailIcon className="w-5 h-5 text-slate-500" />
            </span>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
        </div>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <LockIcon className="w-5 h-5 text-slate-500" />
            </span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 pl-10 pr-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
        >
          {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
        </button>
      </form>
      
      <p className="mt-6 text-sm text-slate-400">
        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        <button onClick={toggleMode} className="font-semibold text-purple-400 hover:text-purple-300">
          {mode === 'login' ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
};

export default LoginPrompt;
