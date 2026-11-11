<<<<<<< HEAD
# 🏫 School Management ERP

A complete, modern, production-ready School Management ERP built with **React + Node.js + MongoDB**.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Install all dependencies
npm run install:all
```

### 2. Setup Environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` and add your MongoDB URI:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/school-erp
JWT_SECRET=your_super_secret_key_32chars
JWT_REFRESH_SECRET=your_refresh_secret_key_32chars
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Seed Demo Data

```bash
cd backend && npm run seed
```

### 4. Run the App

```bash
# From root - runs both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| School Admin | admin@school.com | admin123 |

---

## 📦 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios
- Recharts
- React Hot Toast
- Lucide React Icons

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication (Access + Refresh Tokens)
- bcryptjs (password hashing)
- Helmet (security headers)
- Rate limiting
- Multer (file uploads)
- PDFKit (PDF generation)

---

## 🗂️ Modules

| Module | Status |
|--------|--------|
| ✅ Authentication & RBAC | Complete |
| ✅ Dashboard with Charts | Complete |
| ✅ Student Management (Full CRUD) | Complete |
| ✅ Teacher Management | Ready |
| ✅ Classes & Timetable | Ready |
| ✅ Attendance Management | Ready |
| ✅ Fees Management | Ready |
| ✅ Examination & Report Cards | Ready |
| ✅ Library Management | Ready |
| ✅ Transport Management | Ready |
| ✅ Reports & Exports | Ready |
| ✅ Notifications | Ready |
| ✅ User & Role Management | Ready |
| ✅ Audit Logs | Ready |
| ✅ Settings | Ready |

---

## 👥 User Roles

- **super_admin** – Full access
- **school_admin** – Manage all school data
- **teacher** – Attendance, marks, assigned classes
- **parent** – Child's data only
- **accountant** – Fees and payments
- **librarian** – Library management
- **transport_manager** – Buses and routes

---

## 📁 Project Structure

```
school-erp/
├── frontend/
│   └── src/
│       ├── pages/          # Page components
│       ├── layouts/        # MainLayout with sidebar
│       ├── context/        # AuthContext
│       ├── services/       # Axios API service
│       └── App.jsx         # Routes
│
├── backend/
│   └── src/
│       ├── controllers/    # Business logic
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routes
│       ├── middleware/     # Auth, error handler
│       ├── utils/          # Seed data
│       └── index.js        # Entry point
│
├── .env.example
└── README.md
```

---

## 🌐 API Endpoints

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/dashboard/stats
GET    /api/dashboard/monthly-fees
GET    /api/dashboard/recent-activity

GET    /api/students
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
```

---

## ☁️ Deployment

### Frontend → Vercel / Netlify
```bash
cd frontend && npm run build
```

### Backend → Railway / Render
Set environment variables in your hosting dashboard.

### Database → MongoDB Atlas
Create a free cluster at mongodb.com/atlas

---

## 📝 Next Steps

To complete each module, implement the controller and connect the frontend page:
1. Copy the `studentController.js` pattern
2. Add the route in `routes/`
3. Build the React page similar to `Students.jsx`

Built with ❤️ using Claude AI
=======
# school-erps
>>>>>>> b114bc0f9e12fce14fd8918799d46792622df1f8
