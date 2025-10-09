import React from 'react';
import { useSettingsContext } from '../../../contexts/SettingsContext.jsx';
import { useDeviceContext } from '../../../contexts/DeviceResolution.jsx';
import { useLocation } from 'wouter';
import { useAuthContext } from '../../../contexts/AuthContext.jsx';
// FIX: Using the correct function and constant names
import { removeCookie, AUTH_USER } from '../../../utils/cookies.js';

function Header() {
    const { settings } = useSettingsContext();
    const { deviceType } = useDeviceContext();
    const [_, setLocation] = useLocation();
    const { user, setUser } = useAuthContext();

    function handleLogout() {
        setUser(null);
        // FIX: Using the correct function and constant
        removeCookie(AUTH_USER);
        setLocation('/login');
    }

    return (
        <div className={`header ${deviceType}`}>
            {user && (
                <>
                    <div className={`admin-icon ${deviceType}`} onClick={() => setLocation('/admin')}>
                        <i className="fa fa-gear"></i>
                    </div>
                    <div className={`logout-icon ${deviceType}`} onClick={handleLogout}>
                        <i className="fa fa-sign-out"></i>
                    </div>
                </>
            )}
            <div>{settings.title}</div>
        </div>
    );
}

export default Header;