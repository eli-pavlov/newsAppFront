import './Open.css'
import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter'
import { useDeviceResolution } from '../../contexts/DeviceResolution';
import { db } from '../../api/db';
import gitInfo from '../../../git_info.json';

function OpenPage() {
    const [_, navigate ] = useLocation();
    const { deviceType } = useDeviceResolution();
    const [msg, setMsg] = useState('');
    const [viewGitInfo, setViewGitInfo] = useState(false);
    const [backendGitInfo, setBackendGitInfo] = useState({branch:"", commit:""});
    const openTimer = useRef();

    async function dbAvailable() {
        const result = await db.available();

        if (result.success) {
            setBackendGitInfo(result.git);
            openTimer.current = setTimeout(() => {
                navigate('/admin');
            }, 3000)
        }
        else {
            console.log(result.message);
            setMsg(result.message);
        }
    }

    function titleClick() {
        if (viewGitInfo)
            navigate('/admin');
        else {
            clearTimeout(openTimer.current);
            setViewGitInfo(true);
        }
    }

    useEffect(() => {
        dbAvailable();
    }, [])

    return (
        <div className={`open-page ${deviceType}`}>
            <div className="title" onClick={titleClick}>
                <h1>מיידעון</h1>
            </div>
            {
                msg &&
                <h3>{msg}</h3>
            }
            {
                viewGitInfo &&
                <div className='git-info'><b>
                    <div>
                        Backend:
                    </div>
                    <div>
                        {`branch: ${backendGitInfo.branch}`}
                    </div>
                    <div>
                        {`commit: ${backendGitInfo.commit}`}
                    </div>
                    <div>
                        Frotend:
                    </div>
                    <div>
                        {`branch: ${gitInfo.branch}`}
                    </div>
                    <div>
                        {`commit: ${gitInfo.commit}`}
                    </div>
                </b></div>
            }
        </div>
    )
}

export default OpenPage;
