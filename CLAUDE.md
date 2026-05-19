# InvoicePro — Project Context for Claude

Multi-Tenant SaaS Invoice & Billing Management System (POC). Read this before asking any questions about the project.

---

## Repository Layout

```
d:\Project\Multi-Tenant-project\
├── server/                         # ASP.NET Core 8 — Clean Architecture
│   ├── InvoiceApp.Core/            # Entities, interfaces, DTOs, validators, constants
│   ├── InvoiceApp.Infrastructure/  # EF Core, repositories, services, background jobs
│   ├── InvoiceApp.API/             # Controllers, middleware, filters, Program.cs
│   └── InvoiceApp.Seed/            # One-shot seeder (run separately)
└── client/                         # React 18 + Vite SPA
    └── src/
        ├── app/store.js            # Redux store
        ├── features/               # auth, ui slices
        ├── services/               # RTK Query APIs (authApi, invoiceApi, clientApi, paymentApi, dashboardApi, adminApi)
        ├── components/             # common/, layout/, invoice/, client/
        └── pages/                  # dashboard, invoices, clients, admin, auth, public, misc
```

---

## Backend Stack

| Concern | Technology |
|---|---|
| Framework | ASP.NET Core 8 Web API |
| ORM | Entity Framework Core (SQL Server) |
| Auth | JWT Bearer (access: 15 min) + Refresh Token (7 d, httpOnly cookie) |
| PDF | `itext7.pdfhtml` → `HtmlConverter.ConvertToPdf` |
| Blob Storage | Azure Blob Storage (`Azure.Storage.Blobs`) — container: `invoices`, blobs stored as `{tenantId}/{InvoiceNumber}.pdf` |
| Payments | Stripe (`Stripe.net` 45.x) |
| Email | MailKit/SMTP (Gmail) |
| Background jobs | Hangfire (SQL Server storage) |
| Logging | Serilog → console + rolling file |
| Validation | FluentValidation (auto-validation filter) |
| Migrations | EF Core — run from `server/InvoiceApp.API/`: `dotnet ef migrations add <Name> --project "../InvoiceApp.Infrastructure"` |

**Run API:** `dotnet run` inside `server/InvoiceApp.API/` — loads `appsettings.Development.json` via `Properties/launchSettings.json` (sets `ASPNETCORE_ENVIRONMENT=Development`). API listens on `http://localhost:5000`.

---

## Frontend Stack

| Concern | Technology |
|---|---|
| Framework | React 18 + Vite |
| State | Redux Toolkit + RTK Query |
| Routing | React Router v6 |
| UI | Bootstrap 5.3 (CSS only) + Bootstrap Icons (`bi-*`) |
| Charts | Chart.js via `react-chartjs-2` |
| Notifications | `react-toastify` |
| HTTP | Axios (custom `axiosBaseQuery` with interceptors) |

**Run client:** `npm run dev` inside `client/` — listens on `http://localhost:5173`.

---

## Entities (InvoiceApp.Core/Entities)

All extend `BaseEntity` (Id: Guid, CreatedAt, UpdatedAt).

```
Tenant          — Name, Subdomain, Plan, IsActive, LogoUrl, PrimaryColor, MaxUsers
User            — TenantId?, Name, Email, PasswordHash, Role, IsActive, RefreshToken, RefreshTokenExpiry
Client          — TenantId, Name, Email, Phone, Address, City, Country, IsActive
Invoice         — TenantId, ClientId, InvoiceNumber, Status, IssueDate, DueDate,
                  SubTotal, TaxRate, TaxAmount, DiscountAmount, TotalAmount, Notes,
                  PdfBlobUrl, StripePaymentId, PaidAt, SentAt, RowVersion,
                  LineItems[], Payments[]
InvoiceLineItem — InvoiceId, Description, Quantity, UnitPrice, Amount
Payment         — TenantId, InvoiceId, Amount, Currency, Status, PaidAt,
                  PaymentMethod, StripePaymentIntentId, StripeChargeId
TaxRate         — TenantId, Name, Rate, IsDefault
```

