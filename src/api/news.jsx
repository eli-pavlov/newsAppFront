import { envVar } from "../utils/env";

export default async function getPageNews(pageId=null) {
    try {
        let urlApi = envVar('NEWS_API_URL');
        if (pageId)
            urlApi += `&page=${pageId}`;

        const result = await fetch(urlApi);
        const data = await result.json();

        if (data?.status === 'success')
            return {success:true, totalNews:data.totalResults, nextPage:data.nextPage, data:data.results}
        else
            return {success:false, message:"Response failed"};
    }
    catch(e) {
        return {success:false, mesage:e.message}
    }
}
