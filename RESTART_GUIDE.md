# Quick Restart Guide - After Laptop Restart

This is a quick reference guide to restart the development environment after your laptop restarts. **This assumes you've already completed the initial setup from DEVELOPMENT_SETUP.md**

---

## Quick Start (5 Minutes)

### Step 1: Start MySQL Server
```powershell
net start MySQL80

# Verify it's running
mysql -u root -p
# Enter your password, then type: exit
```

### Step 2: Start Backend (Terminal 1)
```powershell
cd d:\ManthanGuru\insurance-backend
npm run dev
```

Wait for this message:
```
Server running on http://localhost:5000
Database connected successfully
```

### Step 3: Start Admin App (Terminal 2)

**Option A: Web Browser (Default)**
```powershell
cd d:\ManthanGuru\admin-app
npm run web
```

Wait for: `Compiled successfully`

Then access: **http://localhost:19006**

**Option B: Mobile Device/Simulator (LAN Mode)**
```powershell
cd d:\ManthanGuru\admin-app
npx expo start --lan
```

Then use one of:
- 📱 Scan QR code with Expo Go app on phone
- 🖥️ Press `w` for web
- 📱 Press `a` for Android emulator
- 📱 Press `i` for iOS simulator (Mac only)

### Step 4: Access the Application
- Login with:
  - Email: `admin@insurance.com`
  - Password: `Admin@123`

**Done! ✅**

---

## Testing on Mobile Device

### With Expo Go (Easiest - No Emulator Needed)

1. **Download Expo Go** on your phone:
   - [iOS](https://apps.apple.com/app/expo-go/id1054236738)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Update Backend URL** (one-time setup):
   ```powershell
   notepad admin-app/src/config.js
   # Change BASE_URL to your machine IP (e.g., http://192.168.1.10:5000)
   # Find your IP: ipconfig
   ```

3. **Start Expo in LAN mode** (Terminal 2):
   ```powershell
   cd d:\ManthanGuru\admin-app
   npx expo start --lan
   ```

4. **Scan QR Code**:
   - Open Expo Go app → Scan QR Code
   - Point at the QR code shown in terminal
   - App loads on your phone!

5. **Login**: `admin@insurance.com` / `Admin@123`

### With Android Emulator

1. **Start Android Emulator**:
   - Open Android Studio → AVD Manager → Play button

2. **Start Expo** (Terminal 2):
   ```powershell
   cd d:\ManthanGuru\admin-app
   npm run android
   ```

3. **Login**: `admin@insurance.com` / `Admin@123`

### With iOS Simulator (Mac Only)

1. **Start Simulator**:
   ```bash
   open -a Simulator
   ```

2. **Start Expo** (Terminal 2):
   ```bash
   cd d:\ManthanGuru\admin-app
   npm run ios
   ```

3. **Login**: `admin@insurance.com` / `Admin@123`

---

## Full Restart Checklist

Use this checklist when things aren't working:

- [ ] **MySQL is running:** `net start MySQL80` then verify with `mysql -u root -p`
- [ ] **Backend terminal shows:** "Server running on http://localhost:5000"
- [ ] **Admin app terminal shows:** "Compiled successfully"
- [ ] **Browser can access:** http://localhost:19006
- [ ] **Login works** with admin@insurance.com / Admin@123
- [ ] **Dashboard loads** and shows data

---

## Common Startup Issues & Solutions

### Backend won't start - "Port 5000 already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Try again
cd d:\ManthanGuru\insurance-backend
npm run dev
```

### MySQL connection error - "ECONNREFUSED"
```powershell
# Make sure MySQL is running
net start MySQL80

# Verify connection
mysql -u root -p
```

### Admin app shows blank page or connection errors
1. Check backend is running on http://localhost:5000
2. Verify `admin-app/src/config.js` has `BASE_URL = 'http://localhost:5000'`
3. Check browser console (F12) for CORS or network errors
4. Clear browser cache: Ctrl+Shift+Delete

### "Cannot GET /api-docs" (API documentation)
- This is expected if swagger.js didn't initialize
- Backend is still working; test with: `http://localhost:5000/api/auth/login`

---

## Stop Services

When you're done developing:

```powershell
# Stop backend (in backend terminal)
Ctrl+C

# Stop admin app (in admin app terminal)
Ctrl+C

# Stop MySQL (optional - you can leave it running)
net stop MySQL80
```

---

## Environment Variables Reminder

If you modified `.env` during setup, here's where it is:
- **Backend:** `d:\ManthanGuru\insurance-backend\.env`

Current typical values:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=insurance_db
JWT_SECRET=your_secret_key
BASE_URL=http://localhost:5000
NODE_ENV=development
```

---

---

## Mobile Testing Troubleshooting

### Expo Go says "Could not connect to development server"
- Verify phone and computer are on **same WiFi network**
- Check firewall allows port 19000/19001
- Restart Expo: Press `q` in terminal, then restart with `npx expo start --lan`
- Verify machine IP is correct in `admin-app/src/config.js`

### App loads but can't login / API errors
- Verify Backend URL in `admin-app/src/config.js` uses your **machine's IP** (not localhost)
- Example: `http://192.168.1.10:5000` (not `http://localhost:5000`)
- Backend must be running and accessible on that IP from your phone

### "Network request failed" on mobile
- Try with machine name instead of IP:
  ```javascript
  // Instead of IP, try:
  export const BASE_URL = 'http://your-machine-name:5000';
  ```
- Find your machine name in Windows: Right-click "This PC" → Properties

### Android Emulator won't load the app
- Ensure emulator is fully booted
- Close and restart: `npm run android`
- Clear cache: `npm run android -- --reset-cache`

### QR code won't scan
- Make sure QR code is fully visible in terminal
- Move closer or adjust lighting
- Manually enter: Press "Projects" in Expo Go, then enter the connection URL

---

## Useful Commands for Development

### Backend
```powershell
# Development mode with auto-reload
cd d:\ManthanGuru\insurance-backend && npm run dev

# Run seed script to reset admin account
cd d:\ManthanGuru\insurance-backend && npm run seed-admin

# Run production mode
cd d:\ManthanGuru\insurance-backend && npm start
```

### Admin App
```powershell
# Web browser
cd d:\ManthanGuru\admin-app && npm run web

# Android emulator
cd d:\ManthanGuru\admin-app && npm run android

# iOS simulator (Mac only)
cd d:\ManthanGuru\admin-app && npm run ios
```

### Database
```powershell
# Connect to database
mysql -u root -p

# Inside MySQL:
USE insurance_db;
SHOW TABLES;
SELECT * FROM admins;
```

---

## Need More Help?

For detailed setup instructions, see: **DEVELOPMENT_SETUP.md**

For API documentation: Start backend and visit `http://localhost:5000/api-docs`

For database schema: Check `insurance-backend/src/sql/schema.sql`
