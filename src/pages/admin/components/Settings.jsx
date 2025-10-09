import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { useUserContext } from "../../../contexts/AuthContext";
import { getEnvVariable } from "../../../utils/env";
import { At } from "../../../api/db"; // Updated import

import ConfirmModal from "../../../components/ConfirmModal";
import AddFooterMsgModal from "../modal/AddFooterMsgModal";
import CustomButton from "../../../components/CustomButton";
import Section from "./Section";
import AdminCustomInput from "./AdminCustomInput";

function Settings({ cancelFunc, user }) {
    const [_, setLocation] = useLocation();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    let modalData = useRef({});
    const [showAddMsgModal, setShowAddMsgModal] = useState(false);
    const [title, setTitle] = useState('');
    const [isTitleDisabled, setIsTitleDisabled] = useState(true);
    const [footerMessages, setFooterMessages] = useState([]);
    const [colorsTheme, setColorsTheme] = useState('');
    const { setColorsTheme: setGlobalColorsTheme, settings, setSettings } = useSettingsContext();
    const [movies, setMovies] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const videoRef = useRef(null);
    const [onlineMoviesCategories, setOnlineMoviesCategories] = useState([]);
    const [keysPressed, setKeysPressed] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const init = () => {
        setColorsTheme(settings.colors_theme);
        setTitle(settings.title);
        setFooterMessages(settings.footer_messages.map(m => ({ ...m, disabled: true })));
        setMovies(settings.movies ? settings.movies.map(m => ({ ...m })) : []);
        const selectedCategories = (settings.online_movies_categories || []).filter(c => c.selected).map(c => c.name);
        const allCategories = getEnvVariable('ONLINE_MOVIES_CATEGORIES').split(',').map(c => ({
            name: c,
            selected: selectedCategories.includes(c)
        }));
        setOnlineMoviesCategories(allCategories);
    };

    useEffect(() => {
        if (settings && settings.footer_messages) {
            init();
        }
    }, [settings]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (keysPressed.includes(e.key)) return;
            setKeysPressed(prev => [...prev, e.key]);
        };
        const handleKeyUp = () => setKeysPressed([]);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [keysPressed]);

    const handleFooterMsgChange = (index, field, value = null) => {
        let newMessages = [...footerMessages];
        switch (field) {
            case 'msg': newMessages[index].msg = value; break;
            case 'edit': newMessages[index].disabled = !newMessages[index].disabled; break;
            case 'active': newMessages[index].active = !newMessages[index].active; break;
            case 'delete': newMessages.splice(index, 1); break;
            case 'add':
                const newMsg = { id: Date.now(), msg: value, disabled: true, active: false };
                newMessages.push(newMsg);
                setShowAddMsgModal(false);
                break;
        }
        setFooterMessages(newMessages);
    };

    const confirmDeleteFooterMsg = (index) => {
        modalData.current = {
            msg: "Delete this message?",
            yesHandler: () => handleFooterMsgChange(index, 'delete')
        };
        setShowDeleteModal(true);
    };

    const handleFileSelect = (e) => {
        setUploadProgress(0);
        setUploadMsg('');
        const file = e.target.files[0];
        if (file) {
            if (file.type === "video/mp4") {
                setSelectedFile(file);
            } else {
                setSelectedFile(null);
                setUploadMsg("Invalid file format. Please select an MP4 file.");
            }
        } else {
            setSelectedFile(null);
        }
    };
    
    const handleFileUpload = async () => {
        if (!selectedFile) return;

        setUploadMsg("Uploading...");
        setIsUploading(true);

        const result = await At.uploadFileWithPresignedUrl(selectedFile, setUploadProgress);
        
        setIsUploading(false);
        setUploadMsg(result.message || (result.success ? "Upload successful!" : "Upload failed."));

        if (result.success) {
            setSelectedFile(null);
            document.getElementById('file-select').value = null; // Reset file input
            setMovies(prevMovies => [...prevMovies, result.data]);
        }
    };

    const handleDeleteMovie = async () => {
        const { index, object_key } = modalData.current;
        const result = await At.deleteMovie(object_key);
        if (result.success) {
            setMovies(prev => prev.filter((_, i) => i !== index));
        } else {
            alert(result.message || "Failed to delete movie.");
        }
        setShowDeleteModal(false);
    };

    const confirmDeleteMovie = (index, objectKey) => {
        modalData.current = {
            msg: "Delete this movie?",
            index,
            object_key: objectKey,
            yesHandler: handleDeleteMovie
        };
        setShowDeleteModal(true);
    };

    const handleSave = async () => {
        // Create a deep copy to avoid mutating the original settings object
        const settingsToSave = JSON.parse(JSON.stringify(settings));

        settingsToSave.colors_theme = colorsTheme;
        settingsToSave.title = title;
        settingsToSave.footer_messages = footerMessages.map((m, i) => ({ ...m, id: i }));
        // The file data itself is not saved here, only settings related to it
        settingsToSave.movies = movies.map((m) => ({
            object_key: m.object_key,
            active: m.active,
            times: m.times,
        }));
        settingsToSave.online_movies_categories = onlineMoviesCategories.map((c, i) => ({ ...c, id: i }));

        const result = await At.saveSettings(settingsToSave);
        if (result.success) {
            // Refetch settings from server to have the single source of truth
            const updatedSettings = await At.getSettings();
            if(updatedSettings.success) {
                setSettings(updatedSettings.data);
            }
            setLocation("/home");
        } else {
            alert(result.message || "Failed to save settings.");
        }
    };

    const playPreview = (url) => {
        setPreviewUrl(url);
        const video = videoRef.current;
        if (video) {
            video.load();
        }
    };

    const isSuperUser = () => keysPressed.includes("Control") && keysPressed.includes("Shift");

    return (
        <>
            {showAddMsgModal && <AddFooterMsgModal closeHandler={() => setShowAddMsgModal(false)} saveHandler={(msg) => handleFooterMsgChange(-1, 'add', msg)} />}
            {showDeleteModal && <ConfirmModal titleData={{ text: modalData.current.msg }} yesData={{ text: "Yes", actionHandler: modalData.current.yesHandler }} noData={{ text: "No" }} closeHandler={() => setShowDeleteModal(false)} />}
            
            <div className="settings-page">
                <form>
                    <Section title="Colors Theme">
                        <div className="colors-themes">
                            <div className={`color-theme-btn dark ${colorsTheme === "dark" ? "selected" : ""}`} data-value="dark" onClick={() => { setColorsTheme('dark'); }} />
                            <div className={`color-theme-btn light ${colorsTheme === "light" ? "selected" : ""}`} data-value="light" onClick={() => { setColorsTheme('light'); }} />
                        </div>
                    </Section>
                    
                    <Section title="Title">
                        <AdminCustomInput id="title" value={title} setValue={setTitle} disabled={isTitleDisabled} disableInput={() => setIsTitleDisabled(true)}>
                            <div className="font-icon" onClick={() => setIsTitleDisabled(false)}><i className="fa fa-edit"></i></div>
                        </AdminCustomInput>
                    </Section>

                    <Section title="Footer Messages">
                        <div className="add-footer-msg" onClick={() => setShowAddMsgModal(true)}><i className="fa fa-plus"></i></div>
                        <table className="footer-table">
                            <thead><tr><th>Message</th><th width="5%">Active</th><th width="10%"></th></tr></thead>
                            <tbody>
                                {footerMessages.map((item, index) => (
                                    <tr key={item.id}>
                                        <td><AdminCustomInput id={`footer-msg-${item.id}`} value={item.msg} setValue={v => handleFooterMsgChange(index, 'msg', v)} disabled={item.disabled} disableInput={() => handleFooterMsgChange(index, 'edit')} /></td>
                                        <td><div className="active"><input type="checkbox" checked={item.active} onChange={() => handleFooterMsgChange(index, 'active')} /></div></td>
                                        <td>
                                            <div className="actions">
                                                <div className="font-icon" onClick={() => handleFooterMsgChange(index, 'edit')}><i className="fa fa-edit"></i></div>
                                                <div className="font-icon" onClick={() => confirmDeleteFooterMsg(index)}><i className="fa fa-trash"></i></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>

                    <Section title="Downloaded Movies">
                        <div className="movies">
                            <div className="movies-table">
                                <table>
                                    <thead><tr><th width="30%">File Name</th><th width="30%">Times in Cycle</th><th width="15%">Active</th><th width="30%">Actions</th></tr></thead>
                                    <tbody>
                                        {movies && movies.map((movie, index) => (
                                            <tr key={movie.object_key || index}>
                                                <td>{movie.file_name}</td>
                                                <td>
                                                    <select value={movie.times} onChange={e => setMovies(prev => prev.map((m, i) => i === index ? { ...m, times: e.target.value } : m))}>
                                                        <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                                                    </select>
                                                </td>
                                                <td><div className="active"><input type="checkbox" checked={movie.active} onChange={() => setMovies(prev => prev.map((m, i) => i === index ? { ...m, active: !m.active } : m))} /></div></td>
                                                <td>
                                                    <div className="actions">
                                                        <div className="font-icon" onClick={() => playPreview(movie.url)}><i className="fa fa-eye"></i></div>
                                                        <div className={`font-icon ${movie.deletable ? "" : "disabled"}`} onClick={movie.deletable ? () => confirmDeleteMovie(index, movie.object_key) : null}><i className="fa fa-trash"></i></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="movie-preview">
                                <video ref={videoRef} controls><source id="videoSrc" src={previewUrl || ''} type="video/mp4" />Your browser does not support the video tag.</video>
                            </div>
                        </div>
                        <div className="upload-wrapper">
                            <input id="file-select" type="file" accept=".mp4" onChange={handleFileSelect} style={{ display: 'none' }} />
                            <CustomButton btnData={{ name: "select", text: "Select file", type: "button", onClick: isUploading ? null : () => document.getElementById('file-select').click(), disabled: isUploading }} />
                            <div className="progress-wrapper">
                                <div className="upload-progress empty"></div>
                                <div className="upload-progress full" style={{ width: `${uploadProgress}%` }}></div>
                                <div className="upload-progress file-name">{selectedFile?.name ?? ""}</div>
                            </div>
                            <CustomButton btnData={{ name: "upload", text: "Upload file", type: "button", onClick: (selectedFile && !isUploading) ? handleFileUpload : null, disabled: !selectedFile || isUploading }} />
                            <div className="upload-msg">{uploadMsg}</div>
                        </div>
                    </Section>

                    <Section title="Online Movies Categories">
                        <div className="movies-categories">
                            {onlineMoviesCategories.map((cat, index) => (
                                <div key={index} className={`movie-category ${cat.selected ? "selected" : ""}`} onClick={() => setOnlineMoviesCategories(prev => prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c))}>{cat.name}</div>
                            ))}
                        </div>
                    </Section>

                    <div className="buttons">
                        <CustomButton btnData={{ name: "save", text: "Save Settings", type: "button", disabled: !user.editable && !isSuperUser(), onClick: (user.editable || isSuperUser()) ? handleSave : null }} />
                        <CustomButton btnData={{ name: "cancel", text: "Cancel", type: "button", onClick: cancelFunc }} />
                    </div>
                </form>
            </div>
        </>
    );
}
export default Settings;