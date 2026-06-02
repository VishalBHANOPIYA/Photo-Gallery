import { useState, useEffect, useCallback } from 'react';

// Custom hook to fetch photos with pagination support
export function useFetchPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=30`);

        if (!response.ok) {
          throw new Error(`Failed to fetch photos (HTTP status: ${response.status})`);
        }

        const data = await response.json();
        
        if (data.length < 30) {
          setHasMore(false);
        }

        setPhotos((prev) => (page === 1 ? data : [...prev, ...data]));
      } catch (err) {
        setError(err.message || 'An error occurred while fetching photos');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchPhotos();
  }, [page]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [loading, loadingMore, hasMore]);

  return { photos, loading, loadingMore, error, loadMore, hasMore };
}

export default useFetchPhotos;
