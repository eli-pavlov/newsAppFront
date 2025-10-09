// FIX: Changed import from 'envVar' to 'getEnvVariable'
import { getEnvVariable } from "../utils/env.jsx";

/**
 * Fetches a list of stock videos from the Pexels API based on a category.
 * @param {string} category - The search term for the videos.
 * @param {number} [pageId=1] - The page number to fetch.
 * @returns {Promise<object>} An object containing the success status and data.
 */
export async function getCategoryMovies(category, pageId = 1) {
    try {
        // FIX: Changed all calls from 'envVar' to 'getEnvVariable'
        const apiKey = getEnvVariable("VITE_ONLINE_MOVIES_API_KEY");
        const baseUrl = getEnvVariable("VITE_ONLINE_MOVIES_API_URL");
        const minDuration = getEnvVariable("VITE_ONLINE_MOVIES_MIN_DURATION");

        if (!apiKey || !baseUrl) {
            throw new Error("Movies API URL or Key is not defined in environment variables.");
        }

        const url = `${baseUrl}${category}&page=${pageId}`;
        
        const response = await fetch(url, {
            headers: {
                Authorization: apiKey,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Movies API request failed with status ${response.status}`);
        }

        const data = await response.json();
        let relevantMovies = [];

        if (data.videos && data.videos.length > 0) {
            // Filter videos by minimum duration and map to get the video link
            relevantMovies = data.videos
                .filter(movie => movie.duration > Number(minDuration || 15))
                .map(movie => movie.video_files[0].link);
        }

        return {
            success: true,
            category: category,
            totalMovies: relevantMovies.length,
            pageId: pageId,
            nextPage: data.next_page,
            videos: relevantMovies,
        };

    } catch (e) {
        console.error("Failed to get movies data:", e.message);
        // FIX: Corrected typo from 'mesage' to 'message'
        return { success: false, message: e.message };
    }
}

// NOTE: The other functions (uploadMovie, deleteMovie) were removed from this file.
// That logic for uploading to your own server is already correctly handled in `src/api/db.jsx`.
// This file should only be used for fetching from the external Pexels API.