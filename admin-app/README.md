# Manthan Guru — Admin App (Expo)

## What is included
- Expo managed React Native app
- Login screen (API auth against your backend)
- Dashboard screen
- Clients, Policies, Renewals, Claims screens (basic list + navigation)
- Token storage using AsyncStorage
- Simple API service file where BASE_URL is configured
- Instructions to run on mobile, web, and guidance for desktop compatibility

## Quick start
1. Install Expo CLI (optional): `npm install -g expo-cli`
2. In project folder:
   ```bash
   npm install
   npx expo start
   ```
3. For mobile devices, change `src/config.js` BASE_URL to your machine's local IP (e.g. http://192.168.1.10:5000)
4. For development on the same machine (web), `BASE_URL` can be `http://localhost:5000`

## Notes
- This is a starter admin app scaffold. Replace UI with your preferred component library.
- To make this app desktop-compatible, see the "Desktop compatibility" section below or in the assistant reply.
