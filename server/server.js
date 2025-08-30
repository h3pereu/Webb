import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// --- Simple JSON "DB" ---
const DB_PATH = path.join(__dirname, "users.json");
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")); } catch { return { users: [] }; }
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function findUser(email) {
  const db = readDB();
  return db.users.find(u => u.email === String(email).toLowerCase()) || null;
}
function findUserById(id) {
  const db = readDB();
  return db.users.find(u => u.id === id) || null;
}
function writeUser(u) {
  const db = readDB();
  const i = db.users.findIndex(x => x.id === u.id);
  if (i !== -1) { db.users[i] = u; writeDB(db); }
}
function publicUser(u) {
  return { id: u.id, email: u.email, display_name: u.display_name, avatar_url: u.avatar_url };
}

// --- Middleware ---
app.use(express.json());
app.use(cookieSession({
  name: "sid",
  signed: false,
  httpOnly: true,
  sameSite: "lax"
}));
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true
}));

function currentUser(req) {
  if (!req.session?.uid) return null;
  return findUserById(req.session.uid);
}

// --- Auth routes ---
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/me", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: publicUser(u) });
});

app.post("/api/signup", (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (findUser(email)) return res.status(409).json({ error: "Email already registered" });

  const id = String(Date.now());
  const password_hash = bcrypt.hashSync(password, 10);

  const user = {
    id,
    email: String(email).toLowerCase(),
    display_name: displayName || String(email).split("@")[0],
    password_hash,
    // profile
    avatar_url: "",
    bio: "",
    location: "",
    genres: [],
    links: { website: "", instagram: "", twitter: "" },
    // credits
    credits: 20
  };

  const db = readDB();
  db.users.push(user);
  writeDB(db);

  req.session.uid = user.id;
  res.status(201).json({ user: publicUser(user) });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const u = findUser(email);
  if (!u) return res.status(401).json({ error: "Invalid email or password" });
  if (!bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error: "Invalid email or password" });

  req.session.uid = u.id;
  res.json({ user: publicUser(u) });
});

app.post("/api/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// --- Profile routes ---
app.get("/api/profile", (req, res) => {
  if (!req.session?.uid) return res.status(401).json({ error: "Not authenticated" });
  const u = findUserById(req.session.uid);
  if (!u) return res.status(404).json({ error: "User not found" });

  res.json({ profile: {
    id: u.id,
    email: u.email,
    display_name: u.display_name,
    avatar_url: u.avatar_url || "",
    bio: u.bio || "",
    location: u.location || "",
    genres: u.genres || [],
    links: u.links || { website: "", instagram: "", twitter: "" }
  }});
});

app.put("/api/profile", (req, res) => {
  if (!req.session?.uid) return res.status(401).json({ error: "Not authenticated" });

  const { display_name, avatar_url, bio, location, genres, links } = req.body || {};
  const u = findUserById(req.session.uid);
  if (!u) return res.status(404).json({ error: "User not found" });

  if (typeof display_name === "string") u.display_name = display_name.trim().slice(0, 60);
  if (typeof avatar_url === "string") u.avatar_url = avatar_url.trim().slice(0, 500);
  if (typeof bio === "string") u.bio = bio.trim().slice(0, 600);
  if (typeof location === "string") u.location = location.trim().slice(0, 80);
  if (Array.isArray(genres)) u.genres = genres.map(g => String(g).trim()).filter(Boolean).slice(0, 12);
  if (links && typeof links === "object") {
    u.links = {
      website: links.website ? String(links.website).trim().slice(0, 200) : (u.links?.website || ""),
      instagram: links.instagram ? String(links.instagram).trim().slice(0, 200) : (u.links?.instagram || ""),
      twitter: links.twitter ? String(links.twitter).trim().slice(0, 200) : (u.links?.twitter || "")
    };
  }

  writeUser(u);

  res.json({ profile: {
    id: u.id, email: u.email, display_name: u.display_name,
    avatar_url: u.avatar_url || "", bio: u.bio || "", location: u.location || "",
    genres: u.genres || [], links: u.links || { website: "", instagram: "", twitter: "" }
  }});
});

// --- Credits routes ---
app.get("/api/credits", (req, res) => {
  if (!req.session?.uid) return res.status(401).json({ error: "Not authenticated" });
  const u = findUserById(req.session.uid);
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({ credits: typeof u.credits === "number" ? u.credits : 0 });
});

app.post("/api/credits/use", (req, res) => {
  if (!req.session?.uid) return res.status(401).json({ error: "Not authenticated" });
  const { amount } = req.body || {};
  const amt = Number(amount) || 1;
  if (amt <= 0) return res.status(400).json({ error: "Invalid amount" });

  const u = findUserById(req.session.uid);
  if (!u) return res.status(404).json({ error: "User not found" });
  const current = typeof u.credits === "number" ? u.credits : 0;
  if (current < amt) return res.status(402).json({ error: "Insufficient credits", credits: current });

  u.credits = current - amt;
  writeUser(u);
  res.json({ ok: true, credits: u.credits });
});

// dev-only grant
app.post("/api/credits/grant", (req, res) => {
  if (!req.session?.uid) return res.status(401).json({ error: "Not authenticated" });
  const { amount } = req.body || {};
  const amt = Math.max(0, Number(amount) || 0);
  const u = findUserById(req.session.uid);
  if (!u) return res.status(404).json({ error: "User not found" });
  u.credits = (typeof u.credits === "number" ? u.credits : 0) + amt;
  writeUser(u);
  res.json({ ok: true, credits: u.credits });
});

app.listen(PORT, () => {
  console.log(`Local auth server (JSON) running on http://localhost:${PORT}`);
});
