import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, ChevronLeft, SlidersHorizontal, Loader2 } from "lucide-react";
import { Anime } from "../types";

export const SearchView = ({
  animes: initialAnimes,
  onBack,
  onSelectAnime
}: {
  animes: Anime[];
  onBack: () => void;
  onSelectAnime: (anime: Anime) => void;
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/toonstream/feed?search=${encodeURIComponent(query.trim())}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.animes) {
            setSearchResults(data.animes);
          } else {
            setSearchResults([]);
          }
        })
        .catch(err => {
          console.error("Search failed:", err);
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const displayList = query.trim() ? searchResults : initialAnimes;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[80] bg-[#181a20] overflow-y-auto custom-scrollbar pb-32">
      <div className="sticky top-0 z-20 bg-[#181a20] pt-6 pb-4 px-6 flex items-center gap-4 border-b border-white/5">
        <button onClick={onBack} className="text-white hover:text-gray-300 cursor-pointer">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex items-center gap-3 bg-[#1f222a] border border-white/5 rounded-2xl px-4 py-2.5">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search anime on ToonStream (Naruto, Jujutsu Kaisen, etc.)..." 
            className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isSearching && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        </div>
      </div>

      <div className="px-6 pt-6 pb-4 font-bold text-lg text-white flex items-center justify-between">
        <span>
          {query.trim()
            ? `ToonStream Results (${searchResults.length})`
            : `Discover Anime (${initialAnimes.length})`}
        </span>
        {query.trim() && (
          <span className="text-xs text-primary font-normal">Real-time Search</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-6">
        {displayList.map((anime, idx) => (
          <div 
            key={anime.mal_id || idx} 
            className="group cursor-pointer relative"
            onClick={() => onSelectAnime(anime)}
          >
            <div className="w-full aspect-[2/3] rounded-xl overflow-hidden relative border border-white/5 bg-[#0a0a0a] shadow-lg group-hover:border-primary/50 transition-colors">
               <img 
                 src={anime.images.jpg.large_image_url || anime.images.jpg.image_url} 
                 alt={anime.title} 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                 onError={(e) => { e.currentTarget.src = `https://placehold.co/400x600/0a0a0a/ffffff?text=${encodeURIComponent(anime.title)}`; }} 
               />
               <div className="absolute top-2 left-2 bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold text-black shadow-sm flex items-center gap-1 z-10">
                 {anime.score || "8.5"}
               </div>
            </div>
            <h4 className="text-sm mt-3 mb-4 line-clamp-2 font-medium text-white group-hover:text-primary transition-colors">
              {anime.title_english || anime.title}
            </h4>
          </div>
        ))}

        {!isSearching && query.trim() && searchResults.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-500">
            No anime found for "{query}". Try checking your spelling or search by general keyword.
          </div>
        )}
      </div>
    </motion.div>
  );
};
