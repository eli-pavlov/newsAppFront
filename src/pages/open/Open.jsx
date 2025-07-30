import './Open.css'
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter'
import { useDeviceResolution } from '../../contexts/DeviceResolution';
import { db } from '../../api/db';

function OpenPage() {
    const [_, navigate ] = useLocation();
    const { deviceType } = useDeviceResolution();
    const [msg, setMsg] = useState('');

    async function dbAvailable() {
        const result = await db.available();

        if (result.success) {
            setTimeout(() => {
                navigate('/admin');
            }, 3000)
        }
        else {
            console.log(result.message);
            setMsg(result.message);
        }
    }

    useEffect(() => {
        dbAvailable();
    }, [])

    return (
        <div className={`open-page ${deviceType}`}>
            <div className="title">
                <h1>מיידעון</h1>
            </div>
            {
                msg &&
                <h3>{msg}</h3>
            }
        </div>
    )
}

export default OpenPage;
