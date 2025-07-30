import { envVar } from "../utils/env";

export default async function getPageNews(pageId=null) {
    return new Promise(async (resolve, reject) => {
        try {
            let urlApi = envVar('NEWS_API_URL');
            if (pageId)
                urlApi += `&page=${pageId}`;

            const result = await fetch(urlApi);
            const data = await result.json();

            if (data?.status === 'success')
                resolve({success:true, totalNews:data.totalResults, nextPage:data.nextPage, data:data.results})
            else
                resolve({success:false, message:"Response failed"});
        }
        catch(e) {
            reject({success:false, mesage:e.message})
        }
    })
}
