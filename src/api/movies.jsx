import { envVar } from "../utils/env";

export default async function getCategoryMovies(category, pageId = 1) {
    return new Promise(async (resolve, reject) => {
        try {
            let urlApi = envVar('ONLINE_MOVIES_API_URL');
            urlApi += category;
            urlApi += `&page=${pageId}`;

            const result = await fetch(urlApi, {
                headers: {
                    Authorization: envVar('ONLINE_MOVIES_API_KEY')
                }}
            );
            const data = await result.json();

            if (result.ok) {
                let relevantMovies = [];
                
                if (data.videos.length > 0) {
                    relevantMovies = data.videos.filter(m => m.duration > Number(envVar('ONLINE_MOVIES_MIN_DURATION')));
                    relevantMovies = relevantMovies.map(m => m.video_files[0].link);
                }
                resolve({ success: true, category:category, totalMovies: relevantMovies.length, pageId:pageId, nextPage: data.next_page, videos: relevantMovies })
            }
            else
                resolve({ success: false, message: data.error });
        }
        catch (e) {
            reject({ success: false, mesage: e.message })
        }
    })
}
