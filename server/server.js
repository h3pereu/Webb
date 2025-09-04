import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =========================
   Setup
   ========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

/** Kolik kreditů dáme zdarma (signup i měsíční bonus) */
const FREE_CREDITS = Number(process.env.MONTHLY_CREDITS || 10);
/** Po kolika dnech znovu přidělit měsíční bonus */
const GRANT_EVERY_MS = 30 * 24 * 60 * 60 * 1000;

/* =========================
   "DB" – JSON soubor
   ========================= */
const DB_PATH = path.join(__dirname, "users.json");

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { users: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function findUser(email) {
  const db = readDB();
  return db.users.find((u) => u.email === String(email).toLowerCase()) || null;
}

function findUserById(id) {
  const db = readDB();
  return db.users.find((u) => u.id === id) || null;
}

function upsertUser(u) {
  const db = readDB();
  const i = db.users.findIndex((x) => x.id === u.id);
  if (i !== -1) db.users[i] = u;
  else db.users.push(u);
  writeDB(db);
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    display_name: u.display_name,
    avatar_url: u.avatar_url,
  };
}

/* =========================
   Middleware
   ========================= */
app.use((req, res, next) => {
  express.json({ limit: "1mb" })(req, res, (err) => {
    if (err) return res.status(400).json({ error: "bad_json" });
    next();
  });
});

app.use(
  cookieSession({
    name: "sid",
    signed: false,
    httpOnly: true,
    sameSite: "lax",
  })
);

app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
);

function currentUser(req) {
  if (!req.session?.uid) return null;
  return findUserById(req.session.uid);
}

/* =========================
   Kredity – pomocné funkce
   ========================= */
function getBalance(u) {
  return typeof u.credits === "number" ? u.credits : 0;
}

function grant(u, delta, reason = "manual") {
  u.credits = getBalance(u) + Number(delta || 0);
  // jednoduchý log do paměti – když budeš chtít historii, přidej pole u.ledger
  u.last_reason = reason;
  upsertUser(u);
  return u.credits;
}

/** Přidělí měsíční bonus, pokud od posledního přidělení uplynulo ≥30 dní */
function grantMonthlyIfDue(u) {
  const last = u.last_free_credit_at ? new Date(u.last_free_credit_at) : null;
  const now = new Date();
  if (!last || now - last >= GRANT_EVERY_MS) {
    grant(u, FREE_CREDITS, "monthly_bonus");
    u.last_free_credit_at = now.toISOString();
    upsertUser(u);
    return true;
  }
  return false;
}

/* =========================
   Routes
   ========================= */

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, monthly_free_credits: FREE_CREDITS })
);

/* --- Auth & Session --- */
app.get("/api/me", auth, async (req, res) => {
  try {
    const [u] = await q("SELECT id, email, name FROM users WHERE id=?", [req.userId]);
    if (!u) return res.status(404).json({ error: "not_found" });

    await grantMonthlyIfDue(req.userId);

    const balance = await getCreditBalance(req.userId);

    // NEW: read subscription row if it exists
    const [sub] = await q(
      `SELECT stripe_customer_id, stripe_subscription_id, price_id, status, cancel_at_period_end, current_period_end
       FROM subscriptions WHERE user_id=?`,
      [req.userId]
    );

    let profile = null;
    try {
      [profile] = await q(
        "SELECT display_name, billing_name, billing_email, billing_address FROM profiles WHERE user_id=?",
        [req.userId]
      );
    } catch {}

    res.json({
      user: { id: u.id, email: u.email, name: u.name },
      credits: { balance },
      subscription: sub
        ? {
            status: sub.status,
            price_id: sub.price_id,
            cancel_at_period_end: !!sub.cancel_at_period_end,
            current_period_end: sub.current_period_end,
            name: sub.price_id === process.env.STRIPE_PRICE_ARTIST_SUB ? "Artist" : sub.price_id, // optional mapping
          }
        : { status: "free", price_id: "free", name: "Free" },
      profile: profile || {
        display_name: u.name || "Member",
        billing_name: u.name || "",
        billing_email: u.email,
        billing_address: { country: "CZ" },
      },
    });
  } catch (e) {
    console.error("ME ERROR:", e);
    res.status(500).json({ error: "me_failed", message: e.message });
  }
});
app.post("/api/stripe/portal", auth, async (req, res) => {
  try {
    const [row] = await q("SELECT stripe_customer_id FROM subscriptions WHERE user_id=?", [req.userId]);
    if (!row?.stripe_customer_id) return res.status(404).json({ error: "no_customer" });

    const session = await new Stripe(process.env.STRIPE_SECRET_KEY).billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: (process.env.FRONTEND_ORIGIN || "http://localhost:5173") + "/profile",
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("PORTAL ERROR:", e);
    res.status(500).json({ error: "portal_failed" });
  }
});


