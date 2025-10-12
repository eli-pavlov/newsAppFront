import React, { useEffect, useState } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import { initSettings } from './utils/settings';
import api from './api/db';

import Home from './pages/home/Home';
import Admin from './pages/admin/Admin';
import Login from './pages/login/Login';
import Open from './pages/open/Open';
import Loader from './components/Loader';

import './App.css';

function App() {
    const { user, setUser } = useAuth();
    const { setSettings } = useSettings();
    const [location, setLocation] = useLocation();
    const [loading, setLoading] = useState(true); // Add a loading state

    useEffect(() => {
        const checkAuthAndLoadSettings = async () => {
            const authResult = await api.verify();

            if (authResult.success) {
                // User is authenticated
                setUser(authResult.user);
                const settingsResult = await initSettings();
                setSettings(settingsResult);

                // If user is on login page, redirect to admin
                if (location === '/login') {
                    setLocation('/admin');
                }
            } else {
                // User is not authenticated, redirect to login
                // unless they are on the opening page.
                if (location !== '/') {
                    setLocation('/login');
                }
            }
            setLoading(false); // Stop loading
        };

        checkAuthAndLoadSettings();
    }, []); // This empty dependency array ensures it runs only once on mount

    // Show a loading screen while we check for an active session
    if (loading && location !== '/') {
        return <Loader fullScreen={true} />;
    }

    return (
        <Switch>
            <Route path="/" component={Open} />
            <Route path="/login" component={Login} />
            <Route path="/home">{user ? <Home /> : <Login />}</Route>
            <Route path="/admin">{user ? <Admin /> : <Login />}</Route>
            {/* Add a default fallback route if needed */}
            <Route>404: Not Found!</Route>
        </Switch>
    );
}

export default App;