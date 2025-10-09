import { createFetch } from './db.jsx';  // Assuming db.jsx has createFetch or import from utils if needed

export async function uploadMovie(file, onProgress, subFolder = null) {
  // Get presigned URL
  const presignedRes = await createFetch('/files/presigned-url', 'post', { fileName: file.name, contentType: file.type, subFolder }, true);
  if (!presignedRes.success) return presignedRes;

  // Direct upload to S3 with progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedRes.preSignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = async () => {
      if (xhr.status === 200) {
        // Confirm to backend for DB insert
        const metadata = {
          fileName: presignedRes.file_name,
          url: presignedRes.url,
          deletable: presignedRes.deletable,
          subFolder: presignedRes.subFolder
        };
        const confirmRes = await createFetch('/files/confirm', 'post', metadata, true);
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
  return createFetch('/files/delete', 'post', { fileName, subFolder }, true);
}

// ... Keep any other existing functions in movies.jsx unchanged