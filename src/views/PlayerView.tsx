import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, Maximize, Minimize, Settings, Volume2, VolumeX,
  SkipBack, SkipForward, ArrowLeft, Plus, Check, Share2, Download,
  ExternalLink, Star, Tv, ChevronDown, ChevronRight, Server, RefreshCw
} from "lucide-react";
import { Anime } from "../types";
import { useState, useRef, useEffect } from "react";

export const PlayerView = ({
  anime,
  episodeId: initialEpisode,
  initialEpisodeUrl,
  onBack,
  onSelectAnime
}: {
  anime: Anime;
  episodeId: number;
  initialEpisodeUrl?: string;
  onBack: () => void;
  onSelectAnime?: (anime: Anime) => void;
}) => {
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [seriesEpisodes, setSeriesEpisodes] = useState<{ id: number; episode: number; title: string; url: string }[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [currentDub, setCurrentDub] = useState<"SUB" | "DUB">("SUB");
  const [servers, setServers] = useState<{ name: string; url: string }[]>([]);
  const [selectedServerIdx, setSelectedServerIdx] = useState<number>(0);
  const [directUrl, setDirectUrl] = useState<string>("");
  const [isLoadingStream, setIsLoadingStream] = useState<boolean>(true);
  const [isAdded, setIsAdded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load series episodes if available
  useEffect(() => {
    let isMounted = true;
    const fetchPath = anime.pageUrl || (anime.slug ? `/series/${anime.slug}` : "");
    if (!fetchPath) return;

    fetch(`/api/toonstream/series?url=${encodeURIComponent(fetchPath)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.episodes) {
          setSeriesEpisodes(data.episodes);
        }
      })
      .catch(console.error);

    return () => { isMounted = false; };
  }, [anime]);

  const isMovie = anime.isMovie || anime.type === "Movie" || (anime.pageUrl && anime.pageUrl.includes("/movies/"));

  const episodes = seriesEpisodes.length > 0
    ? seriesEpisodes.map(e => e.episode)
    : isMovie
    ? [1]
    : Array.from({ length: Math.min(Math.max((anime as any).episodes || 12, 12), 48) }).map((_, i) => i + 1);

  // Load recommendations
  useEffect(() => {
    let isMounted = true;
    fetch(`https://api.jikan.moe/v4/top/anime?filter=airing&limit=12`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && data.data) {
          setRecommendations(data.data);
        }
      })
      .catch(console.error);
    return () => { isMounted = false; };
  }, [anime.mal_id]);

  // Load ToonStream servers and stream links
  useEffect(() => {
    let isMounted = true;
    setIsLoadingStream(true);

    let targetEpUrl = "";
    if (currentEpisode === initialEpisode && initialEpisodeUrl) {
      targetEpUrl = initialEpisodeUrl;
    } else {
      const found = seriesEpisodes.find(e => e.episode === currentEpisode);
      if (found && found.url) {
        targetEpUrl = found.url;
      } else if (anime.firstEpUrl) {
        targetEpUrl = anime.firstEpUrl;
      } else if (isMovie && anime.pageUrl) {
        targetEpUrl = anime.pageUrl;
      }
    }

    const queryParams = new URLSearchParams({
      title: anime.title || "",
      titleEnglish: anime.title_english || "",
      episode: String(currentEpisode),
      dub: currentDub,
      slug: (anime as any).slug || "",
      episodeUrl: targetEpUrl
    });

    fetch(`/api/toonstream/episode?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success && data.servers && data.servers.length > 0) {
          const valid = data.servers.filter((s: any) => s.url && !s.url.endsWith(".json") && !s.url.includes("/api/"));
          if (valid.length > 0) {
            setServers(valid);
            setSelectedServerIdx(0);
            setDirectUrl(data.directUrl || "");
            return;
          }
        }
        // If no valid embed servers found, keep servers empty so iframe never displays 404 raw JSON
        setServers([]);
        setDirectUrl(data.directUrl || "");
      })
      .catch(err => {
        console.error("Failed to load ToonStream episode:", err);
        if (isMounted) {
          setServers([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingStream(false);
      });

    return () => { isMounted = false; };
  }, [anime, currentEpisode, currentDub, seriesEpisodes, initialEpisodeUrl, initialEpisode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeServer = servers[selectedServerIdx] || servers[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#181a20] overflow-y-auto custom-scrollbar pb-16">
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[110] bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium border border-white/10 shadow-2xl pointer-events-none"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onBack()} className="w-10 h-10 rounded-full bg-[#1f222a] border border-white/5 flex items-center justify-center text-white hover:text-primary transition-colors cursor-pointer shadow-lg hover:bg-[#2a2e39]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base md:text-xl line-clamp-1">{anime.title_english || anime.title}</h2>
            <p className="text-xs text-primary font-medium">ToonStream • {isMovie ? "Full Movie" : `Episode ${currentEpisode}`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDub("SUB")}
            className={`transition-colors px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer ${currentDub === 'SUB' ? 'bg-primary border-primary text-black' : 'bg-[#1f222a] border-white/5 text-gray-300 hover:bg-[#2a2e39] hover:text-white'}`}>
            Sub
          </button>
          <button 
            onClick={() => setCurrentDub("DUB")}
            className={`transition-colors px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-pointer ${currentDub === 'DUB' ? 'bg-primary border-primary text-black' : 'bg-[#1f222a] border-white/5 text-gray-300 hover:bg-[#2a2e39] hover:text-white'}`}>
            Dub
          </button>
        </div>
      </div>

      {/* Video Player Box */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-3">
        <div className="relative w-full aspect-video bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          {isLoadingStream ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400 font-medium">ToonStream থেকে ভিডিও লোড হচ্ছে...</p>
            </div>
          ) : activeServer?.url ? (
            <iframe
              key={activeServer.url}
              src={activeServer.url}
              className="w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-zinc-950">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">ভিডিও প্লেয়ার সার্ভার লোড হচ্ছে বা খুঁজছে</h3>
              <p className="text-xs text-gray-400 max-w-md mb-4">
                অন্য সার্ভার দেখতে পারেন অথবা Sub / Dub পরিবর্তন করে পুনরায় চেষ্টা করতে পারেন।
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentDub(prev => prev === "SUB" ? "DUB" : "SUB")}
                  className="bg-[#1f222a] border border-white/10 hover:bg-[#2a2e39] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-primary" /> {currentDub === "SUB" ? "Dub এ দেখুন" : "Sub এ দেখুন"}
                </button>
                {directUrl && (
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ToonStream এ দেখুন
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Server Selection Controls */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
            <Server className="w-3.5 h-3.5 text-primary" /> Server:
          </span>
          {servers.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedServerIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedServerIdx === idx
                  ? 'bg-primary text-black font-bold shadow-md shadow-primary/20 scale-105'
                  : 'bg-[#1f222a] text-gray-300 hover:bg-[#2a2e39] hover:text-white border border-white/5'
              }`}
            >
              {s.name || `Server ${idx + 1}`}
            </button>
          ))}
          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-zinc-900 text-gray-300 hover:text-white hover:bg-zinc-800 border border-white/10 flex items-center gap-1.5 ml-auto flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" /> ToonStream লিঙ্ক
            </a>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        
        {/* Title */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors">
            {anime.title_english || anime.title}
          </h1>
        </div>
        
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium mb-6">
          <div className="flex items-center gap-1 text-primary">
            <Star className="w-4 h-4 fill-primary" /> 
            <span>{anime.score || "9.8"}</span>
          </div>
          <span className="text-gray-400">{anime.year || "2024"}</span> 
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase border border-primary/20">{(anime as any).rating ? (anime as any).rating.split(' ')[0] : '13+'}</span>
          <span className="border border-white/20 text-gray-300 px-2 py-0.5 rounded text-[10px] md:text-xs">ToonStream</span>
          <span className="border border-white/20 text-gray-300 px-2 py-0.5 rounded text-[10px] md:text-xs">{currentDub}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 mb-6">
          <button onClick={() => { setIsAdded(!isAdded); showToast(isAdded ? "Removed from list" : "Added to list"); }} className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 transition-colors w-20 h-20 rounded-2xl border cursor-pointer ${isAdded ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-[#1f222a] border-white/5 text-gray-300 hover:bg-[#2a2e39] hover:text-white'}`}>
            {isAdded ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            <span className="text-[10px] uppercase tracking-wider font-bold">{isAdded ? "Added" : "List"}</span>
          </button>
          <button onClick={() => {
            if (navigator.share) navigator.share({ title: anime.title, url: window.location.href }).catch(() => {});
            else { navigator.clipboard.writeText(window.location.href); showToast("Link copied to clipboard!"); }
          }} className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 bg-[#1f222a] border border-white/5 hover:bg-[#2a2e39] transition-colors text-gray-300 hover:text-white w-20 h-20 rounded-2xl cursor-pointer">
            <Share2 className="w-6 h-6" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Share</span>
          </button>
          <button onClick={() => {
            if (directUrl) window.open(directUrl, '_blank');
            else showToast("Downloading Episode " + currentEpisode + "...");
          }} className="flex-shrink-0 flex flex-col items-center justify-center gap-1.5 bg-[#1f222a] border border-white/5 hover:bg-[#2a2e39] transition-colors text-gray-300 hover:text-white w-20 h-20 rounded-2xl cursor-pointer">
            <Download className="w-6 h-6" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Download</span>
          </button>
        </div>

        {/* Episodes Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Episodes ({episodes.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentEpisode(prev => Math.max(1, prev - 1))}
                disabled={currentEpisode <= 1}
                className="px-3 py-1.5 rounded-lg bg-[#1f222a] text-xs font-bold text-gray-300 hover:bg-[#2a2e39] disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 cursor-pointer"
              >
                Prev Episode
              </button>
              <button
                onClick={() => setCurrentEpisode(prev => prev + 1)}
                className="px-3 py-1.5 rounded-lg bg-[#1f222a] text-xs font-bold text-gray-300 hover:bg-[#2a2e39] border border-white/5 cursor-pointer"
              >
                Next Episode
              </button>
            </div>
          </div>

          {/* Episodes Scroll List */}
          <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {episodes.map(ep => (
              <button 
                key={ep}
                onClick={() => setCurrentEpisode(ep)}
                className={`flex-shrink-0 w-28 h-16 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${ep === currentEpisode ? 'bg-primary text-black font-bold shadow-[0_0_15px_rgba(6,193,73,0.3)] border border-primary/50 scale-105' : 'bg-[#1f222a] border border-white/5 text-gray-400 hover:bg-[#2a2e39] hover:text-white hover:border-white/10'}`}
              >
                <span className="text-xs font-medium opacity-80">Episode</span>
                <span className="text-lg font-bold">{ep.toString().padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations Header */}
        <div className="mt-8 mb-4">
          <h3 className="text-xl font-bold text-white flex items-center justify-between">
            More Like This
          </h3>
        </div>

        {/* Recommendations Grid */}
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 mb-10">
            {recommendations.slice(0, 7).map(rec => (
              <div 
                key={rec.mal_id} 
                className="group cursor-pointer relative"
                onClick={() => {
                  if (onSelectAnime) onSelectAnime(rec);
                }}
              >
                <div className="w-full aspect-[2/3] rounded-xl overflow-hidden relative border border-white/5 bg-[#0a0a0a] shadow-lg group-hover:border-primary/50 transition-colors">
                   {rec.images?.jpg?.large_image_url || rec.images?.jpg?.image_url ? (
                     <img src={rec.images.jpg.large_image_url || rec.images.jpg.image_url} alt={rec.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = `https://placehold.co/400x600/0a0a0a/ffffff?text=${encodeURIComponent(rec.title)}`; }} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-2">{rec.title}</div>
                   )}
                   <div className="absolute top-2 left-2 bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold text-black shadow-sm flex items-center gap-1 z-10">
                     {rec.score || "N/A"}
                   </div>
                </div>
                <h4 className="text-sm mt-2 line-clamp-2 font-medium text-white group-hover:text-primary transition-colors">{rec.title_english || rec.title}</h4>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center py-12 mb-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

      </div>
    </motion.div>
  );
};
