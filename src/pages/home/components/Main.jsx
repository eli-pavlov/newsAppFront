import { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';

import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useDeviceContext } from '../../../contexts/DeviceResolution';
import { getEnvVariable } from '../../../utils/env';
import { getWeather } from '../../../api/weather';
import { getNews } from '../../../api/news';
import { getOnlineMovies } from '../../../api/movies';

import Loader from '../../../components/Loader';

const MoviePlayer = () => {
    const { deviceType } = useDeviceContext();
    const { settings } = useSettingsContext();
    let moviesList = useRef([]);
    let onlineMovies = useRef({});
    let onlineMoviesCategoryIndex = useRef(0);
    const videoIndex = useRef(-1);
    const [videoSrc, setVideoSrc] = useState(null);
    const [videoKey, setVideoKey] = useState(0); // Used to force re-render
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    // FIX #1: Added dependencies to useEffect to update playlist when settings change
    useEffect(() => {
        const categories = settings.online_movies_categories || [];
        if(categories.length > 0) {
            getOnlineMoviesCycle();
        }
        buildMoviesCycle();
    }, [settings.movies, settings.online_movies_categories]); 
    // END FIX #1

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || videoSrc === "") return;
        
        let handleVideoEnd = null;
        
        const handleLoadedData = () => {
            videoElement.removeEventListener('loadeddata', handleLoadedData);
            setIsLoading(false);
            videoElement.muted = true;
            videoElement.play().catch(error => console.warn("Autoplay failed:", error));
            handleVideoEnd = () => {
                videoElement.removeEventListener('ended', handleVideoEnd);
                playNextMovie();
            };
            videoElement.addEventListener('ended', handleVideoEnd);
        };
        
        videoElement.addEventListener('loadeddata', handleLoadedData);
        videoElement.load();
        
        return () => {
            videoElement.removeEventListener('loadeddata', handleLoadedData);
            if(handleVideoEnd) {
                videoElement.removeEventListener('ended', handleVideoEnd);
            }
        };
    }, [videoSrc, videoKey]);
    
    // ... (Your other functions like getOnlineMoviesCycle, buildMoviesCycle remain the same)

    const buildMoviesCycle = () => {
        let moviesInCycle = [];
        moviesList.current = [];
        const localMovies = settings.movies || [];

        localMovies.forEach(item => {
            if (item.active) {
                moviesInCycle.push({ ...item });
            }
        });

        let isEmpty = true;
        while (isEmpty === false) {
            isEmpty = true;
            moviesInCycle.forEach(item => {
                let times = parseInt(item.times);
                if (times > 0) {
                    isEmpty = false;
                    moviesList.current.push(item.url);
                    item.times = times - 1;
                }
            });
        }
        playNextMovie();
    }
    
    const playNextMovie = () => {
        if (moviesList.current.length === 0) return;
        setIsLoading(true);
        videoIndex.current = (videoIndex.current + 1) % moviesList.current.length;
        const nextVideo = moviesList.current[videoIndex.current];
        if (videoSrc === nextVideo) {
            setVideoKey(prevKey => prevKey + 1);
        } else {
            setVideoSrc(nextVideo);
        }
    };

    return (
        <div className="movie-container">
            {isLoading && <div className="movie-loader"><Loader /></div>}
            {videoSrc && (
                <video ref={videoRef} className={`movie ${deviceType}`} key={`${videoSrc}-${videoKey}`}>
                    <source id="videoSrc" src={videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}
        </div>
    );
};

const GeneralInfo = () => {
    // ... (This component appears correct, no changes needed)
};

const NewsCard = ({ text }) => {
    // ... (This component appears correct, no changes needed)
};

const News = () => {
    const newsList = useRef([]);
    const pageId = useRef(0);
    const totalNews = useRef(0);
    const newsIndex = useRef(0);
    const newsOnScreen = getEnvVariable('NEWS_ON_SCREEN');
    const [newsItems, setNewsItems] = useState(Array(parseInt(newsOnScreen)).fill({ title: '', id: null }));
    const { deviceType } = useDeviceContext();

    const getNewsData = async (page = null) => {
        const result = await getNews(page);
        if (result?.success) {
            pageId.current = result.nextPage;
            totalNews.current = result.totalNews;
            // FIX #2: Store a unique identifier for each news article
            result.data.forEach(article => {
                newsList.current.push({
                    title: article.title,
                    id: article.article_id || article.link // Use a unique field from the API
                });
            });
            if (!page) { // First time loading
                updateNewsOnScreen();
            }
        }
    };

    const updateNewsOnScreen = () => {
        let items = [];
        for (let i = 0; i < newsOnScreen; i++) {
            if (newsIndex.current + i < newsList.current.length - 1) {
                items.push(newsList.current[newsIndex.current + i]);
            }
        }
        setNewsItems(items);
        newsIndex.current += (items.length - 1);
    };

    useEffect(() => {
        let interval = null;
        (async () => {
            await getNewsData();
            const intervalTime = parseInt(getEnvVariable('VITE_NEWS_INTERVAL_IN_MIN')) * 1000 * 60;
            interval = setInterval(() => {
                if (newsIndex.current + (2 * newsOnScreen) > newsList.current.length) {
                    getNewsData(pageId.current);
                }
                if (totalNews.current > 0) {
                    updateNewsOnScreen();
                }
            }, intervalTime);
        })();
        return () => { clearInterval(interval) };
    }, []);

    return (
        <div className={`news-info ${deviceType}`}>
            {/* FIX #2: Use the unique 'id' as the key */}
            {newsItems.map((item, index) => (
                <NewsCard text={item.title} key={item.id || index} />
            ))}
        </div>
    );
};

function Main() {
    const { deviceType } = useDeviceContext();

    return (
        <div className={`main-container ${deviceType}`}>
            <div className={`movie-area ${deviceType}`}>
                <MoviePlayer />
            </div>
            <div className={`info-area ${deviceType}`}>
                <GeneralInfo />
                <News />
            </div>
        </div>
    );
}

export default Main;