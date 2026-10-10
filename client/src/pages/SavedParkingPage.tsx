import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Star, MapPin, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';

export const SavedParkingPage: React.FC = () => {
  const { favoriteSpaces, toggleFavorite } = useFavorites();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all group shadow-sm border ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview Hub</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
          Bookmarks
        </span>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Saved Parking Spaces
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Your bookmarked lots, driveways and garages for instant 1-click reservations.
        </p>
      </div>

      {favoriteSpaces.length === 0 ? (
        // Empty State (Requirement 39)
        <div className={`p-16 rounded-3xl border text-center space-y-4 max-w-md mx-auto my-12 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-slate-900/5'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            <Bookmark className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No saved parking</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Save your favorite parking spaces here for rapid rebooking.
            </p>
          </div>
          <Link
            to="/find"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
          >
            <span>Explore Parking</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteSpaces.map((parking) => (
            <div
              key={parking.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                isDark ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-3">
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900">
                  <img
                    src={parking.images?.[0] || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'}
                    alt={parking.title || 'Parking spot'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-xs font-bold text-white">
                    ₹{parking.pricePerHour}/hr
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded">
                    {parking.availableSpots} SPOTS AVAILABLE
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-bold text-base line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{parking.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-400 shrink-0 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{parking.rating}</span>
                    </div>
                  </div>
                  <p className={`text-xs flex items-center gap-1 mt-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {parking.address}
                  </p>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                isDark ? 'border-slate-800/80' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => toggleFavorite(parking)}
                  className="px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <Link
                  to={`/parking/${parking.id}?book=true`}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                >
                  <span>Reserve</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

