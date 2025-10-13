import { useState, useEffect } from 'react';
import './Login.css'
import { useLocation } from 'wouter'
import { useAuthContext } from '../../contexts/AuthContext';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { db } from '../../api/db';
import { createCookie, AUTH_COOKIE_NAME } from '../../utils/cookies';
import { getSettingsFromDB } from '../../utils/settings';

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errMsg, setErrMsg] = useState("");
    const [protectedUsers, setProtectedUsers] = useState([]);
    const [autoLoginUser, setAutoLoginUser] = useState('');

    const [_, navigate] = useLocation();

    const { setUser } = useAuthContext();

    const { setSettings } = useSettingsContext();

    async function fillProtectedUsers() {
        const result = await db.getProtectedUsers();

        setProtectedUsers(result.data);
    }

    useEffect(() => {
        fillProtectedUsers();
    }, [])

    async function initSettings() {
        const dbSettings = await getSettingsFromDB();

        setSettings(dbSettings.data);
    }

    async function login(e) {
        e.preventDefault();

        let result = null;
        if (autoLoginUser === '')
            result = await db.login(email, password);
        else
            result = await db.login(autoLoginUser.email, autoLoginUser.password);
        
        if (!result.success)
            setErrMsg(result.message);
        else {
            setUser(result.data);

            createCookie(AUTH_COOKIE_NAME, result.tokens.auth_token);

            await initSettings();

            navigate('/admin');
        }
    }

    return (
        <div className='container'>
            <form onSubmit={login} className='login'>
                <div className='element'>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        name="email"
                        onChange={
                            (e) => {
                                setEmail(e.target.value);
                                setErrMsg('');
                                setAutoLoginUser('');
                            }
                        }
                        value={email}
                        required={ !(!!autoLoginUser) }
                    />
                </div>
                <div className='element'>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        name="password"
                        onChange={
                            (e) => {
                                setPassword(e.target.value);
                                setErrMsg('');
                                setAutoLoginUser('');
                            }
                        }
                        value={password}
                        required={ !(!!autoLoginUser) }
                    />
                </div>

                <div className='element'>
                    <label htmlFor="users">Select user</label>
                    <select
                        value = { autoLoginUser?.name ?? '' }
                        onChange = { (e) => { 
                            setEmail('');
                            setPassword('');

                            const autoUser = protectedUsers.find(u => u.name === e.target.value);
                            
                            setAutoLoginUser(autoUser);
                        }}
                    >
                        <option key='empty' value=''></option>
                        {
                            protectedUsers.map((u, index) => (
                                <option key={index} value={u.name}>{u.name}</option>
                            ))
                        }
                    </select>
                </div>

                <button type="submit">Login</button>
                <div className='errorMsg'>
                    {errMsg}
                </div>

            </form>
        </div>
    )
}

export default LoginPage