**DbSets in AppDbContext:** `Tenants, Users, Clients, Invoices, InvoiceLineItems, Payments, TaxRates`

---

## Multi-Tenancy

1. **TenantMiddleware** — reads JWT on every request, populates `ITenantContext` (TenantId, UserId, UserRole)
2. **EF Global Query Filters** — `Client, Invoice, Payment, User, TaxRate` all filtered by `TenantId == _tenantContext.TenantId` unless `IsSuperAdmin`
3. **Auto TenantId on Save** — `AppDbContext.SaveChangesAsync` injects `_tenantContext.TenantId` into any `BaseEntity` with `TenantId == Guid.Empty`

> **Critical pattern:** Never use `.FindAsync(id)` after `.IgnoreQueryFilters()` — it returns `IQueryable`, not `DbSet`. Always use `.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == id)`.

---

## Roles & Authorization

```
SuperAdmin   — full platform access, Hangfire dashboard (/hangfire), no tenantId
TenantAdmin  — full access within own tenant (CRUD invoices, clients, users)
User         — read + create invoices/clients within own tenant
```

Route guard chain (React): `ProtectedRoute` (checks JWT + calls /me) → `RoleRoute` (checks role) → page.

> **Critical:** `ProtectedRoute` must check `!isInitialized` (not just `isLoading`) before rendering `<Outlet />`, otherwise `RoleRoute` sees `user=null` and redirects to `/unauthorized` on hard reload.

---

## Invoice Status Flow

`Draft` → `Sent` (email + PDF generated) → `Paid` (Stripe webhook) / `Overdue` (Hangfire job)
`Draft/Sent/Overdue` → `Cancelled` (TenantAdmin only)

InvoiceNumber format: `INV-{TENANTSHORT4}-{YEAR}-{SEQ:D4}`

---

## Stripe Integration

- **Payment link:** `POST /api/v1/invoices/{id}/payment-link` → creates `PaymentIntent`, returns URL `/pay/{invoiceId}?client_secret=...`
- **Webhook:** `POST /api/v1/payments/stripe/webhook` (raw body, `Stripe-Signature` header)
  - Handles `payment_intent.succeeded` → marks invoice Paid, creates Payment record
  - Handles `payment_intent.payment_failed` → creates failed Payment record
- **API version mismatch fix:** `EventUtility.ConstructEvent(..., throwOnApiVersionMismatch: false)` — Stripe.net 45.x expects `2024-06-20` but CLI sends `2024-11-20.acacia`

Config keys: `Stripe:SecretKey`, `Stripe:WebhookSecret`, `Stripe:Currency`

---

## PDF Generation

`PdfService.GenerateInvoicePdfAsync` uses `iText.Html2pdf.HtmlConverter.ConvertToPdf`.

> **Critical:** Use explicit `using(var writer = ...) using(var pdf = ...)` blocks — NOT `using var`. The PDF trailer/xref must be flushed to `MemoryStream` before `ms.ToArray()` is called. `MemoryStream.ToArray()` works after the stream is closed.

---

## Namespace Collision — InvoiceService

Stripe SDK exports `Invoice` and `InvoiceLineItem` which clash with Core entities. Fixed with aliases:
```csharp
using CoreInvoice = InvoiceApp.Core.Entities.Invoice;
using CoreInvoiceLineItem = InvoiceApp.Core.Entities.InvoiceLineItem;
```

---

## Key Config Files

| File | Purpose |
|---|---|
| `server/InvoiceApp.API/appsettings.json` | Placeholders only — **never real secrets** |
| `server/InvoiceApp.API/appsettings.Development.json` | Real secrets (gitignored) |
| `server/InvoiceApp.API/Properties/launchSettings.json` | Sets `ASPNETCORE_ENVIRONMENT=Development` for `dotnet run` |
| `server/InvoiceApp.Seed/appsettings.Development.json` | Connection string for seeder (gitignored) |
| `client/.env` | `VITE_API_URL=http://localhost:5000` (gitignored) |

---

## Seeded Test Accounts

