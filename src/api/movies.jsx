// src/api/movies.jsx
import At from './db.jsx'; // assuming this is the import for the API wrapper
import axios from 'axios';

export async function uploadMovie(file, subFolder, onProgress) {
  const presignRes = await At.createFetch('/files/presign', 'post', {fileName: file.name, subFolder, contentType: file.type}, true);
  if (!presignRes.success) return presignRes;

  const url = presignRes.data.data.url; // assuming structure {success: true, data: {url: presignedUrl}}

  const putConfig = {
    headers: {'Content-Type': file.type},
    onUploadProgress
  };

  const putRes = await axios.put(url, file, putConfig);

  if (putRes.status !== 200) return {success: false, message: 'Upload to S3 failed'};

  const finalizeRes = await At.createFetch('/files/finalize', 'post', {fileName: file.name, subFolder}, true);

  return finalizeRes;
}

export async function deleteMovie(fileName, subFolder) {
  const presignRes = await At.createFetch('/files/deletePresign', 'post', {fileName, subFolder}, true);
  if (!presignRes.success) return presignRes;

  const url = presignRes.data.data.url;

  const deleteRes = await axios.delete(url);

  if (deleteRes.status !== 200) return {success: false, message: 'Delete from S3 failed'};

  const finalizeRes = await At.createFetch('/files/finalizeDelete', 'post', {fileName, subFolder}, true);

  return finalizeRes;
}