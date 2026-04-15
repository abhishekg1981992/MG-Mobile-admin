// Configure the backend URL
// Uses EXPO_PUBLIC_API_URL env var if set, otherwise Railway Production URL
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mg-mobile-admin-production.up.railway.app';