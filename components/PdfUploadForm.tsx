
import React, { useState, useRef } from 'react';
import { UploadIcon } from './Icons';
import { QuestionType } from '../types';

interface PdfUploadFormProps {
  onGenerate: (
      file: File, 
      numQuestions: number, 
      quizName: string, 
      difficulty: string, 
      timeLimit: number,
      questionType: QuestionType,
      examContext: string
    ) => void;
  error: string | null;
}

const PdfUploadForm: React.FC<PdfUploadFormProps> = ({ onGenerate, error }) => {
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [quizName, setQuizName] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [questionType, setQuestionType] = useState<QuestionType>('MCQ');
  const [examContext, setExamContext] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if(e.dataTransfer.files[0].type === 'application/pdf') {
        setFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && quizName.trim()) {
      const minutes = timeLimit ? parseInt(timeLimit, 10) : 0;
      onGenerate(file, numQuestions, quizName.trim(), difficulty, minutes, questionType, examContext);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        
        {/* File Upload Area */}
        <div 
          className={`w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-400 bg-slate-700' : 'border-slate-600 hover:border-slate-500'}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            required
          />
          <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
            <UploadIcon className="w-12 h-12" />
            {file ? (
              <p className="font-semibold text-purple-300">{file.name}</p>
            ) : (
              <div>
                <p className="font-semibold">Drag & drop your PDF here</p>
                <p className="text-sm">or click to select a file</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Exam Context Prompt */}
        <div>
           <label htmlFor="examContext" className="block text-sm font-medium text-slate-300 mb-2">
             Exam Focus / Instructions <span className="text-purple-400 text-xs">(AI uses this to style answers)</span>
           </label>
           <textarea
             id="examContext"
             value={examContext}
             onChange={(e) => setExamContext(e.target.value)}
             placeholder="e.g. CBSE Class 10 Board Exam, strict marking, focus on keywords..."
             rows={2}
             className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm"
           />
        </div>

        <div>
          <label htmlFor="quizName" className="block text-sm font-medium text-slate-300 mb-2">
            Quiz Name
          </label>
          <input
            type="text"
            id="quizName"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="e.g., Chapter 1: Chemical Reactions"
            className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="questionType" className="block text-sm font-medium text-slate-300 mb-2">
                Question Type
              </label>
              <select
                id="questionType"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              >
                <option value="MCQ">Multiple Choice (MCQs)</option>
                <option value="FillBlanks">Fill in the Blanks</option>
                <option value="VeryShort">Very Short Answer</option>
                <option value="Short">Short Answer</option>
                <option value="Long">Long Answer</option>
                <option value="CaseBased">Case Based</option>
                <option value="ExtractBased">Extract Based</option>
              </select>
            </div>

            <div>
              <label htmlFor="numQuestions" className="block text-sm font-medium text-slate-300 mb-2">
                No. of Questions
              </label>
              <input
                type="number"
                id="numQuestions"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))}
                min="1"
                max="50"
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                required
              />
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-slate-300 mb-2">
                Timer (Minutes)
                </label>
                <input
                type="number"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                min="0"
                max="180"
                placeholder="Optional"
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
            </div>
        </div>

        <button
          type="submit"
          disabled={!file || !quizName.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Generate Quiz
        </button>
      </form>
    </div>
  );
};

export default PdfUploadForm;
