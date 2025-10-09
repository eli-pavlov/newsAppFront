import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import { useUserContext } from "../../../contexts/AuthContext";
import { getEnvVariable } from "../../../utils/env";
import { At } from "../../../api/db";

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
    
    // --- FIX: Renamed state setter to avoid conflict ---
    const [localColorsTheme, setLocalColorsTheme] = useState('');
    const { setColorsTheme: setGlobalColorsTheme, settings, setSettings } = useSettingsContext();
    // --- END FIX ---

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
        if (settings) {
            setLocalColorsTheme(settings.colors_theme || 'light');
            setTitle(settings.title || '');
            setFooterMessages((settings.footer_messages || []).map(m => ({ ...m, disabled: true })));
            setMovies(settings.movies || []);
            const selectedCategories = (settings.online_movies_categories || []).filter(c => c.selected).map(c => c.name);
            const allCategories = getEnvVariable('ONLINE_MOVIES_CATEGORIES').split(',').map(c => ({
                name: c,
                selected: selectedCategories.includes(c)
            }));
            setOnlineMoviesCategories(allCategories);
        }
    };

    useEffect(() => {
        init();
    }, [settings]);
    
    const handleThemeChange = (theme) => {
        setLocalColorsTheme(theme);
        setGlobalColorsTheme(theme); 
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
            document.getElementById('file-select').value = null;
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
    
    // ... all other functions from your original file like handleFileSelect, confirmDeleteMovie, handleSave, etc. ...

    // (The JSX remains the same as my previous answer, just ensure you're using the correct state variables and handlers)
    return (
        <>
            {showAddMsgModal && <AddFooterMsgModal closeHandler={() => setShowAddMsgModal(false)} saveHandler={(msg) => handleFooterMsgChange(-1, 'add', msg)} />}
            {showDeleteModal && <ConfirmModal titleData={{ text: modalData.current.msg }} yesData={{ text: "Yes", actionHandler: modalData.current.yesHandler }} noData={{ text: "No" }} closeHandler={() => setShowDeleteModal(false)} />}
            
            <div className="settings-page">
                <form>
                    <Section title="Colors Theme">
                        <div className="colors-themes">
                            <div className={`color-theme-btn dark ${localColorsTheme === "dark" ? "selected" : ""}`} onClick={() => handleThemeChange('dark')} />
                            <div className={`color-theme-btn light ${localColorsTheme === "light" ? "selected" : ""}`} onClick={() => handleThemeChange('light')} />
                        </div>
                    </Section>
                    
                    {/* ... other sections ... */}

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
                    
                    {/* ... other sections and save/cancel buttons ... */}
                </form>
            </div>
        </>
    );
}

export default Settings;