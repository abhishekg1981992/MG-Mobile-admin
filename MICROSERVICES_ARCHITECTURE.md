# Microservices Architecture Design - Manthan Guru Insurance Application

## Overview
This document outlines the proposed microservices architecture for transitioning from a monolithic Express.js backend to a scalable, distributed system.

---

## Current Architecture
**Monolithic Structure:**
```
insurance-backend/
├── controllers (Auth, Clients, Policies, Renewals, Payments, Claims)
├── routes
├── middleware
├── services
└── Single MySQL Database
```

**Problems with Monolithic Approach:**
- Single point of failure (entire API down if one module fails)
- Difficult to scale specific features independently
- Database becomes a bottleneck for all operations
- Deployment requires redeploying entire application
- Team coordination challenges with shared codebase

---

## Proposed Microservices Architecture

### Service Breakdown

```
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Express/Kong)                  │
│        Request Routing, Auth Validation, Rate Limit      │
└────────────┬────────────┬────────────┬────────────────────┘
             │            │            │
    ┌────────▼───┐ ┌──────▼──────┐ ┌──▼───────────┐
    │Auth Service│ │Client Service│ │Policy Service│
    │(JWT/OAuth) │ │(CRM)         │ │(Policies)    │
    │Port 3001   │ │Port 3002     │ │Port 3003     │
    └────────────┘ └──────────────┘ └──────────────┘
             
    ┌────────┬──────────────┐ ┌──────────────┬──────────────┐
    │         │              │ │              │              │
┌───▼─┐  ┌──▼────────────┐ ┌▼──────┐  ┌──────▼─────┐  ┌────▼────┐
│User │  │ Claims Service │ │Payment│  │  Renewal   │  │ Document│
│Auth │  │ (Claims Mgmt)  │ │Service│  │  Service   │  │ Service │
│DB   │  │ Port 3005      │ │Port 3004 │ Port 3006 │  │Port 3007 │
└─────┘  │ Claims DB      │ │Payment DB │Renewal DB │  │Document  │
         │ Documents      │ │          │          │  │Storage    │
         └────────────────┘ └──────────┘ └────────────┘ └────────┘

         ┌──────────────────────────────────────────┐
         │      Message Queue (RabbitMQ/Redis)     │
         │  (Event Broadcasting & Async Tasks)     │
         └──────────────────────────────────────────┘

         ┌──────────────────────────────────────────┐
         │    Shared Services Layer                 │
         │  • Logging (Winston)                     │
         │  • Notifications                         │
         │  • Cron Jobs (Node-Cron)                │
         │  • File Processing                       │
         └──────────────────────────────────────────┘
```

---

## Detailed Service Specifications

### 1. **API Gateway Service** (Port 3000)
**Purpose:** Single entry point, request routing, authentication validation
**Technology:** Express.js or Kong
**Responsibilities:**
- Route requests to appropriate microservices
- Validate JWT tokens
- Rate limiting (200 req/15 min)
- CORS handling
- Request/Response logging
- Circuit breaker for service failures

**Endpoints Managed:**
```
/api/         → Routes to specific services
/api/health   → Health check for all services
/api-docs     → Swagger documentation
```

---

### 2. **Auth Service** (Port 3001)
**Purpose:** User authentication and authorization
**Database:** Dedicated `auth_db` (users/admins table)
**Responsibilities:**
- User login/logout
- JWT token generation & refresh
- Password hashing & verification
- Role-based access validation
- 2FA support (future)

**API Endpoints:**
```
POST   /auth/login        → Generate JWT token
POST   /auth/refresh      → Refresh token
POST   /auth/logout       → Invalidate token
GET    /auth/validate     → Verify token validity
POST   /auth/users        → Create new user (admin only)
PUT    /auth/users/:id    → Update user
DELETE /auth/users/:id    → Delete user
```

**Database Schema:**
```sql
users:
  - id, username, email, password (bcrypt), role, active, created_at, updated_at

roles:
  - id, name (admin, manager, staff), permissions JSON

activity_logs:
  - id, user_id, action, resource, timestamp
```

---

### 3. **Client Service** (Port 3002)
**Purpose:** Manage client information and profiles
**Database:** Dedicated `client_db`
**Responsibilities:**
- Create/Read/Update/Delete clients
- Store client KYC information
- Manage client contacts
- Client document management
- Search & filter clients

**API Endpoints:**
```
POST   /clients            → Create client
GET    /clients            → List all clients (paginated)
GET    /clients/:id        → Get client details
PUT    /clients/:id        → Update client
DELETE /clients/:id        → Delete client (soft delete)
GET    /clients/:id/summary → Get client summary with policies count
POST   /clients/:id/documents → Upload document
```

