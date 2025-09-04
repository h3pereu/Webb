import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const balance = me?.credits?.balance ?? 0;
  const user = me?.user;
  const profile = me?.profile;
  const openPortal = async () => {
  try {
    const r = await fetch('/api/stripe/portal', { method: 'POST', credentials: 'include' });
    if (!r.ok) {
      const t = await r.text().catch(()=>'');
      alert(`Could not open billing portal (${r.status}) ${t || ''}`);
      return;
    }
    const j = await r.json();
    if (j?.url) window.location.href = j.url;
    else alert('Could not open billing portal.');
  } catch (e) {
    console.error(e);
    alert('Could not open billing portal.');
  }
};
  // Load /api/me
  useEffect(() => {
    let ok = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch("/api/me", { credentials: "include" });
        if (!r.ok) throw new Error("unauthorized");
        const j = await r.json();
        if (ok) setMe(j);
      } catch (e) {
        if (ok) setErr("Not signed in or server unavailable.");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  // Load credits history (if backend route exists)
  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const r = await fetch("/api/credits/history", { credentials: "include" });
        if (!r.ok) return; // ignore silently if not implemented
        const j = await r.json().catch(() => ({}));
        if (ok && Array.isArray(j.items)) setHistory(j.items);
      } catch { }
    })();
    return () => { ok = false; };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/me", { credentials: "include" });
      if (r.ok) setMe(await r.json());
      const h = await fetch("/api/credits/history", { credentials: "include" });
      if (h.ok) {
        const j = await h.json();
        if (Array.isArray(j.items)) setHistory(j.items);
      }
    } finally {
      setLoading(false);
    }
  };

  const initials = useMemo(() => {
    const name = profile?.display_name || user?.name || user?.email || "";
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase() || "U";
  }, [profile, user]);

  return (
    <div className="prof-wrap">
      <style>{css}</style>

      <header className="prof-head">
        <div className="prof-id">
          <div className="avatar" aria-hidden>{initials}</div>
          <div className="meta">
            <h1>{profile?.display_name || user?.name || "Member"}</h1>
            <div className="sub">{user?.email}</div>
          </div>
        </div>

        <div className="credits-pill" title="Current credit balance">
          <span className="dot" />
          Credits: <strong>{balance}</strong>
        </div>
      </header>

      {loading ? (
        <div className="skeleton">Loading profile…</div>
      ) : err ? (
        <div className="alert error">{err}</div>
      ) : (
        <div className="grid">
          {/* Credits Card */}
          <section className="card card--credits">
            <div className="card-head">
              <h3>Credits</h3>
              <button className="btn ghost" onClick={refresh} title="Refresh">
                ↻ Refresh
              </button>
            </div>

            <div className="balance">
              <div className="amount">{balance}</div>
              <div className="hint">Available credits</div>
            </div>

            <ul className="tips">
              <li>You get <strong>+10</strong> free credits every month.</li>
              <li>Credits are spent only when you click <em>Reveal</em> for contacts.</li>
            </ul>

            <div className="cta-row">
              <Link to="/pricing" className="btn primary">➕ Add credits</Link>
              <Link to="/search" className="btn">Find playlists</Link>
            </div>

            {/* Credits History */}
            <div className="history">
              <h4>History</h4>
              {history.length === 0 ? (
                <div className="muted small">No entries yet.</div>
              ) : (
                <ul className="hist">
                  {history
                    .slice() // make a copy so we don’t mutate state
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((x, i) => (
                      <li key={i}>
                        <span className={"amt " + (x.change_amount >= 0 ? "plus" : "minus")}>
                          {x.change_amount > 0 ? `+${x.change_amount}` : x.change_amount}
                        </span>
                        <span className="why">
                          {x.reason
                            ? x.reason.charAt(0).toUpperCase() + x.reason.slice(1)
                            : "Change"}
                        </span>
                        <span className="when">
                          {x.created_at ? new Date(x.created_at).toLocaleString() : ""}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </section>

          {/* Account Card */}
          <section className="card">
            <div className="card-head"><h3>Account</h3></div>
            <div className="rows">
              <Row label="Name" value={profile?.display_name || user?.name || "—"} />
              <Row label="Email" value={user?.email || "—"} mono />
            </div>

          </section>

          {/* Subscription */}
          <section className="card sub-card">
  <div className="card-head">
    <h3>Subscription</h3>
    {me?.subscription && me.subscription.status !== 'free' ? (
      <button className="btn" onClick={openPortal}>Manage</button>
    ) : (
      <a href="/pricing" className="btn primary">Upgrade</a>
    )}
  </div>

  <div className="sub-top">
    <div className="plan">
      <span className="pill">
        {me?.subscription?.name || me?.subscription?.price_id || "Free"}
      </span>
      <div className="plan-sub">
        {me?.subscription && me.subscription.status !== 'free'
          ? "You’re on this plan."
          : "No paid plan yet—using Free features."}
      </div>
    </div>
  </div>

  <ul className="feature-list">
    <li><b>Reveal contacts</b> with credits</li>
    <li><b>Monthly free credits</b> included</li>
    <li><b>Export CSV</b> of results</li>
    <li>Only <b>Live</b> search</li>
  </ul>
</section>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="row">
      <div className="lbl">{label}</div>
      <div className={"val " + (mono ? "mono" : "")}>{value}</div>
    </div>
  );
}

const css = `
:root{
  --bg:#f7f9fc; --card:#fff; --text:#0b0b0c; --muted:#6b7280; --b:#e6e9f0;
  --accent:#6E5BFF; --accent2:#A78BFA; --ring:rgba(110,91,255,.25);
}
.prof-wrap{ padding:22px; color:var(--text); }
.prof-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin:8px 0 18px; }
.prof-id{ display:flex; align-items:center; gap:12px; }
.avatar{
  width:56px; height:56px; border-radius:16px;
  display:grid; place-items:center; font-weight:900;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#fff; box-shadow:0 10px 28px rgba(110,91,255,.28); letter-spacing:.5px;
}
.meta h1{ margin:0; font-size:22px; line-height:1.1; }
.meta .sub{ color:var(--muted); font-size:13px; }

.credits-pill{
  display:inline-flex; align-items:center; gap:8px;
  background:linear-gradient(90deg,#f1efff,#eef5ff);
  border:1px solid var(--b); padding:10px 14px; border-radius:999px; font-weight:800;
}
.credits-pill .dot{ width:8px;height:8px;border-radius:999px;background:#7c3aed; box-shadow:0 0 0 4px rgba(124,58,237,.15);}

.grid{
  display:grid; grid-template-columns: 1.2fr 1fr 1fr; gap:16px;
}
@media (max-width:1024px){ .grid{ grid-template-columns:1fr; } }

.card{
  background:var(--card); border:1px solid var(--b); border-radius:18px; padding:16px;
  box-shadow:0 14px 40px rgba(16,24,40,.08);
}
.card--credits{
  background: radial-gradient(1200px 800px at -10% -10%, rgba(110,91,255,.10) 0, transparent 65%),
              radial-gradient(1200px 800px at 120% 0%, rgba(167,139,250,.12) 0, transparent 55%),
              var(--card);
}
.card-head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.card-head h3{ margin:0; }

.balance{ display:flex; align-items:baseline; gap:12px; margin:12px 0; }
.balance .amount{ font-size:48px; font-weight:900; letter-spacing:1px; }
.balance .hint{ color:var(--muted); }

.tips{ margin:10px 0 14px; padding-left:18px; color:#2a313d; }
.tips li{ margin:4px 0; }

.rows{ display:grid; gap:10px; margin:6px 0; }
.row{ display:grid; grid-template-columns: 160px 1fr; align-items:center; gap:10px; }
.lbl{ color:var(--muted); font-size:13px; }
.val{ font-weight:600; }
.val.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

.alert{ padding:12px; border-radius:12px; border:1px solid var(--b); background:#fff; }
.alert.error{ border-color:#ffd3d3; background:#fff4f4; color:#7a0c0c; }

.skeleton{ padding:12px; color:var(--muted); }

.btn{ border:1px solid var(--b); padding:10px 12px; border-radius:12px; background:#fff; cursor:pointer; text-decoration:none; color:inherit; font-weight:700; }
.btn:hover{ box-shadow:0 0 0 6px var(--ring); border-color:#cfd7ff; }
.btn.primary{ color:#fff; background:linear-gradient(90deg,var(--accent),var(--accent2)); border-color:transparent; box-shadow:0 14px 34px rgba(110,91,255,.18); }
.btn.ghost{ background:#fff; }
.cta-row{ display:flex; gap:10px; flex-wrap:wrap; }

.muted{ color:var(--muted); }
.small{ font-size:12px; }

/* History */
.history{ margin-top:14px }
.history h4{ margin:0 0 8px 0 }
.hist{ list-style:none; padding:0; margin:6px 0; display:grid; gap:6px }
.hist li{ display:grid; grid-template-columns: 80px 1fr auto; gap:10px; align-items:center; }
.amt{ font-weight:800 }
.amt.plus{ color:#047857 }
.amt.minus{ color:#b91c1c }
.why{ color:#2a313d }
.when{ color:var(--muted); font-size:12px }
/* Subscription card */
.sub-card{
  background:
    radial-gradient(900px 600px at 110% -10%, rgba(110,91,255,.10) 0, transparent 60%),
    radial-gradient(700px 600px at -10% 110%, rgba(167,139,250,.12) 0, transparent 55%),
    var(--card);
}
.badge{
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  padding: 6px 8px;
  border-radius: 999px;
  border: 1px solid var(--b);
  background: #fff;
}
.badge.ok{ color:#065f46; background:#ecfdf5; border-color:#bbf7d0; }
.badge.halt{ color:#7a0c0c; background:#fff5f5; border-color:#ffe0e0; }

.sub-top{
  display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
  margin:6px 0 10px;
}
.plan{ display:flex; flex-direction:column; gap:6px; }
.pill {
  display: inline-flex;
  align-items: center;       /* vertikální centrování */
  justify-content: center;   /* horizontální centrování */
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  background: linear-gradient(90deg,#eef2ff,#f5f3ff);
  border: 1px solid var(--b);
  text-align: center;        /* fallback pro víc řádků */
}
.plan-sub{ color:var(--muted); font-size:12px; }

.sub-actions .btn{ white-space:nowrap; }

.feature-list{
  display:grid; gap:8px; padding:0; margin:10px 0 0; list-style:none;
}
.feature-list li{
  display:flex; align-items:center; gap:8px;
}
.feature-list li::before{
  content:"✓";
  display:inline-grid; place-items:center;
  width:18px; height:18px; border-radius:999px;
  border:1px solid var(--b);
}

`;
