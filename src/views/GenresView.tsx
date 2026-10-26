import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { ChevronRight, Filter, Play, Star } from "lucide-react";
import { Anime } from "../types";

const GENRES = [
  { id: 1, name: "Action", icon: "⚔️" },
  { id: 2, name: "Adventure", icon: "🗺️" },
  { id: 4, name: "Comedy", icon: "😂" },
  { id: 8, name: "Drama", icon: "🎭" },
  { id: 10, name: "Fantasy", icon: "✨" },
  { id: 14, name: "Horror", icon: "👻" },
  { id: 7, name: "Mystery", icon: "🔍" },
  { id: 22, name: "Romance", icon: "❤️" },
  { id: 24, name: "Sci-Fi", icon: "🚀" },
  { id: 36, name: "Slice of Life", icon: "☕" },
  { id: 30, name: "Sports", icon: "⚽" },
  { id: 37, name: "Supernatural", icon: "🔮" }
];

export const GenresView = ({ onSelectAnime }: { onSelectAnime: (anime: Anime) => void }) => {
  const [activeGenre, setActiveGenre] = useState(1); // Default to Action
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch(`https://api.jikan.moe/v4/anime?genres=${activeGenre}&order_by=score&sort=desc&limit=24`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setAnimes(data.data || []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [activeGenre]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 py-12 pb-32">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Genres */}
        <div className="w-full md:w-64 flex-shrink-0">
           <div className="flex items-center gap-2 mb-6">
             <Filter className="w-5 h-5 text-vip-gold" />
             <h2 className="text-xl font-display font-bold uppercase tracking-widest text-white">GENRES</h2>
           </div>
           
           <div className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 custom-scrollbar">
             {GENRES.map(genre => (
               <button
                 key={genre.id}
                 onClick={() => setActiveGenre(genre.id)}
                 className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all min-w-[140px] md:min-w-0 ${
                   activeGenre === genre.id 
                    ? 'border-vip-gold bg-vip-gold/10 text-vip-gold shadow-[0_0_15px_rgba(212,175,55,0.15)] font-bold' 
                    : 'border-white/5 bg-[#0a0a0a] text-gray-400 hover:border-vip-gold/50 hover:text-white'
                 }`}
               >
                 <span className="flex items-center gap-2">{genre.icon} {genre.name}</span>
                 {activeGenre === genre.id && <ChevronRight className="w-4 h-4 hidden md:block" />}
               </button>
             ))}
           </div>
        </div>

        {/* Content Grid */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-display font-bold text-white uppercase tracking-widest">
              {GENRES.find(g => g.id === activeGenre)?.name} <span className="text-vip-gold">COLLECTION</span>
            </h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
               <div className="w-10 h-10 border-4 border-vip-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
               {animes.map((anime, idx) => (
                  <motion.div
                    key={anime.mal_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx % 12) * 0.05, duration: 0.3 }}
                    onClick={() => onSelectAnime(anime)}
                    className="group flex flex-col cursor-pointer col-span-1"
                  >
                    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a] transition-all duration-300 shadow-lg group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] group-hover:border-vip-gold/50 w-full aspect-[2/3]">
                      <img
                        src={anime.images.jpg.large_image_url}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-vip-gold/30 px-2 py-1 rounded-lg flex items-center gap-1 z-10">
                        <Star className="w-3 h-3 text-vip-gold fill-vip-gold" />
                        <span className="text-[10px] md:text-xs font-bold text-white shadow-sm">{anime.score || "N/A"}</span>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-vip-gold/90 backdrop-blur-sm flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_20px_rgba(212,175,55,0.5)]">
                          <Play className="w-5 h-5 text-black fill-black ml-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 px-1 flex-shrink-0">
                      <h3 className="font-display font-bold text-white text-sm md:text-base line-clamp-1 transition-colors group-hover:text-vip-gold" title={anime.title_english || anime.title}>
                        {anime.title_english || anime.title}
                      </h3>
                      <p className="text-gray-400 font-medium text-xs line-clamp-1 mt-0.5" title={anime.title}>
                        {anime.title}
                      </p>
                    </div>
                  </motion.div>
               ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