**Database Schema:**
```sql
clients:
  - id, name, phone, email, address, city, state, 
    pincode, dob, gender, pan, aadhar, status, created_at

documents:
  - id, client_id, document_type, path, uploaded_at, 
    verified_by, verified_at
```

**Events Published:**
```
client.created       → Triggers welcome email, account setup
client.updated       → Log change for audit
client.deleted       → Soft delete, notify related services
```

---

### 4. **Policy Service** (Port 3003)
**Purpose:** Manage insurance policies
**Database:** Dedicated `policy_db`
**Responsibilities:**
- Create/Read/Update/Delete policies
- Policy status management
- Policy type management
- Premium calculation (workflow to be defined)
- Policy expiry tracking

**API Endpoints:**
```
POST   /policies            → Create new policy
GET    /policies            → List policies (filter by client, status)
GET    /policies/:id        → Get policy details
PUT    /policies/:id        → Update policy
DELETE /policies/:id        → Delete policy
GET    /policies/:id/summary → Policy summary with payments & renewals
POST   /policies/:id/renew   → Trigger renewal workflow
```

**Database Schema:**
```sql
policies:
  - id, policy_number (unique), client_id, policy_type, 
    premium, sum_assured, start_date, end_date, status,
    created_by, created_at, updated_at

policy_types:
  - id, name, description, base_premium, coverage_details

premium_history:
  - id, policy_id, amount, due_date, paid_date
```

**Events Published:**
```
policy.created       → Initialize renewal schedule
policy.updated       → Update related renewals
policy.expiring_soon → Alert via notification service
```

**Calls To:**
- Client Service (retrieve client info)
- Renewal Service (create renewal records)

---

### 5. **Payment Service** (Port 3004)
**Purpose:** Handle policy premium payments
**Database:** Dedicated `payment_db`
**Responsibilities:**
- Process premium payments
- Payment gateway integration (Stripe, PayPal, etc.)
- Payment status tracking
- Generate payment receipts
- Handle refunds & adjustments

**API Endpoints:**
```
POST   /payments            → Record/Process payment
GET    /payments            → List payments
GET    /payments/:id        → Payment details
PUT    /payments/:id        → Update payment
GET    /payments/:id/receipt → Generate receipt
POST   /payments/refund     → Process refund
```

**Database Schema:**
```sql
payments:
  - id, policy_id, amount, payment_date, method,
    status (pending, success, failed), transaction_id,
    reference_no, created_at

payment_methods:
  - id, type (credit_card, debit_card, bank_transfer, upi),
    provider (Stripe, Razorpay, etc.), details JSON
```

**Events Published:**
```
payment.success      → Update policy status, notify Client Service
payment.failed       → Log failure, retry mechanism
payment.refund       → Audit trail
```

**Calls To:**
- Policy Service (validate policy, fetch details)
- Notification Service (send payment receipt)

---

### 6. **Claims Service** (Port 3005)
**Purpose:** Manage insurance claims submissions and processing
**Database:** Dedicated `claims_db`
**Responsibilities:**
- Submit insurance claims
- Claims status tracking
- Claims assessment workflow
- Settlement processing
- Multi-file attachment handling

**API Endpoints:**
```
POST   /claims              → Submit new claim
GET    /claims              → List claims (paginated, filterable)
GET    /claims/:id          → Get claim details
PUT    /claims/:id          → Update claim status/details
POST   /claims/:id/documents → Upload supporting documents
GET    /claims/:id/documents → Retrieve claim documents
PUT    /claims/:id/assess   → Assign assessor & update status
POST   /claims/:id/settle   → Process settlement
```

**Database Schema:**
```sql
claims:
  - id, policy_id, claim_date, claim_type, description,
    amount_claimed, amount_approved, status
    (submitted, under_review, approved, rejected, paid),
    assigned_to (assessor), created_at, updated_at

claim_documents:
  - id, claim_id, filename, path, document_type,
    uploaded_at

claim_assessments:
  - id, claim_id, assessor_id, assessment_date,
    findings, recommendation, amount_recommended
```

**Events Published:**
```
claim.submitted      → Notify assessor, create task
claim.assigned       → Send notification to assessor
claim.approved       → Trigger payment to Payment Service
claim.rejected       → Notify claimant with reason
claim.paid           → Update claim status
```

**Calls To:**
- Policy Service (validate claim against policy)
- Payment Service (process settlement)
- Notification Service (send updates)
- Document Service (store documents)

---

### 7. **Renewal Service** (Port 3006)
**Purpose:** Manage policy renewal workflows
**Database:** Dedicated `renewal_db`
**Responsibilities:**
- Track upcoming renewals
- Schedule renewal reminders
- Generate renewal documents
- Renewal process automation
- Renewal analytics

