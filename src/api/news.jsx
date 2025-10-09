// FIX: Changed import from 'envVar' to 'getEnvVariable' and added .jsx extension
import { getEnvVariable } from "../utils/env.jsx";

export default async function getPageNews(pageId = null) {
    try {
        // FIX: Changed function call from 'envVar' to 'getEnvVariable'
        let url = getEnvVariable("VITE_NEWS_API_URL");

        if (!url) {
            throw new Error("News API URL is not defined.");
        }

        if (pageId) {
            url += `&page=${pageId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`News API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data: data };

    } catch (e) {
        console.error("Failed to get news data:", e.message);
        return { success: false, message: e.message };
    }
}