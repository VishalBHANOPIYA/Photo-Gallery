import { useReducer, useEffect, useCallback, useState } from 'react';
import Gallery from './components/Gallery';
import { favouritesReducer, getInitialFavourites } from './reducers/favouritesReducer';

function App() {
  // 1. Initialize favourites state using useReducer with a lazy initializer.
  const [favourites, dispatch] = useReducer(favouritesReducer, [], getInitialFavourites);

  // 2. Initialize theme state (reads from localStorage, defaults to 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // 3. Synchronize theme with the HTML element classes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 4. Toggle theme helper function
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // 5. Synchronize favourites state with localStorage on changes.
  useEffect(() => {
    localStorage.setItem('favourites', JSON.stringify(favourites));
  }, [favourites]);

  // 6. Callback function to toggle favourites.
  const toggleFavourite = useCallback((id) => {
    dispatch({ type: 'TOGGLE_FAVOURITE', id });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-400 selection:bg-indigo-500/30 relative">
      {/* Dynamic 3D ambient mesh background lights */}
      <div className="mesh-gradient-bg" />

      {/* Main Gallery component container with theme props */}
      <Gallery
        favourites={favourites}
        toggleFavourite={toggleFavourite}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