**API Endpoints:**
```
GET    /renewals            → List renewals (by status, date range)
POST   /renewals            → Create renewal record
GET    /renewals/:id        → Get renewal details
PUT    /renewals/:id        → Update renewal status
POST   /renewals/:id/complete → Mark renewal as completed
GET    /renewals/due-soon   → Get all renewals due within 30 days
POST   /renewals/bulk-email → Send renewal reminders
```

**Database Schema:**
```sql
renewals:
  - id, policy_id, client_id, original_premium, 
    renewal_date, new_premium, status
    (pending, reminder_sent, renewed, lapsed),
    reminder_count, last_reminder_date,
    created_at, updated_at

renewal_templates:
  - id, name, subject, body (email template)
```

**Events Published:**
```
renewal.due_soon          → Send reminder email
renewal.completed         → Update policy status
renewal.lapsed (unpaid)   → Alert admin
```

**Calls To:**
- Policy Service (fetch policy & client details)
- Notification Service (send renewal reminders)
- Document Service (generate renewal documents)

**Scheduled Jobs (Cron):**
- Daily at 9:00 AM: Check renewals due in next 7 days → Send reminders
- Weekly: Generate renewal report
- Monthly: Process auto-renewals (if configured)

---

### 8. **Document Service** (Port 3007)
**Purpose:** Centralized document management and storage
**Storage:** AWS S3 / Local filesystem
**Responsibilities:**
- Store & retrieve documents
- Document metadata handling
- File validation & scanning
- Document versioning
- Cleanup of old documents

**API Endpoints:**
```
POST   /documents           → Upload document
GET    /documents/:id       → Download document
DELETE /documents/:id       → Delete document
GET    /documents/meta/:id  → Get document metadata
POST   /documents/scan      → Scan document (virus check)
```

**Database Schema:**
```sql
documents:
  - id, entity_type (client, claim, policy), entity_id,
    document_type, filename, storage_path, 
    file_size, mime_type, scan_status, scanned_at,
    created_at, updated_at
```

**Storage Structure:**
```
s3://manthan-guru/
├── clients/{client_id}/
├── claims/{claim_id}/
├── policies/{policy_id}/
└── renewals/{renewal_id}/
```

---

## Communication Patterns

### 1. **Synchronous (REST API)**
Used for real-time data fetches and immediate responses:
```
API Gateway → Service → Response
Examples:
- Get client details (Client Service)
- Get policy info (Policy Service)
- Validate token (Auth Service)
```

### 2. **Asynchronous (Message Queue - RabbitMQ/Redis)**
Used for event-driven workflows and decoupled operations:
```
Service A → Event Published → Message Queue → Service B (Consumer)
Examples:
- client.created → Send welcome email (Notification Service)
- policy.created → Initialize renewal (Renewal Service)
- payment.success → Update policy status (Policy Service)
- claim.submitted → Notify assessor (Notification Service)
```

### 3. **Service-to-Service Communication**
Direct REST calls when immediate response needed:
```
Claims Service → Policy Service (validate policy)
Payment Service → Policy Service (fetch policy premium)
Renewal Service → Policy Service (get policy details)
```

---

## Shared Infrastructure

### 1. **Message Queue (RabbitMQ/Redis)**
**Purpose:** Async event publishing and consumption
**Benefits:**
- Decouples services
- Handles failures gracefully (retry mechanism)
- Enables event sourcing

**Channels:**
```
client.events          (client created, updated, deleted)
policy.events          (policy created, updated, expiring)
payment.events         (payment success, failure, refund)
claims.events          (claim submitted, approved, denied)
renewal.events         (renewal due, completed, lapsed)
notification.events    (email, SMS, push notifications)
```

### 2. **Shared Logging Service**
**Technology:** Churchill/ELK Stack
**Centralized logs from all services:**
```
{
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "claims-service",
  "level": "INFO",
  "message": "Claim submitted",
  "claim_id": "CLM-12345",
  "user_id": "USR-789",
  "trace_id": "abc123def456"
}
```

### 3. **Shared Monitoring & Alerts**
**Tools:** Prometheus + Grafana
**Metrics:**
- Service response time
- Error rates per service
- Database query performance
- Queue message count
- API request rate

### 4. **Configuration Server**
**Technology:** Consul or simple config service
**Manages:**
- Environment variables
- Feature flags
- Service discovery
- Circuit breaker settings

---

## Data Consistency Strategy

### Database per Service Pattern
Each microservice has its own database to ensure:
- Independence
- Technology flexibility
- Parallel scaling

### Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Cross-service queries** | Use API calls or Data Replication |
| **Distributed transactions** | Saga pattern (choreography or orchestration) |
| **Eventual consistency** | Event-driven updates with polling fallback |
| **Data duplication** | Accept duplication, sync via events |

