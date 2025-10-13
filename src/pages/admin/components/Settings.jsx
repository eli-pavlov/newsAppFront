import { useEffect, useState, useRef } from 'react';
import { useWouter } from 'wouter';
import axios from 'axios';

// Components
import Modal from '../../../components/Modal';
import ConfirmationModal from '../../../components/ConfirmModal';
import AddMessageModal from '../modal/AddFooterMsgModal';
import Section from './Section';
import Input from './AdminCustomInput';

// Contexts & Utils
import { useSettings } from '../../../contexts/SettingsContext';
import getEnvVariable from '../../../utils/env';
import { useUser } from '../../../contexts/AuthContext';
import { getSettings } from '../../../utils/settings'; // Assuming this fetches settings

// API
import { getPresignedUrl, finalizeUpload, getPresignedDeleteUrl, finalizeDelete } from '../../../api/movies';
// Note: `saveSettings` would be imported from another API file, e.g., 'src/api/settings.jsx'

const Settings = ({ cancelFunc }) => {
    const [, navigate] = useWouter();
    const { user } = useUser();
    const [showModal, setShowModal] = useState(false);
    let modalData = useRef({});

    const [showAddMessageModal, setShowAddMessageModal] = useState(false);
    const [title, setTitle] = useState("");
    const [isTitleDisabled, setIsTitleDisabled] = useState(true);
    const [footerMessages, setFooterMessages] = useState([]);
    const [colorsTheme, setColorsTheme] = useState("");
    const { settings, setSettings } = useSettings();
    const [movies, setMovies] = useState([]);
    const [previewMovie, setPreviewMovie] = useState(null);
    const videoRef = useRef(null);
    const [onlineMoviesCategories, setOnlineMoviesCategories] = useState([]);
    const [keys, setKeys] = useState([]);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (settings) {
            setColorsTheme(settings.colors_theme);
            setTitle(settings.title);
            setFooterMessages(settings.footer_messages.map(m => ({ ...m, disabled: true })));
            setMovies(settings.movies.map(m => ({ ...m })));
            const selectedCategories = (settings.online_movies_categories || []).filter(c => c.selected).map(c => c.name);
            const allCategories = getEnvVariable('ONLINE_MOVIES_CATEGORIES').split(',').map(name => ({
                name: name,
                selected: selectedCategories.includes(name)
            }));
            setOnlineMoviesCategories(allCategories);
        }
    }, [settings]);

    useEffect(() => {
        const handleKeyDown = (e) => !keys.includes(e.key) && setKeys(prev => [...prev, e.key]);
        const handleKeyUp = () => setKeys([]);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [keys]);

    const handleMessageUpdate = (index, field, value = null) => {
        let newMessages = [...footerMessages];
        switch (field) {
            case 'msg': newMessages[index].msg = value; break;
            case 'edit': newMessages[index].disabled = !newMessages[index].disabled; break;
            case 'active': newMessages[index].active = !newMessages[index].active; break;
            case 'delete': newMessages.splice(index, 1); break;
            case 'add':
                newMessages.push({ id: newMessages.length + 1, msg: value, disabled: true, active: false });
                setShowAddMessageModal(false);
                break;
        }
        setFooterMessages(newMessages);
    };

    const handleDeleteMessage = (index) => {
        modalData.current = { msg: "Delete this message?", yesHandler: () => { handleMessageUpdate(index, "delete"); setShowModal(false); } };
        setShowModal(true);
    };

    const handleSaveSettings = async () => {
        // This function is illustrative as its API call (`apiSaveSettings`) is not defined in the provided files.
        const newSettings = {
            ...settings,
            colors_theme: colorsTheme,
            title: title,
            footer_messages: footerMessages.map((m, i) => ({ ...m, id: i })),
            movies: movies.map((m, i) => ({ ...m, id: i })),
            online_movies_categories: onlineMoviesCategories.map((c, i) => ({ ...c, id: i })),
        };
        // const result = await apiSaveSettings(newSettings);
        setSettings(newSettings);
        alert("Settings have been saved (mocked).");
        navigate("/home");
    };

    const handlePreviewMovie = (movieUrl) => {
        setPreviewMovie(movieUrl);
        if (videoRef.current) videoRef.current.load();
    };

    const toggleCategory = (categoryName) => {
        setOnlineMoviesCategories(prev =>
            prev.map(c => c.name === categoryName ? { ...c, selected: !c.selected } : c)
        );
    };

    const hasPermissions = () => keys.includes("Control") && keys.includes("Shift");
    const handleFileClick = () => { setUploadMsg(""); document.querySelector("#file-select").click(); };

    const handleFileSelect = (e) => {
        setUploadProgress(0);
        const file = e.target.files[0];
        if (file && file.name.endsWith(".mp4")) {
            setUploadFile(file);
            setUploadMsg("");
        } else {
            setUploadFile(null);
            setUploadMsg(file ? "Invalid file format." : "");
        }
    };

    const handleUploadMovie = async () => {
        if (!uploadFile) return;
        setUploading(true);
        setUploadProgress(0);
        setUploadMsg("Getting upload URL...");

        try {
            const userId = user?.id || user?._id;
            const presignResponse = await getPresignedUrl(uploadFile.name, uploadFile.type, userId);
            if (!presignResponse.success) throw new Error(presignResponse.message);

            setUploadMsg("Uploading file...");
            await axios.put(presignResponse.data.url, uploadFile, {
                headers: { 'Content-Type': uploadFile.type },
                onUploadProgress: (e) => e.total && setUploadProgress(Math.round((e.loaded * 100) / e.total)),
            });

            setUploadMsg("Finalizing upload...");
            const finalizeResponse = await finalizeUpload(uploadFile.name, userId);
            if (!finalizeResponse.success) throw new Error(finalizeResponse.message);

            setMovies(prev => [...prev.filter(m => m.file_name !== finalizeResponse.data.file_name), finalizeResponse.data]);
            setUploadMsg("Upload successful!");
            setUploadFile(null);

        } catch (error) {
            setUploadMsg(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteMovie = (index, fileName, subFolder) => {
        modalData.current = {
            msg: "Delete this movie?",
            yesHandler: async () => {
                try {
                    const presignRes = await getPresignedDeleteUrl(fileName, subFolder);
                    if (!presignRes.success) throw new Error(presignRes.message);
                    
                    await axios.delete(presignRes.data.url);
                    
                    const finalizeRes = await finalizeDelete(fileName, subFolder);
                    if (!finalizeRes.success) throw new Error(finalizeRes.message);
                    
                    setMovies(prev => prev.filter((_, i) => i !== index));
                } catch (error) {
                    alert(`Error deleting movie: ${error.message}`);
                }
                setShowModal(false);
            }
        };
        setShowModal(true);
    };

    return (
        <>
            {showAddMessageModal && <AddMessageModal closeHandler={() => setShowAddMessageModal(false)} saveHandler={(msg) => handleMessageUpdate(-1, "add", msg)} />}
            {showModal && <ConfirmationModal titleData={{ text: modalData.current.msg, style: { fontSize: '24px' } }} yesData={{ text: "Yes", style: { backgroundColor: 'red', border: 'none', padding: '16px', fontWeight: 'bold' }, noHover: true, actionHandler: modalData.current.yesHandler }} noData={{ text: "No", style: { backgroundColor: 'white', color: 'black', padding: '16px', border: 'none' } }} closeHandler={() => setShowModal(false)} />}
            
            <div className='settings-page'>
                <form onSubmit={(e) => e.preventDefault()}>
                    <Section title="Colors Theme">
                        <div className='colors-themes'>
                            <div className={`color-theme-btn dark ${colorsTheme === 'dark' ? 'selected' : ''}`} data-value="dark" onClick={(e) => setColorsTheme(e.target.getAttribute("data-value"))}></div>
                            <div className={`color-theme-btn light ${colorsTheme === 'light' ? 'selected' : ''}`} data-value="light" onClick={(e) => setColorsTheme(e.target.getAttribute("data-value"))}></div>
                        </div>
                    </Section>
                    
                    <Section title="Title">
                        <Input id="title" value={title} setValue={setTitle} disabled={isTitleDisabled} disableInput={() => setIsTitleDisabled(true)}>
                            <div className='font-icon' onClick={() => setIsTitleDisabled(false)}><i className='fa fa-edit'></i></div>
                        </Input>
                    </Section>

                    <Section title="Footer Messages">
                        <div className='add-footer-msg' onClick={() => setShowAddMessageModal(true)}><i className='fa fa-plus'></i></div>
                        <table className="footer-table">
                            <thead><tr><th>Message</th><th width="5%">Active</th><th width="10%"></th></tr></thead>
                            <tbody>
                                {footerMessages.map((m, i) => (
                                    <tr key={m.id}>
                                        <td><Input id={`footer-msg-${m.id}`} value={m.msg} setValue={(v) => handleMessageUpdate(i, "msg", v)} disabled={m.disabled} disableInput={() => handleMessageUpdate(i, "edit")} /></td>
                                        <td><div className='active'><input type="checkbox" checked={m.active} onChange={() => handleMessageUpdate(i, "active")} /></div></td>
                                        <td>
                                            <div className='actions'>
                                                <div className='font-icon' onClick={() => handleMessageUpdate(i, "edit")}><i className='fa fa-edit'></i></div>
                                                <div className='font-icon' onClick={() => handleDeleteMessage(i)}><i className='fa fa-trash'></i></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>

                    <Section title="Downloaded Movies">
                        <div className='movies'>
                            <div className='movies-table'>
                                <table>
                                    <thead><tr><th width="30%">File Name</th><th width="30%">Times in Cycle</th><th width="15%">Active</th><th width="30%">Actions</th></tr></thead>
                                    <tbody>
                                        {movies?.map((movie, index) => (
                                            <tr key={`${movie.file_name}-${index}`}>
                                                <td>{movie.file_name}</td>
                                                <td>
                                                    <select value={movie.times} onChange={(e) => setMovies(prev => prev.map((m, i) => i === index ? { ...m, times: e.target.value } : m))}>
                                                        <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                                                    </select>
                                                </td>
                                                <td><div className='active'><input type="checkbox" checked={movie.active} onChange={() => setMovies(prev => prev.map((m, i) => i === index ? { ...m, active: !m.active } : m))} /></div></td>
                                                <td>
                                                    <div className='actions'>
                                                        <div className='font-icon' onClick={() => handlePreviewMovie(movie.url)}><i className='fa fa-eye'></i></div>
                                                        <div className={`font-icon ${movie.deletable ? '' : 'disabled'}`} onClick={movie.deletable ? () => handleDeleteMovie(index, movie.file_name, movie.subFolder) : null}><i className='fa fa-trash'></i></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className='movie-preview'>
                                <video ref={videoRef} controls src={previewMovie || ''}><source src={previewMovie || ''} type="video/mp4" />Your browser does not support video.</video>
                            </div>
                        </div>
                        <div className='upload-wrapper'>
                            <input id="file-select" type="file" accept=".mp4" onChange={handleFileSelect} style={{ display: 'none' }} />
                            <Modal.Button btnData={{ text: "Select file", type: "button", onClick: uploading ? null : handleFileClick, disabled: uploading }} />
                            <div className='progress-wrapper'>
                                <div className='upload-progress empty'></div>
                                <div className='upload-progress full' style={{ width: `${uploadProgress}%` }}></div>
                                <div className='upload-progress file-name'>{uploadFile?.name ?? ""}</div>
                            </div>
                            <Modal.Button btnData={{ text: "Upload file", type: "button", onClick: (uploadFile && !uploading) ? handleUploadMovie : null, disabled: !uploadFile || uploading }} />
                            <div className='upload-msg'>{uploadMsg}</div>
                        </div>
                    </Section>

                    <Section title="Online Movies Categories">
                        <div className='movies-categories'>
                            {onlineMoviesCategories.map((c, i) => (
                                <div key={i} className={`movie-category ${c.selected ? 'selected' : ''}`} onClick={() => toggleCategory(c.name)}>{c.name}</div>
                            ))}
                        </div>
                    </Section>

                    <div className='buttons'>
                        <Modal.Button btnData={{ text: "Save Settings", type: "button", disabled: (!user?.editable && !hasPermissions()), onClick: (user?.editable || hasPermissions()) ? handleSaveSettings : null }} />
                        <Modal.Button btnData={{ text: "Cancel", type: "button", onClick: cancelFunc }} />
                    </div>
                </form>
            </div>
        </>
    );
};

export default Settings;