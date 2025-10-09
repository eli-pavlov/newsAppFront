import { At } from "../api/db.jsx";

/**
 * Fetches settings from the database and ensures default values are set.
 * @param {object|null} user - The user object to fetch settings for.
 * @returns {Promise<object>} The settings result.
 */
export async function getSettingsFromDB(user = null) {
    const result = await At.getSettings(user);

    // Check if the API call was successful and data exists
    if (result.success && result.data) {
        // Ensure arrays exist before trying to iterate over them
        result.data.footer_messages = result.data.footer_messages || [];
        result.data.movies = result.data.movies || [];

        result.data.footer_messages.forEach(m => {
            m.active = m.active ?? false;
        });

        result.data.movies.forEach(m => {
            m.active = m.active ?? false;
            m.times = m.times ?? 1;
        });

        return result;
    } else {
        // If the API call fails, return a default structure to prevent the app from crashing
        console.error("Failed to get settings, using defaults.", result.message);
        return { success: true, data: defaultSettings() };
    }
}

/**
 * Provides a default settings object for the application.
 * @returns {object}
 */
export const defaultSettings = () => {
    return {
        colors_theme: "light",
        title: "News Information System",
        footer_messages: [{ id: 0, msg: "Welcome!", active: true, disabled: true }],
        movies: [],
        online_movies_categories: []
    };
};