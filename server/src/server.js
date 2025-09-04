// server/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import bodyParser from "body-parser";

/* =========================
   MySQL pool + helpers
   ========================= */
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  connectionLimit: 10,
  namedPlaceholders: false,
  charset: "utf8mb4_general_ci",
});

const q = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

/* =========================
   Schema bootstrap
   ========================= */
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) NOT NULL PRIMARY KEY,
      email VARCHAR(320) NOT NULL UNIQUE,
      name VARCHAR(200),
      password_hash VARCHAR(255),
      email_verified_at DATETIME NULL,
      last_free_credit_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id CHAR(36) NOT NULL PRIMARY KEY,
      display_name VARCHAR(200),
      billing_name VARCHAR(200),
      billing_email VARCHAR(320),
      billing_address JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_identities (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      provider ENUM('google','apple','github','password') NOT NULL DEFAULT 'password',
      provider_user_id VARCHAR(191) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_provider_user (provider, provider_user_id),
      KEY idx_identities_user (user_id),
      CONSTRAINT fk_identities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS credit_ledger (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      change_amount INT NOT NULL,
      reason VARCHAR(64) NOT NULL,
      meta JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_ledger_user (user_id),
      CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    user_id                CHAR(36) NOT NULL PRIMARY KEY,
    stripe_customer_id     VARCHAR(191) NOT NULL,
    stripe_subscription_id VARCHAR(191) NOT NULL,
    price_id               VARCHAR(191) NOT NULL,
    status                 VARCHAR(64)  NOT NULL,  -- active, past_due, canceled, etc.
    cancel_at_period_end   TINYINT(1)   NOT NULL DEFAULT 0,
    current_period_end     DATETIME     NULL,
    created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_customer (stripe_customer_id),
    KEY idx_subscription (stripe_subscription_id),
    CONSTRAINT fk_subs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS revealed_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      playlist_id VARCHAR(191) NOT NULL,
      data JSON NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_playlist (user_id, playlist_id),
      KEY idx_revealed_user (user_id),
      CONSTRAINT fk_revealed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

/* =========================
   App + middleware
   ========================= */
const app = express();

app.get("/api/_routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route) {
      const methods = Object.keys(m.route.methods).join(",").toUpperCase();
      routes.push({ methods, path: m.route.path });
    } else if (m.name === "router" && m.handle.stack) {
      m.handle.stack.forEach((h) => {
        if (h.route) {
          const methods = Object.keys(h.route.methods).join(",").toUpperCase();
          routes.push({ methods, path: h.route.path });
        }
      });
    }
  });
  res.json({ routes });
});
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- Stripe webhook (raw body required) ---
app.post("/api/stripe/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // After Checkout completes for a subscription
      case "checkout.session.completed": {
        const s = event.data.object;
        const uid = s.metadata?.app_user_id;
        const subId = s.subscription;          // string like "sub_..."
        const customerId = s.customer;          // string like "cus_..."
        if (!uid || !subId || !customerId) break;

        // Get subscription details (status, period end, price id)
        const sub = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price"] });
        const priceId = sub.items?.data?.[0]?.price?.id || "unknown";
        const status = sub.status; // active, past_due, etc.
        const cancelAtPeriodEnd = sub.cancel_at_period_end ? 1 : 0;
        const currentPeriodEnd = new Date(sub.current_period_end * 1000);

        await q(
          `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, price_id, status, cancel_at_period_end, current_period_end)
           VALUES (?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             stripe_customer_id=VALUES(stripe_customer_id),
             stripe_subscription_id=VALUES(stripe_subscription_id),
             price_id=VALUES(price_id),
             status=VALUES(status),
             cancel_at_period_end=VALUES(cancel_at_period_end),
             current_period_end=VALUES(current_period_end)`,
          [uid, customerId, subId, priceId, status, cancelAtPeriodEnd, currentPeriodEnd]
        );

        // Optional: grant initial monthly credits right away on first purchase
        await q(
          "INSERT INTO credit_ledger (user_id, change_amount, reason) VALUES (?,?,?)",
          [uid, 200, "subscription_first_cycle"]
        );
        break;
      }

      // Renewal paid (monthly cycles)
      case "invoice.paid": {
        const inv = event.data.object;
        if (inv.billing_reason !== "subscription_cycle") break;
        const subId = inv.subscription;
        const customerId = inv.customer;
        if (!subId || !customerId) break;

        // find user by customer id
        const [row] = await q("SELECT user_id FROM subscriptions WHERE stripe_customer_id=? LIMIT 1", [customerId]);
        const uid = row?.user_id;
        if (!uid) break;

        // credit the user for the new cycle
        await q(
          "INSERT INTO credit_ledger (user_id, change_amount, reason, meta) VALUES (?,?,?,?)",
          [uid, 200, "subscription_cycle_credit", JSON.stringify({ invoice: inv.id, sub: subId })]
        );

        // update period end + status
        if (inv.lines?.data?.length) {
          // also safe to refresh subscription status here:
          const sub = await stripe.subscriptions.retrieve(subId);
          await q(
            "UPDATE subscriptions SET status=?, current_period_end=? WHERE stripe_subscription_id=?",
            [sub.status, new Date(sub.current_period_end * 1000), subId]
          );
        }
        break;
      }

      // Keep status in sync (pause/cancel/update)
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await q(
          "UPDATE subscriptions SET status=?, cancel_at_period_end=?, current_period_end=? WHERE stripe_subscription_id=?",
          [
            sub.status,
            sub.cancel_at_period_end ? 1 : 0,
            new Date(sub.current_period_end * 1000),
            sub.id,
          ]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (e) {
    console.error("WEBHOOK HANDLER ERROR:", e);
    res.status(500).json({ error: "webhook_internal_error" });
  }
});


