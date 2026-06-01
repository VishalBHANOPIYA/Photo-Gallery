import { useState, useEffect } from 'react';

// Custom hook to fetch 30 photos on mount
export function useFetchPhotos() {
  // 1. Define three useState values with default values
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Run the fetch operation once when the component mounts
  useEffect(() => {
    // Async function inside useEffect to handle the API request
    const fetchPhotos = async () => {
      try {
        // Set loading to true before starting the request
        setLoading(true);

        // Fetch photos from the Picsum API
        const response = await fetch('https://picsum.photos/v2/list?limit=30');

        // If response.ok is false, throw an Error so it lands in the catch block
        if (!response.ok) {
          throw new Error(`Failed to fetch photos (HTTP status: ${response.status})`);
        }

        // Parse JSON response body
        const data = await response.json();

        // Store the successfully fetched array of photos
        setPhotos(data);
      } catch (err) {
        // Store a readable string in error state on failure
        setError(err.message || 'An error occurred while fetching photos');
      } finally {
        // Set loading to false when the request completes, whether it succeeds or fails
        setLoading(false);
      }
    };

    // Execute the async function
    fetchPhotos();
  }, []); // Empty dependency array ensures this runs only once on mount

  // 3. Return the state values as an object
  return { photos, loading, error };
}

export default useFetchPhotos;
