// src/pages/Pricing.jsx
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";

/* 1) KEEP YOUR CSS INSIDE BACKTICKS */
const css = `
:root{
  --prc-accent:#6E5BFF;
  --prc-accent-2:#A78BFA;
  --prc-ink:#111318;
  --prc-text:#0b0b0c;
  --prc-muted:#6b7280;
  --prc-bg: radial-gradient(1200px 600px at 50% -10%, #f4f6ff, #f7f9fc 40%, #f7f9fc);
  --prc-card: rgba(255,255,255,.72);
  --prc-card-solid:#fff;
  --prc-border: rgba(17, 24, 39, .08);
}

/* Scroll area under sticky navbar */
.page-scroll { height: calc(100vh - var(--nav-h)); overflow: auto; }
@media (max-width: 640px) { .page-scroll { height: calc(100svh - var(--nav-h)); } }

/* Custom scrollbar */
.page-scroll { scrollbar-width: thin; scrollbar-color: #a78bfa #eef1ff; } /* Firefox */
.page-scroll::-webkit-scrollbar { width: 10px; }
.page-scroll::-webkit-scrollbar-track { background:#eef1ff; border-left:1px solid var(--nav-border); }
.page-scroll::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#c7d2fe,#a78bfa); border:2px solid #eef1ff; border-radius:8px; }

/* Pricing styles (unchanged) */
.prc-shell{ min-height:100%; background: var(--prc-bg); padding: 28px 18px 80px; color: var(--prc-text); }
.prc-header{ max-width: 900px; margin: 0 auto 18px; text-align:center; }
.prc-eyebrow{ display:inline-block; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:#7c8195; background:#eef1ff; border:1px solid #e5e9ff; padding:6px 10px; border-radius:999px; }
.prc-title{ margin:10px 0 6px; font-size: clamp(1.8rem, 2.6vw, 2.6rem); color:var(--prc-ink); }
.prc-sub{ color:#687086; max-width:650px; margin:0 auto; }

.prc-grid{ max-width:900px; margin: 24px auto 0; display:grid; gap:16px; grid-template-columns: repeat(12, 1fr); }
.prc-card{ grid-column: span 6; background: var(--prc-card); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  border:1px solid var(--prc-border); border-radius:16px; padding:18px; box-shadow: 0 16px 40px rgba(16,24,40,.08);
  display:flex; flex-direction:column; gap:14px; transition: transform .18s ease, box-shadow .18s ease; }
.prc-card:hover{ transform: translateY(-2px); box-shadow: 0 22px 60px rgba(16,24,40,.12); }
.prc-card.popular{ background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,.85)); border:1px solid #e8e4ff; box-shadow: 0 28px 80px rgba(110,91,255,.18); }

.prc-name{ font-weight:800; color:var(--prc-ink); font-size:1.15rem; }
.prc-desc{ color:#6f768a; min-height:34px; }

.prc-price{ display:flex; align-items:baseline; gap:6px; color:var(--prc-ink); }
.prc-price .amt{ font-size:2rem; font-weight:900; }
.prc-price .per{ color:#8a90a5; font-weight:600; }

.prc-credits{ font-size:13px; color:#3b4152; background:#f3f5ff; border:1px solid #e4e7ff; padding:6px 10px; border-radius:999px; align-self:flex-start; }

.prc-cta{ display:flex; gap:10px; align-items:center; }
.prc-btn{ flex:1 1 auto; border:1px solid var(--prc-border); background:#fff; color:#0e1020; padding:12px 14px; border-radius:12px; font-weight:800; cursor:pointer;
  transition: transform .14s ease, box-shadow .18s ease, background .18s ease; }
.prc-btn:hover{ transform: translateY(-1px); background:#f7f9ff; box-shadow:0 10px 28px rgba(10,20,60,.08); }
.prc-btn.primary{ background: linear-gradient(90deg, var(--prc-accent), var(--prc-accent-2)); color:#fff; border-color: transparent; box-shadow: 0 16px 40px rgba(110,91,255,.28); }
.prc-btn.primary:hover{ filter: brightness(.98); }

.prc-ul{ list-style:none; margin:0; padding:0; display:grid; gap:8px; }
.prc-li{ display:flex; gap:10px; align-items:flex-start; color:#333a4f; }
.prc-li i{ width:18px; height:18px; border-radius:50%; margin-top:2px; background: linear-gradient(90deg, var(--prc-accent), var(--prc-accent-2)); box-shadow: 0 6px 14px rgba(110,91,255,.25); }

.prc-faq{ max-width: 900px; margin: 34px auto 0; display:grid; gap:10px; }
.prc-qa{ background:#fff; border:1px solid var(--prc-border); border-radius:12px; padding:14px 16px; }
.prc-q{ font-weight:800; color:#0f1320; }
.prc-a{ margin-top:6px; color:#5d667c; }

@media (max-width: 720px){ .prc-card{ grid-column: 1 / -1; } }
`;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PLANS = [
  { key: "free", name: "Free", desc: "Kick the tires with core tools.", priceLabel: "$0", per: "forever", credits: 10, highlight: false, features: ["Basic search", "Manual exports", "Community support"], priceId: null, mode: null },
  { key: "artist", name: "Artist", desc: "For artists who actively pitch & research.", priceLabel: "$9", per: "/mo", credits: 200, highlight: true, features: ["Unlimited filters", "CSV & TSV export", "Priority support"], priceId: import.meta.env.VITE_STRIPE_PRICE_ARTIST_SUB, mode: "subscription" },
];

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [loadingKey, setLoadingKey] = useState("");

  // build ?redirect back to current page
  const back = encodeURIComponent(loc.pathname + (loc.search || ""));

  const requireLogin = (target = "pricing") => {
    if (!user) {
      // choose where to send: login or signup
      nav(`/login?redirect=${back}&need=${target}`);
      return false;
    }
    return true;
  };

  async function startCheckout(plan) {
    if (!plan.priceId) return;
    if (!requireLogin("checkout")) return;

    setLoadingKey(plan.key);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, mode: plan.mode }),
      });

      // If server says "not authorized", kick to login preserving return
      if (res.status === 401) {
        nav(`/login?redirect=${back}&need=checkout`);
        return;
      }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Checkout failed (${res.status}). ${t}`);
      }

      const data = await res.json();
      if (data?.url) { window.location.href = data.url; return; }

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js failed to load");
      await stripe.redirectToCheckout({ sessionId: data.id });
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not start checkout.");
    } finally {
      setLoadingKey("");
    }
  }

  const chooseFree = () => {
    // Free still requires an account (so we can attach monthly credits)
    if (!requireLogin("free")) return;
    // Already logged in → just take them to Search (or Profile)
    nav("/search");
  };

  return (
    <>
      <style>{css}</style>
      <div className="page-scroll">
        <div className="prc-shell">
          <header className="prc-header">
            <span className="prc-eyebrow">Pricing</span>
            <h1 className="prc-title">Two simple plans</h1>
            <p className="prc-sub">Pick a subscription and we’ll credit your account every month.</p>
          </header>

          <section className="prc-grid">
            {PLANS.map((p) => (
              <article key={p.key} className={"prc-card" + (p.highlight ? " popular" : "")}>
                <div className="prc-name">{p.name}</div>
                <div className="prc-desc">{p.desc}</div>

                <div className="prc-price">
                  <span className="amt">{p.priceLabel}</span>
                  <span className="per">{p.per}</span>
                </div>

                <span className="prc-credits">{p.credits} credits / month</span>

                <div className="prc-cta">
                  {p.priceId ? (
                    <button
                      className={"prc-btn " + (p.highlight ? "primary" : "")}
                      onClick={() => startCheckout(p)}
                      disabled={loadingKey === p.key}
                    >
                      {loadingKey === p.key ? "Starting…" : `Choose ${p.name}`}
                    </button>
                  ) : (
                    <button className="prc-btn" onClick={chooseFree}>
                      Choose Free
                    </button>
                  )}
                </div>

                <ul className="prc-ul">
                  {p.features.map((f, i) => (
                    <li key={i} className="prc-li">
                      <i aria-hidden="true"></i>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}