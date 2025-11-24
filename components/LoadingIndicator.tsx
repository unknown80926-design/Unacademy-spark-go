
import React, { useState, useEffect } from 'react';

interface LoadingIndicatorProps {
  estimatedTime: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ estimatedTime }) => {
  const [timeLeft, setTimeLeft] = useState(estimatedTime);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  return (
    <div className="flex flex-col items-center justify-center text-center text-slate-400">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
      <h2 className="text-xl font-semibold mt-6 text-slate-300">Generating Your Quiz...</h2>
      <p className="mt-2">The AI is reading your PDF and crafting questions.</p>
      <div className="mt-4 text-sm bg-slate-900/50 px-4 py-2 rounded-full">
        {timeLeft > 0 ? (
          <span>
            Estimated time remaining: <span className="font-bold text-white">{timeLeft}s</span>
          </span>
        ) : (
          <span className="font-bold text-white">Almost done...</span>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;