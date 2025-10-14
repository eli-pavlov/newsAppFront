// src/pages/admin/components/Settings.jsx
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { SettingsContext } from '../../../contexts/SettingsContext';
import { AuthContext } from '../../../contexts/AuthContext';
import At from '../../../api/db.jsx';
import { uploadMovie, deleteMovie } from '../../../api/movies.jsx';
import { getDefaultSettings } from '../../../utils/settings.jsx';
import { getEnvVar } from '../../../utils/env.jsx';
import CustomButton from '../../../components/CustomButton.jsx';
import CustomInput from '../../../components/CustomInput.jsx';
import Section from './Section.jsx';
import AddFooterMsgModal from '../modal/AddFooterMsgModal.jsx';
import ConfirmModal from '../../../components/ConfirmModal.jsx';
import './AdminCustomInput.jsx';
import '../Admin.css'; // Adjusted to correct path assuming styles are in Admin.css

function Settings({ cancelFunc, user }) {
  const [isEditable, setIsEditable] = useState(true);
  const [colorsTheme, setColorsThemeLocal] = useState('');
  const [title, setTitle] = useState('');
  const [footerMessages, setFooterMessages] = useState([]);
  const [footerMsgErr, setFooterMsgErr] = useState('');
  const [isAddFooterMsg, setIsAddFooterMsg] = useState(false);
  const [movies, setMovies] = useState([]);
  const [onlineMoviesCategories, setOnlineMoviesCategories] = useState([]);
  const [previewMovie, setPreviewMovie] = useState(null);
  const videoRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg, setUploadMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const { setColorsTheme, settings, setSettings } = useContext(SettingsContext);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setColorsThemeLocal(settings.colors_theme);
    setTitle(settings.title);
    setFooterMessages(settings.footer_messages.map(msg => ({ ...msg, disabled: true })));
    setMovies(settings.movies.map(movie => ({ ...movie })));
    const categories = getEnvVar('ONLINE_MOVIES_CATEGORIES').split(',').map(cat => ({
      name: cat,
      selected: (settings.online_movies_categories || []).filter(c => c.selected).map(c => c.name).includes(cat)
    }));
    setOnlineMoviesCategories(categories);
  }

  function closeAddFooterMsg() {
    setIsAddFooterMsg(false);
  }

  function addFooterMsg(msg) {
    setFooterMessages([...footerMessages, { id: footerMessages.length + 1, msg, disabled: true, active: false }]);
    setIsAddFooterMsg(false);
  }

  function updateFooterMsg(index, key, value) {
    const msgs = [...footerMessages];
    switch (key) {
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
    }
    setFooterMessages(msgs);
  }

  function deleteFooterMsg(index) {
    setConfirmModal({
      msg: 'Delete this message?',
      yesHandler: () => updateFooterMsg(index, 'delete')
    });
    setShowConfirm(true);
  }

  async function save() {
    let data = {};
    data.colors_theme = colorsTheme;
    data.title = title;
    data.footer_messages = footerMessages.map((msg, idx) => ({ ...msg, id: idx }));
    data.movies = movies.map((movie, idx) => ({ ...movie, id: idx }));
    data.online_movies_categories = onlineMoviesCategories.map((cat, idx) => ({ ...cat, id: idx }));
    const res = await At.saveSettings(data);
    if (res.success) {
      setSettings(data);
      cancelFunc();
    }
  }

  function preview(url) {
    setPreviewMovie(url);
    const video = videoRef.current;
    if (!video) return;
    video.load();
    const onLoaded = () => {
      video.removeEventListener('loadeddata', onLoaded);
    };
    video.addEventListener('loadeddata', onLoaded);
  }

  function selectFile() {
    setUploadMsg("");
    document.querySelector("#file-select").click();
  }

  function onFileChange(e) {
    setUploadProgress(0);
    if (e.target.files.length === 0) {
      setSelectedFile(null);
    } else {
      const file = e.target.files[0];
      if (file.name.endsWith('mp4')) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        setUploadMsg("Invalid file format.");
      }
    }
  }

  async function uploadFile() {
    if (!selectedFile) return;

    setUploadMsg('Uploading file, please wait...');
    setIsUploading(true);

    const res = await uploadMovie(selectedFile, user?.id ? user.id : user._id, (event) => {
      const percent = Math.round((event.loaded * 100) / event.total);
      setUploadProgress(percent);
    });

    setIsUploading(false);
    setUploadMsg(res.message);

    if (res.success) {
      setSelectedFile(null);
      const { file_name, url, deletable, subFolder, times } = res.data;
      setMovies([...movies.filter(movie => movie.url !== url), { file_name, url, subFolder, deletable, times }]);
    }
  }

  function Pn(index, fileName, subFolder) {
    setConfirmModal({
      msg: 'Delete this movie?',
      yesHandler: () => deleteMovieHandler(index, fileName, subFolder)
    });
    setShowConfirm(true);
  }

  async function deleteMovieHandler(index, fileName, subFolder) {
    const res = await deleteMovie(fileName, subFolder);
    if (res.success) {
      setMovies(movies.filter((movie, idx) => idx !== index));
    }
  }

  function toggleCategory(name) {
    const categories = [...onlineMoviesCategories];
    categories.forEach(cat => {
      if (cat.name === name) cat.selected = !cat.selected;
    });
    setOnlineMoviesCategories(categories);
  }

  function Rt() {
    return keys.includes('Control') && keys.includes('Shift');
  }

  const [keys, setKeys] = useState([]);

  useEffect(() => {
    const down = (e) => {
      if (keys.includes(e.key)) return;
      setKeys([...keys, e.key]);
    };
    const up = () => setKeys([]);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [keys]);

  const isChanged = () => {
    // Logic to check if settings have changed
    return true; // Placeholder, implement as per original
  };

  return (
    <div className="settings-page">
      <form>
        <Section title="Colors Theme">
          <div className="colors-themes">
            <div className={`color-theme-btn dark ${colorsTheme === 'dark' ? 'selected' : ''}`} data-value="dark" onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setColorsThemeLocal(e.target.getAttribute('data-value')); }}></div>
            <div className={`color-theme-btn light ${colorsTheme === 'light' ? 'selected' : ''}`} data-value="light" onClick={(e) => { setColorsTheme(e.target.getAttribute('data-value')); setColorsThemeLocal(e.target.getAttribute('data-value')); }}></div>
          </div>
        </Section>
        <Section title="Title">
          <AdminCustomInput id="title" value={title} setValue={setTitle} disabled={isEditable} disableInput={openTitleEdit} />
        </Section>
        <Section title="Footer Messages">
          <div className="add-footer-msg" onClick={() => setIsAddFooterMsg(true)}><i className="fa fa-plus"></i></div>
          <table id="messages" className="footer-table">
            <thead>
              <tr>
                <th>Message</th>
                <th width="5%">Active</th>
                <th width="10%"></th>
              </tr>
            </thead>
            <tbody>
              {footerMessages.map((msg, index) => (
                <tr key={msg.id}>
                  <td><AdminCustomInput id={`footer-msg-${msg.id}`} value={msg.msg} setValue={(val) => updateFooterMsg(index, 'msg', val)} disabled={msg.disabled} disableInput={() => updateFooterMsg(index, 'edit')} /></td>
                  <td><div className="active"><input type="checkbox" checked={msg.active} onChange={() => updateFooterMsg(index, 'active')} /></div></td>
                  <td>
                    <div className="actions">
                      <div className="font-icon" onClick={() => updateFooterMsg(index, 'edit')}><i className="fa fa-edit"></i></div>
                      <div className="font-icon" onClick={() => deleteFooterMsg(index)}><i className="fa fa-trash"></i></div>
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
                <thead>
                  <tr>
                    <th width="30%">File Name</th>
                    <th width="30%">Times in Cycle</th>
                    <th width="15%">Active</th>
                    <th width="30%">Preview</th>
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
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </td>
                      <td><div className="active"><input type="checkbox" checked={movie.active} onChange={() => {
                        const newMovies = [...movies];
                        newMovies[index].active = !newMovies[index].active;
                        setMovies(newMovies);
                      }} /></div></td>
                      <td>
                        <div className="actions">
                          <div className="font-icon" onClick={() => preview(movie.url)}><i className="fa fa-eye"></i></div>
                          <div className={`font-icon ${movie.deletable ? '' : 'disabled'}`} onClick={movie.deletable ? () => Pn(index, movie.file_name, movie.subFolder) : null}><i className="fa fa-trash"></i></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="movie-preview">
              <video ref={videoRef} controls>
                <source id="videoSrc" src={`${previewMovie}`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <div className="upload-wrapper">
            <input id="file-select" type="file" accept=".mp4" onChange={onFileChange} style={{ display: 'none' }} />
            <CustomButton name="select" text="Select file" type="button" onClick={isUploading ? null : selectFile} style={{ fontSize: "24px" }} noHover={isUploading} disabled={isUploading} />
            <div className="progress-wrapper">
              <div className="upload-progress empty" />
              <div className="upload-progress full" style={{ width: `${uploadProgress}%` }} />
              <div className="upload-progress file-name">{selectedFile?.name ?? ""}</div>
            </div>
            <CustomButton name="upload" text="Upload file" type="button" onClick={selectedFile && !isUploading ? uploadFile : null} style={{ fontSize: "24px" }} noHover={!selectedFile || isUploading} disabled={!selectedFile || isUploading} />
            <div className="upload-msg">{uploadMsg}</div>
          </div>
        </Section>
        <Section title="Online Movies Categories">
          <div className="movies-categories">
            {onlineMoviesCategories.map((cat, index) => (
              <div key={index} className={`movie-category ${cat.selected ? 'selected' : ''}`} onClick={() => toggleCategory(cat.name)}>
                {cat.name}
              </div>
            ))}
          </div>
        </Section>
        <div className="buttons">
          <CustomButton name="save" text="Save Settings" type="button" noHover={!Object.keys(T.current).length} disabled={!Object.keys(T.current).length} onClick={Object.keys(T.current).length ? save : null} style={{ padding: "12px", fontSize: "24px" }} />
          <CustomButton name="cancel" text="Cancel" type="button" onClick={cancelFunc} style={{ padding: "12px", fontSize: "24px" }} />
        </div>
      </form>
      {isAddFooterMsg && <AddFooterMsgModal closeHandler={closeAddFooterMsg} saveHandler={addFooterMsg} />}
      {showConfirm && <ConfirmModal titleData={{ text: confirmModal.msg, style: { fontSize: "24px" } }} yesData={{ text: "Yes", style: { backgroundColor: "red", border: "none", padding: "16px", fontWeight: "bold" }, noHover: true, actionHandler: confirmModal.yesHandler }} noData={{ text: "No", style: { backgroundColor: "white", color: "black", padding: "16px", border: "none" } }} closeHandler={() => setShowConfirm(false) } />}
    </div>
  );
}

export default Settings;