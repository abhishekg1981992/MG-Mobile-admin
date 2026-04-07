# Database Maintenance Guide

## File Structure

```
insurance-backend/
  src/sql/
    schema.sql          ← Golden schema (all tables, all columns — single source of truth)
    db_update.sql       ← Pending incremental changes for existing databases
  src/db/
    migrateAll.js       ← Migration runner
  scripts/
    runMigrations.js    ← CLI entry point
    setupDatabase.js    ← First-time setup (migrate:full + seed admin)
    seedAdmin.js        ← Seed admin user from env vars
```

---

## How It Works

Only two SQL files matter:

| File | Purpose |
|------|---------|
| `schema.sql` | Complete DB structure. All `CREATE TABLE IF NOT EXISTS` with every column. Used for fresh DBs. |
| `db_update.sql` | Pending `ALTER TABLE` / `CREATE TABLE` for existing databases. Replace contents after each successful deploy. |

The runner automatically skips duplicate errors (`ER_DUP_FIELDNAME`, `ER_TABLE_EXISTS_ERROR`, `ER_DUP_KEYNAME`), so re-running is always safe.

| Command | What runs | When to use |
|---------|-----------|-------------|
| `npm run migrate` | `db_update.sql` only | Deploy changes to existing DB |
| `npm run migrate:full` | `schema.sql` + `db_update.sql` | Fresh DB setup |
| `node scripts/setupDatabase.js` | `migrate:full` + seed admin | First-time Railway deployment |

---

## How to Add a New Table or Column

### Step 1: Add to `db_update.sql`

Replace the contents of `db_update.sql` with your new changes:

```sql
-- Pending: describe what this deploy changes
ALTER TABLE clients ADD COLUMN pan VARCHAR(20) NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS new_table (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ...
);
```

### Step 2: Update `schema.sql`

Add the same table/column to `schema.sql` so fresh databases include it.

### Step 3: Deploy

```powershell
railway run npm run migrate
```

### Step 4: After successful deploy

Clear `db_update.sql` (leave just the header comment):

```sql
-- Pending incremental changes for existing databases.
-- Replace contents with next set of changes before deploy.
```

That's it. No manifests, no numbered files, no tracking tables.

---

## Running Migrations on Railway

### Option A: Railway CLI from your local machine

The `railway run` command runs a local command but injects Railway's environment variables (DB_HOST, DB_USER, DB_PASS, DB_NAME) so it connects to Railway's MySQL.

**One-time setup:**
```powershell
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login (opens browser for auth)
railway login

# 3. Link to your project (run from insurance-backend folder)
cd D:\ManthanGuruMobileAdmin\insurance-backend
railway link
#   → Select your project and service when prompted
```

**Run migrations:**
```powershell
# Incremental update (existing DB)
railway run npm run migrate

# Fresh DB setup (schema.sql + pending updates)
railway run npm run migrate:full

# First-time setup (full migrate + create admin user)
railway run node scripts/setupDatabase.js
```

### Option B: Railway Dashboard Shell

1. Open Railway project dashboard → click your **backend service**
2. Go to the **Shell** tab
3. Type:
   ```bash
   npm run migrate
   ```

> **Note:** The Shell tab gives you a terminal inside the running container with env vars already set.

---

## Connecting Railway MySQL to Local MySQL Workbench

### Step 1: Get credentials from Railway

1. Open Railway project dashboard → click the **MySQL service**
2. Go to the **Variables** tab (or **Connect** tab)
3. Note down:
   - `MYSQLHOST` (e.g., `roundhouse.proxy.rlwy.net`)
   - `MYSQLPORT` (e.g., `43210` — **not** the default 3306)
   - `MYSQLUSER` (e.g., `root`)
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE` (e.g., `railway`)

### Step 2: Create connection in MySQL Workbench

1. Open MySQL Workbench → click **+** (New Connection)
2. Fill in:
   - **Connection Name**: `Railway Production`
   - **Hostname**: value of `MYSQLHOST`
   - **Port**: value of `MYSQLPORT` (important — Railway uses a non-standard port)
   - **Username**: value of `MYSQLUSER`
   - **Password**: Click **Store in Vault** → paste `MYSQLPASSWORD`
   - **Default Schema**: value of `MYSQLDATABASE`
3. Click **Test Connection** → should say "Successfully made the MySQL connection"
4. Click **OK**

### Troubleshooting

- **Connection timeout**: Check that Railway MySQL service is running in the dashboard.
- **Auth fails after a while**: Railway may rotate credentials — re-check the Variables tab.
- **Wrong port**: Railway uses a proxy port (not 3306). Always copy the exact port from Variables.

---

## Rules

1. **`schema.sql` is the golden source** — always update it alongside `db_update.sql`.
2. **`db_update.sql` is disposable** — replace its contents before each deploy, clear after success.
3. **Changes must be idempotent** — use `IF NOT EXISTS`, `ADD COLUMN` (runner skips duplicates).
4. **Re-running is safe** — the same `db_update.sql` can run multiple times without harm.

---

## Current Table Summary

| Table | Purpose |
|-------|---------|
| `admins` | App login users (username, password, role) |
| `clients` | Customer information (name, phone, email, address, city, state, pincode, dob, nominee, notes) |
| `policies` | Insurance policies linked to clients |
| `renewals` | Policy renewal tracking |
| `payments` | Payment records for policies |
| `claims` | Insurance claim records |
| `documents` | Uploaded files (client/claim docs) |
| `activity_logs` | Audit trail |
| `insurance_providers` | Insurance company details with sales/claim/renewal POC contacts |
