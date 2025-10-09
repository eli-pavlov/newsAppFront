import { useState, useEffect, useRef } from 'react';

import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useDeviceContext } from '../../../contexts/DeviceResolution';
import { getEnvVariable } from '../../../utils/env';
import { getNews } from '../../../api/news';

import Loader from '../../../components/Loader';

// --- Movie Player Component ---

const MoviePlayer = () => {
    const { deviceType } = useDeviceContext();
    const { settings } = useSettingsContext();
    const moviesList = useRef([]);
    const videoIndex = useRef(-1);
    const [videoSrc, setVideoSrc] = useState(null);
    const [videoKey, setVideoKey] = useState(0); // Used to force re-render
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        buildMoviesCycle();
    }, [settings.movies, settings.online_movies_categories]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || videoSrc === null) return;
        
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
            if (handleVideoEnd) {
                videoElement.removeEventListener('ended', handleVideoEnd);
            }
        };
    }, [videoSrc, videoKey]);

    const buildMoviesCycle = () => {
        const localMovies = settings.movies || [];
        const finalPlaylist = [];

        localMovies.forEach(movie => {
            if (movie.active) {
                for (let i = 0; i < parseInt(movie.times, 10); i++) {
                    finalPlaylist.push(movie.url);
                }
            }
        });
        
        moviesList.current = finalPlaylist;

        if (finalPlaylist.length > 0) {
            playNextMovie();
        } else {
            setVideoSrc(null); // Clear video if playlist becomes empty
        }
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
                    <source src={videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}
        </div>
    );
};

// --- General Info Component ---

const GeneralInfo = () => {
    // This component was empty in your provided code.
    // I've kept it as a placeholder. You can add your weather/time logic here.
    const [time, setTime] = useState("00:00:00");
    const [date, setDate] = useState("00/00/0000");

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('he-IL', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false }));
            setDate(now.toLocaleDateString('he-IL', { timeZone: "Asia/Jerusalem", year: 'numeric', month: 'numeric', day: 'numeric' }).replaceAll('.', '/'));
        };
        updateClock();
        const clockInterval = setInterval(updateClock, 1000);
        return () => clearInterval(clockInterval);
    }, []);

    return (
        <div className="general-info">
             <div className={`date-time`}>
                <div className="date-time-area">{time}</div>
                <div className="date-time-area">{date}</div>
            </div>
            {/* Placeholder for Weather Icon and Temp */}
            <div className={`weather`}>
            </div>
        </div>
    );
};

// --- News Components ---

const NewsCard = ({ text }) => {
    // A simple display card for a single news item
    return <div className="news-card">{text}</div>;
};

const News = () => {
    const newsList = useRef([]);
    const pageId = useRef(0);
    const totalNews = useRef(0);
    const newsIndex = useRef(0);
    const newsOnScreen = parseInt(getEnvVariable('NEWS_ON_SCREEN') || '5', 10);
    const [newsItems, setNewsItems] = useState(Array(newsOnScreen).fill({ title: '', id: null }));
    const { deviceType } = useDeviceContext();

    const getNewsData = async (page = null) => {
        const result = await getNews(page);
        if (result?.success) {
            pageId.current = result.nextPage;
            totalNews.current = result.totalNews;
            result.data.forEach(article => {
                newsList.current.push({
                    title: article.title,
                    id: article.article_id || article.link
                });
            });
            if (!page) { // First time loading
                updateNewsOnScreen();
            }
        }
    };

    const updateNewsOnScreen = () => {
        if (newsList.current.length === 0) return;
        let items = [];
        for (let i = 0; i < newsOnScreen; i++) {
            const currentIndex = (newsIndex.current + i) % newsList.current.length;
            items.push(newsList.current[currentIndex]);
        }
        setNewsItems(items);
        newsIndex.current = (newsIndex.current + newsOnScreen) % newsList.current.length;
    };

    useEffect(() => {
        let interval = null;
        (async () => {
            await getNewsData();
            const intervalTime = parseInt(getEnvVariable('VITE_NEWS_INTERVAL_IN_MIN') || '1', 10) * 60 * 1000;
            if (intervalTime > 0) {
                interval = setInterval(() => {
                    if (newsIndex.current + (2 * newsOnScreen) > newsList.current.length && pageId.current) {
                        getNewsData(pageId.current);
                    }
                    if (totalNews.current > 0) {
                        updateNewsOnScreen();
                    }
                }, intervalTime);
            }
        })();
        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);

    return (
        <div className={`news-info ${deviceType}`}>
            {newsItems.map((item, index) => (
                <NewsCard text={item.title} key={item.id || index} />
            ))}
        </div>
    );
};

// --- Main Component (Default Export) ---

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