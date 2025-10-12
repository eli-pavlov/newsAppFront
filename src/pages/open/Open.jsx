// newsAppFront/src/pages/open/Open.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useDeviceResolution } from '../../contexts/DeviceResolution';
import At from '../../api/db'; // Fixed: Default import (was { db })
import { envVar } from '../../utils/env';

function Open() {
    const [location, navigate] = useLocation();
    const { deviceType } = useDeviceResolution();
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [gitInfo, setGitInfo] = useState({
        back: { branch: 'unknown', commit: 'unknown' },
        front: { branch: 'unknown', commit: 'unknown' }
    });
    const timeoutRef = useRef(null);

    async function checkAvailable() {
        try {
            const result = await At.available(); // Fixed: Use At (default instance)
            if (result.success) {
                const frontInfo = {
                    branch: envVar('VITE_FRONTEND_GIT_BRANCH') || 'Unknown',
                    commit: envVar('VITE_FRONTEND_GIT_COMMIT') || 'Unknown'
                };
                setGitInfo({
                    back: result.git_info,
                    front: frontInfo
                });
                timeoutRef.current = setTimeout(() => {
                    navigate('/admin');
                }, 3000);
            } else {
                setErrorMsg(result.message || 'Server unavailable');
            }
        } catch (error) {
            setErrorMsg(error.message || 'Connection failed');
        } finally {
            setIsLoading(false);
        }
    }

    function handleClick() {
        if (isLoading) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setIsLoading(false);
        } else {
            navigate('/admin');
        }
    }

    useEffect(() => {
        checkAvailable();
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div className={`open-page ${deviceType}`}>
            <div className="title" onClick={handleClick}>
                <h1>מיידעון</h1>
            </div>
            {errorMsg && <h3>{errorMsg}</h3>}
            {isLoading && (
                <div className="git-info">
                    <div>BACKEND</div>
                    <b>
                        <div>{`branch: ${gitInfo.back.branch}`}</div>
                        <div>{`commit: ${gitInfo.back.commit}`}</div>
                    </b>
                    <div>FRONTEND</div>
                    <b>
                        <div>{`branch: ${gitInfo.front.branch}`}</div>
                        <div>{`commit: ${gitInfo.front.commit}`}</div>
                    </b>
                </div>
            )}
        </div>
    );
}

export default Open;