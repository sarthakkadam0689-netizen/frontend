# 🏛️ SchemeChecker

> A unified portal for 150+ Indian government schemes — featuring multilingual support, eligibility checker, and user bookmarks.

---

## 📁 Project Structure

```
SchemeChecker_v2/
│
├── frontend/                  ← Static site (deploy to Vercel)
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js            ← localStorage auth system
│   │   ├── app.js             ← Navigation & language switcher
│   │   ├── listing.js         ← Scheme card renderer
│   │   ├── schemesData.js     ← All 150 schemes (data source)
│   │   ├── i18n.js            ← EN / HI / MR translations
│   │   └── saved.js           ← Saved page logic
│   ├── translations/          ← Language JSON files
│   ├── index.html             ← Home page
│   ├── login.html             ← Login page
│   ├── signup.html            ← Signup page
│   ├── schemes.html           ← Browse all schemes
│   ├── saved.html             ← Saved bookmarks (auth-protected)
│   ├── scheme-details.html    ← Scheme detail view
│   ├── auth.html              ← Combined login/signup (legacy)
│   └── vercel.json            ← Vercel routing config
│
├── backend/                  ← Node.js REST API (deploy to Render)
│   ├── config/
│   │   └── db.js             ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── bookmarkController.js
│   ├── middleware/
│   │   └── authMiddleware.js ← JWT protection
│   ├── models/
│   │   ├── User.js
│   │   └── Bookmark.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── bookmarkRoutes.js
│   ├── server.js             ← Express entry point
│   ├── .env.example          ← Sample environment config
│   ├── API_DOCS.md           ← Full API documentation
│   └── package.json
│
├── .gitignore                ← Excludes node_modules, .env
└── README.md                 ← This file
```

---

## 🚀 Deployment Guide

### Part 1 — Frontend on Vercel (Free)

**Step 1: Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit — SchemeChecker"
```

Create a new repo at https://github.com/new, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/schemechecker.git
git branch -M main
git push -u origin main
```

**Step 2: Deploy Frontend on Vercel**

1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **"Add New Project"**
3. Select your `schemechecker` repository
4. Set **Root Directory** to `frontend`
5. **Framework Preset**: Other
6. Click **Deploy** ✅

> Vercel reads `frontend/vercel.json` automatically and sets up clean URLs:
> `/login` instead of `/login.html`, etc.

**Clean URLs after deploy:**

| Page | URL |
|---|---|
| Home | `https://your-app.vercel.app/` |
| Login | `https://your-app.vercel.app/login` |
| Signup | `https://your-app.vercel.app/signup` |
| Schemes | `https://your-app.vercel.app/schemes` |
| Saved | `https://your-app.vercel.app/saved` |

---

### Part 2 — Backend on Render (Free)

**Step 1: Create a MongoDB Atlas cluster**

1. Go to https://cloud.mongodb.com → Create free account
2. Create a **Free M0 cluster**
3. Add a **Database User** (username + password)
4. Under **Network Access** → Allow `0.0.0.0/0`
5. Click **Connect → Drivers** → copy the URI string

**Step 2: Set up `.env`**

```bash
cd backend
cp .env.example .env
# Edit .env and paste your MongoDB URI
```

**Step 3: Deploy Backend on Render**

1. Go to **https://render.com** → Sign in with GitHub
2. Click **New → Web Service**
3. Connect to your GitHub repository
4. Configure:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |

5. Add environment variables:

| Key | Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas URI |
| `JWT_SECRET` | Any long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Your Vercel URL |
| `NODE_ENV` | `production` |

6. Click **Create Web Service** — live in ~2 minutes ✅

---

## 🔧 Running Locally

**Frontend:**
```bash
cd frontend
npx serve . --listen 3000
# Open http://localhost:3000
```

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in your MONGO_URI
npm install
npm run dev            # starts with nodemon
# API running at http://localhost:5000
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Auth (frontend) | localStorage |
| Data | Static JS data file (150+ schemes) |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth (backend) | JWT + bcryptjs |
| Deploy (frontend) | Vercel |
| Deploy (backend) | Render |

---

## 📝 API Endpoints

See [`backend/API_DOCS.md`](./backend/API_DOCS.md) for full docs.

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/signup` | ❌ |
| POST | `/api/auth/login` | ❌ |
| GET | `/api/auth/profile` | ✅ JWT |
| POST | `/api/bookmark/add` | ✅ JWT |
| GET | `/api/bookmark/all` | ✅ JWT |
| DELETE | `/api/bookmark/remove/:id` | ✅ JWT |
