import { motion } from "motion/react";
import { Bookmark, Play, Star, Trash2, Search } from "lucide-react";
import { Anime } from "../types";

export const WatchlistView = ({ onSelectAnime, onSearch }: { onSelectAnime: (anime: Anime) => void, onSearch: () => void }) => {
  // Mock data for watchlist
  const watchlist = [
    { mal_id: 21, title_english: "One Piece", title: "One Piece", score: 8.7, images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1244/138851l.jpg" } } },
    { mal_id: 20, title_english: "Naruto", title: "Naruto", score: 8.0, images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/13/17405l.jpg" } } },
    { mal_id: 16498, title_english: "Attack on Titan", title: "Shingeki no Kyojin", score: 8.5, images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg" } } },
    { mal_id: 38000, title_english: "Demon Slayer", title: "Kimetsu no Yaiba", score: 8.5, images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg" } } },
    { mal_id: 5114, title_english: "Fullmetal Alchemist", title: "Fullmetal Alchemist: Brotherhood", score: 9.1, images: { jpg: { large_image_url: "https://cdn.myanimelist.net/images/anime/1208/94745l.jpg" } } }
  ] as Anime[];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xl">A</div>
          <h1 className="text-xl md:text-2xl font-bold text-white">My List</h1>
        </div>
        <button onClick={onSearch} className="text-white hover:text-gray-300">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
         {watchlist.map((anime, idx) => (
            <motion.div
              key={anime.mal_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="group flex flex-col cursor-pointer"
            >
              <div 
                className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a] transition-all duration-300 shadow-lg group-hover:border-primary/50 w-full aspect-[2/3] mb-2"
                onClick={() => onSelectAnime(anime)}
              >
                <img
                  src={anime.images.jpg.large_image_url}
                  alt={anime.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/400x600/0a0a0a/ffffff?text=${encodeURIComponent(anime.title)}`; }}
                />
                
                <div className="absolute top-2 left-2 bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm flex items-center gap-1 z-10">
                  {anime.score || "N/A"}
                </div>
              </div>
              
            </motion.div>
         ))}
      </div>
    </motion.div>
  );
};
