# e-Nagar Suraksha 🏙️

**Public Complaint Reporting & Tracking System** — A production-ready civic platform for citizens, police officers, municipal officers, and administrators.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18.x
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Backend Environment

```bash
cp backend/.env.example backend/.env
# Edit MONGO_URI and JWT_SECRET in backend/.env
```

The backend `.env` file is already pre-configured for local development. For production, **change `JWT_SECRET`**.

### 3. Seed the Database

```bash
cd backend && npm run seed
```

### 4. Run the Application

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Health check**: http://localhost:5000/api/health

---

## 🔑 Sample Login Credentials

| Role              | Email                         | Password        |
|-------------------|-------------------------------|-----------------|
| Admin             | admin@enagar.gov.in           | Admin@1234      |
| Police Officer    | police@enagar.gov.in          | Police@1234     |
| Municipal Officer | municipal@enagar.gov.in       | Municipal@1234  |
| Citizen 1         | citizen1@example.com          | Citizen@1234    |
| Citizen 2         | citizen2@example.com          | Citizen@1234    |

> 💡 The login page includes **quick-fill demo buttons** for all roles.

---

## 📁 Project Structure

```
e-nagar-suraksha/
├── backend/
│   ├── config/         # DB, Multer, Socket.io setup
│   ├── controllers/    # Auth, Users, Complaints, Admin, Departments, Notifications
│   ├── middleware/     # JWT auth, role guards, rate limiters, validators, error handler
│   ├── models/         # User, Complaint, Department, Notification, AuditLog
│   ├── routes/         # Express route definitions
│   ├── seed/           # Database seeder
│   ├── services/       # Notification service, Escalation cron job
│   ├── utils/          # Logger, complaintId generator, SLA calc, duplicate detection
│   ├── uploads/        # Complaint photos & resolution proofs
│   ├── logs/           # Winston log files
│   ├── server.js       # Entry point
│   └── .env.example
└── frontend/
    └── src/
        ├── components/ # Navbar, Sidebar, MapPicker, StatusBadge, LoadingSpinner
        ├── context/    # AuthContext, SocketContext, NotificationContext
        ├── layouts/    # DashboardLayout
        ├── pages/
        │   ├── public/    # LandingPage, TrackById
        │   ├── auth/      # LoginPage, RegisterPage
        │   ├── citizen/   # Dashboard, SubmitComplaint, MyComplaints, ComplaintDetail
        │   ├── police/    # Dashboard, ComplaintList, ComplaintDetail
        │   ├── municipal/ # Dashboard, ComplaintList
        │   └── admin/     # Dashboard, Analytics, Users, Complaints, Departments, AuditLogs
        ├── services/   # Axios API with all endpoints
        └── utils/      # i18n + EN/HI/TE translations
```

---

## 🌟 Key Features

| Feature | Details |
|---|---|
| **Role-Based Auth** | Citizen / Police / Municipal / Admin — strict JWT guards |
| **Complaint Lifecycle** | 9 statuses: Draft → Submitted → Assigned → In Progress → Resolved → Closed |
| **Smart Duplicate Detection** | Geospatial 500m radius check using MongoDB 2dsphere index |
| **SLA Tracking** | Security=4h, Road=24h, Garbage=72h, Sanitation=168h |
| **Auto Escalation** | Cron job every 30 min escalates SLA-breached complaints |
| **Real-time Updates** | Socket.io events for assignments, status changes, escalations |
| **Map Integration** | Leaflet.js + OpenStreetMap (100% free, no API key needed) |
| **Reverse Geocoding** | Nominatim (free, no API key) |
| **Proof of Resolution** | Officers upload photos; citizens confirm or reopen |
| **Feedback System** | 1–5 star rating with optional comment; avg shown in analytics |
| **Multi-language** | English · हिंदी · తెలుగు (i18n with language switcher) |
| **PWA Ready** | Web app manifest, installable on mobile |
| **Audit Logging** | Every admin action logged with actor, target, IP, timestamp |

---

## 📡 API Reference

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any auth |
| GET | `/api/complaints/search?complaintId=` | Public |
| POST | `/api/complaints` | Citizen |
| GET | `/api/complaints/my` | Citizen |
| GET | `/api/complaints/all` | Officer/Admin |
| PUT | `/api/complaints/:id/update-status` | Officer/Admin |
| POST | `/api/complaints/:id/assign` | Admin |
| POST | `/api/complaints/:id/proof` | Officer/Admin |
| POST | `/api/complaints/:id/feedback` | Citizen |
| POST | `/api/complaints/:id/reopen` | Citizen |
| GET | `/api/admin/dashboard` | Admin |
| GET | `/api/admin/analytics` | Admin |
| GET | `/api/admin/audit-logs` | Admin |
| GET | `/api/users` | Admin |
| POST | `/api/users/create-officer` | Admin |
| PUT | `/api/users/:id/block` | Admin |
| GET | `/api/departments` | Any auth |
| GET | `/api/notifications/my` | Any auth |

---

## 🔒 Security Features

- **Helmet** for HTTP security headers
- **CORS** restricted to frontend origin
- **Rate limiting**: Global (100 req/15m), Login (10/15m), Complaint submission (5/day per user)
- **Input sanitation**: `express-mongo-sanitize` prevents NoSQL injection
- **Password hashing**: bcrypt with 12 salt rounds
- **JWT Auth**: All private routes gated
- **Blocked user detection**: Middleware denies access to blocked accounts
- **File validation**: Only jpeg/png/webp allowed, max 5MB
- **No stack traces in production**: Centralized error handler

---

## 🌍 Production Deployment Notes

1. Set `NODE_ENV=production` in backend `.env`
2. Change `JWT_SECRET` to a cryptographically random 64+ char string
3. Set `MONGO_URI` to your Atlas connection string
4. Set `FRONTEND_URL` to your actual domain
5. Use a reverse proxy (Nginx) in front of the Node.js server
6. Serve uploaded files via CDN or cloud storage for scale
7. Use PM2 for process management: `pm2 start server.js --name enagar-backend`

---

## 🤝 Roles & Permissions Summary

| Action | Citizen | Police | Municipal | Admin |
|--------|---------|--------|-----------|-------|
| Register | ✅ | ❌ | ❌ | ❌ |
| Submit Complaint | ✅ | ❌ | ❌ | ❌ |
| View Own Complaints | ✅ | – | – | ✅ |
| View Dept Complaints | – | ✅ | ✅ | ✅ |
| Update Status | ❌ | ✅ | ✅ | ✅ |
| Assign Complaint | ❌ | ❌ | ❌ | ✅ |
| Upload Resolution | ❌ | ✅ | ✅ | ✅ |
| Confirm/Reopen | ✅ | ❌ | ❌ | ❌ |
| Submit Feedback | ✅ | ❌ | ❌ | ❌ |
| Create Officers | ❌ | ❌ | ❌ | ✅ |
| Block Users | ❌ | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
