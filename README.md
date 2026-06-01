# Photo Gallery App

A responsive React photo gallery that fetches high-quality images from the Picsum API, supports author-based searching, and maintains a persistent list of favourite photos.

---

## Tech Stack
* **Framework**: React 19 (Vite)
* **Styling**: Tailwind CSS
* **Build System**: Vite

---

## Features
1. **Custom Hooks**: Encapsulates fetching state inside a custom `useFetchPhotos` hook.
2. **On-Mount Fetching**: Fetches exactly 30 images from the Picsum API (`https://picsum.photos/v2/list?limit=30`) when the page loads.
3. **Robust Request Management**: Integrates clean `try / catch / finally` blocks with `async / await` syntax to handle API errors and loading states.
4. **State Management Reducer**: Manages the list of favourite photos using a clean `useReducer` pattern.
5. **Persistence**: Syncs user favourites to `localStorage` and loads them efficiently on refresh via a lazy initializer function.
6. **Optimized Filtering**: Uses `useMemo` to filter photos by author and selected tab (All vs Favourites), preventing expensive array operations on unrelated re-renders.
7. **Stable Callbacks**: Employs `useCallback` on the input search handler to maintain a stable function reference.
8. **Interactive Lightbox Modal**: Click on any card to open a premium details view with photographer info, dimension metadata, download trigger, and dynamic smooth animations.
9. **Animated Tab Control**: Effortlessly switch between "All Photos" and "Favourites" view modes in a beautiful sliding segment bar.

---

## Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation Steps
Follow these commands in your terminal to clone and run the application locally:

```bash
# 1. Clone the repository (or navigate to the project directory)
cd Photo-Gallary

# 2. Install all node dependencies
npm install

# 3. Start the Vite local development server
npm run dev
```

---

## How It Works

### `useFetchPhotos` Custom Hook
This custom hook resides in `src/hooks/useFetchPhotos.js`. It initializes three state variables (`photos`, `loading`, `error`), initiates a fetch call inside `useEffect` on mount, parses the JSON response, and returns the states as an object.

### State Persistence & Reducer
The favourites state is handled in `src/reducers/favouritesReducer.js`:
* **`getInitialFavourites()`**: Read and parse favourites from `localStorage`. Wrapped in a try/catch block to safely handle errors or empty storage.
* **`favouritesReducer()`**: Handles the `TOGGLE_FAVOURITE` action. If an ID is present, it filters it out; if not, it appends it. It returns a brand new array reference rather than mutating the state, ensuring React detects the update and triggers a re-render.
* **Synchronization**: An effect in `App.jsx` listens to changes in the `favourites` array and automatically stringifies the state back to `localStorage`.

### Performance Optimizations
* **`useMemo`**: Used to compute `filteredPhotos` in the `Gallery` component. The filtering expression only runs when either the search query changes or the list of photos changes. Unrelated updates (like toggling a favourite) use the cached array.
* **`useCallback`**: Memoizes the `handleSearch` function in the `Gallery` component. This prevents the function instance from being recreated on every keystroke, keeping the reference stable.
