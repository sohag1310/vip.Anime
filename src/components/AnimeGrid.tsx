import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Search, Bookmark, BookmarkCheck } from "lucide-react";

export default function AnimeGrid({ onSelect, bookmarkedIds = [], onToggleBookmark }: any) {
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchAnimes(1, search); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchAnimes(page, search); }, [page]);

  async function fetchAnimes(p: number, q: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/anime/feed?search=${encodeURIComponent(q)}&page=${p}`);
      const data = await res.json();
      if (data.success && data.animes?.length > 0) setAnimes(data.animes);
      else setError("Anime list পাওয়া যায়নি।");
    } catch { setError("Anime load করতে সমস্যা হয়েছে।"); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 pt-8">
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Hindi Dubbed Anime search করুন..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-600 transition"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-violet-500 animate-spin" /></div>
      )}
      {!loading && error && (
        <div className="flex flex-col items-center py-16 gap-3 text-zinc-500">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {animes.map(anime => (
              <div key={anime.id} className="group relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 cursor-pointer hover:border-violet-600 transition" onClick={() => onSelect(anime)}>
                <div className="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                  {anime.cover
                    ? <img src={anime.cover} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">No Image</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                  {/* Bookmark */}
                  <button
                    onClick={e => { e.stopPropagation(); onToggleBookmark?.(anime.id, e); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-zinc-400 hover:text-violet-400 transition"
                  >
                    {bookmarkedIds.includes(anime.id) ? <BookmarkCheck className="h-3.5 w-3.5 text-violet-400" /> : <Bookmark className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-zinc-100 line-clamp-2 leading-snug">{anime.title}</p>
                  <p className="mt-1 text-[10px] text-violet-400 font-mono">{anime.posted || "Hindi Dubbed"}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
              ← Prev
            </button>
            <span className="text-xs font-mono text-zinc-500">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition cursor-pointer">
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
