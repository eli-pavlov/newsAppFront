import { useContext, useState, createContext, useEffect } from "react";

export const SettingsContext = createContext(null);

export function SettingsContextProvider({ children }) {
	const [settings, setSettings] = useState({});

    useEffect(() => {
        const colorsTheme = settings.colors_theme ?? 'light';
        setColorsTheme(colorsTheme);
    }, [settings])

    function setColorsTheme(type) {
        document.body.classList = [`theme-${type}`];
    }

	return <SettingsContext.Provider value={{ settings, setSettings, setColorsTheme }}>{children}</SettingsContext.Provider>;
}

export const useSettingsContext = () => useContext(SettingsContext);
