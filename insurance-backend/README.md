# Insurance Backend (Node.js + Express + MySQL)

## What is included
- Express server with modular routes and controllers
- MySQL connection pool using `mysql2/promise`
- JWT authentication and role-based middleware
- Modules: Admins, Clients, Policies, Renewals, Payments, Claims
- File upload (multer) for documents
- Excel -> MySQL migration script (using `xlsx`)
- Swagger API docs starter
- Security: helmet + rate-limiter
- Cron example for renewal reminders (node-cron)
- Scripts: seed-admin, migrate-excel

## Quick start
1. Copy `.env.example` to `.env` and update credentials.
2. `npm install`
3. Create DB: run SQL in `src/sql/schema.sql` or use docker-compose.
4. `npm run seed-admin` to create initial admin (uses bcrypt).
5. `npm run dev`

