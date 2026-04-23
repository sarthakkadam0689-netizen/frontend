# SchemeChecker API — Documentation & Deployment Guide

## Base URL

```
Local:      http://localhost:5000/api
Production: https://your-app.onrender.com/api
```

---

## Authentication

All protected endpoints require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

You receive this token from `/api/auth/signup` or `/api/auth/login`.

---

## Response Format

All responses follow this structure:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... }
}
```

---

## Endpoints

### 1. POST `/api/auth/signup`

Create a new user account.

**Body (JSON)**:
```json
{
  "name": "Sarth Shah",
  "email": "sarth@example.com",
  "password": "mypassword123"
}
```

**Success Response `201`**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Sarth Shah", "email": "sarth@example.com" }
}
```

**Error Responses**:
- `400` — Missing fields / password too short
- `409` — Email already registered

---

### 2. POST `/api/auth/login`

Login with existing credentials.

**Body (JSON)**:
```json
{
  "email": "sarth@example.com",
  "password": "mypassword123"
}
```

**Success Response `200`**:
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Sarth Shah", "email": "sarth@example.com" }
}
```

**Error Responses**:
- `400` — Missing fields
- `401` — Invalid email or password

---

### 3. GET `/api/auth/profile` 🔒 Protected

Get the logged-in user's profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response `200`**:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Sarth Shah",
    "email": "sarth@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. POST `/api/bookmark/add` 🔒 Protected

Add a new bookmark.

**Headers**:
```
Authorization: Bearer <token>
```

**Body (JSON)**:
```json
{
  "schemeId": "pm-kisan",
  "title": "PM-Kisan Samman Nidhi",
  "description": "Annual ₹6000 support for farmers.",
  "link": "https://pmkisan.gov.in/",
  "category": "agriculture"
}
```

**Success Response `201`**:
```json
{
  "success": true,
  "message": "Scheme bookmarked successfully",
  "bookmark": { "_id": "...", "schemeId": "pm-kisan", "title": "...", ... }
}
```

**Error Responses**:
- `400` — Missing schemeId or title
- `409` — Already bookmarked

---

### 5. GET `/api/bookmark/all` 🔒 Protected

Get all bookmarks for the logged-in user.

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response `200`**:
```json
{
  "success": true,
  "count": 3,
  "bookmarks": [
    { "_id": "...", "schemeId": "pm-kisan", "title": "...", ... }
  ]
}
```

---

### 6. DELETE `/api/bookmark/remove/:id` 🔒 Protected

Remove a bookmark by its MongoDB `_id`.

**Headers**:
```
Authorization: Bearer <token>
```

**URL Example**:
```
DELETE /api/bookmark/remove/664f3a1b2a9e4d001c0f1234
```

**Success Response `200`**:
```json
{
  "success": true,
  "message": "Bookmark removed successfully"
}
```

**Error Responses**:
- `404` — Bookmark not found
- `403` — You don't own this bookmark

---

## Connecting from Frontend (Vanilla JS)

```javascript
const API = 'https://your-app.onrender.com/api'; // or localhost:5000

// ── Signup ──────────────────────────────────────────
async function signup(name, email, password) {
    const res = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.success) localStorage.setItem('token', data.token);
    return data;
}

// ── Login ───────────────────────────────────────────
async function login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) localStorage.setItem('token', data.token);
    return data;
}

// ── Helper: Auth Header ─────────────────────────────
function authHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

// ── Add Bookmark ────────────────────────────────────
async function addBookmark(scheme) {
    const res = await fetch(`${API}/bookmark/add`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
            schemeId: scheme.id,
            title: scheme.name.en,
            description: scheme.description.en,
            link: scheme.applyLink,
            category: scheme.category
        })
    });
    return await res.json();
}

// ── Get All Bookmarks ───────────────────────────────
async function getBookmarks() {
    const res = await fetch(`${API}/bookmark/all`, { headers: authHeader() });
    return await res.json();
}

// ── Remove Bookmark ─────────────────────────────────
async function removeBookmark(bookmarkId) {
    const res = await fetch(`${API}/bookmark/remove/${bookmarkId}`, {
        method: 'DELETE',
        headers: authHeader()
    });
    return await res.json();
}
```

---

## Deployment on Render (Free Tier)

### Step 1 — MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Create a **Free Cluster** (M0 Sandbox).
3. Under **Database Access** → Add a user with read/write permissions.
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — required for Render).
5. Click **Connect** → **Drivers** → copy the connection string, replacing `<password>` with your DB user's password.

---

### Step 2 — Push `backend/` to GitHub

Create a GitHub repository and push the `backend/` folder to it:

```bash
cd backend
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/your-username/schemechecker-backend.git
git push -u origin main
```

> [!IMPORTANT]
> Make sure `.env` is listed in your `.gitignore` — never push secrets!

---

### Step 3 — Deploy on Render

1. Go to [https://render.com](https://render.com) and sign in with GitHub.
2. Click **New → Web Service**.
3. Connect your `schemechecker-backend` repository.
4. Configure:
   | Setting | Value |
   |---|---|
   | **Root Directory** | _(leave blank if backend/ is repo root)_ |
   | **Environment** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |

5. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | `mongodb+srv://...` (your Atlas URI) |
   | `JWT_SECRET` | `any_long_random_string` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` |
   | `NODE_ENV` | `production` |

6. Click **Create Web Service** — Render will build and deploy automatically.

> [!TIP]
> Your API will be live at: `https://your-app-name.onrender.com`  
> Test it by visiting `https://your-app-name.onrender.com/` — you should see `{ "success": true, "message": "SchemeChecker API is running" }`

---

### Step 4 — Update Frontend CORS

Once deployed, update `FRONTEND_URL` in Render's environment variables to your exact Vercel/GitHub Pages domain so CORS lets your frontend through.

---

## Folder Structure Summary

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # signup, login, getProfile
│   └── bookmarkController.js  # add, getAll, remove
├── middleware/
│   └── authMiddleware.js      # JWT protect middleware
├── models/
│   ├── User.js                # User schema (bcrypt)
│   └── Bookmark.js            # Bookmark schema
├── routes/
│   ├── authRoutes.js          # /api/auth/*
│   └── bookmarkRoutes.js      # /api/bookmark/*
├── .env.example               # Sample env config
├── package.json
└── server.js                  # Express app entry point
```
