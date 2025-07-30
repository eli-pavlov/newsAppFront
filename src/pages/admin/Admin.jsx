import './Admin.css'
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter'
import { useDeviceResolution } from '../../contexts/DeviceResolution';
import { db } from '../../api/db';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useAuthContext } from '../../contexts/AuthContext'
import { deleteCookie, AUTH_COOKIE_NAME } from '../../utils/cookies';

import Settings from './components/Settings';
import Users from './components/Users';

function AdminPage() {
    const [_, navigate] = useLocation();
    const { isDesktop } = useDeviceResolution();

    const { setColorsTheme, settings } = useSettingsContext();
    const { isUserRole } = useAuthContext();
    const [activeTab, setActiveTab] = useState('settings');
    const [users, setUsers] = useState([]);
    const { setUser } = useAuthContext();

    async function getAllUsers() {
        const dbUsers = await db.getAllUsers();

        setUsers(dbUsers.data);
    }

    useEffect(() => {
        if (isUserRole('admin'))
            getAllUsers();
    }, [])

    function gotoHomePage() {
        navigate('/home');
    }

    function cancel() {
        setColorsTheme(settings.colors_theme);
        gotoHomePage();
    }

    function tabClick(tabId) {
        setColorsTheme(settings.colors_theme);
        setActiveTab(tabId);
    }

    if (!isDesktop) {
        return (
            <div className='not-available-msg'>
                <div>
                    This page is available only on wide screens.
                </div>
                <div>
                    <button className='btn-back' onClick={gotoHomePage}>Home</button>
                </div>
            </div>
        )
    }

    function logout() {
        setUser(null);
        deleteCookie(AUTH_COOKIE_NAME)
        navigate('/login')
    }

    return (
        <div className='admin-container'>
            <div className='tabs-area'>
                <div className='header'>
                    <div className='icon logout' onClick={ logout }>  
                        <i className="fa fa-sign-out"></i>
                    </div>

                    <div className='icon close' onClick={cancel}>X</div>
                </div>

                <div className='tabs'>
                    <div className={`tab ${activeTab === 'settings' ? 'selected' : ''}`} onClick={() => tabClick('settings')}>Settings</div>
                    {
                        isUserRole('admin') &&
                        <div className={`tab ${activeTab === 'users' ? 'selected' : ''}`} onClick={() => tabClick('users')} >Users</div>
                    }
                </div>

                <div className='tab-area'>
                    {
                        (activeTab === 'settings') &&
                        <Settings cancelFunc={cancel} />
                    }

                    {
                        (activeTab === 'users') &&
                        <Users users={users} setUsers={ setUsers } setActiveTab={setActiveTab} />
                    }
                </div>
            </div>
        </div>
    )
}

export default AdminPage;
