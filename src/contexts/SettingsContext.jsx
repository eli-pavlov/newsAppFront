import { createContext, useState, useContext, useEffect } from 'react';
import At from '../api/db'; // Corrected import
import { defaultSettings } from '../utils/settings';
import { useAuthContext } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings());
    const { user } = useAuthContext();

    useEffect(() => {
        if (user) {
            fetchSettings();
        } else {
            setSettings(defaultSettings());
        }
    }, [user]);

    const applyTheme = (theme) => {
        document.body.className = `theme-${theme || 'light'}`;
    };

    const fetchSettings = async (specificUser = null) => {
        const response = await At.getSettings(specificUser);
        if (response.success) {
            const fetchedSettings = response.data;
            fetchedSettings.footer_messages = fetchedSettings.footer_messages || [];
            fetchedSettings.movies = fetchedSettings.movies || [];
            fetchedSettings.online_movies_categories = fetchedSettings.online_movies_categories || [];
            setSettings(fetchedSettings);
            applyTheme(fetchedSettings.colors_theme);
            return fetchedSettings;
        } else {
            // Fallback to default if API fails
            const defaults = defaultSettings();
            setSettings(defaults);
            applyTheme(defaults.colors_theme);
        }
        return null;
    };

    const saveSettings = async (newSettings) => {
        const response = await At.saveSettings(newSettings);
        if (response.success) {
            setSettings(newSettings);
            applyTheme(newSettings.colors_theme);
        }
        return response;
    };

    const value = { settings, setSettings, fetchSettings, saveSettings, applyTheme };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettingsContext = () => useContext(SettingsContext);