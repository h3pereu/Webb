# Local Auth Server (No native deps)

Pure JS (JSON file) — works on Windows with Node 22 without Visual Studio.
- Stores users in `users.json`
- Passwords hashed with bcryptjs
- HTTP-only cookie session

## Run
```bash
cd server_json
npm i
npm run dev
```
Then browse your app at http://localhost:5173
