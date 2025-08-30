import React from "react";

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

.prc-shell{ min-height: calc(100vh - 56px); background: var(--prc-bg); padding: 28px 18px 80px; color: var(--prc-text); }
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

// plans and credit amounts
const PLANS = [
  {
    key: "free",
    name: "Free",
    desc: "Kick the tires with core tools.",
    price: "0",
    per: "forever",
    credits: 10,
    button: "Choose Free",
    highlight: false,
    features: ["Basic search", "Manual exports", "Community support"]
  },
  {
    key: "artist",
    name: "Artist",
    desc: "For artists who actively pitch & research.",
    price: "9",
    per: "/mo",
    credits: 200,
    button: "Choose Artist",
    highlight: true,
    features: ["Unlimited filters", "CSV & TSV export", "Priority support"]
  }
];

const CREDITS_KEY = "psl_credits";
const PLAN_KEY = "psl_plan";
const LAST_RESET_KEY = "psl_last_reset";

function setPlanAndCredits(planKey, credits) {
  try {
    localStorage.setItem(PLAN_KEY, planKey);
    localStorage.setItem(CREDITS_KEY, String(credits));
    localStorage.setItem(LAST_RESET_KEY, String(Date.now()));
  } catch {}
}

export default function Pricing() {
  const choose = (plan) => {
    setPlanAndCredits(plan.key, plan.credits);
    alert(`${plan.name} selected. ${plan.credits} credits added to your account.`);
    // window.location.href = "/search"; // optional redirect
  };

  return (
    <>
      <style>{css}</style>

      <div className="prc-shell">
        <header className="prc-header">
          <span className="prc-eyebrow">Pricing</span>
          <h1 className="prc-title">Two simple plans</h1>
          <p className="prc-sub">Pick a plan and we’ll credit your account immediately. You can change plans anytime.</p>
        </header>

        <section className="prc-grid">
          {PLANS.map((p) => (
            <article key={p.key} className={"prc-card" + (p.highlight ? " popular" : "")}>
              <div className="prc-name">{p.name}</div>
              <div className="prc-desc">{p.desc}</div>

              <div className="prc-price">
                <span className="amt">${p.price}</span>
                <span className="per">{p.per}</span>
              </div>

              <span className="prc-credits">{p.credits} credits / month</span>

              <div className="prc-cta">
                <button
                  className={"prc-btn " + (p.highlight ? "primary" : "")}
                  onClick={() => choose(p)}
                >
                  {p.button}
                </button>
              </div>

              {/* FEATURES (kept) */}
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

        {/* FAQ (kept) */}
        <section className="prc-faq">
          <div className="prc-qa">
            <div className="prc-q">Can I change plans later?</div>
            <div className="prc-a">Yes. Upgrades apply immediately; downgrades take effect at the next renewal.</div>
          </div>
          <div className="prc-qa">
            <div className="prc-q">How do credits work?</div>
            <div className="prc-a">
              Each search/export uses 1 credit. Selecting a plan sets your monthly allowance
              (10 on Free, 200 on Artist). Credits are stored locally and can be reset when you change plans.
            </div>
          </div>
          <div className="prc-qa">
            <div className="prc-q">Do credits reset monthly?</div>
            <div className="prc-a">
              You can add an automatic monthly reset using the stored <code>psl_last_reset</code> date.
              Want me to wire that into your <code>useCredits</code> hook?
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
