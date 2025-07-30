import { useState } from 'react';
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

    const [_, navigate] = useLocation();

    const { setUser } = useAuthContext();

    const { setSettings } = useSettingsContext();

    async function initSettings() {
        const dbSettings = await getSettingsFromDB();

        setSettings(dbSettings.data);
    }

    async function login(e) {
        e.preventDefault();

        const result = await db.login(email, password);

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
                            }
                        }
                        value={email}
                        required
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
                            }
                        }
                        value={password}
                        required
                    />
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
