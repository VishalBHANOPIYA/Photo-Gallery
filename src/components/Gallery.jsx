import { useState, useCallback, useMemo, useEffect } from 'react';
import useFetchPhotos from '../hooks/useFetchPhotos';
import PhotoCard from './PhotoCard';

// Mock EXIF data generator based on photo ID
const getMockEXIF = (id) => {
  const cameras = ["Fujifilm X-T4", "Sony A7 IV", "Canon EOS R6", "Nikon Z6 II", "Leica Q2"];
  const lenses = ["35mm f/1.4 G", "50mm f/1.2 GM", "24-70mm f/2.8 L", "85mm f/1.8 S", "28mm f/1.7 Summilux"];
  const apertures = ["f/1.4", "f/2.0", "f/2.8", "f/4.0", "f/5.6"];
  const shutters = ["1/125s", "1/250s", "1/500s", "1/1000s", "1/2000s"];
  const isos = ["100", "160", "200", "400", "800"];

  const num = Number(id) || 0;
  return {
    camera: cameras[num % cameras.length],
    lens: lenses[(num + 1) % lenses.length],
    aperture: apertures[(num + 2) % apertures.length],
    shutter: shutters[(num + 3) % shutters.length],
    iso: isos[(num + 4) % isos.length]
  };
};

// Mock dominant color palette generator based on photo ID
const getMockPalette = (id) => {
  const palettes = [
    ["#1E293B", "#475569", "#94A3B8", "#E2E8F0"],
    ["#065F46", "#047857", "#10B981", "#D1FAE5"],
    ["#701A75", "#86198F", "#D946EF", "#FDF4FF"],
    ["#7C2D12", "#9A3412", "#F97316", "#FFEDD5"],
    ["#1E3A8A", "#1D4ED8", "#3B82F6", "#DBEAFE"],
    ["#581C87", "#6D28D9", "#8B5CF6", "#EDE9FE"],
    ["#881337", "#9F1239", "#F43F5E", "#FFE4E6"],
    ["#78350F", "#B45309", "#F59E0B", "#FEF3C7"]
  ];
  const num = Number(id) || 0;
  return palettes[num % palettes.length];
};

