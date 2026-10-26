export interface Anime {
  mal_id: number | string;
  title_english?: string;
  title: string;
  searchTitle?: string;
  slug?: string;
  pageUrl?: string;
  images: {
    jpg: {
      image_url?: string;
      large_image_url: string;
    };
  };
  score: number | string | null;
  synopsis?: string;
  type?: string;
  year?: number | string;
  episodes?: number;
  genres?: string[];
  firstEpUrl?: string;
  isMovie?: boolean;
  hasVideo?: boolean;
  episodesCount?: number;
}