// --- Normal JSON parsing (after webhook) ---
app.use((req, res, next) => {
  express.json({ limit: "1mb" })(req, res, (err) => {
    if (err)
      return res
        .status(400)
        .json({ error: "bad_json", message: "Malformed JSON body." });
    next();
  });
});

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

/* =========================
   Helpers
   ========================= */
const MONTHLY_FREE_CREDITS = Number(process.env.MONTHLY_CREDITS || 10);

const issueJwt = (uid) =>
  jwt.sign({ uid }, process.env.JWT_SECRET || "dev", { expiresIn: "7d" });

const auth = (req, res, next) => {
  try {
    const token = req.cookies.session;
    if (!token) return res.status(401).json({ error: "unauthorized" });
    const { uid } = jwt.verify(token, process.env.JWT_SECRET || "dev");
    req.userId = uid;
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
};

async function grantMonthlyIfDue(userId) {
  const [u] = await q("SELECT last_free_credit_at FROM users WHERE id=?", [
    userId,
  ]);
  const last = u?.last_free_credit_at ? new Date(u.last_free_credit_at) : null;
  const now = new Date();

  const ms30d = 30 * 24 * 60 * 60 * 1000;
  if (!last || now - last >= ms30d) {
    await q(
      "INSERT INTO credit_ledger (user_id, change_amount, reason) VALUES (?, ?, 'monthly_bonus')",
      [userId, MONTHLY_FREE_CREDITS]
    );
    await q("UPDATE users SET last_free_credit_at = NOW() WHERE id=?", [
      userId,
    ]);
    return true;
  }
  return false;
}

async function getCreditBalance(userId) {
  const [row] = await q(
    "SELECT COALESCE(SUM(change_amount),0) AS balance FROM credit_ledger WHERE user_id=?",
    [userId]
  );
  return Number(row?.balance || 0);
}
// ⬇️ paste this AFTER you define `auth`, `q`, `grantMonthlyIfDue`, `getCreditBalance`
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


/* =========================
   Routes
   ========================= */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, monthly: MONTHLY_FREE_CREDITS })
);
app.post("/api/stripe/portal", auth, async (req, res) => {
  try {
    const [row] = await q(
      "SELECT stripe_customer_id FROM subscriptions WHERE user_id=?",
      [req.userId]
    );

    if (!row?.stripe_customer_id) {
      console.warn("[PORTAL] No stripe_customer_id for user", req.userId);
      return res.status(404).json({ error: "no_customer" });
    }

    // Use the same initialized client
    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: (process.env.FRONTEND_ORIGIN || "http://localhost:5173") + "/profile",
    });

    return res.json({ url: session.url });
  } catch (e) {
    // Log full error for you, send minimal detail to client
    console.error("[PORTAL ERROR]", e);
    return res.status(500).json({
      error: "portal_failed",
      message: process.env.NODE_ENV !== "production" ? (e?.message || "unknown") : undefined,
    });
  }
});