// Automatic categorization helper based on photo ID
const getPhotoCategory = (id) => {
  const num = Number(id) || 0;
  if (num % 4 === 0) return "Minimalist";
  if (num % 3 === 0) return "Monochrome";
  if (num % 5 === 0) return "Scenic";
  return "Portrait";
};

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

  // 1. Fetch photos from the custom hook with pagination
  const { photos, loading, loadingMore, error, loadMore, hasMore } = useFetchPhotos();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favourites'
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Advanced gallery options
  const [sortBy, setSortBy] = useState('default'); // 'default', 'author-asc', 'author-desc', 'id-asc', 'id-desc'
  const [cols, setCols] = useState('default'); // 'default', 'compact', 'list'
  const [selectedCategory, setSelectedCategory] = useState('All Styles');
  
  // Image editing effects in Lightbox
  const [grayscale, setGrayscale] = useState(false);
  const [blurAmount, setBlurAmount] = useState(0); // range 0 to 10
  const [zoom, setZoom] = useState(1); // scale factor 1 to 2
  const [rotation, setRotation] = useState(0); // degrees 0, 90, 180, 270

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Copy share link helper
  const copyShareLink = useCallback((photoId) => {
    const shareUrl = `https://picsum.photos/id/${photoId}/1200/800`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("Link copied to clipboard!");
    }).catch(() => {
      showToast("Failed to copy link.", "error");
    });
  }, [showToast]);

  const [slideshowActive, setSlideshowActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Photographer suggestions autocomplete computed values
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const uniqueAuthors = Array.from(new Set(photos.map((p) => p.author)));
    return uniqueAuthors
      .filter((author) => author.toLowerCase().includes(query))
      .slice(0, 5);
  }, [searchQuery, photos]);

  // Reset image effects when a photo is selected
  const handleSelectPhoto = useCallback((photo) => {
    setSelectedPhoto(photo);
    if (!photo) {
      setSlideshowActive(false);
    }
    if (photo) {
      setGrayscale(false);
      setBlurAmount(0);
      setZoom(1);
      setRotation(0);
    }
  }, []);

  // Compute dynamic modal photo URL with active filters
  const getModalImageUrl = useMemo(() => {
    if (!selectedPhoto) return '';
    let url = `https://picsum.photos/id/${selectedPhoto.id}/1200/800`;
    const params = [];
    if (grayscale) params.push('grayscale');
    if (blurAmount > 0) params.push(`blur=${blurAmount}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return url;
  }, [selectedPhoto, grayscale, blurAmount]);

  // Compute download url with applied filters
  const getModalDownloadUrl = useMemo(() => {
    if (!selectedPhoto) return '';
    let url = `https://picsum.photos/id/${selectedPhoto.id}/${selectedPhoto.width}/${selectedPhoto.height}`;
    const params = [];
    if (grayscale) params.push('grayscale');
    if (blurAmount > 0) params.push(`blur=${blurAmount}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return url;
  }, [selectedPhoto, grayscale, blurAmount]);

  // Export favourites to a downloadable text file
  const exportFavourites = useCallback(() => {
    if (favourites.length === 0) return;
    const favouritePhotos = photos.filter(p => favourites.includes(p.id));
    let content = "=== MY FAVOURITE PHOTO GALLERY ===\n\n";
    favouritePhotos.forEach((photo, idx) => {
      content += `${idx + 1}. Photographer: ${photo.author}\n`;
      content += `   Picsum ID: ${photo.id}\n`;
      content += `   Original Dimensions: ${photo.width} x ${photo.height}\n`;
      content += `   Download Link: https://picsum.photos/id/${photo.id}/${photo.width}/${photo.height}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `my-favourites-${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Favourites exported successfully!");
  }, [favourites, photos, showToast]);

  // WHY useCallback is used on handleSearch:
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // WHY useMemo is used on filteredPhotos:
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
    if (selectedCategory !== 'All Styles') {
      result = result.filter((photo) => getPhotoCategory(photo.id) === selectedCategory);
    }
    
    // Apply Advanced Sorting
    result = [...result];
    if (sortBy === 'author-asc') {
      result.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortBy === 'author-desc') {
      result.sort((a, b) => b.author.localeCompare(a.author));
    } else if (sortBy === 'id-asc') {
      result.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortBy === 'id-desc') {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }
    
    return result;
  }, [photos, searchQuery, activeTab, favourites, sortBy, selectedCategory]);

  // Slideshow Autoplay timer effect
  useEffect(() => {
    let timer;
    if (slideshowActive && selectedPhoto) {
      timer = setInterval(() => {
        const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % filteredPhotos.length;
          setSelectedPhoto(filteredPhotos[nextIndex]);
          setZoom(1);
          setRotation(0);
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [slideshowActive, selectedPhoto, filteredPhotos]);

  // Keyboard navigation controls for Lightbox
  useEffect(() => {
    if (!selectedPhoto) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSelectPhoto(null);
      } else if (e.key === 'ArrowRight') {
        const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % filteredPhotos.length;
          setSelectedPhoto(filteredPhotos[nextIndex]);
          setZoom(1);
          setRotation(0);
        }
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
        if (currentIndex !== -1) {
          const prevIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
          setSelectedPhoto(filteredPhotos[prevIndex]);
          setZoom(1);
          setRotation(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, filteredPhotos, handleSelectPhoto]);

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
            
            <div className="w-full sm:w-72 relative">
              {/* Glassmorphic Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                placeholder="Search by photographer..."
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none glass-input"
              />
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-scaleUp">
                  {suggestions.map((author) => (
                    <button
                      key={author}
                      onClick={() => {
                        setSearchQuery(author);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-bold text-[var(--text-color)] opacity-85 transition-colors cursor-pointer"
                    >
                      {author}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All Styles', 'Minimalist', 'Monochrome', 'Scenic', 'Portrait'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 transition-all duration-300">
        
        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-white/5 outline-none transition-all cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="author-asc">Author (A - Z)</option>
            <option value="author-desc">Author (Z - A)</option>
            <option value="id-asc">ID (Ascending)</option>
            <option value="id-desc">ID (Descending)</option>
          </select>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-slate-500">Layout:</span>
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 select-none">
            <button
              onClick={() => setCols('default')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                cols === 'default'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              title="Standard Grid"
            >
              Grid
            </button>
            <button
              onClick={() => setCols('compact')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                cols === 'compact'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              title="Compact Grid"
            >
              Compact
            </button>
            <button
              onClick={() => setCols('list')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                cols === 'list'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              title="List View"
            >
              List
            </button>
          </div>
        </div>

        {/* Batch Export Button (only if favourites available) */}
        {favourites.length > 0 && (
          <button
            onClick={exportFavourites}
            className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Favourites (.txt)
          </button>
        )}
      </div>

      {/* Render states: Loading Skeletons, Error, Empty list, or Photo grid */}
      {loading ? (
        /* Shimmering Glassmorphic Skeletons for a modern loading experience */
        <div className={`grid gap-6 transition-all duration-500 ${
          cols === 'compact' 
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' 
            : cols === 'list'
            ? 'grid-cols-1 max-w-2xl mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
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
        <div>
          <div className={`grid gap-6 transition-all duration-500 ${
            cols === 'compact' 
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' 
              : cols === 'list'
              ? 'grid-cols-1 max-w-2xl mx-auto'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isFavourite={favourites.includes(photo.id)}
                onToggle={toggleFavourite}
                onSelect={handleSelectPhoto}
              />
            ))}
          </div>

          {activeTab === 'all' && (
            <div className="flex flex-col items-center mt-12 mb-6">
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer flex items-center gap-3"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading More Photos...
                    </>
                  ) : (
                    "Load More Photos"
                  )}
                </button>
              ) : (
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">You've reached the end of the gallery.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Advanced Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-300 p-4 animate-fadeIn"
          onClick={() => handleSelectPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row transform transition-all duration-300 scale-95 md:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image side */}
            <div className="relative md:w-3/5 bg-slate-950 aspect-video md:aspect-auto md:min-h-[480px] flex items-center justify-center overflow-hidden">
              <img 
                src={getModalImageUrl}
                alt={selectedPhoto.author}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="w-full h-full object-cover max-h-[60vh] md:max-h-[80vh]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
            </div>

            {/* Info side */}
            <div className="md:w-2/5 p-8 flex flex-col justify-between">
              {/* Close Button */}
              <button 
                onClick={() => handleSelectPhoto(null)}
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

                {/* Smart Camera EXIF Specs */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-2.5">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-indigo-500">Camera Specs (EXIF)</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-450 dark:text-slate-500 text-[10px]">Camera:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{getMockEXIF(selectedPhoto.id).camera}</p>
                    </div>
                    <div>
                      <span className="text-slate-450 dark:text-slate-500 text-[10px]">Lens:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{getMockEXIF(selectedPhoto.id).lens}</p>
                    </div>
                    <div>
                      <span className="text-slate-450 dark:text-slate-500 text-[10px]">Aperture:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{getMockEXIF(selectedPhoto.id).aperture}</p>
                    </div>
                    <div>
                      <span className="text-slate-450 dark:text-slate-500 text-[10px]">Shutter · ISO:</span>
                      <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{getMockEXIF(selectedPhoto.id).shutter} · ISO {getMockEXIF(selectedPhoto.id).iso}</p>
                    </div>
                  </div>
                </div>

                {/* Dominant Color Palette */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-indigo-500">Dominant Palette</span>
                    <span className="text-[9px] text-slate-400">Click bubble to copy HEX</span>
                  </div>
                  <div className="flex gap-2.5">
                    {getMockPalette(selectedPhoto.id).map((hex) => (
                      <button
                        key={hex}
                        onClick={() => {
                          navigator.clipboard.writeText(hex);
                          showToast(`Copied ${hex} to clipboard!`);
                        }}
                        style={{ backgroundColor: hex }}
                        title={`Copy ${hex}`}
                        className="w-7 h-7 rounded-full border border-white/20 shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                      />
                    ))}
                  </div>
                </div>

                {/* Interactive Image Effects Panel */}
                <div className="bg-slate-50 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-500">Image Effects</span>
                  
                  {/* Grayscale Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Grayscale</span>
                    <button
                      onClick={() => setGrayscale(prev => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        grayscale ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          grayscale ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Blur Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Blur Intensity</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{blurAmount}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={blurAmount}
                      onChange={(e) => setBlurAmount(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                    />
                  </div>

                  {/* Rotation Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Rotation</span>
                    <div className="flex gap-2">
                      {[0, 90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          onClick={() => setRotation(deg)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            rotation === deg
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-355'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-355">Zoom Level</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{zoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
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

                {/* Copy Share Link Button */}
                <button
                  onClick={() => copyShareLink(selectedPhoto.id)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-2.772 1.109a2.5 2.5 0 110-1.702l2.772 1.109a2.5 2.5 0 003.478-.397l2.253-2.253a2.5 2.5 0 113.536 3.536l-2.253 2.253a2.5 2.5 0 01-3.536 0l-2.253-2.253a2.5 2.5 0 00-3.478.397" />
                  </svg>
                  Copy Share Link
                </button>

                {/* Autoplay Slideshow Toggle Button */}
                <button
                  onClick={() => {
                    setSlideshowActive(prev => !prev);
                    showToast(slideshowActive ? "Slideshow paused" : "Slideshow started (3s intervals)");
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    slideshowActive
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border-transparent'
                  }`}
                >
                  {slideshowActive ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 animate-pulse">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                      Pause Slideshow
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Start Slideshow
                    </>
                  )}
                </button>

                {/* Download Button */}
                <a
                  href={getModalDownloadUrl}
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

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-sm font-bold transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-450 border-emerald-200 dark:border-emerald-500/20'
          }`}>
            <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
