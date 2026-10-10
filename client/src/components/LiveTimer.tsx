import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
  className?: string;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({
  initialSeconds = 6138, // ~ 1 hour 42 mins 18 secs
  onExpire,
  className = '',
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;

  const isLow = secondsLeft < 900; // less than 15 mins

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-md ${
        isLow
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      } ${className}`}
    >
      <Clock className={`w-4 h-4 ${isLow ? 'animate-bounce text-rose-400' : 'text-emerald-400 animate-spin-slow'}`} />
      <div className="flex flex-col">
        <span className="font-mono text-sm sm:text-base font-bold tracking-wider leading-none text-white">
          {formatted}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-400 leading-none mt-0.5">
          {isLow ? 'Ending soon' : 'Time Remaining'}
        </span>
      </div>
    </div>
  );
};
