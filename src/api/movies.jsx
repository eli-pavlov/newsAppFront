import { envVar } from "../utils/env";

export async function getCategoryMovies(category, pageId = 1) {
    try {
        let urlApi = envVar('ONLINE_MOVIES_API_URL');
        urlApi += category;
        urlApi += `&page=${pageId}`;
        const result = await fetch(urlApi, {
            headers: {
                Authorization: envVar('ONLINE_MOVIES_API_KEY')
            }
        });
        const data = await result.json();
        if (result.ok) {
            let relevantMovies = [];
           
            if (data.videos.length > 0) {
                relevantMovies = data.videos.filter(m => m.duration > Number(envVar('ONLINE_MOVIES_MIN_DURATION')));
                relevantMovies = relevantMovies.map(m => m.video_files[0].link);
            }
            return { success: true, category:category, totalMovies: relevantMovies.length, pageId:pageId, nextPage: data.next_page, videos: relevantMovies }
        }
        else
            return { success: false, message: data.error };
    }
    catch (e) {
        return { success: false, mesage: e.message }
    }
}

export async function uploadMovie(file, onProgress, subFolder = null) {
  // Request presigned URL
  const presignedRes = await createFetch('/presigned-url', 'post', { fileName: file.name, contentType: file.type, subFolder }, true);
  if (!presignedRes.success) return presignedRes;

  // Direct PUT to S3 with progress
  return new Promise(async (resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedRes.preSignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = async () => {
      if (xhr.status === 200) {
        // Confirm to backend
        const metadata = {
          fileName: presignedRes.file_name,
          url: presignedRes.url,
          deletable: presignedRes.deletable,
          subFolder: presignedRes.subFolder
        };
        const confirmRes = await createFetch('/confirm', 'post', metadata, true);
        resolve(confirmRes.success ? { success: true, ...metadata } : confirmRes);
      } else {
        reject({ success: false, message: `Upload failed with status ${xhr.status}` });
      }
    };
    xhr.onerror = () => reject({ success: false, message: 'Upload error' });
    xhr.send(file);
  });
}

export async function deleteMovie(fileName, subFolder) {
  return createFetch('/delete', 'post', { fileName, subFolder }, true);
}

async function createFetch(endpoint, method, data = null, auth = false) {
  // Implement or import general fetch logic here, adapted from your db.jsx or similar
  // For example:
  const url = `${serverUrl}${endpoint}`;  // Assume serverUrl defined
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getCookie(AUTH_COOKIE);  // From cookies.js
    headers.Authorization = `Bearer ${token}`;
  }
  const config = { method, headers };
  if (data) config.body = JSON.stringify(data);
  try {
    const res = await fetch(url, config);
    return await res.json();
  } catch (err) {
    return { success: false, message: err.message };
  }
}