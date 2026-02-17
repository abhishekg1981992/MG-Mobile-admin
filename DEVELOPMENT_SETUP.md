# Development Environment Setup Guide

This guide will help you set up the complete Manthan Guru Insurance Management System for development on your local machine. The system consists of a React Native admin app and a Node.js/Express backend with MySQL database.

**Estimated Setup Time:** 30-45 minutes

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Admin App Setup](#admin-app-setup)
5. [Mobile Device / Simulator Setup](#mobile-device--simulator-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed on your system:

### Required Software
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
  - Verify: `node --version` and `npm --version`
- **MySQL Server** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/mysql/)
  - Verify: `mysql --version`
- **Git** - [Download](https://git-scm.com/)
  - Verify: `git --version`

### Optional but Recommended
- **MySQL Workbench** - GUI for database management
- **Postman** - For testing API endpoints
- **VS Code** with extensions:
  - REST Client
  - Thunder Client
  - MySQL

---

## Database Setup

### Step 1: Start MySQL Server

**On Windows:**
```powershell
# Start MySQL service
net start MySQL80

# Verify it's running
mysql -u root -p
# Enter your MySQL root password, then type: exit
```

**Via Docker (Optional - Recommended for clean setup):**
```bash
docker-compose up -d
# This starts MySQL in a container (no local installation needed)
```

### Step 2: Create Database and Tables

Navigate to the backend directory and run the schema:

```powershell
cd d:\ManthanGuru\insurance-backend

# Login to MySQL and execute the schema
mysql -u root -p < src/sql/schema.sql
# When prompted, enter your MySQL root password
```

**Expected Output:**
```
Database created successfully
Tables created successfully
```

### Step 3: Verify Database

```powershell
mysql -u root -p
# Enter password, then run:
USE insurance_db;
SHOW TABLES;
# You should see: admins, clients, policies, renewals, payments, claims
```

---

## Backend Setup

### Step 1: Install Dependencies

```powershell
cd d:\ManthanGuru\insurance-backend
npm install
```

**Expected time:** 2-3 minutes

### Step 2: Configure Environment Variables

Copy the example env file and update with your database credentials:

```powershell
# Copy the example file
Copy-Item .env.example .env

# Edit the .env file (use any editor)
notepad .env
```

**Update these values in `.env`:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password_here
DB_NAME=insurance_db
JWT_SECRET=your_secret_key_here_change_this_in_production
BASE_URL=http://localhost:5000
NODE_ENV=development
```

### Step 3: Seed Initial Admin Account

Create the first admin user in the database:

```powershell
npm run seed-admin
```

**Expected Output:**
```
Admin account created/updated successfully
Email: admin@insurance.com
Password: Admin@123
```

### Step 4: Start Backend Server

```powershell
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:5000
Database connected successfully
Press Ctrl+C to stop the server
```

**Available Backend Routes:**
- 🔐 Authentication: `POST /api/auth/login`
- 👥 Clients: `GET/POST /api/clients`
- 📋 Policies: `GET/POST /api/policies`
- 🔄 Renewals: `GET/POST /api/renewals`
- 💰 Payments: `GET/POST /api/payments`
- 📝 Claims: `GET/POST /api/claims`

---

## Admin App Setup

### Step 1: Install Dependencies

Open a **new PowerShell terminal** and navigate to the admin app:

```powershell
cd d:\ManthanGuru\admin-app
npm install
```

**Expected time:** 2-3 minutes

### Step 2: Configure API Base URL

Edit the config file to point to your backend:

```powershell
notepad src/config.js
```

Update the `BASE_URL`:

```javascript
// For development on same machine (web)
export const BASE_URL = 'http://localhost:5000';

// For mobile devices on same network, use your machine's IP:
// export const BASE_URL = 'http://192.168.1.10:5000';
```

To find your machine IP on Windows:
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter (e.g., 192.168.x.x)
```

### Step 3: Start the Admin App

```powershell
npm run web
```

**Expected Output:**
```
Expo DevTools is running at...
Compiled successfully
Web interface available at http://localhost:19006
```

---

## Mobile Device / Simulator Setup

### Testing on Physical Mobile Device with Expo Go

#### Prerequisites for Mobile Testing
- **Expo Go app** installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id1054236738) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- **Both your phone and development machine on same WiFi network**
- **Firewall** allows connection on port 19000 (Expo dev server)

#### Step 1: Configure Admin App for Mobile

Edit the config file to use your machine's local IP:

```powershell
notepad admin-app/src/config.js
```

Replace `localhost` with your machine's IP address:

```javascript
// For mobile devices on same network
export const BASE_URL = 'http://192.168.1.10:5000';
// Replace 192.168.1.10 with YOUR machine's actual IP from: ipconfig
```

To find your machine IP:
```powershell
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.10, 10.0.0.5, etc.)
```

#### Step 2: Ensure Backend Accepts Mobile Connections

The backend is already configured to accept requests from any origin (CORS enabled), but verify:

```powershell
# Backend should be running on all interfaces (0.0.0.0)
# Check your terminal shows: Server running on http://localhost:5000
```

#### Step 3: Start Expo in LAN Mode

```powershell
cd d:\ManthanGuru\admin-app

# Start Expo in LAN mode (allows mobile to connect)
npx expo start --lan
```

**Expected Output:**
```
Starting Expo dev server...
LAN mode enabled
Tunnel mode disabled
To open the app on your phone, point the Expo Go app to this QR code:

█████████████████████████████
█ QR CODE WILL APPEAR HERE   █
█████████████████████████████

Connection URL: exp://192.168.1.10:19000
```

#### Step 4: Open on Mobile Device

**Option A: Using QR Code (Recommended)**
1. Open **Expo Go** app on your phone
2. Tap **Scan QR Code**
3. Point camera at the QR code in terminal
4. App will load automatically

**Option B: Manual Connection**
1. Open **Expo Go** app
2. Tap **Projects**
3. Type the URL: `exp://YOUR_MACHINE_IP:19000`
4. Tap **Open**

#### Step 5: Login and Test on Mobile

Once the app loads on your phone:
1. You should see the login screen
2. Login with:
   - Email: `admin@insurance.com`
   - Password: `Admin@123`
3. Test navigation through all screens:
   - Dashboard
   - Clients
   - Policies
   - Renewals
   - Claims

### Testing on Android Emulator

#### Prerequisites
- **Android Studio** installed - [Download](https://developer.android.com/studio)
- **Android Virtual Device (AVD)** created

#### Step 1: Start Android Emulator

```powershell
# Open Android Studio > AVD Manager > Click Play button on a device
# Or use command line:
emulator -list-avds  # List available virtual devices
emulator -avd Pixel_4_API_30  # Replace with your AVD name
```

Wait for the emulator to fully boot.

#### Step 2: Start Expo

```powershell
cd d:\ManthanGuru\admin-app
npm run android
```

**Expected Output:**
```
Launching on Android...
Building for Android...
Installation successful
Opening on emulator...
```

The app will automatically install and launch on your emulator.

#### Step 3: Login and Test

Same as physical device:
1. Login with `admin@insurance.com` / `Admin@123`
2. Test all screens

### Testing on iOS Simulator (Mac Only)

#### Prerequisites
- **Mac with Xcode** installed
- **iOS Simulator** available

#### Step 1: Start Simulator

```bash
# Open iOS Simulator
open -a Simulator
```

#### Step 2: Start Expo

```bash
cd d:\ManthanGuru\admin-app
npm run ios
```

The app will build and launch on the iOS simulator.

---

## Testing on Multiple Devices Simultaneously

You can test on web, mobile, and simulator at the same time!

**Terminal 1 - Backend:**
```powershell
cd d:\ManthanGuru\insurance-backend
npm run dev
```

**Terminal 2 - Admin App (LAN mode for mobile):**
```powershell
cd d:\ManthanGuru\admin-app
npx expo start --lan
```

Then access the app on:
- 📱 **Physical Phone:** Scan QR code in Expo Go
- 🖥️ **Web:** Press `w` in terminal or http://localhost:19006
- 📱 **Android Emulator:** Press `a` in terminal
- 📱 **iOS Simulator:** Press `i` in terminal (Mac only)

---

## Verification

### Test Backend API

Open **Postman** or use curl to test the login endpoint:

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@insurance.com",
    "password": "Admin@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@insurance.com",
    "role": "admin"
  }
}
```

### Test Admin App

1. Open browser: http://localhost:19006
2. Login with:
   - Email: `admin@insurance.com`
   - Password: `Admin@123`
3. Navigate through Dashboard, Clients, Policies screens to verify connectivity

---

## Running Both Services Together

To develop effectively, run these commands in **separate terminal windows**:

**Terminal 1 - Backend:**
```powershell
cd d:\ManthanGuru\insurance-backend
npm run dev
```

**Terminal 2 - Admin App:**
```powershell
cd d:\ManthanGuru\admin-app
npm run web
```

**Terminal 3 - Optional: MySQL monitoring**
```powershell
# Keep this running to monitor database
mysql -u root -p -e "SHOW PROCESSLIST;" # Repeat as needed
```

---

## Troubleshooting

### Issue: "Port 5000 already in use"
```powershell
# Find the process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Issue: "MySQL connection failed"
```powershell
# Verify MySQL is running
mysql -u root -p

# If not running, restart it
net stop MySQL80
net start MySQL80
```

### Issue: "Cannot find module" errors
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm cache clean --force
npm install
```

### Issue: "CORS errors" in browser console
- Verify backend is running on http://localhost:5000
- Check that `BASE_URL` in `admin-app/src/config.js` matches your backend URL

### Issue: "Invalid JWT token"
```powershell
# Re-seed the admin account
cd d:\ManthanGuru\insurance-backend
npm run seed-admin
```

---

## Next Steps

After successful setup:
1. Review the project structure in each folder's README.md
2. Check the API documentation at `http://localhost:5000/api-docs` (Swagger)
3. Familiarize yourself with the database schema in `insurance-backend/src/sql/schema.sql`
4. Start developing!

For quick restart after laptop restart, see **RESTART_GUIDE.md**
