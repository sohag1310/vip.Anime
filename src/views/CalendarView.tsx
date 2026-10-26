import React, { useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { Anime } from "../types";

export const CalendarView = ({ animes, onSelectAnime, onSearch }: { animes: Anime[], onSelectAnime: (anime: Anime) => void, onSearch: () => void }) => {
  const [selectedDay, setSelectedDay] = useState(5);
  const days = [
    { id: 1, name: "Mon", date: "20" },
    { id: 2, name: "Tue", date: "21" },
    { id: 3, name: "Wed", date: "22" },
    { id: 4, name: "Thu", date: "23" },
    { id: 5, name: "Fri", date: "24", highlight: true },
    { id: 6, name: "Sat", date: "25" },
    { id: 7, name: "Sun", date: "26" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xl">A</div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Release Calendar</h1>
        </div>
        <button onClick={onSearch} className="text-white hover:text-primary transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-between items-center mb-10 overflow-x-auto custom-scrollbar pb-2">
        {days.map(day => (
          <button 
            key={day.id} 
            onClick={() => setSelectedDay(day.id)}
            className={`flex flex-col items-center justify-center w-14 h-16 rounded-2xl flex-shrink-0 transition-colors ${selectedDay === day.id ? 'bg-primary text-white shadow-[0_0_15px_rgba(6,193,73,0.3)]' : 'bg-transparent text-gray-400 hover:bg-white/5'}`}
          >
            <span className="text-xs font-medium mb-1">{day.name}</span>
            <span className="text-lg font-bold">{day.date}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto">
        {animes.slice(0, 15).map((anime, idx) => {
          const hours = ((12 + idx * 3) % 24).toString().padStart(2, '0');
          const minutes = (idx % 2 === 0 ? "00" : "30");

          return (
            <div key={idx} className="flex gap-4 items-center">
              <div className="text-right w-12 flex-shrink-0">
                <span className="text-white font-bold">{hours}:{minutes}</span>
              </div>
              
              <div 
                className="flex-1 rounded-2xl bg-[#1f222a] border border-white/5 p-3 flex gap-4 items-center cursor-pointer hover:bg-[#2a2e39] transition-colors"
                onClick={() => onSelectAnime(anime)}
              >
                <div className="w-16 h-20 lg:w-24 lg:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-black/50 relative">
                  <img src={anime.images.jpg.large_image_url} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://placehold.co/400x600/0a0a0a/ffffff?text=${encodeURIComponent(anime.title)}`; }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold line-clamp-1 lg:text-lg mb-1">{anime.title_english || anime.title}</h3>
                  <p className="text-gray-400 text-xs lg:text-sm line-clamp-1 mb-2">{anime.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block">Episode {10 + idx}</div>
                    <span className="text-[10px] text-gray-500 font-medium">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