### Example Saga: Create Policy Flow
```
1. Client Service: Store client info
2. Policy Service: Create policy (receives client_id)
3. Emit: policy.created event
4. Renewal Service: Subscribe to event, create renewal
5. Payment Service: Subscribe to event, initialize payment tracking
6. If any step fails → Compensating transaction (rollback)
```

---

## Deployment Architecture

### Development Environment
```
Local Machine / Docker Compose
├── API Gateway (3000)
├── Auth Service (3001)
├── Client Service (3002)
├── Policy Service (3003)
├── Payment Service (3004)
├── Claims Service (3005)
├── Renewal Service (3006)
├── Document Service (3007)
├── RabbitMQ (5672)
├── MySQL (3306)
└── Redis (6379)
```

### Production Environment
```
Kubernetes Cluster
├── API Gateway (Ingress Controller)
├── Microservices (Individual Deployments)
├── MongoDB/MySQL (Separate instances)
├── Message Queue (RabbitMQ, replicated)
├── Redis (Distributed cache)
├── Logging Stack (ELK/Datadog)
├── Monitoring (Prometheus/Grafana)
└── Load Balancer (AWS ALB/Nginx)
```

### Docker Compose Setup
Each service gets its own container with volume mapping for databases.

---

## Migration Strategy (Monolith to Microservices)

### Phase 1: Setup Foundation (Week 1-2)
- [ ] Create API Gateway
- [ ] Extract Auth Service
- [ ] Setup Message Queue
- [ ] Configure logging & monitoring

### Phase 2: Extract Core Services (Week 3-4)
- [ ] Extract Client Service
- [ ] Extract Policy Service
- [ ] Extract Payment Service
- [ ] Setup service-to-service communication

### Phase 3: Extract Complex Services (Week 5-6)
- [ ] Extract Claims Service
- [ ] Extract Renewal Service
- [ ] Extract Document Service
- [ ] Implement cron jobs migration

### Phase 4: Testing & Optimization (Week 7-8)
- [ ] Integration testing across services
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] Security hardening

### Phase 5: Deployment & Rollout (Week 9+)
- [ ] Deploy to staging
- [ ] Blue-green deployment strategy
- [ ] Gradual traffic migration
- [ ] Production monitoring

---

## Technology Stack Recommendation

| Component | Technology | Reason |
|-----------|-----------|--------|
| **Service Framework** | Node.js + Express.js | Lightweight, fast, existing codebase |
| **Message Queue** | RabbitMQ | Reliable delivery, excellent docs |
| **Cache** | Redis | Session management, rate limiting |
| **Database** | MySQL 8+ | Relational data, ACID compliance |
| **API Gateway** | Express.js + Middleware | Custom control, lightweight |
| **Logging** | Winston + Churchill | Structured logging, easy integration |
| **Monitoring** | Prometheus + Grafana | Open-source, battle-tested |
| **Container** | Docker + Docker Compose | Portable, reproducible environments |
| **Orchestration** | Kubernetes or Nomad | Auto-scaling, self-healing |
| **CI/CD** | GitHub Actions / Jenkins | Automated testing & deployment |

---

## Benefits of This Architecture

✅ **Scalability:** Scale individual services based on demand
✅ **Resilience:** One service failure doesn't bring down entire system
✅ **Technology Flexibility:** Each service can use different tech stacks
✅ **Team Autonomy:** Teams can work independently on different services
✅ **Faster Deployment:** Deploy services independently without full regression
✅ **Easy Monitoring:** Monitor individual service health
✅ **High Availability:** Implement redundancy per service
✅ **Cost Efficiency:** Pay for compute based on actual usage

---

## Challenges & Mitigation

| Challenge | Mitigation |
|-----------|-----------|
| **Complexity** | Good documentation, monitoring, alerting |
| **Network latency** | Batch API calls, use caching |
| **Debugging across services** | Distributed tracing (Jaeger/Zipkin) |
| **Data consistency** | Event-driven architecture, audit logs |
| **DevOps overhead** | Docker + Kubernetes, infrastructure as code |

---

## Next Steps

1. **Review this architecture** with the team
2. **Create individual service repositories** (or mono-repo with multiple services)
3. **Setup Docker Compose** for local development
4. **Extract Auth Service first** (lowest dependencies)
5. **Implement API Gateway** to route to new services
6. **Gradually migrate other services** following Phase 2-3 plan

---

## References
- [Microservices.io](https://microservices.io/)
- [Building Microservices - Sam Newman](https://www.oreilly.com/library/view/building-microservices/9781491950340/)
- [12 Factor App](https://12factor.net/)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
