import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const redirect = params.get("redirect") || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      nav(redirect);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <style>{css}</style>
      <div className="auth-grid">
        <div className="auth-panel auth-left">
          <div className="brand">
            <div className="logo">🎧</div>
            <div className="brand-names">
              <span className="brand-top">Astra Radio</span>
              <span className="brand-sub">member access</span>
            </div>
          </div>
          <h1 className="title">Welcome back</h1>
          <p className="subtitle">Log in to continue.</p>
          <ul className="bullets">
            <li>🔒 Secure session</li>
            <li>⚡ Credits for Search</li>
            <li>🎨 Clean UI</li>
          </ul>
          <div className="illus" aria-hidden>
            <div className="blob b1" />
            <div className="blob b2" />
            <div className="blob b3" />
          </div>
        </div>

        <div className="auth-panel auth-right">
          <div className="card">
            <h2 className="card-title">Log in</h2>
            <form onSubmit={onSubmit} className="form">
              <div className={"field" + (email ? " has-value" : "")}>
                <input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" />
                <label htmlFor="email">Email</label>
              </div>

              <div className={"field" + (password ? " has-value" : "")}>
                <input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="current-password" />
                <label htmlFor="password">Password</label>
                <button type="button" className="showpw" onClick={()=>setShowPw(v=>!v)} aria-label={showPw ? "Hide password" : "Show password"} title={showPw ? "Hide" : "Show"}>{showPw ? "🙈" : "👁️"}</button>
              </div>

              {error && <div className="error" role="alert">{error}</div>}
              <button className="submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Log in"}</button>
            </form>

            <p className="swap">No account? <Link to="/signup">Create one</Link></p>
          </div>
          <p className="footnote">Dev-only local auth.</p>
        </div>
      </div>
    </div>
  );
}

const css = `
:root { --bg: var(--page-bg, #f7f9fc); --panel: #ffffff; --card: rgba(255,255,255,.86); --muted: var(--psl-muted, #6b7280); --text: var(--psl-text, #0b0b0c); --accent: var(--nav-accent, #6E5BFF); --accent-2: var(--nav-accent-2, #A78BFA); --ring: rgba(110,91,255,.30); --border: var(--psl-border, #e7eaf0); }
*{box-sizing:border-box}
.auth-wrap{min-height:100dvh;background:
  radial-gradient(1100px 700px at -10% -10%, rgba(110,91,255,.12) 0, transparent 60%),
  radial-gradient(1100px 800px at 120% 0%, rgba(167,139,250,.16) 0, transparent 55%),
  linear-gradient(180deg, var(--bg), var(--bg)); color:var(--text); display:grid; place-items:center; padding:24px}
.auth-grid{width:100%; max-width:1100px; display:grid; grid-template-columns:1.2fr 1fr; gap:24px}
.auth-panel{background:var(--panel); border:1px solid var(--border); border-radius:22px; position:relative; overflow:hidden}
.auth-left{padding:28px; display:grid; align-content:start; gap:14px; isolation:isolate}
.brand{display:flex; align-items:center; gap:12px; margin-bottom:10px}
.logo{width:44px; height:44px; display:grid; place-items:center; background:linear-gradient(135deg, var(--accent), var(--accent-2)); border-radius:14px; font-size:22px; box-shadow:0 10px 40px rgba(110,91,255,.25)}
.brand-names{display:flex; flex-direction:column; line-height:1.05}
.brand-top{font-weight:900; letter-spacing:.2px}
.brand-sub{font-size:12px; color:var(--muted)}
.title{font-size:38px; line-height:1.05; margin:8px 0 6px 0; color:var(--text)}
.subtitle{color:var(--muted); margin:0 0 10px 0}
.bullets{display:grid; gap:6px; padding-left:0; list-style:none; color:#2a313d; margin:0}
.illus{position:absolute; inset:0; z-index:-1; overflow:hidden}
.blob{position:absolute; filter:blur(44px); opacity:.45}
.b1{width:380px; height:380px; background:radial-gradient(circle at 30% 30%, var(--accent), transparent 60%); top:-60px; left:-60px}
.b2{width:420px; height:420px; background:radial-gradient(circle at 70% 40%, var(--accent-2), transparent 60%); bottom:-80px; right:-100px}
.b3{width:240px; height:240px; background:radial-gradient(circle at 50% 50%, #61dafb, transparent 60%); bottom:30%; left:38%}
.auth-right{padding:28px; display:grid; align-content:center}
.card{background:var(--card); border:1px solid var(--border); backdrop-filter: blur(12px); border-radius:18px; padding:22px; box-shadow: 0 18px 60px rgba(16,24,40,.12)}
.card-title{margin:0 0 12px 0; font-weight:900; font-size:22px; color:var(--text)}
.form{display:grid; gap:14px}
.field{position:relative}
.field input{width:100%; padding:14px 44px 14px 14px; border-radius:14px; border:1px solid var(--border); background:#fff; color:var(--text); font-size:15px; outline:none}
.field input:focus{ box-shadow:0 0 0 6px var(--ring); border-color:#cfd7ff }
.field label{pointer-events:none; position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted); transition: all .18s ease; background:transparent; padding:0 .2em}
.field.has-value label, .field input:focus + label{ top:-8px; font-size:12px; color:#3a4150; background:var(--panel) }
.showpw{position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:transparent; font-size:18px; cursor:pointer; color:var(--muted)}
.error{background:#fff3f3; border:1px solid #ffd2d2; color:#7a0c0c; padding:10px 12px; border-radius:12px}
.submit{padding:13px 14px; border-radius:14px; font-weight:900; letter-spacing:.2px; border:1px solid var(--border); cursor:pointer; background:linear-gradient(90deg, var(--accent), var(--accent-2)); color:#fff; box-shadow:0 14px 34px rgba(110,91,255,.22)}
.swap{margin-top:10px; color:var(--muted)}
.swap a{color:var(--accent); font-weight:800; text-decoration:none}
.footnote{color:var(--muted); font-size:12px; text-align:center; margin-top:10px}
@media (max-width:920px){ .auth-grid{grid-template-columns:1fr} .auth-left{min-height:300px} }
`;
