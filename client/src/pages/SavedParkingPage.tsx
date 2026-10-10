import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Star, MapPin, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

export const SavedParkingPage: React.FC = () => {
  const { favoriteSpaces, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold transition-all group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview Hub</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          Bookmarks
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
          Saved Parking Spaces
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Your bookmarked lots, driveways and garages for instant 1-click reservations.
        </p>
      </div>

      {favoriteSpaces.length === 0 ? (
        // Empty State (Requirement 39)
        <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No saved parking</h3>
            <p className="text-xs text-slate-400 mt-1">
              Save your favorite parking spaces here for rapid rebooking.
            </p>
          </div>
          <Link
            to="/find"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
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
              className="p-4 rounded-3xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
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
                    <h3 className="font-bold text-white text-base line-clamp-1">{parking.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-amber-400 shrink-0 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{parking.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {parking.address}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
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
