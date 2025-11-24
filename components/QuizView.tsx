
import React, { useEffect, useState, useRef } from 'react';
import { QuizQuestion, EvaluationResult } from '../types';
import { BackArrowIcon, GridIcon, NextArrowIcon, UploadIcon } from './Icons';
import { evaluateAnswer } from '../services/geminiService';

interface QuizViewProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  userAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
  onNext: () => void;
  onBack: () => void;
  onToggleOverview: () => void;
  expiryTime: number | null;
  onTimeUp: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  userAnswer, 
  onAnswerSelect, 
  onNext, 
  onBack, 
  onToggleOverview,
  expiryTime,
  onTimeUp
}) => {
  const hasAnswered = userAnswer !== null;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showMistakes, setShowMistakes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSubjective = ['Short', 'VeryShort', 'Long', 'CaseBased', 'ExtractBased'].includes(question.type);

  // Reset state when question changes
  useEffect(() => {
    setTextInput(question.type === 'FillBlanks' && userAnswer ? userAnswer : '');
    setSelectedFile(null);
    setEvaluation(null);
    setShowModelAnswer(false);
    setShowMistakes(false);
    setIsEvaluating(false);
  }, [question, userAnswer]);

  useEffect(() => {
    if (!expiryTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = Math.floor((expiryTime - now) / 1000);
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
        onAnswerSelect(textInput.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndEvaluate = async () => {
      if (!selectedFile) return;
      
      setIsEvaluating(true);
      try {
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            
            // Determine max marks based on type (heuristic)
            const maxMarks = question.type === 'VeryShort' ? 2 : question.type === 'Short' ? 3 : 5;

            try {
                const result = await evaluateAnswer(question.question, question.modelAnswer || '', base64String, maxMarks);
                setEvaluation(result);
                onAnswerSelect("Uploaded Answer"); // Mark as answered
                setShowMistakes(true); // Auto show mistakes initially
            } catch (err) {
                alert("Failed to evaluate answer. Please ensure the image is clear.");
            } finally {
                setIsEvaluating(false);
            }
        };
      } catch (e) {
          setIsEvaluating(false);
      }
  };

  const renderQuestionContent = () => {
      // For MCQ and FillBlanks, input is below. For Subjective, upload button is here in header.
      return (
        <div className="relative p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-lg mb-6 transform transition-all hover:border-slate-600">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                        Question {questionNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-purple-300 border border-slate-600 shadow-sm">
                        {question.type}
                    </span>
                </div>
                
                {/* Subjective Upload Button in Corner */}
                {isSubjective && !evaluation && (
                    <button 
                        onClick={() => document.getElementById('answer-upload')?.click()}
                        disabled={isEvaluating}
                        className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-lg shadow-md transition-all text-sm font-bold transform hover:scale-105 active:scale-95"
                    >
                        <UploadIcon className="w-4 h-4" />
                        {selectedFile ? 'Change File' : 'Upload Answer'}
                    </button>
                )}
            </div>
            
            <p className="text-xl sm:text-2xl text-white font-medium leading-relaxed">
                {question.question}
            </p>

            {question.context && (
                <div className="mt-4 p-4 bg-slate-900/60 rounded-lg border-l-4 border-purple-500 text-sm text-slate-300 italic">
                    "{question.context}"
                </div>
            )}
        </div>
      );
  };

  const renderSubjectiveFeedback = () => {
    if (!isSubjective) return null;

    return (
        <div className="space-y-6">
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="answer-upload"
            />
            
            {/* Selected File & Analyze Action */}
            {selectedFile && !evaluation && (
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-900/30 p-2 rounded-lg">
                             <UploadIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Answer File Selected</p>
                            <p className="text-xs text-slate-400">{selectedFile.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleUploadAndEvaluate}
                        disabled={isEvaluating}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg transform active:scale-95"
                    >
                        {isEvaluating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Analyzing...
                            </>
                        ) : (
                            'Analyze Marks'
                        )}
                    </button>
                </div>
            )}

            {/* Evaluation Report */}
            {evaluation && (
                <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden animate-slide-up shadow-2xl">
                    <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h3 className="font-bold text-xl text-white">Evaluation Report</h3>
                            <p className="text-slate-400 text-sm">AI Examiner Feedback</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-600 flex flex-col items-end">
                                <span className="text-xs text-slate-400 uppercase font-bold">Marks Scored</span>
                                <span className={`text-2xl font-extrabold ${evaluation.score === evaluation.maxMarks ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {evaluation.score} <span className="text-sm text-slate-500">/ {evaluation.maxMarks}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <button 
                             onClick={() => setShowMistakes(!showMistakes)}
                             className="text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-2 transition"
                        >
                            {showMistakes ? '▼ Hide Mistakes' : '▶ Show Mistakes where marks were cut'}
                        </button>

                        {showMistakes && evaluation.mistakes.length > 0 && (
                            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 animate-fade-in">
                                <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    Areas for Improvement
                                </h4>
                                <ul className="space-y-2">
                                    {evaluation.mistakes.map((mistake, i) => (
                                        <li key={i} className="text-slate-300 text-sm flex gap-2">
                                            <span className="text-red-500 font-bold">•</span>
                                            {mistake}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {evaluation.feedback && (
                            <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4">
                                <h4 className="text-purple-400 font-bold mb-2">Examiner's Note</h4>
                                <p className="text-slate-300 text-sm italic leading-relaxed">"{evaluation.feedback}"</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Topper Answer Toggle in Footer */}
                    <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700 flex justify-center">
                        <button 
                            onClick={() => setShowModelAnswer(!showModelAnswer)}
                            className="text-purple-300 hover:text-white font-semibold underline underline-offset-4 decoration-purple-500/50 hover:decoration-purple-500 transition-all"
                        >
                            {showModelAnswer ? 'Hide Topper Answer' : 'Reveal Topper Answer'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Topper Answer Sheet */}
            {showModelAnswer && question.modelAnswer && (
                 <div className="mt-6 animate-slide-up relative max-w-3xl mx-auto">
                     <div className="bg-white text-slate-900 rounded-sm shadow-xl overflow-hidden relative min-h-[400px]">
                        {/* Header */}
                        <div className="h-14 border-b-2 border-slate-200 flex items-center px-8 justify-between bg-slate-50">
                            <span className="font-serif font-bold text-slate-500 uppercase tracking-widest text-xs">CBSE Board Answer Sheet</span>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                <span className="text-red-600 font-bold font-serif">Top Scorer</span>
                            </div>
                        </div>
                        
                        {/* Paper Body */}
                        <div className="relative w-full h-full p-8 sm:p-10 bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:100%_2rem]">
                            {/* Margin Line */}
                            <div className="absolute top-0 left-12 bottom-0 w-0.5 bg-red-400/40 h-full z-0"></div>
                            
                            <div className="relative z-10 font-serif text-lg leading-[2rem] whitespace-pre-wrap pl-8 text-slate-800" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                {question.modelAnswer}
                            </div>
                        </div>
                     </div>
                     {/* Paper Stack Effect */}
                     <div className="absolute -bottom-2 left-2 right-2 h-4 bg-white/50 rounded-sm -z-10 shadow-lg transform rotate-1"></div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="w-full flex flex-col justify-between h-full pb-20 relative">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes pop {
          0% { transform: scale(0.98); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .animate-pop {
          animation: pop 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-800/95 backdrop-blur-sm z-20 py-2 border-b border-transparent transition-all">
        <button onClick={onToggleOverview} className="p-2 rounded-md hover:bg-slate-700 transition-colors">
          <GridIcon className="w-6 h-6 text-slate-400" />
        </button>
        {timeLeft !== null && (
          <div className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-purple-300'}`}>
              ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Main Content Area with Key for Transition */}
      <div key={questionNumber} className="flex-grow overflow-y-auto pr-1">
        
        {/* Question Area */}
        <div className="animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            {renderQuestionContent()}
        </div>

        {/* Input Areas */}
        <div className="mt-4">
            {question.type === 'MCQ' && question.options && (
                <div className="space-y-3">
                {question.options.map((option, index) => {
                    let btnClass = "bg-slate-700 hover:bg-slate-600 border-slate-600";
                    let feedbackClass = "";
                    if (hasAnswered) {
                        if (option === question.correctAnswer) {
                            btnClass = "bg-green-600/20 border-green-500 text-green-100 ring-1 ring-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                            feedbackClass = "animate-pop";
                        }
                        else if (option === userAnswer) {
                            btnClass = "bg-red-600/20 border-red-500 text-red-100 ring-1 ring-red-500";
                        }
                        else btnClass = "bg-slate-800 opacity-50 border-slate-700";
                    }
                    return (
                        <button
                            key={index}
                            onClick={() => onAnswerSelect(option)}
                            disabled={hasAnswered}
                            className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${btnClass} disabled:cursor-not-allowed group relative overflow-hidden animate-slide-up opacity-0 ${feedbackClass}`}
                            style={{ animationDelay: `${(index + 1) * 75}ms`, animationFillMode: 'forwards' }}
                        >
                            <span className="font-medium relative z-10">{option}</span>
                            {hasAnswered && option === question.correctAnswer && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 font-bold text-xl animate-pop">✓</span>
                            )}
                            {hasAnswered && option === userAnswer && option !== question.correctAnswer && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 font-bold text-xl">✗</span>
                            )}
                        </button>
                    );
                })}
                </div>
            )}

            {question.type === 'FillBlanks' && (
                <div className="space-y-4 animate-slide-up opacity-0" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type the missing word..."
                        disabled={hasAnswered}
                        className={`w-full bg-slate-900 border-2 rounded-lg p-4 text-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner ${
                            hasAnswered 
                                ? (userAnswer?.toLowerCase() === question.correctAnswer?.toLowerCase() ? 'border-green-500 text-green-400 bg-green-900/10' : 'border-red-500 text-red-400 bg-red-900/10')
                                : 'border-slate-700 text-white'
                        }`}
                    />
                    {!hasAnswered ? (
                        <button 
                            onClick={handleTextSubmit}
                            disabled={!textInput.trim()}
                            className="px-6 py-3 w-full sm:w-auto bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                        >
                            Submit Answer
                        </button>
                    ) : (
                        <div className="text-lg animate-fade-in p-3 bg-slate-800 rounded-lg border border-slate-700">
                            Correct Answer: <span className="font-bold text-green-400">{question.correctAnswer}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="animate-slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                 {renderSubjectiveFeedback()}
            </div>

            {/* Explanation for MCQ */}
            {hasAnswered && question.type === 'MCQ' && (
            <div className="mt-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <h3 className="font-bold text-sm uppercase text-purple-300 mb-2 flex items-center gap-2">
                    <span className="bg-purple-500 w-1 h-4 rounded-full"></span>
                    Explanation
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{question.explanation}</p>
            </div>
            )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700 bg-slate-800 z-10">
        <button
          onClick={onBack}
          disabled={questionNumber === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
        >
          <BackArrowIcon className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={onNext}
          className={`flex items-center gap-2 px-6 py-2 rounded-md font-semibold transition shadow-lg transform active:scale-95 ${
            hasAnswered
              ? 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-purple-500/25'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          {hasAnswered
            ? (questionNumber === totalQuestions ? 'Finish Quiz' : 'Next Question')
            : 'Skip'}
          <NextArrowIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default QuizView;