app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "missing_fields" });

    const existing = await q("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length)
      return res.status(409).json({ error: "email_taken" });

    const hash = await bcrypt.hash(password, 12);
    await q(
      "INSERT INTO users (id, email, name, password_hash, last_free_credit_at) VALUES (UUID(), ?, ?, ?, NOW())",
      [email, name || null, hash]
    );
    const [u] = await q("SELECT id FROM users WHERE email=?", [email]);

    try {
      await q(
        "INSERT IGNORE INTO profiles (user_id, billing_email, billing_name, display_name) VALUES (?, ?, ?, ?)",
        [u.id, email, name || null, name || null]
      );
      await q(
        "INSERT IGNORE INTO user_identities (user_id, provider, provider_user_id) VALUES (?, 'password', ?)",
        [u.id, email]
      );
    } catch {}

    await q(
      "INSERT INTO credit_ledger (user_id, change_amount, reason) VALUES (?, ?, 'signup_bonus')",
      [u.id, MONTHLY_FREE_CREDITS]
    );

    const token = issueJwt(u.id);
    res
      .cookie("session", token, { httpOnly: true, sameSite: "lax" })
      .json({ ok: true });
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    res.status(500).json({ error: "signup_failed", message: e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "missing_fields" });

    const [u] = await q(
      "SELECT id, email, name, password_hash FROM users WHERE email=?",
      [email]
    );
    if (!u?.password_hash)
      return res.status(401).json({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    const token = issueJwt(u.id);
    res
      .cookie("session", token, { httpOnly: true, sameSite: "lax" })
      .json({ ok: true });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ error: "login_failed", message: e.message });
  }
});

app.post("/api/stripe/create-checkout-session", auth, async (req, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) return res.status(400).json({ error: "missing_price" });

    // reuse saved customer if present
    const [sub] = await q(
      "SELECT stripe_customer_id FROM subscriptions WHERE user_id=?",
      [req.userId]
    );
    const customer = sub?.stripe_customer_id || null;

    // Build params without customer_creation (not allowed in subscription mode)
    const params = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url:
        (process.env.FRONTEND_ORIGIN || "http://localhost:5173") +
        "/profile?success=1",
      cancel_url:
        (process.env.FRONTEND_ORIGIN || "http://localhost:5173") +
        "/pricing?canceled=1",
      metadata: { app_user_id: req.userId },
    };

    if (customer) params.customer = customer; // reuse only if we have it

    const session = await stripe.checkout.sessions.create(params);
    res.json({ id: session.id, url: session.url });
  } catch (e) {
    console.error("CHECKOUT ERROR:", e);
    res.status(500).json({ error: "checkout_failed" });
  }
});

// --- Credits (JWT-auth + ledger-backed) ---
app.get("/api/credits", auth, async (req, res) => {
  try {
    // monthly drip if due
    await grantMonthlyIfDue(req.userId);

    const balance = await getCreditBalance(req.userId);
    return res.json({ credits: balance });
  } catch (e) {
    console.error("[CREDITS GET]", e);
    return res.status(500).json({ error: "credits_failed" });
  }
});

