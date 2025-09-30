import '../Admin.css'
import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter'
import ConfirmModal from '../../../components/ConfirmModal';
import { CustomButton } from '../../../components/CustomButton'
import AddFooterMsgModal from '../modal/AddFooterMsgModal';
import { db } from '../../../api/db';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import Section from '../components/Section';
import AdminCustomInput from './AdminCustomInput'
import { envVar } from '../../../utils/env';

// This is the only file you need to update for the UI changes.
function Settings({ cancelFunc, user }) {
    const [_, navigate] = useLocation();
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    let confirmData = useRef({})
    const [addFooterMsgModal, setAddFooterMsgModal] = useState(false);
    const [title, setTitle] = useState('')
    const [lockTitle, setlockTile] = useState(true)
    const [footerMessages, setFooterMessages] = useState([]);
    const [theme, setTheme] = useState('');
    const { setColorsTheme, settings, setSettings } = useSettingsContext();
    const [movies, setMovies] = useState([]);
    const [movieFile, setMovieFile] = useState(null);
    const videoRef = useRef(null);
    const [onlineMoviesCategories, setOnlineMoviesCategories] = useState([]);
    const [keysPressed, setKeysPressed] = useState([]);

    // --- REVISED STATE FOR UPLOAD ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);


    function initPageSettings() {
        setTheme(settings.colors_theme);
        setTitle(settings.title);
        setFooterMessages(settings.footer_messages.map(m => ({ ...m, ['disabled']: true })));
        setMovies(settings.movies.map(m => ({ ...m })));
        const savedMoviesCategories = settings.online_movies_categories || [];
        const selectedSavedMoviesCategories = savedMoviesCategories.filter(c => c.selected).map(c => c.name);
        let envMoviesCategories = envVar('ONLINE_MOVIES_CATEGORIES').split(',');
        const settingsMoviesCategories = envMoviesCategories.map(c => ({ name: c, selected: selectedSavedMoviesCategories.includes(c) }));
        setOnlineMoviesCategories(settingsMoviesCategories);
    }

    useEffect(() => {
        initPageSettings();
    }, [settings]) // Depend on settings to re-init if they change externally

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (keysPressed.includes(e.key)) return;
            const newKeysList = [...keysPressed, e.key];
            setKeysPressed(newKeysList);
        };
        const handleKeyUp = () => {
            setKeysPressed([]);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [keysPressed])

    function enableTitle() {
        setlockTile(false);
    }

    function disableTitle() {
        setlockTile(true);
    }

    function updateFooterMessage(msgIndex, action, value = null) {
        let newFooterMessage = [...footerMessages];
        switch (action) {
            case 'msg':
                newFooterMessage[msgIndex].msg = value;
                break;
            case 'edit':
                newFooterMessage[msgIndex].disabled = !newFooterMessage[msgIndex].disabled;
                break;
            case 'active':
                newFooterMessage[msgIndex].active = !newFooterMessage[msgIndex].active;
                break;
            case 'delete':
                newFooterMessage.splice(msgIndex, 1);
                break;
            case 'add':
                const newMsg = { id: newFooterMessage.length + 1, msg: value, disabled: true, active: false };
                newFooterMessage.push(newMsg);
                setAddFooterMsgModal(false);
                break;
        }
        setFooterMessages(newFooterMessage);
    }

    function removeFooterMsg(msgIndex) {
        confirmData.current = {
            msg: 'Delete this message?',
            yesHandler: () => { updateFooterMessage(msgIndex, 'delete') },
        };
        setOpenConfirmModal(true);
    }

    async function saveSettingsToDB() {
        let newSettings = {};
        newSettings.colors_theme = theme;
        newSettings.title = title;
        newSettings.footer_messages = footerMessages.map((m, index) => ({ ...m, id: index }));
        newSettings.movies = movies.map((m, index) => ({ ...m, id: index }));
        newSettings.online_movies_categories = onlineMoviesCategories.map((c, index) => ({ ...c, id: index }));
        await db.saveSettings(newSettings);
        setSettings(newSettings);
        navigate('/home');
    }

    function previewMovie(fileName) {
        setMovieFile(fileName);
        const video = videoRef.current;
        if (video) video.load();
    }

    function clickMovieCategory(categoryName) {
        let updatedMoviesCategories = [...onlineMoviesCategories];
        const category = updatedMoviesCategories.find(c => c.name === categoryName);
        if (category) {
            category.selected = !category.selected;
        }
        setOnlineMoviesCategories(updatedMoviesCategories);
    }

    function cheatKeys() {
        return keysPressed.includes('Control') && keysPressed.includes('Shift');
    }

    // --- REVISED UPLOAD FUNCTIONS ---

    function openFileSelection() {
        setUploadMsg('');
        document.querySelector('#file-select').click();
    }

    function fileSelected(e) {
        setUploadProgress(0);
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }
        if (file.name.endsWith('mp4')) {
            setSelectedFile(file);
            setUploadMsg('');
        } else {
            setSelectedFile(null);
            setUploadMsg('Invalid file format.');
        }
    };

    async function handleUpload() {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadMsg('Uploading file, please wait...');

        // The progress callback now directly sets the state
        const result = await db.uploadMovie(selectedFile, setUploadProgress);
        
        setIsUploading(false);
        setUploadMsg(result.message);

        if (result.success) {
            setSelectedFile(null); // Clear the file after successful upload
            // The `result.data` from the backend now contains the complete movie object
            setMovies(prevMovies => [...prevMovies, result.data]);
        }
    }

    // --- END REVISED UPLOAD FUNCTIONS ---

    async function deleteMovie(index, fileName, subFolder) {
        confirmData.current = {
            msg: 'Delete this movie?',
            yesHandler: () => { deleteMovieFile(index, fileName, subFolder) },
        };
        setOpenConfirmModal(true);
    }

    async function deleteMovieFile(index, fileName, subFolder) {
        const result = await db.deleteMovie(fileName, subFolder);
        if (result.success) {
            setMovies(movies.filter((f, ind) => ind !== index));
        }
    }

    return (
        <>
            {addFooterMsgModal && <AddFooterMsgModal closeHandler={() => { setAddFooterMsgModal(false) }} saveHandler={(val) => { updateFooterMessage(-1, 'add', val) }} />}
            {openConfirmModal && <ConfirmModal titleData={{ text: confirmData.current.msg, style: { fontSize: "24px" } }} yesData={{ text: "Yes", style: { "backgroundColor": "red", "border": "none", "padding": "16px", "fontWeight": "bold" }, noHover: true, actionHandler: confirmData.current.yesHandler }} noData={{ text: "No", style: { "backgroundColor": "white", "color": "black", "padding": "16px", "border": "none" } }} closeHandler={() => { setOpenConfirmModal(false) }} />}
            <div className='settings-page'>
                <form>
                    <Section title="Colors Theme">
                        <div className='colors-themes'>
                            <div className={`color-theme-btn dark ${(theme === 'dark') ? 'selected' : ''}`} data-value='dark' onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setTheme(e.target.getAttribute('data-value')); }} />
                            <div className={`color-theme-btn light ${(theme === 'light') ? 'selected' : ''}`} data-value='light' onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setTheme(e.target.getAttribute('data-value')); }} />
                        </div>
                    </Section>
                    <Section title="Title">
                        <AdminCustomInput id='title' value={title} setValue={setTitle} disabled={lockTitle} disableInput={disableTitle}>
                            <div className='font-icon' onClick={enableTitle}><i className="fa fa-edit"></i></div>
                        </AdminCustomInput>
                    </Section>
                    <Section title="Footer Messages">
                        <div className='add-footer-msg' onClick={() => setAddFooterMsgModal(true)}><i className="fa fa-plus"></i></div>
                        <table id='messages' className='footer-table'>
                            <thead><tr><th>Message</th><th width="5%" >Active</th><th width="10%" ></th></tr></thead>
                            <tbody>
                                {footerMessages.map((m, index) => (
                                    <tr key={m.id}>
                                        <td><AdminCustomInput id={`footer-msg-${m.id}`} value={m.msg} setValue={(val) => { updateFooterMessage(index, 'msg', val); }} disabled={m.disabled} disableInput={() => { updateFooterMessage(index, 'edit'); }} /></td>
                                        <td><div className='active'><input type="checkbox" checked={m.active} onChange={() => { updateFooterMessage(index, 'active'); }} /></div></td>
                                        <td><div className='actions'><div className='font-icon' onClick={(() => { updateFooterMessage(index, 'edit') })}><i className="fa fa-edit"></i></div><div className='font-icon' onClick={() => removeFooterMsg(index)}><i className="fa fa-trash"></i></div></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>
                    <Section title="Downloaded Movies">
                        <div>
                            <div className='movies'>
                                <div className='movies-table'>
                                    <table>
                                        <thead><tr><th width="30%">File Name</th><th width="30%">Times in Cycle</th><th width="15%">Active</th><th width="30%">Preview</th></tr></thead>
                                        <tbody>
                                            {movies && movies.map((m, index) => (
                                                <tr key={`${m.file_name}-${index}`}>
                                                    <td>{m.file_name}</td>
                                                    <td>
                                                        <select value={m.times} onChange={(e) => { const updatedMovies = [...movies]; updatedMovies[index].times = e.target.value; setMovies(updatedMovies); }}>
                                                            <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                                                        </select>
                                                    </td>
                                                    <td><div className='active'><input type="checkbox" checked={m.active} onChange={() => { const updatedMovies = [...movies]; updatedMovies[index].active = !updatedMovies[index].active; setMovies(updatedMovies); }} /></div></td>
                                                    <td>
                                                        <div className='actions'>
                                                            <div className='font-icon' onClick={() => { previewMovie(m.url) }}><i className="fa fa-eye"></i></div>
                                                            <div className={`font-icon ${m.deletable ? '' : 'disabled'}`} onClick={(m.deletable ? () => { deleteMovie(index, m.file_name, m.subFolder) } : null)}><i className="fa fa-trash"></i></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className='movie-preview'>
                                    <video ref={videoRef} controls>
                                        <source id="videoSrc" src={`${movieFile}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                            <div className='upload-wrapper'>
                                <input id='file-select' type='file' accept=".mp4" onChange={fileSelected} style={{ "display": "none" }} />
                                <CustomButton btnData={{ name: "select", text: 'Select file', type: "button", onClick: !isUploading ? () => { openFileSelection() } : null, style: { 'fontSize': '24px' }, noHover: isUploading, disabled: isUploading }} />
                                <div className='progress-wrapper'>
                                    <div className='upload-progress empty'></div>
                                    <div className='upload-progress full' style={{ "width": `${uploadProgress}%` }}></div>
                                    <div className='upload-progress file-name'>{selectedFile?.name ?? ''}</div>
                                </div>
                                <CustomButton btnData={{ name: "upload", text: 'Upload file', type: "button", onClick: (selectedFile && !isUploading) ? () => { handleUpload() } : null, style: { 'fontSize': '24px' }, noHover: !selectedFile || isUploading, disabled: !selectedFile || isUploading }} />
                                <div className='upload-msg'>{uploadMsg}</div>
                            </div>
                        </div>
                    </Section>
                    <Section title="Online Movies Categories">
                        <div className='movies-categories'>
                            {onlineMoviesCategories.map((c, index) => (
                                <div key={index} className={`movie-category ${c.selected ? 'selected' : ''}`} onClick={() => { clickMovieCategory(c.name) }}>{c.name}</div>
                            ))}
                        </div>
                    </Section>
                    <div className='buttons'>
                        <CustomButton btnData={{ name: "save", text: 'Save Settings', type: "button", noHover: (!user.editable && !cheatKeys()), disabled: (!user.editable && !cheatKeys()) ? true : false, onClick: (user.editable || cheatKeys()) ? (() => { saveSettingsToDB() }) : null, style: { "padding": '12px', 'fontSize': '24px' }, }} />
                        <CustomButton btnData={{ name: "cancel", text: 'Cancel', type: "button", onClick: (() => { cancelFunc() }), style: { "padding": '12px', 'fontSize': '24px' }, }} />
                    </div>
                </form>
            </div>
        </>
    )
}

export default Settings;
