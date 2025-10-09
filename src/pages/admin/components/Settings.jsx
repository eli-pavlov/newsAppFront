import { useEffect, useRef, useState } from 'react';
import Section from './Section';
import AdminCustomInput from './AdminCustomInput';
import ConfirmModal from '../../../components/ConfirmModal';
import At from '../../../../api/db';
import { useSettingsContext } from '../../../../contexts/SettingsContext';
import { getEnvVariable } from '../../../../utils/env';
import AddFooterMsgModal from '../modal/AddFooterMsgModal';
import CustomButton from '../../../components/CustomButton';

const Settings = ({ cancelFunc, user }) => {
    const [location, setLocation] = useLocation();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    let confirmData = useRef({});
    const [title, setTitle] = useState('');
    const [isTitleDisabled, setIsTitleDisabled] = useState(true);
    const [footerMessages, setFooterMessages] = useState([]);
    const [isAddFooterMsg, setIsAddFooterMsg] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('');
    const { setColorsTheme, settings, setSettings } = useSettingsContext();
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const videoRef = useRef(null);
    const [onlineMoviesCategories, setOnlineMoviesCategories] = useState([]);
    const [pressedKeys, setPressedKeys] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadMsg, setUploadMsg] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const initSettings = () => {
        setSelectedTheme(settings.colors_theme);
        setTitle(settings.title);
        setFooterMessages(settings.footer_messages.map(e => ({ ...e, disabled: true })));
        setMovies(settings.movies.map(e => ({ ...e })));
        const onlineMovies = (settings.online_movies_categories || []).filter(e => e.selected).map(e => e.name);
        const categories = getEnvVariable('ONLINE_MOVIES_CATEGORIES').split(',').map(e => ({ name: e, selected: onlineMovies.includes(e) }));
        setOnlineMoviesCategories(categories);
    }

    useEffect(() => {
        initSettings();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (pressedKeys.includes(e.key))
                return;

            const keys = [...pressedKeys, e.key];
            setPressedKeys(keys);
        }

        const handleKeyUp = (e) => {
            setPressedKeys([]);
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keyup', handleKeyUp);
        }

    }, [pressedKeys]);

    const handleFooterMsgState = (index, property, value = null) => {
        let msgs = [...footerMessages];

        switch (property) {
            case 'msg':
                msgs[index].msg = value;
                break;
            case 'edit':
                msgs[index].disabled = !msgs[index].disabled;
                break;
            case 'active':
                msgs[index].active = !msgs[index].active;
                break;
            case 'delete':
                msgs.splice(index, 1);
                break;
            case 'add':
                const newMsg = {
                    id: msgs.length + 1,
                    msg: value,
                    disabled: true,
                    active: false
                };
                msgs.push(newMsg);
                setIsAddFooterMsg(false);
                break;
        }

        setFooterMessages(msgs);
    }

    const handleDeleteFooterMsg = (index) => {
        confirmData.current = {
            msg: "Delete this message?",
            yesHandler: () => { handleFooterMsgState(index, 'delete') }
        }
        setIsConfirmOpen(true);
    }

    const handleSaveSettings = async () => {
        let updatedSettings = {};
        updatedSettings.colors_theme = selectedTheme;
        updatedSettings.title = title;
        updatedSettings.footer_messages = footerMessages.map((e, i) => ({ ...e, id: i }));
        updatedSettings.movies = movies.map((e, i) => ({ ...e, id: i }));
        updatedSettings.online_movies_categories = onlineMoviesCategories.map((e, i) => ({ ...e, id: i }));
        await At.saveSettings(updatedSettings);
        setSettings(updatedSettings);
        setLocation('/home');
    }

    const handleMoviePreview = (movieUrl) => {
        setSelectedMovie(movieUrl);
        const video = videoRef.current;
        if (!video) return;

        video.load();
        const handleLoadedData = () => {
            video.removeEventListener('loadeddata', handleLoadedData);
        };
        video.addEventListener('loadeddata', handleLoadedData);
    };

    const handleCategoryClick = (categoryName) => {
        let categories = [...onlineMoviesCategories];
        categories.forEach(e => {
            if (e.name === categoryName) {
                e.selected = !e.selected;
            }
        });
        setOnlineMoviesCategories(categories);
    }

    const checkSuperUser = () => {
        return pressedKeys.includes('Control') && pressedKeys.includes('Shift');
    }

    const onFileSelect = () => {
        setUploadMsg('');
        document.querySelector('#file-select').click();
    }

    const handleFileChange = (e) => {
        setUploadProgress(0);
        if (e.target.files.length === 0) {
            setSelectedFile(null);
        } else {
            const file = e.target.files[0];
            if (file.name.endsWith('mp4')) {
                setSelectedFile(file);
            } else {
                setSelectedFile(null);
                setUploadMsg('Invalid file format.');
            }
        }
    }

    const handleUploadFile = async () => {
        let timeout = 10;
        setUploadMsg('Uploading file, please wait...');
        setIsUploading(true);

        const interval = setInterval(() => {
            setUploadProgress(timeout);
            timeout = Math.min(timeout + 10, 95);
        }, 2000);

        const res = await At.uploadMovie(selectedFile, (e) => {
            const progress = Math.round((e.loaded * 100) / e.total);
            clearInterval(interval);
            setUploadProgress(progress);
        }, user?.id ? user.id : user._id);

        clearInterval(interval);
        setUploadProgress(100);
        setIsUploading(false);
        setUploadMsg(res.message);

        if (res.success) {
            setSelectedFile(null);
            const { file_name, url, deletable, subFolder, times, object_key } = res;
            setMovies([...movies.filter(m => m.url !== url), { file_name, url, subFolder, deletable, times, object_key, active: true }]);
        }
    }

    const handleDeleteMovie = async (index, objectKey) => {
        confirmData.current = {
            msg: "Delete this movie?",
            yesHandler: async () => {
                const res = await At.deleteFile(objectKey);
                if (res.success) {
                    setMovies(movies.filter((_, i) => i !== index));
                }
            }
        };
        setIsConfirmOpen(true);
    };

    return (
        <>
            {isAddFooterMsg && <AddFooterMsgModal closeHandler={() => { setIsAddFooterMsg(false) }} saveHandler={(value) => { handleFooterMsgState(-1, 'add', value) }} />}
            {isConfirmOpen &&
                <ConfirmModal
                    titleData={{ text: confirmData.current.msg, style: { fontSize: '24px' } }}
                    yesData={{ text: 'Yes', style: { backgroundColor: 'red', border: 'none', padding: '16px', fontWeight: 'bold' }, noHover: true, actionHandler: confirmData.current.yesHandler }}
                    noData={{ text: 'No', style: { backgroundColor: 'white', color: 'black', padding: '16px', border: 'none' } }}
                    closeHandler={() => { setIsConfirmOpen(false) }}
                />}
            <div className='settings-page'>
                <form>
                    <Section title="Colors Theme">
                        <div className='colors-themes'>
                            <div className={`color-theme-btn dark ${selectedTheme === 'dark' ? 'selected' : ''}`} data-value='dark' onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setSelectedTheme(e.target.getAttribute('data-value')) }}></div>
                            <div className={`color-theme-btn light ${selectedTheme === 'light' ? 'selected' : ''}`} data-value='light' onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setSelectedTheme(e.target.getAttribute('data-value')) }}></div>
                        </div>
                    </Section>

                    <Section title="Title">
                        <AdminCustomInput
                            id="title"
                            value={title}
                            setValue={setTitle}
                            disabled={isTitleDisabled}
                            disableInput={() => setIsTitleDisabled(null)}
                        >
                            <div className='font-icon' onClick={() => setIsTitleDisabled(false)}>
                                <i className="fa fa-edit"></i>
                            </div>
                        </AdminCustomInput>
                    </Section>

                    <Section title="Footer Messages">
                        <div className='add-footer-msg' onClick={() => setIsAddFooterMsg(true)}>
                            <i className='fa fa-plus'></i>
                        </div>
                        <table id='messages' className='footer-table'>
                            <thead>
                                <tr>
                                    <th>Message</th>
                                    <th width='5%'>Active</th>
                                    <th width='10%'></th>
                                </tr>
                            </thead>
                            <tbody>
                                {footerMessages.map((element, index) => (
                                    <tr key={element.id}>
                                        <td>
                                            <AdminCustomInput
                                                id={`footer-msg-${element.id}`}
                                                value={element.msg}
                                                setValue={(value) => { handleFooterMsgState(index, 'msg', value) }}
                                                disabled={element.disabled}
                                                disableInput={() => { handleFooterMsgState(index, 'edit') }}
                                            />
                                        </td>
                                        <td>
                                            <div className='active'>
                                                <input type='checkbox' checked={element.active} onChange={() => { handleFooterMsgState(index, 'active') }} />
                                            </div>
                                        </td>
                                        <td>
                                            <div className='actions'>
                                                <div className='font-icon' onClick={() => { handleFooterMsgState(index, 'edit') }}>
                                                    <i className="fa fa-edit"></i>
                                                </div>
                                                <div className='font-icon' onClick={() => handleDeleteFooterMsg(index)}>
                                                    <i className="fa fa-trash"></i>
                                                </div>
                                            </div>
                                        </td>
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
                                        <thead>
                                            <tr>
                                                <th width='30%'>File Name</th>
                                                <th width='30%'>Times in Cycle</th>
                                                <th width='15%'>Active</th>
                                                <th width='30%'>Preview</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {movies && movies.map((movie, index) => (
                                                <tr key={`${movie.file_name}-${index}`}>
                                                    <td>{movie.file_name}</td>
                                                    <td>
                                                        <select value={movie.times} onChange={(e) => {
                                                            const newMovies = [...movies];
                                                            newMovies[index].times = e.target.value;
                                                            setMovies(newMovies);
                                                        }}>
                                                            <option value='1'>1</option>
                                                            <option value='2'>2</option>
                                                            <option value='3'>3</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <div className='active'>
                                                            <input type='checkbox' checked={movie.active} onChange={() => {
                                                                const newMovies = [...movies];
                                                                newMovies[index].active = !newMovies[index].active;
                                                                setMovies(newMovies);
                                                            }} />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className='actions'>
                                                            <div className='font-icon' onClick={() => { handleMoviePreview(movie.url) }}>
                                                                <i className="fa fa-eye"></i>
                                                            </div>
                                                            <div className={`font-icon ${movie.deletable ? '' : 'disabled'}`} onClick={movie.deletable ? () => { handleDeleteMovie(index, movie.object_key) } : null}>
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
                                        <source id="videoSrc" src={`${selectedMovie}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                            <div className='upload-wrapper'>
                                <input id='file-select' type='file' accept='.mp4' onChange={handleFileChange} style={{ display: 'none' }} />
                                <CustomButton btnData={{ name: 'select', text: 'Select file', type: 'button', onClick: isUploading ? null : () => { onFileSelect() }, style: { fontSize: '24px' }, noHover: isUploading, disabled: isUploading }} />
                                <div className='progress-wrapper'>
                                    <div className='upload-progress empty'></div>
                                    <div className='upload-progress full' style={{ width: `${uploadProgress}%` }}></div>
                                    <div className='upload-progress file-name'>{selectedFile?.name ?? ''}</div>
                                </div>
                                <CustomButton btnData={{ name: 'upload', text: 'Upload file', type: 'button', onClick: (selectedFile && !isUploading) ? () => { handleUploadFile() } : null, style: { fontSize: '24px' }, noHover: !selectedFile || isUploading, disabled: !selectedFile || isUploading }} />
                                <div className='upload-msg'>{uploadMsg}</div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Online Movies Categories">
                        <div className='movies-categories'>
                            {onlineMoviesCategories.map((element, index) => (
                                <div key={index} className={`movie-category ${element.selected ? 'selected' : ''}`} onClick={() => { handleCategoryClick(element.name) }}>
                                    {element.name}
                                </div>
                            ))}
                        </div>
                    </Section>

                    <div className='buttons'>
                        <CustomButton btnData={{ name: 'save', text: 'Save Settings', type: 'button', noHover: !user.editable && !checkSuperUser(), disabled: !user.editable && !checkSuperUser(), onClick: (user.editable || checkSuperUser()) ? () => { handleSaveSettings() } : null, style: { padding: '12px', fontSize: '24px' } }} />
                        <CustomButton btnData={{ name: 'cancel', text: 'Cancel', type: 'button', onClick: () => { cancelFunc() }, style: { padding: '12px', fontSize: '24px' } }} />
                    </div>
                </form>
            </div>
        </>
    );
}

export default Settings;