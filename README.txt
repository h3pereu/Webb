# Auth Client Kit (Drop-In)

Copy these files into the *root* of your Vite React project (same level as App.jsx).
If you don't have folders like `pages`, `components`, `context`, create them.

Files:
- App.jsx
- vite.config.js (adds proxy for /api -> http://localhost:4000)
- /components/ProtectedRoute.jsx
- /components/Navbar.jsx
- /context/AuthContext.jsx
- /pages/Login.jsx
- /pages/Signup.jsx

## Steps
1) Copy files into your project (keep the folder structure).
2) Install React Router if you don't have it:
   npm i react-router-dom
3) Start a dev auth server (no native dependencies):
   - Download 'local-auth-server-json.zip' I provided earlier.
   - Unzip to 'server_json', then:
     cd server_json && npm i && npm run dev
   The server will run on http://localhost:4000
4) Start your app:
   npm run dev
   Open http://localhost:5173

## How to navigate
- /signup → create an account
- /login → log in
- /account and /search are protected
- Navbar shows login/logout + account

You can change which routes are protected in App.jsx by wrapping them in <ProtectedRoute>.
