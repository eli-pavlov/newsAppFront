import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMediaQuery } from 'react-responsive';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useAuthContext } from '../../contexts/AuthContext';
import At from '../../api/db'; // Corrected import
import Loader from '../../components/Loader';
import Settings from './components/Settings';
import Users from './components/Users';
import './Admin.css';

const Admin = () => {
    const { user, isLoading, logout, isUserRole } = useAuthContext();
    const [, setLocation] = useLocation();
    const isDesktop = useMediaQuery({ minWidth: 1025 });
    const { applyTheme, settings } = useSettingsContext();
    const [activeTab, setActiveTab] = useState('settings');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (!isLoading && !user) {
            setLocation('/login');
        } else if (user) {
            applyTheme(settings.colors_theme);
            if (isUserRole('admin')) {
                At.getAllUsers().then(res => {
                    if (res.success) setUsers(res.data);
                });
            }
        }
    }, [user, isLoading, setLocation, settings.colors_theme, applyTheme, isUserRole]);
    
    if (isLoading || !user) {
        return <Loader fullScreen={true} transparent={false} />;
    }

    if (!isDesktop) {
        return (
            <div className='not-available-msg'>
                <div>This page is available only on wide screens.</div>
                <div>
                    <button className='btn-back' onClick={() => setLocation('/home')}>Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="tabs-area">
                <div className="header">
                    <div className="icon logout" onClick={logout}>
                        <i className="fa fa-sign-out"></i>
                    </div>
                    <div className="icon close" onClick={() => setLocation('/home')}>X</div>
                </div>
                <div className="tabs">
                    <div className={`tab ${activeTab === 'settings' ? 'selected' : ''}`} onClick={() => setActiveTab('settings')}>
                        Settings
                    </div>
                    {isUserRole('admin') && (
                        <div className={`tab ${activeTab === 'users' ? 'selected' : ''}`} onClick={() => setActiveTab('users')}>
                            Users
                        </div>
                    )}
                </div>
                <div className="tab-area">
                    {activeTab === 'settings' && <Settings cancelFunc={() => setLocation('/home')} user={user} />}
                    {activeTab === 'users' && <Users users={users} setUsers={setUsers} setActiveTab={setActiveTab} />}
                </div>
            </div>
        </div>
    );
};

export default Admin;