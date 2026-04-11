// src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const jsonHeaders = { 'Content-Type': 'application/json' };
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Safely extract an array from an API response, whether it's a raw array
 * or wrapped in an object like { data: [...] }.
 */
export function extractArray(response) {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object') {
    for (const key of ['data', 'clients', 'policies', 'claims', 'renewals', 'payments', 'documents']) {
      if (Array.isArray(response[key])) return response[key];
    }
    for (const val of Object.values(response)) {
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

/**
 * Format a date string for display as DD-MM-YYYY.
 * Handles ISO timestamps, YYYY-MM-DD, and DD-MM-YYYY (pass-through).
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  // Already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Parse a date string (DD-MM-YYYY, YYYY-MM-DD, or ISO) into a Date object.
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export class ApiError extends Error {
  constructor(message, code, status = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function mapNetworkError(error) {
  const msg = String(error?.message || '').toLowerCase();

  if (error?.name === 'AbortError' || msg.includes('timed out') || msg.includes('etimedout')) {
    return new ApiError('Request timed out. Please check your internet connection and try again.', 'TIMEOUT');
  }

  if (msg.includes('network request failed') || msg.includes('failed to fetch') || msg.includes('network error')) {
    return new ApiError('Unable to reach server. Please verify internet and backend URL.', 'NETWORK');
  }

  return new ApiError(error?.message || 'Unexpected network error', 'UNKNOWN');
}

async function requestJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok) {
      throw new ApiError(payload?.error || 'Request failed', 'HTTP_ERROR', res.status);
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw mapNetworkError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkSystemAvailability() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok || payload?.status === 'degraded') {
      throw new ApiError('System unavailable', 'SERVICE_UNAVAILABLE', res.status);
    }

    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw mapNetworkError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function login(username, password) {
  return requestJson('/api/auth/login', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password }),
  });
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
  return requestJson(path, { headers });
}

export async function apiPost(path, body) {
  const headers = await authHeaders();
  return requestJson(path, { method: 'POST', headers, body: JSON.stringify(body) });
}

export async function apiPut(path, body) {
  const headers = await authHeaders();
  return requestJson(path, { method: 'PUT', headers, body: JSON.stringify(body) });
}

export async function apiDelete(path) {
  const headers = await authHeaders();
  return requestJson(path, { method: 'DELETE', headers });
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

/**
 * Upload policy document using expo-document-picker.
 * path: `/api/policies/:id/doc`
 */
export async function uploadPolicyDocument(policyId) {
  try {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (result.type !== 'success') return { cancelled: true };

    const uri = result.uri;
    const name = result.name || 'file';
    let file;
    if (Platform.OS === 'web') {
      const r = await fetch(uri);
      const blob = await r.blob();
      file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
    } else {
      file = {
        uri,
        name,
        type: result.mimeType || 'application/octet-stream',
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/api/policies/${policyId}/doc`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return res.json();
  } catch (e) {
    console.error('Policy upload error', e);
    return { error: e.message || String(e) };
  }
}
