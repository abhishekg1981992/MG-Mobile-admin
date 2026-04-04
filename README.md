# Manthan Guru Insurance Application

**A comprehensive insurance policy management system with mobile admin app and microservices backend.**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation & Setup](#installation--setup)
7. [Running the Application](#running-the-application)
8. [API Documentation](#api-documentation)
9. [Environment Configuration](#environment-configuration)
10. [Development Guidelines](#development-guidelines)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)
15. [License](#license)

---

## Project Overview

Manthan Guru is a modern Insurance Application designed to streamline policy management, claims processing, payment tracking, and customer relationship management. The system consists of:

- **Mobile Admin App** - React Native/Expo-based mobile interface for insurance agents and staff
- **Backend API** - Node.js/Express.js microservices architecture (being migrated from monolith)
- **Database** - MySQL for persistent data storage
- **Message Queue** - RabbitMQ for async event processing

### Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Client Management** | Create, update, and manage client information | ✅ Active |
| **Policy Management** | Create, track, and manage insurance policies | ✅ Active |
| **Claims Processing** | Submit, track, and process insurance claims | ✅ Active |
| **Payment Tracking** | Record and manage premium payments | ✅ Active |
| **Renewal Management** | Automated renewal reminders and tracking | ✅ Active |
| **Document Management** | Upload and manage client/claim documents | ✅ Active |
| **User Authentication** | JWT-based role-based access control | ✅ Active |
| **Activity Logging** | Audit trail for all operations | ✅ Active |
| **Mobile App** | React Native admin interface | ✅ In Development |
| **Microservices** | Transition to microservices architecture | 🔄 Planned |

---

## Architecture

### Current Architecture (Monolith)
```
Insurance Admin App
        ↓
    Mobile UI (React Native/Expo)
        ↓
    API Gateway (Express.js:3000)
        ├── /auth routes
        ├── /clients routes
        ├── /policies routes
        ├── /renewals routes
        ├── /payments routes
        └── /claims routes
        ↓
   Single MySQL Database
```

### Planned Architecture (Microservices)
See [MICROSERVICES_ARCHITECTURE.md](MICROSERVICES_ARCHITECTURE.md) for detailed design.

```
Mobile UI (React Native)
        ↓
    API Gateway (Port 3000)
        ↓
    ┌───────────────┬───────────────┬───────────────┐
    ↓               ↓               ↓               ↓
Auth Service   Client Service   Policy Service   ... (other services)
(3001)         (3002)           (3003)
    ↓               ↓               ↓               ↓
Auth DB        Client DB        Policy DB       ... (service-specific DBs)
    ↓               ↓               ↓
    └───────────────┴───────────────┴──────────────→ Message Queue (RabbitMQ)
```

---

## Technology Stack

### Frontend (Mobile App)
- **Framework:** React Native with Expo
- **Language:** JavaScript/TypeScript
- **State Management:** Context API / Redux (planned)
- **HTTP Client:** Axios
- **UI Components:** React Native, Expo UI Kit

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Language:** JavaScript
- **Database:** MySQL 8.0+
- **ORMs:** Direct MySQL queries (migration to Sequelize/TypeORM planned)
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** Multer
- **Task Scheduling:** Node-cron
- **Logging:** Winston
- **Security:** Helmet, bcryptjs
- **API Documentation:** Swagger/OpenAPI

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose (planned Kubernetes migration)
- **Message Queue:** RabbitMQ (Planned)
- **Cache:** Redis (Planned)
- **Monitoring:** Prometheus + Grafana (Planned)
- **CI/CD:** GitHub Actions (Planned)

---

## Project Structure

```
ManthanGuruMobileAdmin/
├── admin-app/                    # React Native Mobile Application
│   ├── App.js                   # Entry point
│   ├── app.json                 # Expo configuration
│   ├── package.json             # NPM dependencies
│   ├── tsconfig.json            # TypeScript config
│   ├── assets/                  # Images and static assets
│   ├── components/              # Reusable React components
│   │   ├── external-link.tsx
│   │   ├── haptic-tab.tsx
│   │   ├── hello-wave.tsx
│   │   ├── parallax-scroll-view.tsx
│   │   ├── themed-text.tsx
│   │   ├── themed-view.tsx
│   │   └── ui/                  # UI components
│   ├── constants/               # App constants
│   │   └── theme.ts            # Theme configuration
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   └── use-theme-color.ts
│   ├── src/                     # Application source code
│   │   ├── config.js           # API configuration
│   │   ├── screens/            # Screen components
│   │   │   ├── AddEditClient.js
│   │   │   ├── ClaimsScreen.js
│   │   │   ├── ClientDetails.js
│   │   │   ├── ClientsScreen.js
│   │   │   ├── DashboardScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── PoliciesScreen.js
│   │   │   └── RenewalsScreen.js
│   │   └── services/           # API services
│   │       └── api.js          # API client setup
│   ├── scripts/                # Build/utility scripts
│   │   └── reset-project.js
│   └── README.md               # Admin app documentation
│
├── insurance-backend/          # Node.js/Express Backend (Monolithic - Being Migrated)
│   ├── src/
│   │   ├── app.js             # Express app setup
│   │   ├── swagger.js         # Swagger configuration
│   │   ├── config/
│   │   │   └── db.js          # MySQL connection pool
│   │   ├── controllers/       # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── claims.controller.js
│   │   │   ├── clients.controller.js
│   │   │   ├── payments.controller.js
│   │   │   ├── policies.controller.js
│   │   │   └── renewals.controller.js
│   │   ├── routes/            # API route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── claims.routes.js
│   │   │   ├── clients.routes.js
│   │   │   ├── payments.routes.js
│   │   │   ├── policies.routes.js
│   │   │   └── renewals.routes.js
│   │   ├── middleware/        # Express middleware
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   └── upload.js
│   │   ├── utils/
│   │   │   ├── cronJobs.js    # Scheduled cron jobs
│   │   │   ├── dateUtils.js
│   │   │   └── logger.js      # Logging utility
│   │   ├── docs/
│   │   │   └── swagger.yaml   # OpenAPI specification
│   │   └── sql/
│   │       └── schema.sql     # Database schema
│   ├── scripts/               # Setup scripts
│   │   ├── migrateExcel.js   # Bulk client migration
│   │   └── seedAdmin.js       # Create initial admin
│   ├── uploads/               # File storage
│   │   ├── claims/
│   │   └── clients/
│   ├── Dockerfile            # Container configuration
│   ├── docker-compose.yml    # Local dev environment
│   ├── package.json          # NPM dependencies
│   ├── pm2.config.js         # Production process config
│   └── README.md             # Backend documentation
│
├── uploads/                  # Shared file upload directory
│   ├── claims/
│   └── clients/
│
├── DEVELOPMENT_SETUP.md      # Development environment setup guide
├── RESTART_GUIDE.md          # Restart procedures guide
├── MICROSERVICES_ARCHITECTURE.md  # Microservices design document
└── README.md                 # This file
```

---

## Prerequisites

Before you begin, ensure you have installed:

### Required
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 8.x or higher (comes with Node.js)
- **MySQL** 8.0 or higher ([Download](https://dev.mysql.com/downloads/mysql/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

### Optional (for development)
- **VS Code** with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Thunder Client or Postman (API testing)
  - MySQL Shell or DBeaver (database management)
- **Expo Go App** (for testing React Native app on phone)

### System Requirements
- **OS:** Windows 10+, macOS 10.14+, or Linux
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 2GB free space
- **Internet:** For npm package downloads

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ManthanGuruMobileAdmin.git
cd ManthanGuruMobileAdmin
```

### Step 2: Setup Backend

```bash
cd insurance-backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=manthan_guru_db
# JWT_SECRET=your_secret_key
# NODE_ENV=development
# PORT=3000
```

### Step 3: Setup MySQL Database

```bash
# Option A: Using Docker Compose (Recommended)
docker-compose up -d

# Option B: Manual MySQL setup
mysql -u root -p
CREATE DATABASE manthan_guru_db;
USE manthan_guru_db;
SOURCE src/sql/schema.sql;
```

### Step 4: Seed Initial Data

```bash
cd insurance-backend

# Create initial admin user
node scripts/seedAdmin.js
# Default: username=admin, password=admin123

# (Optional) Import clients from Excel
node scripts/migrateExcel.js path/to/clients.xlsx
```

### Step 5: Setup Frontend (Mobile App)

```bash
cd ../admin-app

# Install dependencies
npm install

# Install Expo CLI (if not already installed)
npm install -g expo-cli

# Create .env file for API configuration
# REACT_APP_API_URL=http://localhost:3000/api
```

### Step 6: Verify Installation

```bash
# Test Backend
cd insurance-backend
npm start
# Expected: "Server running on port 3000"

# Test Frontend
cd admin-app
npm start
# Expected: Expo CLI opens in terminal/browser
```

---

## Running the Application

### Option A: Docker Compose (Recommended for Local Development)

```bash
cd insurance-backend

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- MySQL database (port 3306)
- Backend API (port 3000)
- Adminer (MySQL web UI) - accessible at `http://localhost:8080`

### Option B: Manual Setup

#### Terminal 1 - Backend API

```bash
cd insurance-backend
npm start

# Output: "Server running on port 3000"
```

#### Terminal 2 - MySQL (if running locally)

```bash
mysql -u root -p
# Keep terminal open with MySQL connection
```

#### Terminal 3 - Mobile App

```bash
cd admin-app
npm start
```

Then:
- Press `w` for web preview
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on phone

### API Access

- **API Base URL:** `http://localhost:3000/api`
- **API Documentation:** `http://localhost:3000/api-docs`
- **Health Check:** `http://localhost:3000/health`

### Mobile App Access

- **Web:** Open web link from Expo CLI
- **Phone/Emulator:** Scan QR code with Expo Go or emulator camera

---

## API Documentation

### Authentication

**Login and get JWT token:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Use token in requests:**
```bash
Authorization: Bearer <token>
```

### Available Endpoints

#### Clients
- `POST /api/clients` - Create new client
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `POST /api/clients/:id/doc` - Upload document

#### Policies
- `POST /api/policies` - Create policy
- `GET /api/policies` - List policies
- `GET /api/policies/:id` - Get policy details
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

#### Claims
- `POST /api/claims` - Submit claim
- `GET /api/claims` - List claims
- `GET /api/claims/:id` - Get claim details
- `PUT /api/claims/:id` - Update claim
- `POST /api/claims/:id/doc` - Upload claim document

#### Renewals
- `GET /api/renewals` - List renewals
- `POST /api/renewals` - Create renewal
- `PUT /api/renewals/:id/complete` - Complete renewal

#### Payments
- `POST /api/payments` - Record payment
- `GET /api/payments` - List payments
- `PUT /api/payments/:id` - Update payment

**Full API documentation available at:** `http://localhost:3000/api-docs`

---

## Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=manthan_guru_db

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Mail (Optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENV=development
```

---

## Development Guidelines

### Code Style

- **Backend:** Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **Frontend:** Follow [Airbnb React Guide](https://github.com/airbnb/javascript/tree/master/react)
- **Use ESLint:** Check linting rules in `eslint.config.js`

### Naming Conventions

```
Files:
- Controllers: camelCase filename
- Routes: dash-case.routes.js
- Utilities: dash-case.js

Variables:
- Constants: UPPER_SNAKE_CASE
- Functions: camelCase
- Classes: PascalCase
```

### Commit Message Format

```
type(scope): subject

feat(auth): add login endpoint
fix(clients): resolve null reference error
docs(readme): update installation steps
chore(deps): upgrade express to 4.18
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Adding New Features

1. Create feature branch: `git checkout -b feature/feature-name`
2. Write code following style guidelines
3. Add tests for new functionality
4. Test locally: `npm test`
5. Create pull request with description
6. Code review and merge to main

---

## Testing

### Backend Tests

```bash
cd insurance-backend

# Run all tests
npm test

# Run specific test file
npm test -- tests/auth.test.js

# Run with coverage
npm test -- --coverage
```

### Frontend Tests

```bash
cd admin-app

# Run tests
npm test

# Run specific test
npm test -- ClientsScreen.test.js
```

### API Testing (Using Thunder Client/Postman)

1. Import Postman collection from `insurance-backend/postman-collection.json`
2. Set environment variables
3. Run requests or collection

---

## Deployment

### Staging Deployment

```bash
# Build Docker image
docker build -t manthan-guru-api:staging .

# Push to registry
docker push your-registry/manthan-guru-api:staging

# Deploy using docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Production Deployment

See [Deployment Guide](DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Build optimized production image
2. Push to Docker registry
3. Deploy to Kubernetes cluster
4. Monitor with Prometheus + Grafana
5. Setup CI/CD with GitHub Actions

### Database Migration

```bash
# Backup existing database
mysqldump -u root -p manthan_guru_db > backup.sql

# Run migrations
node scripts/migrate.js

# Verify migration
npm test -- migration.test.js
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `connect ECONNREFUSED 127.0.0.1:3306`

Solution:
```bash
# Check if MySQL is running
mysql -u root -p

# If not running, start MySQL service
# Windows: net start MySQL80
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql
```

### Port Already in Use

**Error:** `Error: listen EADDRINUSE :::3000`

Solution:
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=3001 npm start
```

### Mobile App Not Connecting to Backend

**Issue:** App shows network error

Solution:
1. Ensure backend is running: `http://localhost:3000/health` returns JSON
2. Check `.env` has correct `REACT_APP_API_URL`
3. On Android emulator: Use `10.0.2.2` instead of `localhost`
4. On physical phone: Use machine IP address (e.g., `192.168.x.x`)

### JWT Token Expired

**Error:** `401 Unauthorized - Token expired`

Solution:
```bash
# Refresh token endpoint
POST /api/auth/refresh
Headers: { "Authorization": "Bearer <refresh_token>" }

# Or login again to get new token
```

### File Upload Failing

**Error:** `413 Payload Too Large`

Solution:
- Check `MAX_FILE_SIZE` in `.env`
- Increase `bodyLimit` in app.js
- Ensure file size is within limit (default 10MB)

---

## Contributing

### Pull Request Process

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request with description

### Report Issues

Use GitHub Issues with template:
- Description of issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs if applicable

---

## Roadmap

### Current Phase (Q1 2025)
- ✅ Auth system setup
- ✅ Client management module
- ✅ Policy management module
- ✅ Claims processing module
- 🔄 Mobile app development
- 📅 Payment gateway integration

### Next Phase (Q2 2025)
- 📅 Microservices architecture migration
- 📅 RabbitMQ message queue integration
- 📅 Enhanced reporting & analytics
- 📅 Mobile app completion

### Future Enhancements
- AI-powered claims assessment
- Mobile app for customers
- Advanced analytics dashboard
- Integration with external systems
- Multi-language support

---

## License

This project is proprietary software developed for Manthan Guru Insurance. All rights reserved.

---

## Contact & Support

For issues, questions, or suggestions:

- **Email:** support@manthanguru.com
- **Documentation:** See DEVELOPMENT_SETUP.md, RESTART_GUIDE.md
- **API Docs:** `http://localhost:3000/api-docs`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | Jan 2025 | Initial project setup, core modules |
| 0.2.0 | Feb 2025 | Mobile app v1, API documentation |
| 1.0.0 | TBD | Production release |

---

## Changelog Tracking

All updates to this README will be documented here.

**Last Updated:** April 4, 2025

### Recent Updates (This Session)
- Created comprehensive README for entire project
- Added microservices architecture design document
- Documented current monolithic backend structure

---

**Happy Coding! 🚀**
