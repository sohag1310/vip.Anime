import express from "express";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- API Routes ---
  const ANIWATCH_BASE = "https://aniwatch.us.com";
  const MASUKESTIN_BASE = "https://masukestin.com";

  const ANIME_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  };

  // ── Scraper 1: Anime list
  async function fetchAnimeWatchFeed(page = 1, search = "") {
    const url = search
      ? `${ANIWATCH_BASE}/?s=${encodeURIComponent(search)}`
      : `${ANIWATCH_BASE}/genre/hindi-dubbed/page/${page}/`;
    const res = await axios.get(url, { headers: ANIME_HEADERS, timeout: 12000 });
    const $ = cheerio.load(res.data);
    const animes: any[] = [];

    $(".post-cards article, article.item-1, .items .item").each((_, el) => {
      const elem = $(el);
      const linkEl = elem.find("a").first();
      const title = elem.find(".name, .film-name, h2 a, h3 a, .title").first().text().trim() || linkEl.attr("title") || "";
      const link = linkEl.attr("href") || "";
      const cover = elem.find("img").attr("src") || elem.find("img").attr("data-src") || "";
      if (title && link) {
        const slugMatch = link.replace(/\/$/, "").match(/\/([^\/]+)$/);
        const slug = slugMatch ? slugMatch[1] : Buffer.from(link).toString("base64url").slice(0, 30);
        animes.push({ id: slug, token: "aniwatch", title, cover: cover ? `/api/proxy?url=${encodeURIComponent(cover)}` : "", category: "Anime", posted: "Hindi Dubbed", uploader: "AniWatch", rating: "4.7", tags: ["Hindi Dubbed", "Anime"], pageUrl: link });
      }
    });
    return animes;
  }

  // ── Scraper 2: Episode list
  async function fetchAnimeWatchEpisodes(pageUrl: string) {
    const url = pageUrl.startsWith("http") ? pageUrl : `${ANIWATCH_BASE}/${pageUrl}/`;
    const res = await axios.get(url, { headers: ANIME_HEADERS, timeout: 12000 });
    const $ = cheerio.load(res.data);
    const episodes: any[] = [];

    $(".episodios li, .listing.items.lists li, .episodelist li, #episode_by_temp li").each((_, el) => {
      const elem = $(el);
      const linkEl = elem.find("a").first();
      const epLink = linkEl.attr("href") || "";
      const epTitle = linkEl.find(".episodiotitle, .num-epi").text().trim() || linkEl.attr("title") || "";
      const epNum = epTitle.replace(/[^0-9]/g, "") || String(episodes.length + 1);
      if (epLink) {
        const slugMatch = epLink.replace(/\/$/, "").match(/\/([^\/]+)$/);
        episodes.push({ id: slugMatch ? slugMatch[1] : epLink, episode: epNum, title: epTitle || `Episode ${epNum}`, url: epLink });
      }
    });

    if (episodes.length > 1) {
      const first = parseInt(episodes[0].episode || "0");
      const last = parseInt(episodes[episodes.length - 1].episode || "0");
      if (first > last) episodes.reverse();
    }
    return episodes;
  }

  // ── Scraper 3: File code from m3u8
  async function fetchFileCode(episodePageUrl: string) {
    const res = await axios.get(episodePageUrl, { headers: ANIME_HEADERS, timeout: 12000 });
    const $ = cheerio.load(res.data);
    const html = res.data;
    let embedSrc = "";

    $("iframe").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src.includes("hgcloud") || src.includes("masukestin")) {
        embedSrc = src.startsWith("//") ? "https:" + src : src;
        return false;
      }
    });

    if (!embedSrc) {
      const m = html.match(/(?:hgcloud\.to|masukestin\.com)\/(?:e\/|embed\/)?([a-zA-Z0-9]+)/);
      if (m) embedSrc = `https://hgcloud.to/e/${m[1]}`;
    }
    if (!embedSrc) return null;

    const embedRes = await axios.get(embedSrc, { headers: { ...ANIME_HEADERS, "Referer": episodePageUrl }, timeout: 12000 });
    const embedHtml = embedRes.data;
    const fileCodeMatch = embedSrc.match(/\/e\/([a-zA-Z0-9]+)/) || embedHtml.match(/file_code['":s]+['"]([a-zA-Z0-9]+)['"]/);
    const fileCode = fileCodeMatch ? fileCodeMatch[1] : "";
    const hashMatch = embedHtml.match(/hash['":s]+['"]([a-f0-9\-]+)['"]/i);
    const hash = hashMatch ? hashMatch[1] : "";
    const referer = embedSrc.includes("hgcloud") ? "hgcloud.to" : "masukestin.com";

    return fileCode ? { fileCode, hash, referer } : null;
  }

  async function fetchM3u8(fileCode: string, hash: string, referer: string) {
    const apiUrl = `${MASUKESTIN_BASE}/dl?op=view&file_code=${fileCode}&hash=${hash}&embed=1&referer=${referer}&adb=0&hls4=1`;
    const res = await axios.get(apiUrl, { headers: { ...ANIME_HEADERS, "Referer": `https://masukestin.com/e/${fileCode}`, "Cookie": "tsn=3" }, timeout: 12000 });
    const m = res.data.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    return m ? m[0] : "";
  }

  // --- Image Proxy ---
  app.get("/api/proxy", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) {
        res.status(400).send("No URL provided");
        return;
      }
      const response = await axios.get(url as string, {
        responseType: "stream",
        headers: { "Referer": "https://aniwatch.us.com/" },
        timeout: 10000
      });
      response.data.pipe(res);
    } catch (error: any) {
      res.status(500).send("Proxy error: " + error.message);
    }
  });

  // Route 1: Anime list
  app.get("/api/anime/feed", async (req, res) => {
    try {
      const search = (req.query.search as string) || "";
      const page = req.query.page as string || "1";
      const animes = await fetchAnimeWatchFeed(parseInt(page), search);
      if (animes.length > 0) {
        res.json({ success: true, animes });
      } else {
        res.json({ success: false, error: "Anime list পাওয়া যায়নি।" });
      }
    } catch (err: any) {
      res.json({ success: false, error: err.message });
    }
  });

  // Route 2: Episode list
  app.get("/api/anime/episodes", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).json({ success: false, error: "URL দাও" });
        return;
      }
      const episodes = await fetchAnimeWatchEpisodes(url);
      if (episodes.length > 0) {
        res.json({ success: true, episodes });
      } else {
        res.json({ success: false, episodes: [], error: "Episode পাওয়া যায়নি।" });
      }
    } catch (err: any) {
      res.json({ success: false, episodes: [], error: err.message });
    }
  });

  // Route 3: Stream URL
  app.get("/api/anime/stream", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).json({ success: false, error: "URL দাও" });
        return;
      }
      const fileInfo = await fetchFileCode(url);
      if (!fileInfo) {
        res.json({ success: false, error: "Video embed পাওয়া যায়নি।" });
        return;
      }
      const m3u8Url = await fetchM3u8(fileInfo.fileCode, fileInfo.hash, fileInfo.referer);
      if (m3u8Url) {
        res.json({ success: true, streamUrl: m3u8Url, type: "m3u8" });
      } else {
        res.json({ success: false, error: "Stream URL বের করা সম্ভব হয়নি।" });
      }
    } catch (err: any) {
      res.json({ success: false, error: err.message });
    }
  });

  // Route 4: HLS Proxy (CORS fix for m3u8)
  app.get("/api/anime/hls-proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).send("URL দাও");
        return;
      }
      const response = await axios.get(url, { headers: { ...ANIME_HEADERS, "Referer": "https://masukestin.com/" }, responseType: "text", timeout: 12000 });
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      const base = url.substring(0, url.lastIndexOf("/") + 1);
      const rewritten = response.data.replace(/^(?!#)(.+\.ts.*)$/gm, (match: string) => {
        const tsUrl = match.startsWith("http") ? match : base + match;
        return `/api/anime/ts-proxy?url=${encodeURIComponent(tsUrl)}`;
      });
      res.send(rewritten);
    } catch (err: any) {
      res.status(502).send("HLS proxy error: " + err.message);
    }
  });

  // Route 5: TS Segment Proxy
  app.get("/api/anime/ts-proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).send("URL দাও");
        return;
      }
      const response = await axios.get(url, { headers: { ...ANIME_HEADERS, "Referer": "https://masukestin.com/" }, responseType: "stream", timeout: 20000 });
      res.setHeader("Content-Type", "video/MP2T");
      res.setHeader("Access-Control-Allow-Origin", "*");
      response.data.pipe(res);
    } catch (err) {
      res.status(502).send("TS proxy error");
    }
  });

  // Route 6: ToonStream Episode and Player Resolver
  const toonstreamCache = new Map<string, any>();

  const extractServersFromHtml = (html: string): { name: string; url: string }[] => {
    const $ = cheerio.load(html);
    const servers: { name: string; url: string }[] = [];

    const btnLabels: string[] = [];
    $(".aa-tbs-video .btn, .server-btn, .opt-server, [data-server]").each((_, b) => {
      const text = $(b).text().replace(/\s+/g, " ").trim();
      if (text) btnLabels.push(text);
    });

    $(".video-player .video iframe, #player iframe, iframe").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (
        src &&
        !src.includes("ads") &&
        !src.includes("googletagmanager") &&
        !src.includes("disqus") &&
        !src.includes("google_ads") &&
        !src.endsWith(".json") &&
        !src.includes("/api/")
      ) {
        const cleanSrc = src.startsWith("//") ? `https:${src}` : src;
        if (!cleanSrc.endsWith(".json")) {
          const label = btnLabels[i] || `Server ${i + 1}`;
          if (!servers.some(s => s.url === cleanSrc)) {
            servers.push({ name: label, url: cleanSrc });
          }
        }
      }
    });

    return servers;
  };

  app.get("/api/toonstream/episode", async (req, res) => {
    try {
      const episodeUrl = (req.query.episodeUrl as string) || "";
      const customSlug = (req.query.slug as string) || "";
      const title = (req.query.title as string) || "";
      const titleEnglish = (req.query.titleEnglish as string) || "";
      const ep = parseInt((req.query.episode as string) || "1", 10) || 1;
      const dub = req.query.dub === "DUB";

      const cacheKey = `${episodeUrl}_${customSlug}_${title}_${titleEnglish}_${ep}_${dub}`;
      if (toonstreamCache.has(cacheKey)) {
        res.json(toonstreamCache.get(cacheKey));
        return;
      }

      let foundData: any = null;

      // 1. Direct episode URL if provided
      if (episodeUrl) {
        const targetUrl = episodeUrl.startsWith("http")
          ? episodeUrl
          : `https://toonstream.vip${episodeUrl.startsWith('/') ? '' : '/'}${episodeUrl}`;
        try {
          const pageRes = await axios.get(targetUrl, {
            headers: ANIME_HEADERS,
            timeout: 7000
          });
          if (pageRes.status === 200 && pageRes.data && typeof pageRes.data === 'string' && String(pageRes.headers['content-type'] || '').includes('text/html')) {
            const servers = extractServersFromHtml(pageRes.data);
            if (servers.length > 0) {
              foundData = {
                success: true,
                found: true,
                directUrl: targetUrl,
                slug: customSlug,
                servers
              };
            }
          }
        } catch {
          // Fall through to candidates
        }
      }

      // 2. Slug candidates with unicode accent normalization
      const normalize = (str: string) => {
        return str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      };

      const slugs = new Set<string>();
      if (customSlug) {
        const normCustom = normalize(customSlug).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (normCustom) {
          slugs.add(normCustom);
          slugs.add(normCustom.replace(/-(hindi-dub|hindi|dubbed|dub|sub)$/g, ""));
          slugs.add(normCustom.replace(/-season-\d+/g, ""));
        }
      }

      const titles = [titleEnglish, title].filter(Boolean);
      for (const t of titles) {
        const norm = normalize(t);
        const clean = norm.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "");
        const s1 = clean.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (s1) {
          slugs.add(s1);
          slugs.add(s1.replace(/-(hindi-dub|hindi|dubbed|dub|sub)$/g, ""));
        }

        const noSeason = clean.replace(/season\s*\d+/i, "").replace(/part\s*\d+/i, "").replace(/\d+(st|nd|rd|th)\s*season/i, "");
        const s2 = noSeason.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (s2) {
          slugs.add(s2);
          slugs.add(s2.replace(/-(hindi-dub|hindi|dubbed|dub|sub)$/g, ""));
        }

        const beforeColon = clean.split(/[:\-–]/)[0].trim();
        const s3 = beforeColon.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (s3) {
          slugs.add(s3);
          slugs.add(s3.replace(/-(hindi-dub|hindi|dubbed|dub|sub)$/g, ""));
        }
      }

      const candidateList = Array.from(slugs).filter(Boolean);

      if (!foundData) {
        for (const slug of candidateList) {
          const targets = dub
            ? [`https://toonstream.vip/episode/${slug}-1x${ep}-dub/`, `https://toonstream.vip/episode/${slug}-1x${ep}/`, `https://toonstream.vip/movies/${slug}/`]
            : [`https://toonstream.vip/episode/${slug}-1x${ep}/`, `https://toonstream.vip/episode/${slug}-1x${ep}-sub/`, `https://toonstream.vip/movies/${slug}/`];

          for (const targetUrl of targets) {
            try {
              const pageRes = await axios.get(targetUrl, {
                headers: ANIME_HEADERS,
                timeout: 5000
              });

              if (pageRes.status === 200 && pageRes.data && typeof pageRes.data === 'string' && String(pageRes.headers['content-type'] || '').includes('text/html')) {
                const servers = extractServersFromHtml(pageRes.data);
                if (servers.length > 0) {
                  foundData = {
                    success: true,
                    found: true,
                    directUrl: targetUrl,
                    slug,
                    servers
                  };
                  break;
                }
              }
            } catch {
              // try next
            }
          }
          if (foundData) break;
        }
      }

      // 3. Fallback: Search ToonStream directly for series page & episodes
      if (!foundData && titles.length > 0) {
        try {
          const searchTitle = normalize(titles[0]).split(/[:\-–]/)[0].trim();
          const searchRes = await axios.get(`https://toonstream.vip/s?q=${encodeURIComponent(searchTitle)}`, {
            headers: ANIME_HEADERS,
            timeout: 5000
          });
          if (searchRes.status === 200 && typeof searchRes.data === 'string') {
            const $s = cheerio.load(searchRes.data);
            const firstSeriesLink = $s("article a.lnk-blk").first().attr("href") || $s("article a").first().attr("href");
            if (firstSeriesLink) {
              const seriesPageRes = await axios.get(firstSeriesLink, { headers: ANIME_HEADERS, timeout: 5000 });
              if (seriesPageRes.status === 200 && typeof seriesPageRes.data === 'string') {
                const $series = cheerio.load(seriesPageRes.data);
                let matchedEpLink = "";
                $series("a[href*='/episode/']").each((_, a) => {
                  const href = $series(a).attr("href") || "";
                  if (href.includes(`1x${ep}`) || href.includes(`-${ep}/`) || href.includes(`episode-${ep}`)) {
                    matchedEpLink = href;
                    return false;
                  }
                });
                if (!matchedEpLink) {
                  matchedEpLink = $series("a[href*='/episode/']").first().attr("href") || "";
                }
                if (matchedEpLink) {
                  const epUrl = matchedEpLink.startsWith("http") ? matchedEpLink : `https://toonstream.vip${matchedEpLink.startsWith('/') ? '' : '/'}${matchedEpLink}`;
                  const epPageRes = await axios.get(epUrl, { headers: ANIME_HEADERS, timeout: 5000 });
                  if (epPageRes.status === 200 && typeof epPageRes.data === 'string' && String(epPageRes.headers['content-type'] || '').includes('text/html')) {
                    const servers = extractServersFromHtml(epPageRes.data);
                    if (servers.length > 0) {
                      foundData = {
                        success: true,
                        found: true,
                        directUrl: epUrl,
                        slug: customSlug || candidateList[0] || "anime",
                        servers
                      };
                    }
                  }
                }
              }
            }
          }
        } catch {
          // ignore search error
        }
      }

      const fallbackSlug = candidateList[0] || "anime";
      const fallbackUrl = `https://toonstream.vip/episode/${fallbackSlug}-1x${ep}${dub ? "-dub" : ""}/`;

      const responsePayload = foundData || {
        success: true,
        found: false,
        directUrl: fallbackUrl,
        slug: fallbackSlug,
        servers: []
      };

      if (toonstreamCache.size > 200) toonstreamCache.clear();
      toonstreamCache.set(cacheKey, responsePayload);

      res.json(responsePayload);
    } catch (err: any) {
      res.json({
        success: false,
        error: err.message,
        servers: []
      });
    }
  });

  // Route 7: ToonStream Anime Feed Scraper & Search with Video Availability Verification
  const feedCache = new Map<string, { timestamp: number; data: any }>();
  const CACHE_TTL = 15 * 60 * 1000; // 15 mins

  // In-memory verification cache: link -> { hasVideo, episodesCount, isMovie, firstEpUrl, checkedAt }
  const verifiedAnimeCache = new Map<string, {
    hasVideo: boolean;
    episodesCount: number;
    isMovie: boolean;
    firstEpUrl?: string;
    checkedAt: number;
  }>();
  const VERIFY_TTL = 30 * 60 * 1000; // 30 minutes

  const verifyAnimeVideoAvailability = async (link: string): Promise<{
    hasVideo: boolean;
    episodesCount: number;
    isMovie: boolean;
    firstEpUrl?: string;
  }> => {
    const cached = verifiedAnimeCache.get(link);
    if (cached && Date.now() - cached.checkedAt < VERIFY_TTL) {
      return cached;
    }

    const targetUrl = link.startsWith("http")
      ? link
      : `https://toonstream.vip${link.startsWith('/') ? '' : '/'}${link}`;

    try {
      const pageRes = await axios.get(targetUrl, {
        headers: ANIME_HEADERS,
        timeout: 6000
      });

      if (pageRes.status !== 200 || !pageRes.data || typeof pageRes.data !== "string") {
        const res = { hasVideo: false, episodesCount: 0, isMovie: false };
        verifiedAnimeCache.set(link, { ...res, checkedAt: Date.now() });
        return res;
      }

      const $ = cheerio.load(pageRes.data);
      const epLinks: string[] = [];
      $("a[href*=\"/episode/\"]").each((_, a) => {
        const h = $(a).attr("href");
        if (h && !epLinks.includes(h)) epLinks.push(h);
      });

      // 1. If it has series episode links: check first episode for working stream servers
      if (epLinks.length > 0) {
        const firstEp = epLinks[0].startsWith("http")
          ? epLinks[0]
          : `https://toonstream.vip${epLinks[0].startsWith('/') ? '' : '/'}${epLinks[0]}`;
        try {
          const epRes = await axios.get(firstEp, { headers: ANIME_HEADERS, timeout: 5000 });
          if (epRes.status === 200 && epRes.data && typeof epRes.data === "string") {
            const srvs = extractServersFromHtml(epRes.data);
            if (srvs.length > 0) {
              const res = { hasVideo: true, episodesCount: epLinks.length, isMovie: false, firstEpUrl: firstEp };
              verifiedAnimeCache.set(link, { ...res, checkedAt: Date.now() });
              return res;
            }
          }
        } catch {
          // Fall through
        }
        // If first episode had no servers, check direct page (e.g. embed on series page)
        const directSrvs = extractServersFromHtml(pageRes.data);
        if (directSrvs.length > 0) {
          const res = { hasVideo: true, episodesCount: 1, isMovie: true, firstEpUrl: targetUrl };
          verifiedAnimeCache.set(link, { ...res, checkedAt: Date.now() });
          return res;
        }
        const res = { hasVideo: false, episodesCount: 0, isMovie: false };
        verifiedAnimeCache.set(link, { ...res, checkedAt: Date.now() });
        return res;
      }

      // 2. If no episode links, check if it is a movie with direct video servers on page
      const directSrvs = extractServersFromHtml(pageRes.data);
      if (directSrvs.length > 0) {
        const res = { hasVideo: true, episodesCount: 1, isMovie: true, firstEpUrl: targetUrl };
        verifiedAnimeCache.set(link, { ...res, checkedAt: Date.now() });
        return res;
      }

      // No episode links and no video embed iframes found -> dead/empty poster
      const res = { hasVideo: false, episodesCount: 0, isMovie: false };
      verifiedAnimeCache.set(link, { ...res, checkedAt: Date.now() });
      return res;
    } catch {
      const res = { hasVideo: false, episodesCount: 0, isMovie: false };
      verifiedAnimeCache.set(link, { ...res, checkedAt: Date.now() });
      return res;
    }
  };

  app.get("/api/toonstream/feed", async (req, res) => {
    try {
      const page = parseInt((req.query.page as string) || "1", 10) || 1;
      const category = (req.query.category as string) || "anime";
      const search = (req.query.search as string) || "";
      const cacheKey = `feed_${page}_${category}_${search}`;

      const cached = feedCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        res.json(cached.data);
        return;
      }

      let fetchUrl = "";
      if (search) {
        fetchUrl = `https://toonstream.vip/s?q=${encodeURIComponent(search)}`;
      } else if (category === "hindi-dubbed") {
        fetchUrl = page === 1 ? `https://toonstream.vip/category/hindi-dubbed/` : `https://toonstream.vip/category/hindi-dubbed/?page=${page}`;
      } else if (category === "series") {
        fetchUrl = `https://toonstream.vip/series/?page=${page}`;
      } else {
        fetchUrl = `https://toonstream.vip/category/anime?type=all&page=${page}`;
      }

      const response = await axios.get(fetchUrl, {
        headers: ANIME_HEADERS,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const rawAnimes: any[] = [];

      $("article").each((_, el) => {
        const title = $(el).find(".entry-title, h2, h3").first().text().trim();
        const link = $(el).find("a.lnk-blk").attr("href") || $(el).find("a").first().attr("href") || "";
        const img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
        const vote = $(el).find(".vote").text().replace(/TMDB/i, "").trim() || "8.5";

        if (title && link) {
          const slug = link.replace(/\/$/, "").split("/").pop() || "";
          const largeImg = img.includes("/w") ? img.replace(/\/w\d+\//, "/w780/") : img;

          rawAnimes.push({
            mal_id: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            slug,
            title,
            title_english: title,
            pageUrl: link,
            images: {
              jpg: {
                image_url: img,
                large_image_url: largeImg || img
              }
            },
            score: parseFloat(vote) || 8.5,
            synopsis: `${title} - Full series streaming on ToonStream. High definition stream with multiple audio dubs and subtitle options.`,
            type: link.includes("/movies/") ? "Movie" : "TV",
            year: 2024
          });
        }
      });

      // Concurrently verify video availability in batches of 6
      const batchSize = 6;
      const verifiedAnimes: any[] = [];
      for (let i = 0; i < rawAnimes.length; i += batchSize) {
        const chunk = rawAnimes.slice(i, i + batchSize);
        const chunkResults = await Promise.all(chunk.map(async (item) => {
          const v = await verifyAnimeVideoAvailability(item.pageUrl);
          if (v.hasVideo) {
            return {
              ...item,
              hasVideo: true,
              isMovie: v.isMovie,
              episodesCount: v.episodesCount,
              firstEpUrl: v.firstEpUrl,
              type: v.isMovie ? "Movie" : item.type
            };
          }
          return null;
        }));
        for (const item of chunkResults) {
          if (item) verifiedAnimes.push(item);
        }
      }

      const result = {
        success: true,
        page,
        totalPages: 47,
        category,
        totalRaw: rawAnimes.length,
        count: verifiedAnimes.length,
        animes: verifiedAnimes
      };

      if (feedCache.size > 200) feedCache.clear();
      feedCache.set(cacheKey, { timestamp: Date.now(), data: result });

      res.json(result);
    } catch (err: any) {
      console.error("Feed error:", err.message);
      res.json({
        success: false,
        error: err.message,
        animes: []
      });
    }
  });

  // Route 8: ToonStream Series Details & Episodes Scraper (with Movie support)
  app.get("/api/toonstream/series", async (req, res) => {
    try {
      const urlPath = (req.query.url as string) || (req.query.slug ? `/series/${req.query.slug}` : "");
      if (!urlPath) {
        res.status(400).json({ success: false, error: "URL or slug required" });
        return;
      }

      const targetUrl = urlPath.startsWith("http") ? urlPath : `https://toonstream.vip${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
      const response = await axios.get(targetUrl, {
        headers: ANIME_HEADERS,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const title = $("h1").first().text().replace(/SCHEDULE.*$/i, "").trim();
      const desc = $(".description p, .overview p, .entry-content p, .description").first().text().trim();
      
      const genres: string[] = [];
      $(".genres a, .genre a, a[href*=\"category\"]").each((_, a) => {
        const t = $(a).text().trim();
        if (t && !genres.includes(t)) genres.push(t);
      });

      const episodes: any[] = [];
      $("a[href*=\"/episode/\"]").each((_, a) => {
        const href = $(a).attr("href") || "";
        const epMatch = href.match(/1x(\d+)/i) || href.match(/episode-(\d+)/i);
        const epNum = epMatch ? parseInt(epMatch[1], 10) : (episodes.length + 1);
        if (!episodes.some(e => e.url === href)) {
          episodes.push({
            id: epNum,
            episode: epNum,
            title: `Episode ${epNum}`,
            url: href
          });
        }
      });

      episodes.sort((a, b) => a.episode - b.episode);

      // If no episodes found with /episode/, check if this page is a Movie with direct video servers!
      let isMovie = false;
      if (episodes.length === 0) {
        const directServers = extractServersFromHtml(response.data);
        if (directServers.length > 0) {
          isMovie = true;
          episodes.push({
            id: 1,
            episode: 1,
            title: "Full Movie",
            url: targetUrl
          });
        }
      }

      res.json({
        success: true,
        title,
        synopsis: desc,
        genres,
        isMovie,
        episodesCount: episodes.length,
        hasPlayableVideo: episodes.length > 0,
        episodes
      });
    } catch (err: any) {
      res.json({ success: false, error: err.message, episodes: [] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
