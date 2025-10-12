import { envVar } from "../utils/env";

export default async function getWeatherData() {
    return new Promise(async (resolve, reject) => {
        try {
            const urlApi = envVar('WEATHER_API_URL');
            const result = await fetch(urlApi);
            const data = await result.json();

            if (data?.current)
                resolve({success:true, data:data})
            else
                resolve({success:false, message:"Response failed"});
        }
        catch(e) {
            reject({success:false, mesage:e.message})
        }
    })
}
