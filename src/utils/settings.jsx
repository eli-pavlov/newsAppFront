// newsAppFront/src/utils/settings.jsx
import At from "../api/db"; // Fixed: Changed to default import (was { db })

export async function getSettingsFromDB(user=null) {
    try {
        let result = null;
        if (user) {
            result = await At.getSettings(user); // Fixed: Use At (default instance)
        } else {
            result = await At.getSettings(); // Fixed: Use At
        }

        // get the movies files list from server folder
        const serverMoviesList = await At.getMoviesList(At.getUserId(user)); // Fixed: Use At

        let serverMoviesNames = [];
        let serverMoviesInfo = {};
        serverMoviesList.forEach(f => {
            serverMoviesNames.push(f.name);
            serverMoviesInfo[f.name] = {subFolder:f.subFolder, url:f.url};
        });

        if (result.success) {
            // get the saved movies list
            const settingsMovies = result.data.movies.map(item => item.file_name);

            // get the movies files list that were removed from server folder since last save 
            const missingFiles = settingsMovies.filter(f => !serverMoviesNames.includes(f));

            // find the new files that added to server folder
            const newFiles = serverMoviesNames.filter(f => !settingsMovies.includes(f));

            // create the updated movies list 
            // get only the saved files that are still exists in server folder (ignore the removed files)
            let finalSettingsMoviesList = result.data.movies.filter(item => !missingFiles.includes(item.file_name));

            // add the new movies files
            newFiles.forEach(f => {
                finalSettingsMoviesList.push({
                    file_name: f,
                });
            })

            // add the full url for each movie file
            finalSettingsMoviesList.forEach(f => {
                f.deletable = (serverMoviesInfo[f.file_name].subFolder !== null);
                f.url = serverMoviesInfo[f.file_name].url;
                f.subFolder = serverMoviesInfo[f.file_name].subFolder;
            })

            result.data.movies = finalSettingsMoviesList;

            return result;
        }
        else {
            // in case there is no saved settings, return also the server movies files
            const folderFilesList = serverMoviesList.map(f => ({
                file_name: f.name,
                url: f.url,
                deletable: f.deletable
            }));

            result.movies = folderFilesList;
            result.message = result.message ?? "Get settings failed.";

            return result;
        }
    }
    catch (e) {
        return { success:false, message: e.message};
    }
}