app.post("/api/credits/use", auth, async (req, res) => {
  try {
    const amt = Number(req.body?.amount) || 1;
    if (amt <= 0) return res.status(400).json({ error: "invalid_amount" });

    const balance = await getCreditBalance(req.userId);
    if (balance < amt) {
      return res.status(402).json({ error: "Insufficient credits", credits: balance });
    }

    // deduct by inserting a negative row
    await q(
      "INSERT INTO credit_ledger (user_id, change_amount, reason, meta) VALUES (?,?,?,?)",
      [req.userId, -amt, "reveal_spend", JSON.stringify({ ts: Date.now() })]
    );

    const newBalance = await getCreditBalance(req.userId);
    return res.json({ ok: true, credits: newBalance });
  } catch (e) {
    console.error("[CREDITS USE]", e);
    return res.status(500).json({ error: "credits_use_failed" });
  }
});

// --- Revealed items (JWT-auth + MySQL) ---
app.get("/api/revealed", auth, async (req, res) => {
  try {
    const rows = await q(
      "SELECT playlist_id AS id, data FROM revealed_items WHERE user_id=? ORDER BY created_at DESC",
      [req.userId]
    );
    const items = rows.map(r => ({ id: r.id, ...(typeof r.data === "string" ? JSON.parse(r.data) : r.data) }));
    res.json({ items });
  } catch (e) {
    console.error("[REVEALED GET]", e);
    res.status(500).json({ error: "load_failed" });
  }
});
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("session", { httpOnly: true, sameSite: "lax" });
  return res.json({ ok: true });
});
app.get("/api/credits/history", auth, async (req, res) => {
  try {
    const rows = await q(
      `SELECT id, change_amount, reason, meta, created_at
       FROM credit_ledger
       WHERE user_id=?
       ORDER BY created_at DESC
       LIMIT 500`,
      [req.userId]
    );
    res.json({
      items: rows.map(r => ({
        id: r.id,
        amount: r.change_amount,
        reason: r.reason,
        meta: typeof r.meta === "string" ? JSON.parse(r.meta || "null") : r.meta,
        created_at: r.created_at
      }))
    });
  } catch (e) {
    console.error("[CREDITS HISTORY]", e);
    res.status(500).json({ error: "history_failed" });
  }
});

app.post("/api/revealed", auth, async (req, res) => {
  try {
    const { playlist_id, data } = req.body || {};
    if (!playlist_id || !data) return res.status(400).json({ error: "missing_fields" });

    await q(
      `INSERT INTO revealed_items (user_id, playlist_id, data)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE data=VALUES(data)`,
      [req.userId, playlist_id, JSON.stringify(data)]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("[REVEALED POST]", e);
    res.status(500).json({ error: "save_failed" });
  }
});

app.delete("/api/revealed/:id", auth, async (req, res) => {
  try {
    await q("DELETE FROM revealed_items WHERE user_id=? AND playlist_id=?", [req.userId, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("[REVEALED DELETE ONE]", e);
    res.status(500).json({ error: "delete_failed" });
  }
});

app.delete("/api/revealed", auth, async (req, res) => {
  try {
    await q("DELETE FROM revealed_items WHERE user_id=?", [req.userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("[REVEALED CLEAR]", e);
    res.status(500).json({ error: "clear_failed" });
  }
});


/* (your credits/revealed/me routes remain as you had them) */

/* =========================
   Start
   ========================= */
const port = Number(process.env.PORT || 4000);

ensureSchema()
  .then(() => {
    app.listen(port, () =>
      console.log(
        "API listening on",
        port,
        "— monthly free credits:",
        MONTHLY_FREE_CREDITS
      )
    );
  })
  .catch((e) => {
    console.error("Schema init failed:", e);
    process.exit(1);
  });
