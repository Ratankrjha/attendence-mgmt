# Attendance Management System (MVP)

A full-stack attendance management system for colleges, with role-based access for
Teachers and Class Representatives (CRs).

## Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt password hashing

## Project structure

```
attendance-system/
├── backend/
│   ├── config/db.js
│   ├── controllers/       # auth + attendance business logic
│   ├── middleware/        # JWT auth guard, role guard, error handler
│   ├── models/            # User, Attendance
│   ├── routes/
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js       # axios instance with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   ├── pages/
    │   └── utils/rollNumbers.js
    └── vite.config.js
```

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env     # then edit MONGO_URI and JWT_SECRET
npm install
npm run dev               # nodemon on http://localhost:5000
```

You need a running MongoDB instance — either local (`mongodb://127.0.0.1:27017/attendance_system`)
or a free MongoDB Atlas cluster (recommended for deployment).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Optionally create `frontend/.env` with:

```
VITE_API_URL=http://localhost:5000/api
```

## How it works

- **Register/Login** — pick either `Teacher` or `CR` as the role at signup. Passwords are
  hashed with bcrypt; a JWT is issued on login/register and stored client-side, attached to
  every API call via an axios interceptor.
- **Teacher Dashboard** — V1 placeholder ("Teacher Module Coming Soon") with logout.
- **CR Dashboard** — links to Mark Attendance, Attendance History, and Profile.
- **Mark Attendance** — a 5-step flow (date → year → class → section → generate roster).
  The roster is pre-filled with roll numbers `1–100` plus `A0–A9` through `Z0–Z9`, and you can
  add any custom roll number. Every student defaults to `Present` and can be toggled to
  `Absent` or `Half Day`; the summary counts update live. Before saving, the app checks
  `/api/attendance/check` for an existing session on the same date/year/class/section and
  blocks duplicates (also enforced server-side via a unique compound index).
- **Attendance History** — filter by date, year, class, section, or roll number; open any
  record to view/print an A4-formatted report (present/absent/half-day roll lists + summary).
- **Profile** — view account details and change password.

## API overview

| Method | Route                          | Access        |
|--------|--------------------------------|---------------|
| POST   | /api/auth/register             | Public        |
| POST   | /api/auth/login                | Public        |
| GET    | /api/auth/profile               | Authenticated |
| PUT    | /api/auth/change-password       | Authenticated |
| GET    | /api/attendance/check           | Authenticated |
| GET    | /api/attendance                 | Authenticated |
| GET    | /api/attendance/:id             | Authenticated |
| POST   | /api/attendance                 | CR only       |
| PUT    | /api/attendance/:id             | CR only (future use) |
| DELETE | /api/attendance/:id             | CR only (future use) |

## Notes

- The frontend was verified with a clean `npm install && npm run build`.
- The backend was syntax-checked; you'll need a MongoDB connection string to run it live.
- `node_modules` are not included — run `npm install` in both `backend/` and `frontend/`.
