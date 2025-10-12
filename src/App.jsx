import './App.css'
import OpenPage from './pages/open/Open'
import HomePage from './pages/home/Home'
import LoginPage from './pages/login/Login'
import AdminPage from './pages/admin/Admin'
import { DeviceResolutionProvider } from './contexts/DeviceResolution'
import { Route } from 'wouter'
import { SettingsContextProvider } from './contexts/SettingsContext'
import { AuthContextProvider, useAuthContext } from './contexts/AuthContext'
import { useLocation } from 'wouter'
import { useEffect, useRef } from 'react'
import { db } from './api/db'
import { getSettingsFromDB } from './utils/settings'
import { useSettingsContext } from './contexts/SettingsContext'

function ProtectedRoute({ Component }) {
  const [_, navigate] = useLocation();

  const { user, setUser } = useAuthContext();
  const { setSettings } = useSettingsContext();

  async function initUserFromToken() {
    const result = await db.verify();

    if (result.success) {
      const dbSettings = await getSettingsFromDB();
      
      setSettings(dbSettings.data);
      setUser(result.user);
      navigate('/admin');
    }
    else {
      navigate('/login');
    }
  }

  useEffect(() => {
    if (!user) {
      initUserFromToken();
    }
  }, [])

  return user ? <Component /> : null;
}

function App() {
  let getVariables = useRef(true);

  async function getEnvVariablesFromServer() {
    if (!getVariables)
      return;

    getVariables = false;

    await db.getEnvVariables();
  }

  useEffect(() => {
    getEnvVariablesFromServer();
  }, [])

  return (
    <>
      <AuthContextProvider>
        <SettingsContextProvider>
          <DeviceResolutionProvider>
            <Route path="/" component={OpenPage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/home" component={() => <ProtectedRoute Component={HomePage} />} />
            <Route path="/admin" component={() => <ProtectedRoute Component={AdminPage} />} />
          </DeviceResolutionProvider>
        </SettingsContextProvider>
      </AuthContextProvider>
    </>
  )
}

export default App