function doSignup(req, res) {
  const { email, password, displayName, name } = req.body || {};
  const display = displayName || name;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  if (String(password).length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (findUser(email)) return res.status(409).json({ error: "Email already registered" });

  const id = String(Date.now()); // jednoduché ID; pro produkci použij uuid
  const password_hash = bcrypt.hashSync(password, 10);

  const user = {
    id,
    email: String(email).toLowerCase(),
    display_name: display || String(email).split("@")[0],
    password_hash,
    avatar_url: "",
    bio: "",
    location: "",
    genres: [],
    links: { website: "", instagram: "", twitter: "" },
    credits: 0,
    last_free_credit_at: new Date().toISOString(), // startovní timestamp
  };

  // signup bonus
  grant(user, FREE_CREDITS, "signup_bonus");

  upsertUser(user);
  req.session.uid = user.id;
  res.status(201).json({ user: publicUser(user) });
}

function doLogin(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const u = findUser(email);
  if (!u) return res.status(401).json({ error: "Invalid email or password" });
  if (!bcrypt.compareSync(password, u.password_hash))
    return res.status(401).json({ error: "Invalid email or password" });

  req.session.uid = u.id;
  res.json({ user: publicUser(u) });
}

function doLogout(req, res) {
  req.session = null;
  res.json({ ok: true });
}

// tvoje původní cesty
app.post("/api/signup", doSignup);
app.post("/api/login", doLogin);
app.post("/api/logout", doLogout);

// aliasy kompatibilní s jinou částí FE
app.post("/api/auth/signup", doSignup);
app.post("/api/auth/login", doLogin);
app.post("/api/auth/logout", doLogout);

/* --- Profile --- */
app.get("/api/profile", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Not authenticated" });

  res.json({
    profile: {
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      avatar_url: u.avatar_url || "",
      bio: u.bio || "",
      location: u.location || "",
      genres: u.genres || [],
      links: u.links || { website: "", instagram: "", twitter: "" },
    },
  });
});

app.put("/api/profile", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Not authenticated" });

  const { display_name, avatar_url, bio, location, genres, links } = req.body || {};

  if (typeof display_name === "string") u.display_name = display_name.trim().slice(0, 60);
  if (typeof avatar_url === "string") u.avatar_url = avatar_url.trim().slice(0, 500);
  if (typeof bio === "string") u.bio = bio.trim().slice(0, 600);
  if (typeof location === "string") u.location = location.trim().slice(0, 80);
  if (Array.isArray(genres))
    u.genres = genres.map((g) => String(g).trim()).filter(Boolean).slice(0, 12);
  if (links && typeof links === "object") {
    u.links = {
      website: links.website ? String(links.website).trim().slice(0, 200) : u.links?.website || "",
      instagram: links.instagram ? String(links.instagram).trim().slice(0, 200) : u.links?.instagram || "",
      twitter: links.twitter ? String(links.twitter).trim().slice(0, 200) : u.links?.twitter || "",
    };
  }

  upsertUser(u);

  res.json({
    profile: {
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      avatar_url: u.avatar_url || "",
      bio: u.bio || "",
      location: u.location || "",
      genres: u.genres || [],
      links: u.links || { website: "", instagram: "", twitter: "" },
    },
  });
});

/* --- Credits --- */
app.get("/api/credits", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Not authenticated" });

  // pro jistotu i tady můžeme přidat měsíční grant, ale stačí v /api/me
  res.json({ credits: getBalance(u) });
});
// posledních 20 záznamů
app.get("/api/credits/history", auth, async (req, res) => {
  const items = await q(
    `SELECT change_amount, reason, created_at
     FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 20`,
    [req.userId]
  );
  res.json({ items });
});

app.post("/api/credits/use", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Not authenticated" });

  const amt = Math.max(1, Number(req.body?.amount) || 1);
  const current = getBalance(u);
  if (current < amt) return res.status(402).json({ error: "Insufficient credits", credits: current });

  u.credits = current - amt;
  upsertUser(u);
  res.json({ ok: true, credits: u.credits });
});

/** Dev-only: manuální připsání kreditů */
app.post("/api/credits/grant", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Not authenticated" });

  const amt = Math.max(0, Number(req.body?.amount) || 0);
  u.credits = getBalance(u) + amt;
  upsertUser(u);
  res.json({ ok: true, credits: u.credits });
});

/* =========================
   Start
   ========================= */
app.listen(PORT, () => {
  console.log(`Local auth server (JSON) running on http://localhost:${PORT}`);
  console.log(`Signup bonus: +${FREE_CREDITS}, monthly bonus every 30d: +${FREE_CREDITS}`);
});
