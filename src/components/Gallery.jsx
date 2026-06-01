import { useState, useCallback, useMemo, useEffect } from 'react';
import useFetchPhotos from '../hooks/useFetchPhotos';
import PhotoCard from './PhotoCard';

export default function Gallery({ favourites, toggleFavourite, theme, toggleTheme }) {
  // Dynamically load and initialize Google Translate in a React-safe way
  useEffect(() => {
    // 1. Setup the global initialization callback function
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
      }
    };

    // 2. Inject the Google Translate API script if not already loaded
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      // If script is already present and Google Translate is ready, initialize directly
      window.googleTranslateElementInit();
    }
  }, []);

  // 1. Fetch photos from the custom hook
  const { photos, loading, error } = useFetchPhotos();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favourites'
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // WHY useCallback is used on handleSearch:
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // WHY useMemo is used on filteredPhotos:
  // We compute the filtered list dynamically. The filter logic only runs when 'photos', 'searchQuery',
  // 'activeTab', or 'favourites' changes. This caches the list across unrelated re-renders.
  const filteredPhotos = useMemo(() => {
    let result = photos;
    if (activeTab === 'favourites') {
      result = result.filter((photo) => favourites.includes(photo.id));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((photo) =>
        photo.author.toLowerCase().includes(query)
      );
    }
    return result;
  }, [photos, searchQuery, activeTab, favourites]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* 
        Sticky Header Container with glassmorphism & backdrop blur.
        Using negative margins to bleed full-width horizontally while preserving inner alignment.
      */}
      <header className="sticky top-0 z-20 bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--card-border)] py-5 mb-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)]" />
            <h1 className="text-2xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
              PIXEL GALLERY
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Google Translate Select Element */}
            <div id="google_translate_element" className="google-translate-wrapper" />

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-color)] hover:opacity-85 transition-all focus:outline-none cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                // Sun Icon for Dark Mode (switch to light)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              ) : (
                // Moon Icon for Light Mode (switch to dark)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Favourites Tab Filter Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 relative w-full sm:w-auto shrink-0 select-none">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all relative z-10 cursor-pointer ${
                  activeTab === 'all'
                    ? 'text-indigo-600 dark:text-white bg-white dark:bg-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('favourites')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all relative z-10 cursor-pointer ${
                  activeTab === 'favourites'
                    ? 'text-indigo-600 dark:text-white bg-white dark:bg-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Favourites ({favourites.length})
              </button>
            </div>
            
            <div className="w-full sm:w-72">
              {/* Glassmorphic Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by photographer..."
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none glass-input"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Render states: Loading Skeletons, Error, Empty list, or Photo grid */}
      {loading ? (
        /* Shimmering Glassmorphic Skeletons for a modern loading experience */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden border border-[var(--card-border)] animate-pulse">
              <div className="aspect-4/3 bg-[var(--shimmer-bg)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" style={{ animation: 'shimmer 1.8s infinite' }} />
              </div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[var(--shimmer-bg)] rounded w-2/3" />
                <div className="flex justify-between items-center pt-3 border-t border-[var(--card-border)]">
                  <div className="h-3 bg-[var(--shimmer-bg)] rounded w-1/4" />
                  <div className="h-3 bg-[var(--shimmer-bg)] rounded w-1/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-32">
          {/* Centered red error message box with neon accent shadow */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-8 py-5 rounded-2xl text-center max-w-md shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mx-auto mb-3 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-semibold text-lg">Failed to load gallery</p>
            <p className="text-xs text-red-500 dark:text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-2xl border border-[var(--card-border)] max-w-lg mx-auto">
          {/* Friendly empty fallback state */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 mx-auto mb-3 text-slate-400 dark:text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="font-semibold text-lg text-[var(--text-color)] opacity-85">No photos match your search.</p>
          <p className="text-sm mt-1 text-[var(--text-color)] opacity-60">Try checking the spelling or searching for a different author.</p>
        </div>
      ) : (
        /* 
          Responsive grid:
          - Mobile (default): 1 column (grid-cols-1)
          - Tablet: 2 columns (sm:grid-cols-2)
          - Desktop: 4 columns (lg:grid-cols-4)
        */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isFavourite={favourites.includes(photo.id)}
              onToggle={toggleFavourite}
              onSelect={setSelectedPhoto}
            />
          ))}
        </div>
      )}

      {/* Advanced Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-300 p-4 animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row transform transition-all duration-300 scale-95 md:scale-100 hover:scale-101"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image side */}
            <div className="relative md:w-3/5 bg-slate-950 aspect-video md:aspect-auto md:min-h-[450px] flex items-center justify-center">
              <img 
                src={`https://picsum.photos/id/${selectedPhoto.id}/1200/800`}
                alt={selectedPhoto.author}
                className="w-full h-full object-cover max-h-[60vh] md:max-h-[80vh]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
            </div>

            {/* Info side */}
            <div className="md:w-2/5 p-8 flex flex-col justify-between">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-500">Photographer</span>
                  <h2 translate="no" className="notranslate text-2xl font-black text-slate-800 dark:text-white mt-1">
                    {selectedPhoto.author}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">Image ID</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPhoto.id}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">Dimensions</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{selectedPhoto.width} × {selectedPhoto.height}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {/* Favourite Toggle Button */}
                <button
                  onClick={() => toggleFavourite(selectedPhoto.id)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    favourites.includes(selectedPhoto.id)
                      ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border-transparent'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={favourites.includes(selectedPhoto.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {favourites.includes(selectedPhoto.id) ? 'Remove from Favourites' : 'Add to Favourites'}
                </button>

                {/* Download Button */}
                <a
                  href={`https://picsum.photos/id/${selectedPhoto.id}/${selectedPhoto.width}/${selectedPhoto.height}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
