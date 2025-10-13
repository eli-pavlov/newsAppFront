import '../Home.css'
import { useEffect, useState, useRef } from 'react'
import { useSettingsContext } from '../../../contexts/SettingsContext';

function Footer() {
    const { settings } = useSettingsContext();

    const messages = settings.footer_messages.filter(m => m.active).map(m => m.msg);

    const [msg, setMsg] = useState('');
    const [forceEnterMsg, setForceEnterMsg] = useState(0);
    let msgIndex = useRef(-1);

    useEffect(() => {
        enterMsg();
    }, []);

    useEffect(() => {
        const elm = document.getElementById('msg');
        elm.style.left = `${-elm.scrollWidth}px`;
        elm.classList.add('msg-anim');

        const onAnimEnd = () => {
            elm.removeEventListener('animationend', onAnimEnd);
            elm.classList.remove('msg-anim');

            if (messages.length == 1)
                setForceEnterMsg(forceEnterMsg + 1)
            else
                enterMsg();
        };

        elm.addEventListener('animationend', onAnimEnd);

        return () => {
            elm.removeEventListener('animationend', onAnimEnd);
        };
    }, [msg, forceEnterMsg])

    function enterMsg() {
        if (messages.length == 0)
            return;

        msgIndex.current = (msgIndex.current + 1 < messages.length) ? msgIndex.current + 1 : 0;
        setMsg(messages[msgIndex.current]);
    }

    return (
        <div className="footer">
            <div id='msg' className='msg'>
                {msg}
            </div>
        </div>
    )
}

export default Footer;
