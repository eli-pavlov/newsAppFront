import '../Home.css'
import { useEffect, useState, useRef } from 'react'
import { useDeviceResolution } from '../../../contexts/DeviceResolution';
import getWeatherData from '../../../api/weather';
import getPageNews from '../../../api/news';
import getCategoryMovies from '../../../api/movies';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { envVar } from '../../../utils/env';
import Loader from '../../../components/Loader'

function MovieArea() {
    const { deviceType } = useDeviceResolution();
    const {settings } = useSettingsContext();
    let movieList = useRef([]);
    let onlineMovieList = useRef({});
    let categoryIndex = useRef(0);

    const movieIndex = useRef(-1);
    const [movieFile, setMovieFile] = useState(null);
    const [forceMovie, setForceMovie] = useState(0);

    const videoRef = useRef(null);
    const [viewLoader, setViewLoader] = useState(false);

    function getNextCategoryMovies() {
        if (categoryIndex.current < settings.online_movies_categories.length) {
            if (settings.online_movies_categories[categoryIndex.current].selected)
                getCategoryMoviesList(settings.online_movies_categories[categoryIndex.current].name);
            else {
                categoryIndex.current++;
                getNextCategoryMovies();
            }
        }
        else {
            if (Object.keys(onlineMovieList.current).length === 0)
                return;

            let allMoviesInList = false;
            let newMoviesList = [];
            let downloadedMoviesInd = 0;
            let allDownloadMoviesLocated = (movieList.current.length === 0);
            
            while (!allMoviesInList || !allDownloadMoviesLocated) {
                // add download video to list
                if (downloadedMoviesInd < movieList.current.length) {
                    newMoviesList.push(movieList.current[downloadedMoviesInd]);
                    downloadedMoviesInd++;

                    if (downloadedMoviesInd === movieList.current.length) {
                        allDownloadMoviesLocated = true;
                        downloadedMoviesInd = 0;
                    }
                }

                // add online video to list
                allMoviesInList = true;
                Object.keys(onlineMovieList.current).forEach(c => {
                    if (onlineMovieList.current[c].length > 0) {
                        allMoviesInList = false;
                        newMoviesList.push(onlineMovieList.current[c][0]);
                        onlineMovieList.current[c].splice(0,1);
                    }
                })    
            }

            const noDownloadedMoviesToDisplay = (movieList.current.length === 0);

            movieList.current = [...newMoviesList];

            if (noDownloadedMoviesToDisplay) {
                nextMovie();
            }
        }
    }

    async function getCategoryMoviesList(category, pageId = null) {
        if (!pageId)
            pageId = Math.floor(Math.random() * 50);

        console.log(`Get online videos for category ${category}`);

        const data = await getCategoryMovies(category, pageId);

        console.log(data);
        
        if (data.success) {
            if (data.totalMovies >= 10) {
                onlineMovieList.current[data.category] = [...data.videos];
                categoryIndex.current++;
                getNextCategoryMovies();
            }
            else {
                // try to find a new page with at least 10 videos
                pageId = Math.max(1, Math.floor(data.pageId / 2));
                getCategoryMoviesList(data.category, pageId)
            }
        }
    }

    function initMovies() {
        let viewMovies = [];

        movieList.current = viewMovies.map(m => m.url);
        settings.movies.forEach(m => { 
            if (m.active)
                viewMovies.push({...m});
        });
        
        let quit = false;
        while (!quit) {
            quit = true;
            viewMovies.forEach(m => {
                let t = parseInt(m.times);
                if (t > 0) {
                    quit = false;
                    movieList.current.push(m.url);
                    m.times = t - 1;
                }
            })
        }

        nextMovie();
    }

    function nextMovie() {
        if (movieList.current.length === 0)
            return;

        setViewLoader(true);

        movieIndex.current = (movieIndex.current + 1) % movieList.current.length;

        console.log(`Play video ${movieIndex.current + 1} out of ${movieList.current.length} videos`);
        
        if (movieFile === movieList.current[movieIndex.current])
            setForceMovie(forceMovie + 1);
        else
            setMovieFile(movieList.current[movieIndex.current]);
    }

    useEffect(() => {
        getNextCategoryMovies();
        initMovies();
    }, [])

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (movieFile === '')
            return;

        let onVideoEnd = null;

        video.load();

        const handleLoaded = () => {
            video.removeEventListener("loadeddata", handleLoaded);

            setViewLoader(false);

            video.muted = true;
            video.play().catch(err => console.warn("Autoplay failed:", err));

            onVideoEnd = () => {
                video.removeEventListener('ended', onVideoEnd);
                nextMovie();
            };

            video.addEventListener('ended', onVideoEnd);
        };

        video.addEventListener("loadeddata", handleLoaded);

        return () => {
            video.removeEventListener("loadeddata", handleLoaded);
            if (onVideoEnd)
                video.removeEventListener('ended', onVideoEnd);
        };
    }, [movieFile, forceMovie])

    return (
        <div className="movie-container">
            {
                viewLoader &&
                <div className='movie-loader'>
                    <Loader />
                </div>
            }
            {
                movieFile &&
                <video ref={videoRef} className={`movie ${deviceType}`}>
                    <source id="videoSrc" src={`${movieFile}`} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            }
        </div>
    )
}

