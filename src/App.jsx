// newsAppFront/src/App.jsx
import { useLocation } from 'wouter'
import { useEffect, useRef } from 'react'
import At from './api/db'; // Fixed: Default import (was { db })
import { getSettingsFromDB } from './utils/settings'
import { useSettingsContext } from './contexts/SettingsContext'
import { useAuthContext } from './contexts/AuthContext'
import { useDeviceResolution } from './contexts/DeviceResolution'
import DeviceResolution from './contexts/DeviceResolution'
import AuthProvider from './contexts/AuthContext'
import SettingsProvider from './contexts/SettingsContext'
import Open from './pages/open/Open'
import Login from './pages/login/Login'
import Home from './pages/home/Home'
import Admin from './pages/admin/Admin'
import './App.css'

function App() {
    const [location] = useLocation();
    const { setSettings } = useSettingsContext();
    const { user } = useAuthContext();
    const { deviceType } = useDeviceResolution();
    const isLoadingRef = useRef(true);

    useEffect(() => {
        const loadSettings = async () => {
            const result = await getSettingsFromDB(user);
            if (result.success) {
                setSettings(result.data);
            }
            isLoadingRef.current = false;
        };

        loadSettings();
    }, [user, setSettings]);

    const isAdminRoute = location === '/admin';
    const isLoginRoute = location === '/login';
    const isOpenRoute = location === '/';

    if (isLoadingRef.current) {
        return <div>Loading...</div>;
    }

    if (isAdminRoute && !user) {
        return <Login />;
    }

    if (isLoginRoute && user) {
        return <Home />;
    }

    if (isOpenRoute && user) {
        return <Home />;
    }

    return (
        <div className={`App ${deviceType}`}>
            {isOpenRoute ? <Open /> : (isAdminRoute ? <Admin /> : <Home />)}
        </div>
    );
}

export default function AppWithProviders() {
    return (
        <DeviceResolution>
            <AuthProvider>
                <SettingsProvider>
                    <App />
                </SettingsProvider>
            </AuthProvider>
        </DeviceResolution>
    );
}