| Role | Email | Password |
|---|---|---|
| SuperAdmin | superadmin@invoiceapp.com | Admin@123456 |
| TenantAdmin (TechCorp) | admin@techcorp.com | Admin@123456 |
| User (TechCorp) | user1@techcorp.com | User@123456 |
| TenantAdmin (BlueSky) | admin@bluesky.com | Admin@123456 |

---

## Frontend State Shape

```
Redux store:
  auth:   { user, accessToken, isAuthenticated, isInitialized }
  ui:     { sidebarOpen, sidebarCollapsed }
  + RTK Query slices: authApi, invoiceApi, clientApi, paymentApi, dashboardApi, adminApi
```

`accessToken` persisted in `localStorage`. Refresh token is httpOnly cookie — auto-sent by browser.

---

## API Base Routes

```
POST   /api/v1/auth/register|login|refresh|logout|me
GET    /api/v1/invoices           (paginated: page, limit, status, clientId, search, sort, dateFrom, dateTo)
GET    /api/v1/invoices/{id}/pdf
POST   /api/v1/invoices/{id}/payment-link
GET    /api/v1/clients
GET    /api/v1/dashboard/stats|revenue-chart|invoice-status-chart|top-clients|recent-invoices|overdue-alerts
GET    /api/v1/payments
POST   /api/v1/payments/stripe/webhook
GET    /api/v1/admin/tenants|users|stats|activity
GET    /api/v1/tenant/users
```

---

## Common Edit Locations (skip exploration — go straight here)

| Task | File(s) |
|---|---|
| **Add / edit API endpoint** | `server/InvoiceApp.API/Controllers/<Entity>Controller.cs` |
| **Add / edit service logic** | `server/InvoiceApp.Infrastructure/Services/<Entity>Service.cs` |
| **Add repository method** | `server/InvoiceApp.Infrastructure/Repositories/<Entity>Repository.cs` |
| **Add interface** | `server/InvoiceApp.Core/Interfaces/Services/` or `Interfaces/Repositories/` |
| **Add DTO** | `server/InvoiceApp.Core/DTOs/<Entity>/` (subfolders: Auth, Client, Common, Dashboard, Invoice, User) |
| **Add / edit validator** | `server/InvoiceApp.Core/Validators/<Name>Validator.cs` |
| **Wire up DI / middleware** | `server/InvoiceApp.API/Program.cs` |
| **Edit RTK Query service** | `client/src/services/<entity>Api.js` (authApi, invoiceApi, clientApi, paymentApi, dashboardApi, adminApi, tenantApi) |
| **Edit Redux slice** | `client/src/features/auth/authSlice.js` or `features/ui/uiSlice.js` |
| **Add / edit page** | `client/src/pages/<section>/` → register route in `client/src/App.jsx` |
| **Add sidebar nav item** | `client/src/components/layout/Sidebar.jsx` |
| **Add shared UI component** | `client/src/components/common/` |
| **Edit invoice / client components** | `client/src/components/invoice/` or `components/client/` |
| **Redux store wiring** | `client/src/app/store.js` |
| **DB schema change** | `dotnet ef migrations add <Name> --project "../InvoiceApp.Infrastructure"` (run from `server/InvoiceApp.API/`) |

---

## Known Gotchas

1. **`IgnoreQueryFilters()` + `FindAsync`** → use `FirstOrDefaultAsync(x => x.Id == id)` instead
2. **Stripe webhook 400** → `throwOnApiVersionMismatch: false` in `EventUtility.ConstructEvent`
3. **PDF 500** → explicit `using` blocks, not `using var`, in `PdfService`
4. **Hard reload → /unauthorized** → `ProtectedRoute` must gate on `!isInitialized`, not just `isLoading`
5. **Bootstrap dropdowns** → Bootstrap JS not imported; all dropdowns are React-state-controlled (`useState` + click-outside `useEffect`)
6. **Hangfire auth** → uses `IHttpContextAccessor` (not `DashboardContext.GetHttpContext()`)
7. **Sidebar collapse** → toggled from both navbar hamburger and sidebar "Collapse sidebar" button via `toggleSidebarCollapsed` Redux action
8. **`overdue-alerts` 403** → endpoint is restricted to TenantAdmin/User; SuperAdmin gets 403 (expected)