function GeneralInfo() {
    const [time, setTime] = useState('00:00:00');
    const [date, setDate] = useState('00/00/0000');
    const [weatherText, setWeatherText] = useState(null);
    const [weatherIcon, setWeatherIcon] = useState(null);
    const { deviceType } = useDeviceResolution();

    async function getTempreture() {
        const data = await getWeatherData();

        if (data.success) {
            setWeatherText(data.data.current.temp_c);
            setWeatherIcon(data.data.current.condition.icon);
        }
    }

    function updateTime() {
        const now = new Date();
        const newTime = now.toLocaleTimeString('he-IL', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        setTime(newTime);
    }

    function updateDate() {
        const now = new Date();
        const newDate = now.toLocaleDateString('he-IL', {
            timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        setDate(newDate.replaceAll('.', '/'));
    }

    useEffect(() => {
        updateTime();
        updateDate();
        getTempreture();

        const timeInterval = setInterval(() => {
            updateTime();
        }, 1000);

        const dateInterval = setInterval(() => {
            updateDate();
        }, 1000 * 60);

        const weatherInterval = setInterval(() => {
            getTempreture();
        }, parseInt(envVar('VITE_WEATHER_INTERVAL_IN_MIN')) * 1000 * 60);

        return () => {
            clearInterval(timeInterval);
            clearInterval(dateInterval);
            clearInterval(weatherInterval);
        };
    }, [])

    return (
        <div className={`general-info ${deviceType}`}>
            <div className={`date-time ${deviceType}`}>
                <div className='date-time-area'>{time}</div>
                <div className='date-time-area'>{date}</div>
            </div>

            <div className={`weather ${deviceType}`}>
                <div>{weatherText}°</div>
                {
                    weatherIcon &&
                    <img src={weatherIcon} />
                }
            </div>
        </div>
    )
}

function NewsCard({ text }) {
    const [viewLoader, setViewLoader] = useState(true);

    useEffect(() => {
        setViewLoader(true);
        setTimeout(() => {
            setViewLoader(false);
        }, 1000);
    }, [text])

    return (
        <>
            <div className={`news-card cards${envVar('NEWS_ON_SCREEN')}`}>
                {
                    viewLoader &&
                    <Loader />
                }
                {
                    !viewLoader &&
                    <h4>{text}</h4>
                }
            </div>
        </>
    )
}

function NewsInfo() {
    const allNewsList = useRef([]);
    const newsHead = useRef(0);
    const totalNews = useRef(0);
    const nextPageId = useRef(0);

    const NewsToDisplay = envVar('NEWS_ON_SCREEN');

    const [onScreenNews, setOnScreenNews] = useState(Array(parseInt(envVar('NEWS_ON_SCREEN'))).fill(''));
    const { deviceType } = useDeviceResolution();

    async function getNews(pageId=null) {
        const data = await getPageNews(pageId);

        if (data.success) {
            nextPageId.current = data.nextPage;
            totalNews.current = data.totalNews;

            data.data.forEach(info => {
                allNewsList.current.push({ index: allNewsList.current.length, title: info.title });
            });

            console.log("Total news in list", allNewsList.current.length);
            if (!pageId)
                displayNews();
        }
    }

    function displayNews() {
        setOnScreenNews([]);

        console.log("HEAD", newsHead.current);
        console.log("Total News", allNewsList.current.length);

        let currentNews = [];
        for(let n=0; n<NewsToDisplay; n++) {
            if (newsHead.current + n < allNewsList.current.length - 1) {
                currentNews.push(allNewsList.current[newsHead.current + n]);
            }
        }

        setOnScreenNews(currentNews);

        newsHead.current += currentNews.length - 1;
    }

    useEffect(() => {
        getNews();

        const newsInterval = parseInt(envVar('VITE_NEWS_INTERVAL_IN_MIN')) * 1000 * 60;

        const nextNewsInterval = setInterval(() => {
            if (newsHead.current + (2 * NewsToDisplay) > allNewsList.current.length) {
                console.log("Get next page data")
                getNews(nextPageId.current);
            }

            displayNews();
        }, newsInterval);

        return () => {
            clearInterval(nextNewsInterval);
        };        
    }, [])

    return (
        <div className={`news-info ${deviceType}`}>
            {
                onScreenNews.map((n, index) => <NewsCard key={index} text={n.title} />)
            }
        </div>
    )
}

function Main() {
    const { deviceType } = useDeviceResolution();

    return (
        <div className={`main-container ${deviceType}`}>
            <div className={`movie-area ${deviceType}`}>
                <MovieArea />
            </div>

            <div className={`info-area ${deviceType}`}>
                <GeneralInfo />
                <NewsInfo />
            </div>
        </div>
    )
}

export default Main;
