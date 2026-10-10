import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <MapPin className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-4xl sm:text-5xl font-black text-white">404</span>
          <h2 className="text-xl font-bold text-white">Lost in the Parking Lot?</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            The page or parking coordinate you are navigating to doesn't exist or has expired.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
        >
          <span>Return to Homepage</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
