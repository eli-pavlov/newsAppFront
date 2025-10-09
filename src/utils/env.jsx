// A simple object containing fallback values for environment variables.
// These are used during local development if a .env file is not present.
const defaultEnv = {
    VITE_NEWS_API_URL: "https://newsdata.io/api/1/latest?apikey=YOUR_API_KEY&country=il&language=he",
    VITE_NEWS_ON_SCREEN: 4,
    VITE_WEATHER_API_URL: "https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=Tel Aviv",
    VITE_WEATHER_INTERVAL_IN_MIN: 10,
    VITE_ONLINE_MOVIES_API_KEY: "YOUR_API_KEY",
    VITE_ONLINE_MOVIES_API_URL: "https://api.pexels.com/videos/search?orientation=landscape&size=medium&per_page=100&query=",
    VITE_ONLINE_MOVIES_CATEGORIES: "Animals,Sport,Cars,Jungles,Flowers,Beaches,Buildings,Sunsets,Waterfalls,Amusement parks",
    VITE_ONLINE_MOVIES_MIN_DURATION: 15
};

/**
 * Retrieves an environment variable. It prioritizes variables loaded by Vite,
 * then falls back to a default object.
 * @param {string} name - The name of the environment variable (e.g., "SERVER_URL").
 * @returns {string|number} The value of the environment variable.
 */
export function getEnvVariable(name) {
    const varName = name.startsWith('VITE_') ? name : `VITE_${name}`;
    return import.meta.env[varName] || defaultEnv[varName];
}