// newsAppFront/src/pages/admin/components/Settings.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { At } from '../../../api/db.jsx'; // Your API client
import { SettingsContext } from '../../../contexts/SettingsContext';
import Modal from '../../../components/Modal'; // Assuming Modal is the base modal
import AddFooterMsgModal from '../modal/AddFooterMsgModal';
import Section from './Section';
import AdminCustomInput from './AdminCustomInput';
import CustomButton from '../../../components/CustomButton'; // Corrected path
import ConfirmModal from '../../../components/ConfirmModal'; // Corrected path

function Settings({ cancelFunc, user }) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({});
    const [title, setTitle] = useState('');
    const [theme, setTheme] = useState('');
    const [footerMessages, setFooterMessages] = useState([]);
    const [movies, setMovies] = useState([]);
    const [onlineCategories, setOnlineCategories] = useState([]);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMessage, setUploadMessage] = useState('');
    const [videoPreview, setVideoPreview] = useState(null);
    const videoRef = useRef(null);
    const { setColorsTheme, settings, setSettings } = useContext(SettingsContext);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setTheme(settings.colors_theme || 'light');
        setTitle(settings.title || '');
        setFooterMessages(settings.footer_messages?.map(msg => ({ ...msg, disabled: true })) || []);
        setMovies(settings.movies || []);
        const selectedCats = (settings.online_movies_categories || []).filter(cat => cat.selected).map(cat => cat.name);
        const allCats = process.env.VITE_ONLINE_MOVIES_CATEGORIES.split(',').map(cat => ({
            name: cat.trim(),
            selected: selectedCats.includes(cat.trim())
        }));
        setOnlineCategories(allCats);
    }, [settings]);

    const toggleCategory = (category) => {
        const updated = onlineCategories.map(cat =>
            cat.name === category ? { ...cat, selected: !cat.selected } : cat
        );
        setOnlineCategories(updated);
    };

    const handleSave = async () => {
        const updatedSettings = {
            ...settings,
            colors_theme: theme,
            title,
            footer_messages: footerMessages.map((msg, index) => ({ ...msg, id: index })),
            movies: movies.map((movie, index) => ({ ...movie, id: index })),
            online_movies_categories: onlineCategories.map((cat, index) => ({ ...cat, id: index }))
        };
        const result = await At.createFetch('/settings/set', 'POST', updatedSettings, true);
        if (result.success) {
            setSettings(updatedSettings);
            cancelFunc();
        } else {
            // Handle error (e.g., alert(result.message))
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        setIsUploading(true);
        setUploadProgress(0);
        setUploadMessage('Uploading file, please wait...');

        try {
            const contentType = uploadFile.type || 'video/mp4';
            const presignRes = await At.createFetch('/files/presign', 'POST', { 
                fileName: uploadFile.name, 
                subFolder: user.id || user._id,
                contentType 
            }, true);
            if (!presignRes.success) {
                throw new Error(presignRes.message || 'Presign failed');
            }

            const uploadRes = await fetch(presignRes.url, {
                method: 'PUT',
                body: uploadFile,
                headers: {
                    'Content-Type': contentType
                }
            });
            if (!uploadRes.ok) {
                throw new Error(`Upload failed: ${uploadRes.statusText}`);
            }

            const finalizeRes = await At.createFetch('/files/finalize', 'POST', { 
                fileName: uploadFile.name, 
                subFolder: user.id || user._id 
            }, true);
            if (finalizeRes.success) {
                setUploadMessage('Upload successful');
                // Refresh movies list or add to state
                const refreshed = await At.createFetch('/settings/get', 'GET', null, true);
                if (refreshed.success) {
                    setMovies(refreshed.data.movies || []);
                }
            } else {
                throw new Error(finalizeRes.message || 'Finalize failed');
            }
        } catch (error) {
            setUploadMessage(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            setUploadFile(null);
            setUploadProgress(0);
            setTimeout(() => setUploadMessage(''), 5000);
        }
    };

    const handleDeleteMovie = async (index, fileName, subFolder) => {
        setConfirmData({
            msg: 'Delete this movie?',
            yesHandler: async () => {
                try {
                    const presignDel = await At.createFetch('/files/delete_presign', 'POST', { fileName, subFolder }, true);
                    if (!presignDel.success) {
                        throw new Error(presignDel.message || 'Presign delete failed');
                    }

                    const deleteRes = await fetch(presignDel.url, { method: 'DELETE' });
                    if (!deleteRes.ok) {
                        throw new Error(`Delete failed: ${deleteRes.statusText}`);
                    }

                    const finalizeDel = await At.createFetch('/files/finalize_delete', 'POST', { fileName, subFolder }, true);
                    if (finalizeDel.success) {
                        // Refresh movies list
                        const refreshed = await At.createFetch('/settings/get', 'GET', null, true);
                        if (refreshed.success) {
                            setMovies(refreshed.data.movies || []);
                        }
                    } else {
                        throw new Error(finalizeDel.message || 'Finalize delete failed');
                    }
                } catch (error) {
                    // Handle error (e.g., alert(error.message))
                }
                setConfirmModalOpen(false);
            }
        });
        setConfirmModalOpen(true);
    };

    const previewVideo = (url) => {
        setVideoPreview(url);
        if (videoRef.current) {
            videoRef.current.load();
        }
    };

    return (
        <div className="admin-settings">
            {/* Theme Selector */}
            <Section title="Colors Theme">
                <div className="colors-themes">
                    <div className={`color-theme-btn dark ${theme === 'dark' ? 'selected' : ''}`}
                         data-value="dark"
                         onClick={(e) => {
                             setColorsTheme(e.target.getAttribute('data-value'));
                             setTheme(e.target.getAttribute('data-value'));
                         }}>
                    </div>
                    <div className={`color-theme-btn light ${theme === 'light' ? 'selected' : ''}`}
                         data-value="light"
                         onClick={(e) => {
                             setColorsTheme(e.target.getAttribute('data-value'));
                             setTheme(e.target.getAttribute('data-value'));
                         }}>
                    </div>
                </div>
            </Section>

            {/* Title Input */}
            <Section title="Title">
                <AdminCustomInput
                    id="title"
                    value={title}
                    setValue={setTitle}
                    disabled={true} // Editable only for admin
                />
            </Section>

            {/* Footer Messages */}
            <Section title="Footer Messages">
                {/* Existing code for footer messages */}
            </Section>

            {/* Downloaded Movies */}
            <Section title="Downloaded Movies">
                {/* Existing code for movies table and upload */}
                <div className="upload-wrapper">
                    <input
                        id="file-select"
                        type="file"
                        accept=".mp4"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                    <CustomButton
                        text="Select file"
                        onClick={() => document.getElementById('file-select').click()}
                        disabled={isUploading}
                    />
                    {uploadFile && (
                        <div className="progress-wrapper">
                            <div className="upload-progress empty"></div>
                            <div className="upload-progress full" style={{ width: `${uploadProgress}%` }}></div>
                            <div className="upload-progress file-name">{uploadFile.name}</div>
                        </div>
                    )}
                    <CustomButton
                        text="Upload file"
                        onClick={handleUpload}
                        disabled={!uploadFile || isUploading}
                    />
                    <div className="upload-msg">{uploadMessage}</div>
                </div>
            </Section>

            {/* Online Movies Categories */}
            <Section title="Online Movies Categories">
                <div className="movies-categories">
                    {onlineCategories.map((cat, index) => (
                        <div
                            key={index}
                            className={`movie-category ${cat.selected ? 'selected' : ''}`}
                            onClick={() => toggleCategory(cat.name)}
                        >
                            {cat.name}
                        </div>
                    ))}
                </div>
            </Section>

            {/* Save/Cancel Buttons */}
            <div className="buttons">
                <CustomButton
                    text="Save Settings"
                    onClick={handleSave}
                    style={{ padding: '12px', fontSize: '24px' }}
                />
                <CustomButton
                    text="Cancel"
                    onClick={cancelFunc}
                    style={{ padding: '12px', fontSize: '24px' }}
                />
            </div>

            {/* Confirm Modal */}
            {confirmModalOpen && (
                <ConfirmModal
                    titleData={{ text: confirmData.msg, style: { fontSize: '24px' } }}
                    yesData={{
                        text: 'Yes',
                        style: { backgroundColor: 'red', border: 'none', padding: '16px', fontWeight: 'bold' },
                        noHover: true,
                        actionHandler: confirmData.yesHandler
                    }}
                    noData={{
                        text: 'No',
                        style: { backgroundColor: 'white', color: 'black', padding: '16px', border: 'none' }
                    }}
                    closeHandler={() => setConfirmModalOpen(false)}
                />
            )}

            {/* Add Footer Msg Modal */}
            {addModalOpen && (
                <AddFooterMsgModal
                    closeHandler={() => setAddModalOpen(false)}
                    saveHandler={(msg) => {
                        // Add logic
                        setAddModalOpen(false);
                    }}
                />
            )}

            {/* Video Preview */}
            {videoPreview && (
                <video ref={videoRef} controls>
                    <source src={videoPreview} type="video/mp4" />
                </video>
            )}
        </div>
    );
}

export default Settings;