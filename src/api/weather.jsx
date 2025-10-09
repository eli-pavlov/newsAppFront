import { getEnvVariable } from "../utils/env.jsx";

export default async function getWeatherData() {
    try {
        const url = getEnvVariable("VITE_WEATHER_API_URL");

        if (!url) {
            throw new Error("Weather API URL is not defined.");
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Weather API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data: data };

    } catch (e) {
        console.error("Failed to get weather data:", e.message);
        return { success: false, message: e.message };
    }
}