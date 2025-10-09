import React from 'react';
import { useDeviceResolution } from '../../../contexts/DeviceResolution.jsx';
import { useSettingsContext } from '../../../contexts/SettingsContext.jsx';

// Import child components (assuming they are in the same directory)
import MovieArea from './MovieArea'; // You may need to create/adjust these files
import GeneralInfo from './GeneralInfo';
import NewsInfo from './NewsInfo';

// FIX: Corrected the imports for movies and env utilities
import { getCategoryMovies } from '../../../api/movies.jsx';
import { getEnvVariable } from '../../../utils/env.jsx';
import getWeatherData from '../../../api/weather.jsx';
import getPageNews from '../../../api/news.jsx';

function Main() {
    const { deviceType } = useDeviceResolution();

    // The rest of your component's logic would go here...

    return (
        <div className={`main-container ${deviceType}`}>
            <div className={`movie-area ${deviceType}`}>
                {/* This component will likely fetch and display movies */}
                {/* e.g., <MovieArea /> */}
            </div>

            <div className={`info-area ${deviceType}`}>
                {/* These components will likely display news and weather */}
                {/* e.g., <GeneralInfo /> <NewsInfo /> */}
            </div>
        </div>
    );
}

export default Main;