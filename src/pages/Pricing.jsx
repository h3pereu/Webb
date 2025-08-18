import React, { useMemo, useState } from "react";

/* Page-scoped styles (prefix prc-) — plain template literal (no String.raw) */
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

.prc-shell{
  min-height: calc(100vh - 56px);
  background: var(--prc-bg);
  padding: 28px 18px 80px;
  color: var(--prc-text);
}

.prc-header{
  max-width: 1100px; margin: 0 auto 18px; text-align:center;
}
.prc-eyebrow{
  display:inline-block; font-size:12px; letter-spacing:.14em; text-transform:uppercase;
  color:#7c8195; background:#eef1ff; border:1px solid #e5e9ff; padding:6px 10px; border-radius:999px;
}
.prc-title{ margin:10px 0 6px; font-size: clamp(1.8rem, 2.6vw, 2.6rem); color:var(--prc-ink); }
.prc-sub{ color:#687086; max-width:720px; margin:0 auto; }

.prc-toggle{
  display:flex; gap:8px; align-items:center; justify-content:center;
  margin:18px auto 8px; color:#3b4152; font-weight:700;
}
.prc-switch{
  position:relative; width:56px; height:30px; border-radius:999px; border:1px solid var(--prc-border);
  background:#fff; cursor:pointer; box-shadow: inset 0 0 0 2px rgba(0,0,0,.02);
}
.prc-switch input{ appearance:none; -webkit-appearance:none; width:100%; height:100%; margin:0; cursor:pointer; }
.prc-switch i{
  position:absolute; top:3px; left:3px; width:24px; height:24px; border-radius:50%;
  background: linear-gradient(90deg, var(--prc-accent), var(--prc-accent-2));
  transition: transform .18s ease; box-shadow: 0 6px 18px rgba(110,91,255,.28);
}
.prc-switch input:checked + i{ transform: translateX(26px); }
.prc-save{ font-size:12px; color:#6c60ff; background:#efeaff; border:1px solid #e6e0ff; padding:4px 8px; border-radius:999px; }

/* Pricing grid */
.prc-grid{
  max-width:1100px; margin: 18px auto 0;
  display:grid; gap:16px; grid-template-columns: repeat(12, 1fr);
}
.prc-card{
  grid-column: span 4;
  background: var(--prc-card);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  border:1px solid var(--prc-border);
  border-radius:16px;
  padding:18px;
  box-shadow: 0 16px 40px rgba(16,24,40,.08);
  display:flex; flex-direction:column; gap:14px;
  transition: transform .18s ease, box-shadow .18s ease;
}
.prc-card:hover{ transform: translateY(-2px); box-shadow: 0 22px 60px rgba(16,24,40,.12); }
.prc-card.popular{
  background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,.8));
  border:1px solid #e8e4ff; box-shadow: 0 28px 80px rgba(110,91,255,.18);
}
.prc-badge{
  align-self:flex-start; font-size:11px; letter-spacing:.12em; text-transform:uppercase;
  color:#6c60ff; background:#efeaff; border:1px solid #e6e0ff; padding:6px 10px; border-radius:999px;
}
.prc-name{ font-weight:800; color:var(--prc-ink); font-size:1.1rem; }
.prc-desc{ color:#6f768a; min-height:34px; }

.prc-price{ display:flex; align-items:baseline; gap:6px; color:var(--prc-ink); }
.prc-price .amt{ font-size:2rem; font-weight:900; }
.prc-price .per{ color:#8a90a5; font-weight:600; }

.prc-cta{ display:flex; gap:10px; align-items:center; }
.prc-btn{
  flex:1 1 auto; border:1px solid var(--prc-border);
  background:#fff; color:#0e1020;
  padding:12px 14px; border-radius:12px; font-weight:800; cursor:pointer;
  transition: transform .14s ease, box-shadow .18s ease, background .18s ease;
}
.prc-btn:hover{ transform: translateY(-1px); background:#f7f9ff; box-shadow:0 10px 28px rgba(10,20,60,.08); }
.prc-btn.primary{
  background: linear-gradient(90deg, var(--prc-accent), var(--prc-accent-2));
  color:#fff; border-color: transparent; box-shadow: 0 16px 40px rgba(110,91,255,.28);
}
.prc-btn.primary:hover{ filter: brightness(.98); }

.prc-ul{ list-style:none; margin:0; padding:0; display:grid; gap:8px; }
.prc-li{ display:flex; gap:10px; align-items:flex-start; color:#333a4f; }
.prc-li i{
  width:18px; height:18px; border-radius:50%; margin-top:2px;
  background: linear-gradient(90deg, var(--prc-accent), var(--prc-accent-2));
  box-shadow: 0 6px 14px rgba(110,91,255,.25);
}

/* Feature compare (compact) */
.prc-compare{
  max-width:1100px; margin: 26px auto 0;
  background: var(--prc-card-solid);
  border:1px solid var(--prc-border); border-radius:16px;
  overflow:auto; box-shadow: 0 16px 40px rgba(16,24,40,.06);
}
.prc-compare table{ width:100%; border-collapse:separate; border-spacing:0; font-size:14px; color:#0f1320; }
.prc-compare thead th{
  position:sticky; top:0; z-index:1;
  background:linear-gradient(180deg, #fbfcff, #fff);
  border-bottom:1px solid var(--prc-border);
  padding:12px; text-align:left; font-weight:800;
}
.prc-compare tbody td{ padding:12px; border-bottom:1px solid #eef1f6; }
.prc-compare tbody tr:hover{ background:#f7f9ff; }
.prc-tick{
  display:inline-block; width:18px; height:18px; border-radius:50%;
  background: linear-gradient(90deg, var(--prc-accent), var(--prc-accent-2));
  box-shadow: 0 6px 14px rgba(110,91,255,.25);
}

/* FAQ */
.prc-faq{ max-width: 900px; margin: 34px auto 0; display:grid; gap:10px; }
.prc-qa{ background:#fff; border:1px solid var(--prc-border); border-radius:12px; padding:14px 16px; }
.prc-q{ font-weight:800; color:#0f1320; }
.prc-a{ margin-top:6px; color:#5d667c; }

/* Responsive */
@media (max-width: 1000px){
  .prc-card{ grid-column: span 6; }
}
@media (max-width: 720px){
  .prc-grid{ grid-template-columns: 1fr; }
  .prc-card{ grid-column: 1 / -1; }
}
`;

function usePrices() {
  // prices in cents (monthly)
  const base = { free: 0, starter: 900, pro: 1900 };
  const yearlyDiscount = 0.2; // 20% off if billed annually
  return { base, yearlyDiscount };
}

export default function Pricing() {
  const { base, yearlyDiscount } = usePrices();
  const [yearly, setYearly] = useState(true);

  const plans = useMemo(() => {
    const m = (c) => (c / 100).toFixed(0);
    const y = (c) => (((c * 12) * (1 - yearlyDiscount)) / 100).toFixed(0);
    return [
      {
        key: "free",
        name: "Free",
        desc: "Kick the tires with core tools.",
        price: 0,
        per: yearly ? "forever" : "/mo",
        cta: "Get Started",
        features: ["Basic search", "Manual exports", "Community support"],
        highlight: false
      },
      {
        key: "starter",
        name: "Starter",
        desc: "For indie creators and small teams.",
        price: yearly ? y(base.starter) : m(base.starter),
        per: yearly ? "/yr (billed once)" : "/mo",
        cta: "Start Starter",
        features: ["Unlimited filters", "CSV & TSV export", "Email templates", "Priority support"],
        highlight: false
      },
      {
        key: "pro",
        name: "Pro",
        desc: "All features, faster workflows.",
        price: yearly ? y(base.pro) : m(base.pro),
        per: yearly ? "/yr (billed once)" : "/mo",
        cta: "Upgrade to Pro",
        features: ["Bulk actions", "Saved segments", "Team sharing", "API access (beta)", "SLA support"],
        highlight: true
      }
    ];
  }, [yearly, base, yearlyDiscount]);

  return (
    <>
      <style>{css}</style>

      <div className="prc-shell">
        <header className="prc-header">
          <span className="prc-eyebrow">Pricing</span>
          <h1 className="prc-title">Simple plans that grow with you</h1>
          <p className="prc-sub">Pick monthly or save with annual billing. Change or cancel anytime.</p>

          <div className="prc-toggle">
            <span>Monthly</span>
            <label className="prc-switch" aria-label="Billing toggle">
              <input
                type="checkbox"
                checked={yearly}
                onChange={(e) => setYearly(e.target.checked)}
              />
              <i></i>
            </label>
            <span>Yearly</span>
            <span className="prc-save">Save 20%</span>
          </div>
        </header>

        <section className="prc-grid">
          {plans.map((p) => (
            <article key={p.key} className={"prc-card" + (p.highlight ? " popular" : "")}>
                
              <div className="prc-name">{p.name}</div>
              <div className="prc-desc">{p.desc}</div>

              <div className="prc-price">
                <span className="amt">{p.price}$</span>
                <span className="per">{p.per}</span>
              </div>

              <div className="prc-cta">
                <button className={"prc-btn " + (p.highlight ? "primary" : "")}>{p.cta}</button>
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

        <section className="prc-compare" aria-label="Feature comparison">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Starter</th>
                <th>Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Filters & search", true, true, true],
                ["CSV / TSV export", false, true, true],
                ["Bulk actions", false, false, true],
                ["Saved segments", false, false, true],
                ["Team sharing", false, false, true],
                ["Priority support", false, true, true],
                ["API access (beta)", false, false, true]
              ].map((row, idx) => (
                <tr key={idx}>
                  <td>{row[0]}</td>
                  <td>{row[1] ? <span className="prc-tick" aria-label="Included" /> : ""}</td>
                  <td>{row[2] ? <span className="prc-tick" aria-label="Included" /> : ""}</td>
                  <td>{row[3] ? <span className="prc-tick" aria-label="Included" /> : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="prc-faq">
          <div className="prc-qa">
            <div className="prc-q">Can I change plans later?</div>
            <div className="prc-a">Yes. Upgrades pro-rate immediately; downgrades apply at the next renewal.</div>
          </div>
          <div className="prc-qa">
            <div className="prc-q">Is there a free trial?</div>
            <div className="prc-a">The Free plan lets you try core features without a time limit. Pro trials available on request.</div>
          </div>
        </section>
      </div>
    </>
  );
}
