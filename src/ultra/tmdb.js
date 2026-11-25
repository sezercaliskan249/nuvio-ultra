/**
 * TMDB yardımcıları - tüm kaynaklar ortak kullanır (tek istek, önbellekli)
 */

import { fetchJson } from "./http.js";

const TMDB_API_KEY = "68e094699525b18a70bab2f86b1fa706";
const cache = {};

/**
 * TMDB ID -> { title, originalTitle, year, imdbId, isTv }
 */
export function getMediaInfo(tmdbId, mediaType) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const key = (isTv ? "tv" : "movie") + ":" + tmdbId;
  if (cache[key]) return cache[key];

  const endpoint = isTv ? "tv" : "movie";
  const url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;

  const p = fetchJson(url)
    .then((data) => {
      const dateStr = isTv ? data.first_air_date : data.release_date;
      return {
        title: isTv ? data.name : data.title,
        originalTitle: isTv ? data.original_name : data.original_title,
        year: dateStr ? parseInt(dateStr.substring(0, 4), 10) : 0,
        imdbId: (data.external_ids && data.external_ids.imdb_id) || data.imdb_id || null,
        isTv,
        seasons: isTv ? data.number_of_seasons || 1 : 0,
        // Dakika: film süresi / dizide ortalama bölüm süresi (gereken hız hesabı için)
        runtime: isTv
          ? (data.episode_run_time && data.episode_run_time[0]) ||
            (data.last_episode_to_air && data.last_episode_to_air.runtime) ||
            45
          : data.runtime || 0,
      };
    })
    .catch((e) => {
      delete cache[key];
      throw e;
    });

  cache[key] = p;
  return p;
}
