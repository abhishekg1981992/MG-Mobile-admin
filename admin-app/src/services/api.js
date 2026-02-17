// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const jsonHeaders = { 'Content-Type': 'application/json' };

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function setToken(token) {
  await AsyncStorage.setItem('token', token);
}

export async function getToken() {
  return await AsyncStorage.getItem('token');
}

async function authHeaders(isJson = true) {
  const token = await getToken();
  const base = token ? { Authorization: `Bearer ${token}` } : {};
  return isJson ? { ...base, ...jsonHeaders } : base;
}

export async function apiGet(path) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  return res.json();
}

export async function apiPost(path, body) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

export async function apiPut(path, body) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  return res.json();
}

export async function apiDelete(path) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
  return res.json();
}

/**
 * Upload client document using expo-document-picker.
 * Returns backend response.
 * path: `/api/clients/:id/doc`
 */
export async function uploadClientDocument(clientId) {
  try {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.type !== 'success') return { cancelled: true };

    const uri = result.uri;
    const name = result.name || 'file';
    // On web, result.uri is a blob:... or http(s) data — fetch it as blob
    let file;
    if (Platform.OS === 'web') {
      const r = await fetch(uri);
      const blob = await r.blob();
      file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
    } else {
      // On mobile, File-like object for FormData
      file = {
        uri,
        name,
        type: result.mimeType || 'application/octet-stream',
      };
    }

    const formData = new FormData();
    // If mobile - append file object; if web - File instance works too
    formData.append('file', file);

    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // Note: DO NOT set Content-Type header for multipart; fetch will set boundary
    const res = await fetch(`${BASE_URL}/api/clients/${clientId}/doc`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return res.json();
  } catch (e) {
    console.error('Upload error', e);
    return { error: e.message || String(e) };
  }
}
