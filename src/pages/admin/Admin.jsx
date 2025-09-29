// src/pages/Admin/Settings.jsx
import { useEffect, useState, useRef } from 'react';
import { useLocation } from "wouter";
import { useSettings } from '../../contexts/SettingsContext';
import At from '../../services/Wp';
import ModalConfirm from '../../components/ModalConfirm';
import ModalNewMessage from './ModalNewMessage';
import Section from '../../components/Section';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function Settings({ cancelFunc, user }) {
    const [, navigate] = useLocation();
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    let confirmData = useRef({});
    const [isNewMessageModal, setNewMessageModal] = useState(false);
    const [title, setTitle] = useState('');
    const [titleDisabled, setTitleDisabled] = useState(true);
    const [footerMessages, setFooterMessages] = useState([]);
    const [colorsTheme, setColorsTheme] = useState('');
    const { setColorsTheme, settings, setSettings } = useSettings();
    const [movies, setMovies] = useState([]);
    const [previewMovie, setPreviewMovie] = useState(null);
    const videoRef = useRef(null);
    const [onlineMoviesCategories, setOnlineMoviesCategories] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [activeKeys, setActiveKeys] = useState([]);

    function init() {
        setColorsTheme(settings.colors_theme);
        setTitle(settings.title);
        setFooterMessages(settings.footer_messages.map(item => ({ ...item, disabled: true })));
        setMovies(settings.movies.map(item => ({ ...item })));
        const selectedCategories = (settings.online_movies_categories || []).filter(c => c.selected).map(c => c.name);
        const allCategories = import.meta.env.VITE_ONLINE_MOVIES_CATEGORIES.split(',').map(name => ({ name: name, selected: selectedCategories.includes(name) }));
        setOnlineMoviesCategories(allCategories);
    }

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (activeKeys.includes(e.key))
                return;
            const keys = [...activeKeys, e.key];
            setActiveKeys(keys);
        }
        const handleKeyUp = (e) => {
            setActiveKeys([]);
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [activeKeys]);

    function handleEditTitle() {
        setTitleDisabled(null);
    }
    function disableEditTitle() {
        setTitleDisabled(true);
    }

    function handleFooterMessage(index, field, value = null) {
        let items = [...footerMessages];
        switch (field) {
            case 'msg':
                items[index].msg = value;
                break;
            case 'edit':
                items[index].disabled = !items[index].disabled;
                break;
            case 'active':
                items[index].active = !items[index].active;
                break;
            case 'delete':
                items.splice(index, 1);
                break;
            case 'add':
                const newItem = { id: items.length + 1, msg: value, disabled: true, active: false };
                items.push(newItem);
                setNewMessageModal(false);
                break;
        }
        setFooterMessages(items);
    }

    function confirmDeleteMessage(index) {
        confirmData.current = {
            msg: "Delete this message?",
            yesHandler: () => { handleFooterMessage(index, 'delete') }
        }
        setConfirmOpen(true);
    }

    async function save() {
        let data = {};
        data.colors_theme = colorsTheme;
        data.title = title;
        data.footer_messages = footerMessages.map((item, index) => ({ ...item, id: index }));
        data.movies = movies.map((item, index) => ({ ...item, id: index }));
        data.online_movies_categories = onlineMoviesCategories.map((item, index) => ({ ...item, id: index }));
        await At.saveSettings(data);
        setSettings(data);
        navigate('/home');
    }

    function handlePreview(url) {
        setPreviewMovie(url);
        const video = videoRef.current;
        if (!video) return;
        video.load();
        const handleLoadedData = () => {
            video.removeEventListener('loadeddata', handleLoadedData);
        };
        video.addEventListener('loadeddata', handleLoadedData);
    }

    function handleCategorySelection(name) {
        let items = [...onlineMoviesCategories];
        items.forEach(item => {
            if (item.name === name)
                item.selected = !item.selected;
        })
        setOnlineMoviesCategories(items);
    }

    function showAdminFeatures() {
        return activeKeys.includes('Control') && activeKeys.includes('Shift');
    }

    function handleFileSelect() {
        setUploadMessage('');
        document.querySelector('#file-select').click();
    }

    function handleFileChange(event) {
        setUploadProgress(0);
        if (event.target.files.length === 0) {
            setSelectedFile(null);
        } else {
            const file = event.target.files[0];
            if (file.name.endsWith('mp4')) {
                setSelectedFile(file);
                setUploadMessage('');
            } else {
                setSelectedFile(null);
                setUploadMessage("Invalid file format.");
            }
        }
    }

    async function handleUpload() {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadMessage('Uploading file, please wait...');

        const result = await At.uploadMovie(selectedFile, (percent) => {
            setUploadProgress(percent);
        });
        
        setUploadMessage(result.message);
        setIsUploading(false);

        if (result.success) {
            setSelectedFile(null);
            setMovies(prevMovies => [...prevMovies, result.data]);
        }
    }

    async function confirmDeleteMovie(index, fileName, subFolder) {
        confirmData.current = {
            msg: "Delete this movie?",
            yesHandler: () => { deleteMovie(index, fileName, subFolder) }
        }
        setConfirmOpen(true);
    }

    async function deleteMovie(index, fileName, subFolder) {
        const result = await At.deleteMovie(fileName, subFolder);
        if (result.success) {
            setMovies(movies.filter((item, i) => i !== index));
        }
    }

    return (
        <>
            {isNewMessageModal &&
                <ModalNewMessage
                    closeHandler={() => { setNewMessageModal(false) }}
                    saveHandler={(msg) => { handleFooterMessage(-1, 'add', msg) }}
                />}
            {isConfirmOpen &&
                <ModalConfirm
                    titleData={{ text: confirmData.current.msg, style: { fontSize: "24px" } }}
                    yesData={{ text: "Yes", style: { backgroundColor: "red", border: "none", padding: "16px", fontWeight: "bold" }, noHover: true, actionHandler: confirmData.current.yesHandler }}
                    noData={{ text: "No", style: { backgroundColor: "white", color: "black", padding: "16px", border: "none" } }}
                    closeHandler={() => { setConfirmOpen(false) }} />}

            <div className='settings-page'>
                <form>
                    <Section title="Colors Theme">
                        <div className='colors-themes'>
                            <div className={`color-theme-btn dark ${colorsTheme === 'dark' ? 'selected' : ''}`} data-value='dark' onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setColorsTheme(e.target.getAttribute('data-value')) }}></div>
                            <div className={`color-theme-btn light ${colorsTheme === 'light' ? 'selected' : ''}`} data-value='light' onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setColorsTheme(e.target.getAttribute('data-value')) }}></div>
                        </div>
                    </Section>
                    <Section title="Title">
                        <Input
                            id='title'
                            value={title}
                            setValue={setTitle}
                            disabled={titleDisabled}
                            disableInput={disableEditTitle}
                        >
                            <div className='font-icon' onClick={handleEditTitle}>
                                <i className="fa fa-edit"></i>
                            </div>
                        </Input>
                    </Section>
                    <Section title="Footer Messages">
                        <div className='add-footer-msg' onClick={() => setNewMessageModal(true)}>
                            <i className="fa fa-plus"></i>
                        </div>
                        <table id="messages" className='footer-table'>
                            <thead>
                                <tr>
                                    <th>Message</th>
                                    <th width="5%">Active</th>
                                    <th width="10%"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {footerMessages.map((item, index) =>
                                    <tr key={item.id}>
                                        <td>
                                            <Input
                                                id={`footer-msg-${item.id}`}
                                                value={item.msg}
                                                setValue={(value) => { handleFooterMessage(index, 'msg', value) }}
                                                disabled={item.disabled}
                                                disableInput={() => { handleFooterMessage(index, 'edit') }}
                                            />
                                        </td>
                                        <td>
                                            <div className='active'>
                                                <input type="checkbox" checked={item.active} onChange={() => { handleFooterMessage(index, 'active') }} />
                                            </div>
                                        </td>
                                        <td>
                                            <div className='actions'>
                                                <div className='font-icon' onClick={() => { handleFooterMessage(index, 'edit') }}>
                                                    <i className="fa fa-edit"></i>
                                                </div>
                                                <div className='font-icon' onClick={() => confirmDeleteMessage(index)}>
                                                    <i className="fa fa-trash"></i>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Section>
                    <Section title="Downloaded Movies">
                        <div>
                            <div className='movies'>
                                <div className='movies-table'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th width="30%">File Name</th>
                                                <th width="30%">Times in Cycle</th>
                                                <th width="15%">Active</th>
                                                <th width="30%">Preview</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movies &&
                                                movies.map((movie, index) => (
                                                    <tr key={`${movie.file_name}-${index}`}>
                                                        <td>{movie.file_name}</td>
                                                        <td>
                                                            <select value={movie.times} onChange={(e) => {
                                                                const items = [...movies];
                                                                items[index].times = e.target.value;
                                                                setMovies(items);
                                                            }}>
                                                                <option value="1">1</option>
                                                                <option value="2">2</option>
                                                                <option value="3">3</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <div className='active'>
                                                                <input type="checkbox" checked={movie.active} onChange={() => {
                                                                    const items = [...movies];
                                                                    items[index].active = !items[index].active;
                                                                    setMovies(items);
                                                                }} />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className='actions'>
                                                                <div className="font-icon" onClick={() => { handlePreview(movie.url) }}>
                                                                    <i className="fa fa-eye"></i>
                                                                </div>
                                                                <div className={`font-icon ${movie.deletable ? "" : "disabled"}`} onClick={movie.deletable ? () => { confirmDeleteMovie(index, movie.file_name, movie.subFolder) } : null}>
                                                                    <i className="fa fa-trash"></i>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className='movie-preview'>
                                    <video ref={videoRef} controls>
                                        <source id="videoSrc" src={`${previewMovie}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>

                            <div className='upload-wrapper'>
                                <input id="file-select" type="file" accept=".mp4" onChange={handleFileChange} style={{ display: 'none' }} />
                                <Button
                                    btnData={{
                                        name: "select",
                                        text: "Select file",
                                        type: "button",
                                        onClick: isUploading ? null : handleFileSelect,
                                        style: { fontSize: '24px' },
                                        noHover: isUploading,
                                        disabled: isUploading
                                    }}
                                />
                                <div className='progress-wrapper'>
                                    <div className='upload-progress empty'></div>
                                    <div className='upload-progress full' style={{ width: `${uploadProgress}%` }}></div>
                                    <div className='upload-progress file-name'>{selectedFile?.name ?? ''}</div>
                                </div>
                                <Button
                                    btnData={{
                                        name: "upload",
                                        text: "Upload file",
                                        type: "button",
                                        onClick: (selectedFile && !isUploading) ? handleUpload : null,
                                        style: { fontSize: '24px' },
                                        noHover: !selectedFile || isUploading,
                                        disabled: !selectedFile || isUploading
                                    }}
                                />
                                <div className='upload-msg'>{uploadMessage}</div>
                            </div>
                        </div>
                    </Section>
                    <Section title="Online Movies Categories">
                        <div className='movies-categories'>
                            {onlineMoviesCategories.map((item, index) =>
                                <div key={index} className={`movie-category ${item.selected ? 'selected' : ''}`} onClick={() => { handleCategorySelection(item.name) }}>
                                    {item.name}
                                </div>
                            )}
                        </div>
                    </Section>
                    <div className='buttons'>
                        <Button
                            btnData={{
                                name: "save",
                                text: "Save Settings",
                                type: "button",
                                noHover: !user.editable && !showAdminFeatures(),
                                disabled: !user.editable && !showAdminFeatures(),
                                onClick: (user.editable || showAdminFeatures()) ? () => { save() } : null,
                                style: { padding: '12px', fontSize: '24px' }
                            }}
                        />
                        <Button
                            btnData={{
                                name: "cancel",
                                text: "Cancel",
                                type: "button",
                                onClick: () => { cancelFunc() },
                                style: { padding: '12px', fontSize: '24px' }
                            }}
                        />
                    </div>
                </form>
            </div>
        </>
    );
}
