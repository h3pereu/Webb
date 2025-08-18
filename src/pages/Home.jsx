import React from "react";

const css = `
:root{
  --ps-bg:
    radial-gradient(1200px 600px at 80% 20%, rgba(129,161,255,.22), transparent 60%),
    radial-gradient(900px 500px at 10% 80%, rgba(255,170,210,.18), transparent 60%),
    linear-gradient(180deg, #ffffff, #fbfbff 40%, #ffffff 100%);
  --ps-black:#0b0b0c; --ps-muted:#6b7280;
  --ps-accent:#7c5cff; --ps-accent-2:#00d4ff;
  --ps-line:#eaeaef; --ps-card:#fff;
}
body{overflow-y:hidden;}
.ps-wrap{ background:var(--ps-bg); min-height:100svh; }
.ps-container{ max-width:1150px; margin:0 auto; padding:48px 24px; }

.ps-sr{ position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.ps-kbd-focus:focus-visible{ outline:2px solid color-mix(in oklab, var(--ps-accent), #000 10%); outline-offset:2px; border-radius:12px; }

.ps-hero{ display:grid; grid-template-columns:1.1fr .9fr; gap:40px; align-items:center; }
.ps-eyebrow{
  display:inline-flex; align-items:center; gap:8px; font-weight:600; font-size:13px;
  color:#3f3f46; background:#fff; border:1px solid var(--ps-line);
  border-radius:999px; padding:8px 12px; box-shadow:0 8px 24px rgba(0,0,0,.06)
}
.ps-title{ font-size:54px; line-height:1.05; letter-spacing:-.02em; font-weight:800; color:var(--ps-black); margin:16px 0 }
.ps-sub{ font-size:18px; color:var(--ps-muted); max-width:60ch }

.ps-cta{ display:flex; gap:10px; margin-top:22px; align-items:center; flex-wrap:wrap; }
.ps-input{
  flex:1 1 260px; min-width:260px; padding:14px 16px;
  border:1px solid var(--ps-line); border-radius:12px; font-size:16px; background:#fff;
}
.ps-btn{
  padding:14px 18px; border:none; border-radius:12px; font-weight:700; cursor:pointer;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
  background:var(--ps-black); color:#fff;
}
.ps-btn:hover{ transform:translateY(-2px); box-shadow:0 10px 20px rgba(0,0,0,.15) }
.ps-btn.secondary{ background:#fff; color:#000; border:1px solid var(--ps-line) }

.ps-logos{ display:flex; gap:18px; align-items:center; margin-top:22px; opacity:.85; flex-wrap:wrap }
.ps-logos span{ display:inline-flex; align-items:center; gap:8px; font-size:13px; color:#4b5563 }
.ps-dot{ width:4px; height:4px; border-radius:999px; background:#c9ccd6; }

.ps-cardflow{ display:grid; grid-template-rows:auto; gap:14px; position:relative; }
.ps-flow-card{
  background:var(--ps-card); border:1px solid var(--ps-line); border-radius:16px; padding:14px 16px;
  box-shadow:0 10px 30px rgba(0,0,0,.05); display:flex; align-items:center; gap:12px;
  transition: transform .2s ease, box-shadow .2s ease;
}
.ps-flow-card:hover{ transform: translateY(-1px); box-shadow:0 14px 36px rgba(0,0,0,.07) }
.ps-badge{ height:34px; width:34px; border-radius:10px; display:grid; place-items:center; color:#fff; font-weight:800;
  background:linear-gradient(135deg, var(--ps-accent), var(--ps-accent-2)); }
.ps-chip{
  display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:6px 10px; border-radius:999px;
  background:#f3f4f6; margin-left:auto; white-space:nowrap;
}

@media (min-width: 981px){
  .ps-cardflow{ position:sticky; top:96px; }
}

.ps-features{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:44px }
.ps-feature{ background:#fff; border:1px solid var(--ps-line); border-radius:16px; padding:18px; box-shadow:0 10px 24px rgba(0,0,0,.06) }
.ps-feature h4{ margin:0 0 6px 0; font-size:16px }
.ps-feature p{ margin:0; color:#6b7280; font-size:14px }

.ps-cta-band{
  --ring: radial-gradient(40% 140% at 10% 50%, rgba(124,92,255,.25), transparent),
          radial-gradient(40% 140% at 90% 50%, rgba(0,212,255,.25), transparent);
  margin:56px 0 14px; border-radius:20px; padding:16px; display:flex; gap:16px; align-items:center;
  background:
    var(--ring),
    linear-gradient(#fff, #fff) padding-box,
    conic-gradient(from 180deg, rgba(124,92,255,.6), rgba(0,212,255,.6), rgba(124,92,255,.6)) border-box;
  border:1px solid transparent;
}
.ps-cta-band strong{ font-size:15px }
.ps-cta-band .ps-input{ min-width:220px }

@media (prefers-reduced-motion: reduce){
  .ps-btn, .ps-flow-card{ transition:none }
  .ps-btn:hover, .ps-flow-card:hover{ transform:none; box-shadow:none }
}

@media (max-width: 980px){
  .ps-hero{ grid-template-columns:1fr; }
  .ps-title{ font-size:42px; }
}
@media (max-width: 560px){
  .ps-cta{ flex-direction:column; align-items:stretch }
  .ps-btn, .ps-input{ width:100% }
  .ps-logos{ gap:10px }
}
`;

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function Home() {
  const onSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="ps-wrap">
      <style>{css}</style>

      <div className="ps-container">
        <section className="ps-hero">
          { }
          <div>
            <span className="ps-eyebrow">PlaylistSupplier • grow with curators</span>
            <h1 className="ps-title">
              Find playlists with Instagram curators —
              <br /> get added in days, not weeks.
            </h1>
            <p className="ps-sub">
              PlaylistSupplier helps artists and labels discover active Spotify/Apple playlists where the curator is
              reachable on Instagram. Search, verify signals, and start a DM or email with one click.
            </p>

            <form className="ps-cta" onSubmit={onSubmit}>
              <label htmlFor="artist-url" className="ps-sr">Paste artist or track URL</label>
              <input id="artist-url" className="ps-input ps-kbd-focus" placeholder="Paste artist or track URL" />
              <button className="ps-btn ps-kbd-focus" type="submit">Find Playlists</button>
              <button className="ps-btn secondary ps-kbd-focus" type="button" aria-label="Watch product demo video">
                Watch Demo
              </button>
            </form>

            <div className="ps-logos" aria-label="trust and highlights">
              <span>Trusted by 500+ indie artists</span>
              <span className="ps-dot" aria-hidden="true" />
              <span><Check /> No spam lists</span>
              <span className="ps-dot" aria-hidden="true" />
              <span><Check /> IG contact included</span>
            </div>
          </div>

          { }
          <div className="ps-cardflow" aria-label="product flow preview">
            <div className="ps-flow-card">
              <div className="ps-badge" aria-hidden>🎯</div>
              <div>
                <strong>Targeting</strong>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Genre: chill edm · BPM 90–120 · Mood: uplifting</div>
              </div>
              <span className="ps-chip">Live filters</span>
            </div>

            <div className="ps-flow-card">
              <div className="ps-badge" aria-hidden>🔎</div>
              <div>
                <strong>Discover playlists</strong>
                <div style={{ color: "#6b7280", fontSize: 13 }}>4,213 results with curator IG in bio</div>
              </div>
              <span className="ps-chip">IG linked</span>
            </div>

            <div className="ps-flow-card">
              <div className="ps-badge" aria-hidden>✅</div>
              <div>
                <strong>Quality signals</strong>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Save-rate, recency, non-bot growth</div>
              </div>
              <span className="ps-chip">Anti-bot</span>
            </div>

            <div className="ps-flow-card">
              <div className="ps-badge" aria-hidden>✉️</div>
              <div>
                <strong>Outreach</strong>
                <div style={{ color: "#6b7280", fontSize: 13 }}>DM template + email + auto-translation</div>
              </div>
              <span className="ps-chip">1-click DM</span>
            </div>
          </div>
        </section>

        { }
        <section className="ps-features" aria-label="core features">
          <div className="ps-feature">
            <h4>Instagram-first curators</h4>
            <p>See IG handle, last activity, and response likelihood for each playlist.</p>
          </div>
          <div className="ps-feature">
            <h4>Smart scoring</h4>
            <p>Signals combine save-rate, skip-rate, and add cadence to avoid fake lists.</p>
          </div>
          <div className="ps-feature">
            <h4>Inbox-ready outreach</h4>
            <p>Personalized DM + email templates with placeholders for your track.</p>
          </div>
        </section>

        { }
        <section className="ps-cta-band" aria-label="signup">
          <strong>Ready to find your next 20 playlists?</strong>
          <div style={{
            display: "flex",
            gap: 8,
            marginLeft: "auto",
            flexWrap: "nowrap",
            minWidth: "320px",
            alignItems: "center"
          }}>
            <label htmlFor="signup-email" className="ps-sr">Email</label>
            <input
              id="signup-email"
              className="ps-input ps-kbd-focus"
              placeholder="Enter email"
              style={{ flex: "1 1 auto" }}
            />
            <button className="ps-btn ps-kbd-focus" style={{ flexShrink: 0 }}>Sign up free</button>
          </div>
        </section>

      </div>
    </div>
  );
}
