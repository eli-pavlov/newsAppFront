import React from 'react';
import { useDeviceResolution } from '../../../contexts/DeviceResolution.jsx';

// FIX: Added the .jsx file extension to all component imports
import MovieArea from './MovieArea.jsx';
import GeneralInfo from './GeneralInfo.jsx';
import NewsInfo from './NewsInfo.jsx';

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
    );
}

export default Main;