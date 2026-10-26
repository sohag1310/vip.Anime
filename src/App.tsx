import { motion } from "motion/react";
import { Crown, Play, Star, Sparkles, ChevronRight, Loader2, MonitorPlay, Lock, Unlock, Search, Bookmark, User, Home, Calendar, Download, Menu, Settings, Mic, Flame, Layers } from "lucide-react";
import { TiltCard } from "./components/TiltCard";
import { useState, useEffect } from "react";
import { Anime } from "./types";
import { PlayerView } from "./views/PlayerView";
import { DetailsView } from "./views/DetailsView";
import { GenresView } from "./views/GenresView";
import { WatchlistView } from "./views/WatchlistView";
import { SettingsView } from "./views/SettingsView";
import { DownloadView } from "./views/DownloadView";

import { CalendarView } from "./views/CalendarView";
import { SearchView } from "./views/SearchView";

import { AdminView } from "./views/AdminView";
import { db } from "./firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

const AnimeGridRow = ({
  title,
  subtitle,
  animes,
  onSelectAnime,
  onSeeAll
}: {
  title: string;
  subtitle?: string;
  animes: Anime[];
  onSelectAnime?: (anime: Anime) => void;
  onSeeAll?: () => void;
}) => {
  if (!animes || animes.length === 0) return null;
  
  return (
    <section className="relative z-10 w-full px-4 md:px-8 lg:px-12 mx-auto pb-8">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-primary font-medium flex items-center hover:translate-x-1 transition-transform text-xs md:text-sm cursor-pointer">
            See all <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        )}
      </div>
      
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x snap-mandatory">
        {animes.map((anime, idx) => (
          <motion.div
            key={anime.mal_id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "50px" }}
            transition={{ delay: (idx % 10) * 0.04, duration: 0.4, ease: "easeOut" }}
            className="group flex flex-col cursor-pointer w-36 md:w-48 flex-shrink-0 snap-start"
            onClick={() => onSelectAnime && onSelectAnime(anime)}
          >
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a] transition-all duration-300 shadow-lg group-hover:border-primary/50 w-full aspect-[2/3] mb-2">
              <img
                src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
                alt={anime.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = `https://placehold.co/400x600/0a0a0a/ffffff?text=${encodeURIComponent(anime.title)}`; }}
              />
              
              {/* Rating Badge */}
              <div className="absolute top-2 left-2 bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold text-black shadow-sm flex items-center gap-1 z-10">
                <Star className="w-3 h-3 fill-black" />
                <span>{anime.score || "8.5"}</span>
              </div>

              {/* ToonStream Badge */}
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                HD
              </div>
            </div>
            
            {/* Title */}
            <div className="px-1 flex-shrink-0">
              <h3 className="font-bold text-white line-clamp-2 transition-colors group-hover:text-primary text-sm leading-snug" title={anime.title_english || anime.title}>
                {anime.title_english || anime.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default function App() {
  const [heroAnime, setHeroAnime] = useState<Anime | null>(null);
  const [trendingAnimes, setTrendingAnimes] = useState<Anime[]>([]);
  const [popularAnimes, setPopularAnimes] = useState<Anime[]>([]);
  const [hindiAnimes, setHindiAnimes] = useState<Anime[]>([]);
  const [mustWatchAnimes, setMustWatchAnimes] = useState<Anime[]>([]);
  const [catalogAnimes, setCatalogAnimes] = useState<Anime[]>([]);
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [catalogCategory, setCatalogCategory] = useState<string>("anime");
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [adminAnimes, setAdminAnimes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'mylist' | 'download' | 'profile' | 'details' | 'player' | 'search' | 'admin'>('home');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedEpisodeUrl, setSelectedEpisodeUrl] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [inputPwd, setInputPwd] = useState('');

  const handleAdminAuth = () => {
    setShowAdminPrompt(true);
  };

  const submitAdminAuth = () => {
    const pwd = inputPwd;
    if (pwd) {
      if (pwd === "9221" && adminPassword === '') {
        setAdminPassword(pwd);
        setActiveTab('admin');
        setShowAdminPrompt(false);
        setInputPwd('');
      } else if (pwd === adminPassword || pwd === "9221") {
        setAdminPassword(pwd);
        setActiveTab('admin');
        setShowAdminPrompt(false);
        setInputPwd('');
      } else {
        alert("Incorrect password!");
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnime(anime);
    setSelectedEpisodeUrl(anime.firstEpUrl || undefined);
    setActiveTab('details');
  };

  const handlePlayAnime = (episodeId: number, episodeUrl?: string) => {
    setSelectedEpisode(episodeId);
    setSelectedEpisodeUrl(episodeUrl);
    setActiveTab('player');
  };

  // Initial load of ToonStream catalog
  useEffect(() => {
    let isMounted = true;

    const fetchFeed = async (page: number, cat = "anime") => {
      try {
        const res = await fetch(`/api/toonstream/feed?page=${page}&category=${cat}`);
        const data = await res.json();
        const list = (data.success && data.animes) ? data.animes : [];
        return list.filter((a: Anime) => a.hasVideo !== false);
      } catch (err) {
        console.error("ToonStream feed fetch error:", err);
        return [];
      }
    };

    const loadInitialData = async () => {
      setIsLoading(true);

      // Load Page 1 for Hero and Trending
      const p1 = await fetchFeed(1, "anime");
      if (!isMounted) return;

      if (p1.length > 0) {
        setHeroAnime(p1[0]);
        setTrendingAnimes(p1.slice(1));
        setCatalogAnimes(p1);
      }
      setIsLoading(false);

      // Load other categories in background
      const [p2, hindi, p3] = await Promise.all([
        fetchFeed(2, "anime"),
        fetchFeed(1, "hindi-dubbed"),
        fetchFeed(3, "anime")
      ]);

      if (!isMounted) return;
      if (p2.length > 0) setPopularAnimes(p2);
      if (hindi.length > 0) setHindiAnimes(hindi);
      if (p3.length > 0) setMustWatchAnimes(p3);

      // Admin animes
      try {
        const q = query(collection(db, 'anime_data'), orderBy('createdAt', 'desc'), limit(15));
        const snapshot = await getDocs(q);
        const adminData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (isMounted) setAdminAnimes(adminData);
      } catch (err) {
        console.error("Failed to load admin animes", err);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  // Fetch catalog when page or category changes
  const fetchCatalogPage = async (page: number, cat: string) => {
    setCatalogLoading(true);
    setCatalogPage(page);
    setCatalogCategory(cat);
    try {
      const res = await fetch(`/api/toonstream/feed?page=${page}&category=${cat}`);
      const data = await res.json();
      if (data.success && data.animes) {
        setCatalogAnimes(data.animes.filter((a: Anime) => a.hasVideo !== false));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const allAvailableAnimes = [
    ...(heroAnime ? [heroAnime] : []),
    ...trendingAnimes,
    ...popularAnimes,
    ...hindiAnimes,
    ...mustWatchAnimes,
    ...catalogAnimes
  ];

  return (
    <div className="min-h-screen relative overflow-hidden font-sans bg-[#181a20] text-zinc-100">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-grid z-0 opacity-40 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary opacity-[0.05] blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-primary text-black font-bold px-6 py-3 rounded-full text-sm shadow-[0_0_20px_rgba(6,193,73,0.5)] border border-white/20 pointer-events-none transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      {activeTab !== 'player' && activeTab !== 'search' && activeTab !== 'details' && activeTab !== 'admin' && (
        <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary bg-primary/20 flex items-center justify-center font-bold text-primary">
              TS
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight flex items-center gap-1.5">
                ToonStream <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-mono">Anime</span>
              </h2>
              <p className="text-gray-400 text-xs">Watch Free Anime Online</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                fetchCatalogPage(1, "hindi-dubbed");
                const el = document.getElementById("toonstream-library");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} 
              className="hover:text-primary transition-colors text-white flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-violet-400" />
              <span>Hindi Dub</span>
            </button>
            <button onClick={() => setActiveTab('search')} className="hover:text-primary transition-colors text-white p-2 rounded-full bg-zinc-900/60 border border-white/5 cursor-pointer">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('profile')} className="hover:text-primary transition-colors text-white p-2 rounded-full bg-zinc-900/60 border border-white/5 cursor-pointer">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <div className={`pb-20 ${activeTab === 'player' ? 'pb-0' : ''}`}>
        {isLoading ? (
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-gray-400 font-mono">ToonStream Anime তালিকা লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <>
                {/* Hero Section with ToonStream Poster */}
                {heroAnime && (
                  <main className="relative z-10 w-full mb-8">
                    <div className="relative w-full aspect-[4/5] md:aspect-[21/9] max-h-[580px]">
                      <div className="absolute inset-0">
                        <img 
                          src={heroAnime.images.jpg.large_image_url || heroAnime.images.jpg.image_url} 
                          alt={heroAnime.title} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.currentTarget.src = `https://placehold.co/1200x600/0a0a0a/ffffff?text=${encodeURIComponent(heroAnime.title)}`; }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181a20] via-black/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#181a20] via-black/40 to-transparent hidden md:block" />
                      </div>
                      
                      <div className="absolute bottom-6 left-6 right-6 md:left-12 lg:left-20 flex flex-col justify-end max-w-3xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-primary text-black font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded">
                            Featured on ToonStream
                          </span>
                          <span className="text-gray-300 text-xs">⭐ {heroAnime.score || "8.5"} Rating</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 line-clamp-2 text-shadow-lg drop-shadow-md">
                          {heroAnime.title_english || heroAnime.title}
                        </h1>
                        <p className="text-xs md:text-sm text-gray-300 mb-5 line-clamp-2 max-w-xl">
                          {heroAnime.synopsis || "Full series streaming in high quality on ToonStream with English sub & multi-language dubs."}
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => { handleSelectAnime(heroAnime); handlePlayAnime(1); }} className="bg-primary text-black hover:bg-primary/90 px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 cursor-pointer">
                            <Play className="w-4 h-4 fill-black" />
                            <span>Play Now</span>
                          </button>
                          <button onClick={() => { handleSelectAnime(heroAnime); }} className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </main>
                )}

                {/* ToonStream Catalog Rows */}
                <AnimeGridRow 
                  title="🔥 Trending on ToonStream" 
                  subtitle="Latest popular anime streaming right now"
                  animes={trendingAnimes} 
                  onSelectAnime={handleSelectAnime} 
                  onSeeAll={() => setActiveTab('search')} 
                />
                
                {hindiAnimes.length > 0 && (
                  <AnimeGridRow 
                    title="🎙️ Hindi Dubbed Anime" 
                    subtitle="Watch anime with authentic Hindi audio"
                    animes={hindiAnimes} 
                    onSelectAnime={handleSelectAnime} 
                    onSeeAll={() => { fetchCatalogPage(1, "hindi-dubbed"); }} 
                  />
                )}
                
                <AnimeGridRow 
                  title="⭐ Popular Anime Series" 
                  subtitle="Fan favorites and top rated anime"
                  animes={popularAnimes} 
                  onSelectAnime={handleSelectAnime} 
                  onSeeAll={() => setActiveTab('search')} 
                />
                
                <AnimeGridRow 
                  title="⚡ Must-Watch Anime" 
                  subtitle="Action, fantasy, and adventure"
                  animes={mustWatchAnimes} 
                  onSelectAnime={handleSelectAnime} 
                  onSeeAll={() => setActiveTab('search')} 
                />

                {/* Full Browse Library Section */}
                <section id="toonstream-library" className="relative z-10 w-full px-4 md:px-8 lg:px-12 mx-auto pt-6 pb-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-t border-white/10 pt-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Layers className="w-6 h-6 text-primary" /> 
                        ToonStream Full Library
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        ব্রাউজ করুন ToonStream এর সম্পূর্ণ অ্যানিমে তালিকা (পোস্টার, টাইটেল ও এপিসোডসহ)
                      </p>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-white/5 self-start md:self-auto">
                      <button
                        onClick={() => fetchCatalogPage(1, "anime")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          catalogCategory === "anime" ? "bg-primary text-black shadow-sm" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        All Anime
                      </button>
                      <button
                        onClick={() => fetchCatalogPage(1, "hindi-dubbed")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          catalogCategory === "hindi-dubbed" ? "bg-primary text-black shadow-sm" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Hindi Dubbed
                      </button>
                      <button
                        onClick={() => fetchCatalogPage(1, "series")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          catalogCategory === "series" ? "bg-primary text-black shadow-sm" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Series
                      </button>
                    </div>
                  </div>

                  {catalogLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-xs text-gray-400">নতুন পাতা লোড হচ্ছে...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {catalogAnimes.map((anime, idx) => (
                          <div
                            key={anime.mal_id || idx}
                            onClick={() => handleSelectAnime(anime)}
                            className="group cursor-pointer flex flex-col"
                          >
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5 bg-[#0a0a0a] group-hover:border-primary/50 transition-all duration-300 shadow-md">
                              <img
                                src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
                                alt={anime.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) => { e.currentTarget.src = `https://placehold.co/400x600/0a0a0a/ffffff?text=${encodeURIComponent(anime.title)}`; }}
                              />
                              <div className="absolute top-2 left-2 bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold text-black shadow-sm">
                                {anime.score || "8.5"}
                              </div>
                            </div>
                            <h3 className="font-semibold text-white line-clamp-2 text-xs md:text-sm mt-2 group-hover:text-primary transition-colors leading-snug">
                              {anime.title_english || anime.title}
                            </h3>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      <div className="mt-10 flex items-center justify-center gap-3">
                        <button
                          onClick={() => fetchCatalogPage(Math.max(1, catalogPage - 1), catalogCategory)}
                          disabled={catalogPage <= 1}
                          className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-gray-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          ← Previous Page
                        </button>
                        <span className="text-xs font-mono text-gray-400 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                          Page {catalogPage} of 47
                        </span>
                        <button
                          onClick={() => fetchCatalogPage(catalogPage + 1, catalogCategory)}
                          className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-gray-300 hover:bg-zinc-800 cursor-pointer"
                        >
                          Next Page →
                        </button>
                      </div>
                    </>
                  )}
                </section>

                {/* Admin Uploads if available */}
                {adminAnimes.length > 0 && (
                  <section className="relative z-10 w-full px-4 md:px-8 lg:px-12 mx-auto pb-8 border-t border-white/5 pt-8">
                    <div className="flex items-center justify-between mb-4 gap-4">
                      <h2 className="text-xl font-bold">Admin Uploads</h2>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x snap-mandatory">
                      {adminAnimes.map((anime, idx) => (
                        <motion.div
                          key={anime.id || idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "50px" }}
                          transition={{ delay: (idx % 10) * 0.05, duration: 0.5, ease: "easeOut" }}
                          className="group flex flex-col cursor-pointer w-48 md:w-64 flex-shrink-0 snap-start"
                        >
                          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a] transition-all duration-300 shadow-lg group-hover:border-primary/50 w-full aspect-video mb-2">
                             <iframe src={anime.driveEmbedLink} className="w-full h-full object-cover pointer-events-auto" allowFullScreen />
                          </div>
                          <div className="px-1 flex-shrink-0">
                            <h3 className="font-bold text-white line-clamp-1 transition-colors group-hover:text-primary text-sm" title={anime.title}>
                              {anime.title}
                            </h3>
                            <p className="text-xs text-primary mt-1">Episode {anime.episode}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === 'search' && (
              <SearchView animes={allAvailableAnimes} onBack={() => setActiveTab('home')} onSelectAnime={handleSelectAnime} />
            )}

            {activeTab === 'genres' && (
              <GenresView onSelectAnime={handleSelectAnime} />
            )}

            {activeTab === 'mylist' && (
              <WatchlistView onSelectAnime={handleSelectAnime} onSearch={() => setActiveTab('search')} />
            )}

            {activeTab === 'profile' && (
              <SettingsView />
            )}

            {activeTab === 'download' && (
              <DownloadView onSearch={() => setActiveTab('search')} />
            )}

            {activeTab === 'calendar' && (
              <CalendarView animes={trendingAnimes} onSelectAnime={handleSelectAnime} onSearch={() => setActiveTab('search')} />
            )}

            {activeTab === 'details' && selectedAnime && (
              <DetailsView anime={selectedAnime} onBack={() => setActiveTab('home')} onPlay={handlePlayAnime} />
            )}

            {activeTab === 'player' && selectedAnime && (
              <PlayerView
                anime={selectedAnime}
                episodeId={selectedEpisode}
                initialEpisodeUrl={selectedEpisodeUrl}
                onBack={() => setActiveTab('details')}
                onSelectAnime={handleSelectAnime}
              />
            )}

            {activeTab === 'admin' && (
              <AdminView onBack={() => setActiveTab('home')} adminPassword={adminPassword} />
            )}
          </>
        )}
      </div>

      {/* Floating Admin Button */}
      {activeTab !== 'admin' && (
        <button 
          onClick={handleAdminAuth}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] z-[100] cursor-pointer hover:scale-125 transition-transform flex items-center justify-center"
          aria-label="Admin Panel"
        >
          <div className="w-2 h-2 rounded-full bg-[#c8a2c8]"></div>
        </button>
      )}

      {/* Admin Password Modal */}
      {showAdminPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Admin Access</h3>
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={inputPwd}
              onChange={(e) => setInputPwd(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitAdminAuth(); }}
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAdminPrompt(false); setInputPwd(''); }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold hover:bg-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitAdminAuth}
                className="flex-1 py-2.5 rounded-xl bg-primary text-sm font-bold text-black hover:bg-primary/90 transition cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {activeTab !== 'player' && activeTab !== 'details' && activeTab !== 'admin' && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#181a20]/90 backdrop-blur-md border-t border-white/5 pb-5 pt-3 px-6 z-50 rounded-t-3xl sm:max-w-full sm:rounded-none">
          <div className="flex justify-between items-center text-xs text-gray-500 max-w-md mx-auto">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'home' ? 'text-primary' : 'hover:text-gray-300'}`}>
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'calendar' ? 'text-primary' : 'hover:text-gray-300'}`}>
              <Calendar className="w-5 h-5" />
              <span>Release Ca..</span>
            </button>
            <button onClick={() => setActiveTab('mylist')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'mylist' ? 'text-primary' : 'hover:text-gray-300'}`}>
              <Bookmark className="w-5 h-5" />
              <span>My List</span>
            </button>
            <button onClick={() => setActiveTab('download')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'download' ? 'text-primary' : 'hover:text-gray-300'}`}>
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'profile' ? 'text-primary' : 'hover:text-gray-300'}`}>
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
