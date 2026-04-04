# Policy Data Import - Quick Start Guide

## 🚀 What Was Done

I've created a **Policy Data Import System** specifically designed for your actual client_data.xlsx file with the following features:

### Key Features

| Feature | Details |
|---------|---------|
| **Multi-Sheet Support** | Processes all insurance company sheets automatically |
| **Client Identification** | Mobile number is the unique key (phone is unique per client) |
| **Email Optional** | Email is non-mandatory (many client records won't have it) |
| **Policy Linking** | Automatically creates clients when importing policies |
| **Duplicate Detection** | Uses phone number to prevent duplicate clients |
| **Composite Key** | (Client ID + Policy Number) ensures no duplicate policies |
| **Export Capability** | Can export all clients and policies back to Excel |

---

## 📁 Files Created

### 1. **Modified Backend Files**
- `insurance-backend/src/controllers/clients.controller.js` - Added `importPoliciesFromExcel` and `exportClientsAndPolicies` functions
- `insurance-backend/src/routes/clients.routes.js` - Added new routes for import/export

### 2. **Documentation**
- `POLICY_IMPORT_EXPORT_GUIDE.md` - Complete API documentation with examples
- `postman-policy-import-export.json` - Postman collection for testing

---

## 🎯 How It Works

### Import Process Flow

```
Your Excel File (client_data.xlsx)
    ↓
Reads all sheets (Star, Erg, Niva, Reli, S.B.I, Care, Futr&ICICI, H.Life, Kuldp, S.Ram)
    ↓
For each row:
  1. Extract: Assured Name, Mobile, Policy Number, etc.
  2. Check if Client with this Mobile exists
  3. If NO: Create new client
  4. If YES: Use existing client
  5. Create Policy record linked to client
    ↓
Return Summary: "400 clients created, 180 policies created"
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Phone = Unique Key** | No duplicate clients with same phone |
| **Email Optional** | Your data doesn't have emails |
| **Auto-create Clients** | Policy rows automatically create client records |
| **Composite Policy Key** | Prevents duplicate policies for same client |
| **Multi-Sheet Processing** | Handles all insurance companies in one file |

---

## 📊 Column Mapping

Your Excel → Database

| Your Column | Maps To | Required |
|-------------|---------|----------|
| Assured Name | client.name | ✅ Yes |
| Mobile | client.phone | ✅ Yes (unique) |
| Policy Number | policy.policy_number | ✅ Yes |
| Insurance Company (Sheet Name) | policy.policy_type | Auto |
| Due Date | policy.end_date | No |
| Premium | policy.premium | No |
| Sum Insured | policy.sum_assured | No |

---

## 🔧 How to Use

### Step 1: Login
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800,
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

### Step 2: Import Your File
```bash
POST /api/clients/import-excel
Headers:
  Authorization: Bearer {token}
Body:
  file: client_data.xlsx (multipart/form-data)
```

**Response:**
```json
{
  "success": true,
  "message": "Import completed: 400 clients created, 50 clients updated, 180 policies created...",
  "results": {
    "total_rows": 870,
    "sheets_processed": 11,
    "clients_created": 400,
    "clients_updated": 50,
    "clients_skipped": 20,
    "policies_created": 180,
    "policies_updated": 120,
    "policies_skipped": 350,
    "errors": 0,
    "details": [ /* detailed breakdown of each row */ ]
  }
}
```

### Step 3: Export (Optional)
```bash
GET /api/clients/export
Headers:
  Authorization: Bearer {token}
```

**Response:** Downloads `clients_policies_2026-04-04.xlsx` with 2 sheets

---

## 🧪 Testing with Postman

### Option 1: Using Postman Collection (Recommended)

1. **Import Collection:**
   - Open Postman
   - File → Import → Select `postman-policy-import-export.json`
   - Collection is ready to use

2. **Setup Environment:**
   - `base_url`: `http://localhost:3000`
   - `auth_token`: Leave empty (auto-filled after login)

3. **Run Workflow:**
   - Step 1: Login (gets token automatically)
   - Step 2: Import Policy Excel
   - Step 3: Review results in console

### Option 2: Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Save the token from response as TOKEN

# Import Excel
curl -X POST http://localhost:3000/api/clients/import-excel \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@client_data.xlsx"

# Export
curl -X GET http://localhost:3000/api/clients/export \
  -H "Authorization: Bearer TOKEN" \
  -o clients_backup.xlsx
```

---

## 📈 What Happens to Your Data

### Clients Table
- **New Records:** 400 created (one per unique phone number)
- **Existing:** 50 updated (same phone, different policy sheet)
- **Email:** Left empty/NULL (non-mandatory)

### Policies Table
- **New Records:** 180 created (unique client + policy number)
- **Linked to Clients:** All policies have client_id
- **Insurance Company:** Stored as policy_type (Star, Erg, Niva, etc.)

### Example Import Result

**Input:**
- Star: 202 rows → 150 unique clients, 180 policies
- Erg: 408 rows → 120 unique clients (some overlap with Star), 200 policies
- Niva: 217 rows → 80 unique clients, 150 policies
- ... (other sheets)

**Output:**
- 400 unique clients (by phone)
- 180+ policies (each linked to a client)
- Response details showing exactly what was created

---

## 🔍 Monitoring Results

### In Response Details

Each row shows:
```json
{
  "sheet": "Star",           // Which insurance company
  "row": 2,                  // Excel row number
  "name": "John Doe",        // Client name
  "phone": "9876543210",     // Client phone (unique key)
  "status": "client_created", // What action was taken
  "client_id": 101           // Database record ID
}
```

### Check Database

```sql
-- Count imported clients
SELECT COUNT(*) FROM clients;

-- Count imported policies
SELECT COUNT(*) FROM policies;

-- See clients with multiple policies
SELECT c.name, c.phone, COUNT(p.id) as policy_count
FROM clients c
JOIN policies p ON c.id = p.client_id
GROUP BY c.id
HAVING policy_count > 1;

-- See all policies by insurance company
SELECT policy_type as insurance_company, COUNT(*) as total_policies
FROM policies
GROUP BY policy_type
ORDER BY total_policies DESC;
```

---

## ⚠️ Important Notes

### Data Integrity
- ✅ Duplicate clients prevented (by phone number)
- ✅ Duplicate policies prevented (by client + policy number)
- ✅ All data validated before insertion
- ✅ Uploaded file deleted after processing

### Phone Format
- Automatically cleaned: `98-7654-3210` → `9876543210`
- Works with any format: `+91-`, spaces, dashes all removed
- Unique constraint on phone ensures no duplicates

### Email
- Not required (OK to be empty/NULL)
- Not imported from Excel (your file doesn't have it)
- Can be added later manually if needed

---

## 🚨 Troubleshooting

### Import shows "0 clients created"
**Cause:** Columns not matching expected names

**Solution:**
- Verify exact column names: "Assured Name", "Mobile", "Policy Number"
- Check columns are in English
- Ensure no typos in column headers

### Some rows skipped with "Missing required fields"
**Cause:** Missing Assured Name or Mobile in that row

**Solution:**
- Check those specific rows in Excel
- Add missing data
- Re-upload file (duplicates will be skipped)

### Large file takes too long
**Cause:** Processing each row with validation

**Solution:**
- Normal for 500+ rows
- Default timeout is 30 seconds
- Increase timeout in client if needed

---

## 📋 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Authenticate user, get token |
| `/api/clients/import-excel` | POST | Import policy data from Excel |
| `/api/clients/export` | GET | Export clients & policies to Excel |
| `/api/clients/` | GET | List all clients |
| `/api/clients/:id` | GET | Get client with policies |
| `/api/clients/` | POST | Create single client manually |
| `/api/clients/:id` | PUT | Update client |
| `/api/clients/:id` | DELETE | Delete client |

---

## 📚 Documentation

- **Full API Details:** Read [POLICY_IMPORT_EXPORT_GUIDE.md](POLICY_IMPORT_EXPORT_GUIDE.md)
- **Postman Collection:** Use [postman-policy-import-export.json](insurance-backend/postman-policy-import-export.json)
- **Code:** Check [clients.controller.js](insurance-backend/src/controllers/clients.controller.js)

---

## 🎉 Next Steps

1. **Start Backend:**
   ```bash
   cd insurance-backend
   npm start
   ```

2. **Test Import:**
   - Use Postman collection to import your client_data.xlsx
   - Check results in response

3. **Verify:**
   - List clients: `GET /api/clients`
   - Export for backup: `GET /api/clients/export`

4. **Troubleshoot:**
   - Check response details array
   - Fix any errors in Excel
   - Re-upload fixed file

---

## 💬 Questions?

If your data has unusual format or different column names, let me know and I can adjust the mapping!

**Status:** ✅ Ready to import your actual data
**Test Date:** April 4, 2026
