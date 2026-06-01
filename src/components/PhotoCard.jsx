import { useState, useRef } from 'react';

export default function PhotoCard({ photo, isFavourite, onToggle, onSelect }) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Construct a smaller version of the image for fast loading
  const imageUrl = `https://picsum.photos/id/${photo.id}/400/300`;

  // Calculate mouse position to apply a dynamic 3D tilt effect on hover
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    // Normalize coordinates: range from -1 to 1
    const dx = (x - xc) / xc;
    const dy = (y - yc) / yc;
    
    // Set maximum tilt angle (e.g., 10 degrees) and slightly scale up
    const rotateX = -dy * 10;
    const rotateY = dx * 10;
    
    setTransformStyle(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  // Reset rotation and scale when mouse leaves
  const handleMouseLeave = () => {
    setTransformStyle('rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  // Handle click on heart with a micro-animation pop trigger
  const handleLike = () => {
    setIsLiked(true);
    // Reset animation trigger state after it completes
    setTimeout(() => setIsLiked(false), 600);
    onToggle(photo.id);
  };

  return (
    <div className="card-perspective w-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onSelect(photo)}
        style={{ 
          transform: transformStyle,
          transition: transformStyle ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
        }}
        className={`glass-card rounded-2xl overflow-hidden relative group cursor-pointer ${
          isFavourite 
            ? 'ring-1 ring-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]' 
            : 'shadow-xl'
        }`}
      >
        {/* Image Container with a glowing dynamic overlay */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-950">
          <img
            src={imageUrl}
            alt={`Photo by ${photo.author}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          
          {/* Neon gradient overlay that fades in on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Heart/Favourite Button overlay with micro-animation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 ${
              isFavourite 
                ? 'bg-red-500/15 border border-red-500/30 text-red-500' 
                : 'bg-slate-900/60 border border-white/5 text-slate-300 hover:text-red-400 hover:bg-slate-900/80 hover:border-red-500/20'
            }`}
            aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFavourite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2.5"
              className={`w-5 h-5 transition-transform duration-300 ${
                isLiked ? 'animate-heart' : ''
              } ${isFavourite ? 'fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

         {/* Card Details with 3D Pop-Out depth for child elements */}
        <div className="p-5 relative z-10" style={{ transform: 'translateZ(30px)' }}>
          <p 
            translate="no"
            className="notranslate font-bold text-[var(--text-color)] text-base tracking-wide truncate opacity-90 group-hover:opacity-100 transition-all duration-300"
          >
            {photo.author}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors duration-200"
            >
              View Info
            </a>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider bg-slate-100 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-white/5">
              ID: {photo.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
