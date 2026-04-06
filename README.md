# Finance Data Processing and Access Control — Full Stack

A full-stack finance dashboard application with role-based access control, built with a Node.js/Express backend and React/Vite frontend.

## Project Overview

- **Backend** — RESTful API with JWT authentication, RBAC middleware, financial record management, and analytics dashboard
- **Frontend** — Modern React SPA with Tailwind CSS, Recharts analytics, responsive sidebar layout, and role-gated routing

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend Runtime** | Node.js + Express |
| **Database** | SQLite (better-sqlite3) with WAL mode |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **Frontend** | React 19 + Vite |
| **Styling** | Tailwind CSS v4 |
| **Charts** | Recharts |
| **HTTP Client** | Axios |
| **Routing** | React Router v6 |

## Setup Instructions

### Backend

```bash
cd backend
npm install
# Create .env file (already provided with defaults)
npm run dev    # Development with nodemon
npm start      # Production
```

Backend runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:3000`.

> **Note:** Start the backend first, then the frontend.

## Assumptions

- JWT is used for authentication; tokens expire after 24 hours
- SQLite is chosen for simplicity — no external database server needed
- Soft delete is implemented for financial records (preserves data integrity)
- Roles are `viewer`, `analyst`, and `admin` — selectable at registration
- WAL mode is enabled for better concurrent read performance
- Passwords are hashed with bcryptjs (salt factor 10)
- Frontend stores JWT in localStorage for simplicity

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login and receive JWT + user object |

### User Management (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | ✅ | List all users (no password field) |
| PATCH | `/api/users/:id/role` | ✅ | Update user role |
| PATCH | `/api/users/:id/status` | ✅ | Activate / deactivate user |

### Financial Records

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/records` | ✅ | All | List records (filters + pagination) |
| POST | `/api/records` | ✅ | Admin | Create record |
| PUT | `/api/records/:id` | ✅ | Admin | Update record |
| DELETE | `/api/records/:id` | ✅ | Admin | Soft-delete record |

### Dashboard (Analyst + Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/summary` | ✅ | Financial summary with charts data |

## Role Permissions

| Feature | Viewer | Analyst | Admin |
|---------|--------|---------|-------|
| Register / Login | ✅ | ✅ | ✅ |
| View financial records | ✅ | ✅ | ✅ |
| Create / Edit / Delete records | ❌ | ❌ | ✅ |
| View dashboard summary | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## Project Structure

```
finance-app/
├── backend/
│   ├── src/
│   │   ├── config/database.js         # SQLite init, WAL, table creation
│   │   ├── middleware/auth.js         # JWT Bearer token verification
│   │   ├── middleware/rbac.js         # Role-based authorization
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     # Register + Login
│   │   │   ├── users.controller.js    # User management
│   │   │   ├── records.controller.js  # Financial records CRUD
│   │   │   └── dashboard.controller.js # Analytics queries
│   │   ├── routes/                    # Express route definitions
│   │   └── app.js                     # Express entry point
│   ├── .env                           # PORT + JWT_SECRET
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/axios.js               # Axios instance + auth interceptor
│   │   ├── context/AuthContext.jsx     # Auth state + localStorage
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top bar with user info + logout
│   │   │   ├── Sidebar.jsx            # Navigation sidebar (responsive)
│   │   │   └── ProtectedRoute.jsx     # Auth + role gate wrapper
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Login form
│   │   │   ├── Register.jsx           # Registration form
│   │   │   ├── Dashboard.jsx          # Summary cards + charts
│   │   │   ├── Records.jsx            # CRUD table with filters
│   │   │   └── Users.jsx              # Admin user management
│   │   ├── App.jsx                    # Root layout + routing
│   │   └── main.jsx                   # React entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```
