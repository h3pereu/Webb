import React from "react";

// Styles scoped to this page (prefixed with ps- to avoid collisions)
const css = `
:root{
  --ps-bg: radial-gradient(1200px 600px at 80% 20%, rgba(129,161,255,.25), transparent 60%),
           radial-gradient(900px 500px at 10% 80%, rgba(255,170,210,.22), transparent 60%),
           linear-gradient(180deg, #fff, #fbfbfb 40%, #ffffff 100%);
  --ps-black:#0b0b0c; --ps-muted:#6b7280; --ps-accent:#7c5cff; --ps-accent-2:#00d4ff;
}
.ps-wrap{background:var(--ps-bg); min-height:calc(100vh - 56px);}
.ps-container{max-width:1150px; margin:0 auto; padding:48px 24px;}
.ps-hero{display:grid; grid-template-columns:1.1fr .9fr; gap:40px; align-items:center}
.ps-eyebrow{display:inline-flex; align-items:center; gap:8px; font-weight:600; font-size:13px; color:#3f3f46; background:#fff; border:1px solid #eee; border-radius:999px; padding:8px 12px; box-shadow:0 8px 24px rgba(0,0,0,.06)}
.ps-title{font-size:54px; line-height:1.05; letter-spacing:-.02em; font-weight:800; color:var(--ps-black); margin:16px 0}
.ps-sub{font-size:18px; color:var(--ps-muted); max-width:52ch}
.ps-cta{display:flex; gap:10px; margin-top:22px}
.ps-input{flex:1; min-width:260px; padding:14px 16px; border:1px solid #ddd; border-radius:12px; font-size:16px}
.ps-btn{padding:14px 18px; border:none; border-radius:12px; font-weight:700; cursor:pointer; transition:.2s transform, .2s box-shadow; background:var(--ps-black); color:#fff}
.ps-btn:hover{transform:translateY(-2px); box-shadow:0 10px 20px rgba(0,0,0,.15)}
.ps-btn.secondary{background:#fff; color:#000; border:1px solid #e5e7eb}
.ps-logos{display:flex; gap:26px; align-items:center; margin-top:28px; opacity:.7; flex-wrap:wrap}
.ps-logos span{font-size:13px; color:#6b7280}

.ps-cardflow{display:grid; grid-template-rows:auto; gap:16px; position:relative}
.ps-flow-card{background:#fff; border:1px solid #eee; border-radius:16px; padding:14px 16px; box-shadow:0 10px 30px rgba(0,0,0,.05); display:flex; align-items:center; gap:12px}
.ps-badge{height:32px; width:32px; border-radius:10px; display:grid; place-items:center; background:linear-gradient(135deg, var(--ps-accent), var(--ps-accent-2)); color:#fff; font-weight:800}
.ps-chip{display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:6px 10px; border-radius:999px; background:#f3f4f6; margin-left:auto}

/* Features */
.ps-features{display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:44px}
.ps-feature{background:#fff; border:1px solid #eee; border-radius:16px; padding:18px; box-shadow:0 10px 24px rgba(0,0,0,.06)}
.ps-feature h4{margin:0 0 6px 0; font-size:16px}
.ps-feature p{margin:0; color:#6b7280; font-size:14px}

/* CTA band */
.ps-cta-band{margin:56px 0 14px; background:linear-gradient(135deg, rgba(124,92,255,.12), rgba(0,212,255,.12)); border:1px dashed rgba(124,92,255,.35); border-radius:20px; padding:16px; display:flex; gap:16px; align-items:center}
.ps-cta-band strong{font-size:15px}

/* Responsive */
@media (max-width: 980px){
  .ps-hero{grid-template-columns:1fr;}
}
`;

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
);

export default function Home(){
  return (
    <div className="ps-wrap">
      <style>{css}</style>
      <div className="ps-container">
        <section className="ps-hero">
          {/* Left: copy + CTA */}
          <div>
            <span className="ps-eyebrow">PlaylistSupplier • grow with curators</span>
            <h1 className="ps-title">Find playlists with Instagram curators —<br/> get added in days, not weeks.</h1>
            <p className="ps-sub">PlaylistSupplier helps artists and labels discover active Spotify/Apple playlists where the curator is reachable on Instagram. Search, verify signals, and start a DM or email with one click.</p>
            <div className="ps-cta">
              <input className="ps-input" placeholder="Paste artist or track URL" />
              <button className="ps-btn">Find Playlists</button>
              <button className="ps-btn secondary">Watch Demo</button>
            </div>
            <div className="ps-logos">
              <span>Trusted by 500+ indie artists</span>
              <span><Check/> No spam lists</span>
              <span><Check/> IG contact included</span>
            </div>
          </div>

          {/* Right: flow mock like Apollo but different */}
          <div className="ps-cardflow">
            <div className="ps-flow-card"><div className="ps-badge">🎯</div><div>
              <strong>Targeting</strong><div style={{color:'#6b7280',fontSize:13}}>Genre: chill edm · BPM 90–120 · Mood: uplifting</div></div>
              <span className="ps-chip">Live filters</span>
            </div>
            <div className="ps-flow-card"><div className="ps-badge">🔎</div><div>
              <strong>Discover playlists</strong><div style={{color:'#6b7280',fontSize:13}}>4,213 results with curator IG in bio</div></div>
              <span className="ps-chip">IG linked</span>
            </div>
            <div className="ps-flow-card"><div className="ps-badge">✅</div><div>
              <strong>Quality signals</strong><div style={{color:'#6b7280',fontSize:13}}>Save-rate, recency, non-bot growth</div></div>
              <span className="ps-chip">Anti-bot</span>
            </div>
            <div className="ps-flow-card"><div className="ps-badge">✉️</div><div>
              <strong>Outreach</strong><div style={{color:'#6b7280',fontSize:13}}>DM template + email + auto-translation</div></div>
              <span className="ps-chip">1‑click DM</span>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="ps-features">
          <div className="ps-feature"><h4>Instagram-first curators</h4><p>See IG handle, last activity, and response likelihood for each playlist.</p></div>
          <div className="ps-feature"><h4>Smart scoring</h4><p>Signals combine save-rate, skip-rate, and add cadence to avoid fake lists.</p></div>
          <div className="ps-feature"><h4>Inbox-ready outreach</h4><p>Personalized DM + email templates with placeholders for your track.</p></div>
        </section>

        {/* CTA band */}
        <section className="ps-cta-band">
          <strong>Ready to find your next 20 playlists?</strong>
          <div style={{display:'flex',gap:8, marginLeft:'auto'}}>
            <input className="ps-input" placeholder="Enter email" style={{minWidth:220}}/>
            <button className="ps-btn">Sign up free</button>
          </div>
        </section>
      </div>
    </div>
  );
}
