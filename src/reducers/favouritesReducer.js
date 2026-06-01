/**
 * Helper function to retrieve the initial list of favourite photo IDs from localStorage.
 * Wrapped in a try/catch block to safely fallback to an empty array if reading or parsing fails.
 */
export function getInitialFavourites() {
  try {
    const saved = localStorage.getItem('favourites');
    // If favourites exist in localStorage, parse and return the array; otherwise return []
    return saved ? JSON.parse(saved) : [];
  } catch {
    // Return empty array if JSON parsing fails or localStorage is unavailable
    return [];
  }
}

/**
 * Reducer function to manage the state of favourite photo IDs.
 *
 * WHY IMMUTABILITY (RETURNING A NEW ARRAY) MATTERS IN REACT:
 * React detects state changes by comparing the old state reference with the new state reference (shallow comparison).
 * If we mutate the array directly (e.g. state.push(id)), the array reference remains the same. Because the reference
 * hasn't changed, React's change detection assumes nothing has updated and skip re-rendering the UI.
 * By returning a new array reference (e.g. using filter or spread operator), we guarantee that React sees the
 * new reference and triggers a component re-render to display the updated favourites.
 */
export function favouritesReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_FAVOURITE': {
      const { id } = action;
      
      // If the ID is already in the favourites array, remove it
      if (state.includes(id)) {
        // filter() returns a brand new array, maintaining immutability
        return state.filter(favId => favId !== id);
      } 
      
      // If the ID is not in the array, add it
      // Using the spread operator [...] returns a brand new array, maintaining immutability
      return [...state, id];
    }
    
    default:
      // Return state unchanged if the action type is unknown
      return state;
  }
}
