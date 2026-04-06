# Finance Data Processing & Access Control Backend

## Overview
This is a robust, secure, and production-grade Node.js/Express backend service designed to manage financial data entries, user authentication, strict Role-Based Access Control (RBAC), and aggregated dashboard analytics. 

It was built specifically to demonstrate clean architectural thinking, separation of concerns, and reliable validation.

## ✨ Features & Capabilities

- **Strict Role-Based Access Control (RBAC)**: Supports `viewer`, `analyst`, and `admin` roles, strictly enforced via isolated middleware.
- **Financial Record Management**: Full CRUD operations for financial records with support for filtering by date, type, and category.
- **Aggregated Analytics**: A dedicated `/summary` endpoint that efficiently groups data to calculate Total Income, Total Expenses, Net Balance, and Monthly Trends in a single database round-trip.
- **"Bulletproof" Validation**: All inbound HTTP requests are parsed and strictly validated against Zod schemas. Bad inputs fail early with clean, human-readable 400 structures.
- **Security-First Authentication**: JWTs are transmitted exclusively via `HttpOnly`, `Secure`, `SameSite` cookies to drastically mitigate XSS attack vectors.
- **CSRF & Brute Force Protection**: Endpoints are shielded by Origin/Referer CSRF validation, and authentication endpoints are throttled using `express-rate-limit`.
- **Database Modularity**: Powered by `better-sqlite3` for high-performance synchronous queries, modeling relational constraints cleanly.

---

## 🏗️ Architecture & Backend Design

The application follows the classic **MVC (Model-View-Controller) / Service Router Layer** pattern for separation of concerns:

- **/routes**: Registers URL paths and applies relevant middleware (Authentication, Validation, Authorization).
- **/controllers**: Extracts request parameters, executes core business logic, and formats the API JSON responses.
- **/middleware**: Reusable isolated logic gates (e.g., `validate.js` for Zod checking, `auth.js` for JWT parsing and RBAC bounds).
- **/config**: Database initialization, schema definition, and environment setups.

---

## 🚀 Setup & Execution 

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone this repository and navigate to the backend directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables based on the template:
   ```bash
   cp .env.example .env
   ```
   *(Ensure you run the crypto generator below to get a highly secure `JWT_SECRET`)*

### Starting the Server
**For Development:**
```bash
npm run dev
```

**For Testing:**
100% test coverage path covering logic loops, RBAC, and bad permutations.
```bash
npm test
```

---

## 📖 API Documentation (Swagger)
Interactive API documentation is generated actively according to the OpenAPI 3.0.0 specification.
When the server is booted locally, you can view, interact with, and test all backend route patterns by visiting:
**`http://localhost:3000/api-docs`**

---

## 🧠 Tradeoffs & Assumptions

1. **Database Selection (SQLite vs PostgreSQL):** Node's synchronous `better-sqlite3` package was chosen for this assessment over a heavy relational DB like PostgreSQL. Because it runs embedded in the same process, it massively simplifies local development and assessment review without sacrificing SQL integrity (Foreign keys and constraints exist in DB init).
2. **Numeric Precision (IEEE 754 vs Decimal Types):** Standard JavaScript Numbers (binary floating-point approximations) were used to maintain an extremely lightweight dependency tree for the assessment. In a true enterprise-grade scenario handling large volume compliance ledgers, standard floats pose a precision loss risk, and a library like `Decimal.js` (paired with PostgreSQL `NUMERIC` columns) would be strictly mandated.
3. **TypeScript vs JavaScript:** Pure JavaScript was used to keep the codebase universally readable and lean. To regain the type-safety typical of TypeScript, robust **Zod schema validations** were layered onto the request cycle guaranteeing runtime type-safety at all network boundaries.
4. **Session Store vs JWT:** While stateful sessions (Redis) allow instantaneous remote logout, stateless JWTs were used for horizontal scalability. To counteract JWT XSS-vulnerabilities, they are securely locked behind non-extractable `HttpOnly` Set-Cookies.

---

## 🌟 Additional Thoughtfulness (Bonus Polish)

To prove application depth beyond the immediate constraints, several supplementary modules were designed into the core system:
- **Audit Logging System**: The database automatically tracks intrusive admin actions (like deleting records or altering roles) into a hidden `audit_logs` table accessible only to super-admins for compliance monitoring.
- **Node-Cron Jobs**: Added a background worker executing at server-midnight `0 0 * * *` that reads a `recurring_transactions` table to autonomously inject recurring salaries or subscriptions into the ledger.
- **Budget Tracking**: A logic branch within the dashboard aggregation endpoint evaluates the user's spending mapped against active category budgets explicitly.
