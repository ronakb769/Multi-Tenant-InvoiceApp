# InvoicePro — Multi-Tenant SaaS Invoice & Billing Management

A complete, production-ready multi-tenant invoicing platform built with ASP.NET Core 8 + React 18.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React 18 Client                          │
│   Redux Toolkit (RTK Query) · Bootstrap 5.3 · Chart.js          │
│   React Hook Form · Stripe Elements · React Router v6           │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP / JWT Bearer
┌─────────────────────────▼───────────────────────────────────────┐
│                  ASP.NET Core 8 Web API                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ TenantMiddle-│  │ JWT Auth     │  │ Error Handling      │  │
│  │ ware         │  │ + RBAC       │  │ Middleware          │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
│                                                                 │
│  Controllers → Services → Repositories → EF Core 8             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Hangfire     │  │ MailKit SMTP │  │ Stripe .NET SDK     │  │
│  │ (Cron jobs)  │  │ (Emails)     │  │ (Payments)          │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           SQL Server (Multi-Tenant via EF Filters)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Strategy
- **Single database** with Global Query Filters on all tenant-scoped entities
- `TenantMiddleware` extracts `TenantId` from JWT claims before every request
- EF Core automatically scopes all queries to the current tenant
- SuperAdmin bypasses filters via `IsSuperAdmin` flag

---

## Setup Instructions

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server 2019+ (or Docker)

### Backend Setup

```bash
cd server

# Restore packages
dotnet restore

# Apply migrations
cd InvoiceApp.API
dotnet ef database update

# Run the API
dotnet run
# API runs at http://localhost:5000
# Swagger UI at http://localhost:5000/swagger
```

### Seed Database

```bash
cd server/InvoiceApp.Seed
dotnet run
```

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
# App runs at http://localhost:5173
```

### Configure Environment

**Server** — edit `server/InvoiceApp.API/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=InvoiceAppDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Stripe": {
    "SecretKey": "sk_test_...",
    "WebhookSecret": "whsec_..."
  },
  "Email": {
    "Username": "your@gmail.com",
    "Password": "your_app_password"
  }
}
```

**Client** — edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | superadmin@invoiceapp.com | SuperAdmin@1234 |
| TenantAdmin (TechCorp) | admin@techcorp.com | Admin@1234 |
| User (TechCorp) | user1@techcorp.com | User@1234 |
| User (TechCorp) | user2@techcorp.com | User@1234 |
| TenantAdmin (Creative Studio) | admin@creativestudio.com | Admin@1234 |
| User (Creative Studio) | user1@creativestudio.com | User@1234 |

---

## Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Payment succeeds |
| 4000 0000 0000 0002 | Card declined |
| 4000 0025 0000 3155 | Requires authentication |

Use any future expiry date and any 3-digit CVC.

---

## API Endpoints

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PUT    /api/v1/auth/me/profile
PUT    /api/v1/auth/me/password
GET    /api/v1/tenant/check-subdomain
```

### Invoices
```
GET    /api/v1/invoices
GET    /api/v1/invoices/:id
POST   /api/v1/invoices
PUT    /api/v1/invoices/:id
DELETE /api/v1/invoices/:id
PATCH  /api/v1/invoices/:id/send
PATCH  /api/v1/invoices/:id/cancel
GET    /api/v1/invoices/:id/pdf
POST   /api/v1/invoices/:id/payment-link
GET    /api/v1/invoices/stats/summary
GET    /api/v1/invoices/stats/monthly
```

### Clients
```
GET    /api/v1/clients
GET    /api/v1/clients/:id
POST   /api/v1/clients
PUT    /api/v1/clients/:id
DELETE /api/v1/clients/:id
GET    /api/v1/clients/:id/invoices
```

### Payments
```
GET    /api/v1/payments
GET    /api/v1/payments/:invoiceId
POST   /api/v1/payments/stripe/webhook
```

### Dashboard
```
GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/revenue-chart
GET    /api/v1/dashboard/invoice-status-chart
GET    /api/v1/dashboard/top-clients
GET    /api/v1/dashboard/recent-invoices
GET    /api/v1/dashboard/overdue-alerts
```

### Admin (SuperAdmin only)
```
GET    /api/v1/admin/stats
GET    /api/v1/admin/tenants
GET    /api/v1/admin/tenants/:tenantId
PATCH  /api/v1/admin/tenants/:tenantId/status
PATCH  /api/v1/admin/tenants/:tenantId/plan
GET    /api/v1/admin/users
GET    /api/v1/admin/platform-revenue
```

---

## Key Features

- **Multi-tenancy** — complete data isolation between tenants via EF Core global query filters
- **JWT Auth** — 15-minute access tokens + 7-day refresh tokens stored in httpOnly cookies
- **Stripe Payments** — full payment intent flow with webhook handling
- **PDF Generation** — server-side invoice PDFs via iText7 HTML-to-PDF
- **Email** — MailKit SMTP for invoice delivery
- **Background Jobs** — Hangfire daily cron for overdue invoice detection
- **Role-Based Access** — SuperAdmin / TenantAdmin / User with fine-grained permissions
- **Concurrency** — RowVersion optimistic concurrency on User and Invoice entities
- **Structured Logging** — Serilog to console + rolling file
- **FluentValidation** — automatic validation filter on all endpoints

---

## Running Stripe Webhooks Locally

```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to localhost:5000/api/v1/payments/stripe/webhook
```

Copy the webhook signing secret from the CLI output to `appsettings.Development.json`.
