import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useDeviceContext } from '../../contexts/DeviceResolution.jsx'; // FIX: Corrected the file extension
import { At } from '../../api/db.jsx';
import { getEnvVariable } from '../../utils/env.jsx';

function Open() {
    const [_, setLocation] = useLocation();
    const { deviceType } = useDeviceContext();
    const [errorMsg, setErrorMsg] = useState("");
    const [showGitInfo, setShowGitInfo] = useState(false);
    const [gitInfo, setGitInfo] = useState({ back: { branch: "unknown", commit: "unknown" }, front: { branch: "unknown", commit: "unknown" } });
    const timer = useRef();

    async function checkDb() {
        const result = await At.available();
        if (result.success) {
            const frontGit = {
                branch: getEnvVariable("FRONTEND_GIT_BRANCH") || "Unknown",
                commit: getEnvVariable("FRONTEND_GIT_COMMIT") || "Unknown"
            };
            setGitInfo({ back: result.git_info, front: frontGit });
            timer.current = setTimeout(() => { setLocation('/admin') }, 3000);
        } else {
            console.log(result.message);
            setErrorMsg(result.message);
        }
    }

    function titleClickHandler() {
        if (showGitInfo) {
            setLocation('/admin');
        } else {
            clearTimeout(timer.current);
            setShowGitInfo(true);
        }
    }

    useEffect(() => {
        checkDb();
        return () => clearTimeout(timer.current);
    }, []);

    return (
        <div className={`open-page ${deviceType}`}>
            <div className='title' onClick={titleClickHandler}>
                <h1>NewsApp</h1>
            </div>
            {errorMsg && <h3>{errorMsg}</h3>}
            {showGitInfo &&
                <div className='git-info'>
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
            }
        </div>
    );
}

export default Open;