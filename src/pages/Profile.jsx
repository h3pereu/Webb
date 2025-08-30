import React, { useEffect, useState } from "react";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    display_name: "",
    avatar_url: "",
    bio: "",
    location: "",
    genres_csv: "",
    website: "",
    instagram: "",
    twitter: ""
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load profile");
        const { profile } = await res.json();
        setForm({
          display_name: profile.display_name || "",
          avatar_url: profile.avatar_url || "",
          bio: profile.bio || "",
          location: profile.location || "",
          genres_csv: (profile.genres || []).join(", "),
          website: profile.links?.website || "",
          instagram: profile.links?.instagram || "",
          twitter: profile.links?.twitter || ""
        });
      } catch (e) {
        setError(e.message || "Cannot load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMsg(""); setSaving(true);
    try {
      const payload = {
        display_name: form.display_name,
        avatar_url: form.avatar_url,
        bio: form.bio,
        location: form.location,
        genres: form.genres_csv.split(",").map(s => s.trim()).filter(Boolean),
        links: {
          website: form.website,
          instagram: form.instagram,
          twitter: form.twitter
        }
      };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:"Save failed"}));
        throw new Error(err.error || "Save failed");
      }
      setMsg("Saved ✓");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding:"2rem"}}>Načítám profil…</div>;

  return (
    <div className="profile-wrap" style={{minHeight:"calc(100vh - 56px)"}}>
      <style>{css}</style>
      <div className="profile-card">
        <h1>Profil</h1>

        <form className="profile-form" onSubmit={onSubmit}>
          <div className="row">
            <div className="col">
              <label>Zobrazované jméno</label>
              <input name="display_name" value={form.display_name} onChange={onChange} placeholder="např. Dominik" />
            </div>
            <div className="col">
              <label>Lokalita</label>
              <input name="location" value={form.location} onChange={onChange} placeholder="Praha, CZ" />
            </div>
          </div>

          <label>Avatar URL</label>
          <input name="avatar_url" value={form.avatar_url} onChange={onChange} placeholder="https://…" />

          <label>O mně</label>
          <textarea name="bio" value={form.bio} onChange={onChange} rows={5} placeholder="Krátké bio…" />

          <label>Oblíbené žánry (oddělené čárkou)</label>
          <input name="genres_csv" value={form.genres_csv} onChange={onChange} placeholder="house, rock, drum&bass" />

          <div className="row">
            <div className="col">
              <label>Web</label>
              <input name="website" value={form.website} onChange={onChange} placeholder="https://example.com" />
            </div>
            <div className="col">
              <label>Instagram</label>
              <input name="instagram" value={form.instagram} onChange={onChange} placeholder="https://instagram.com/…" />
            </div>
            <div className="col">
              <label>Twitter/X</label>
              <input name="twitter" value={form.twitter} onChange={onChange} placeholder="https://twitter.com/…" />
            </div>
          </div>

          {error && <div className="alert error">{error}</div>}
          {msg && <div className="alert ok">{msg}</div>}

          <button className="save" type="submit" disabled={saving}>
            {saving ? "Ukládám…" : "Uložit profil"}
          </button>
        </form>
      </div>
    </div>
  );
}

const css = `
.profile-wrap{ display:grid; place-items:start center; padding:24px; background:var(--page-bg, #f7f9fc); }
.profile-card{
  width:100%; max-width:900px; background:#fff; border:1px solid var(--psl-border, #e7eaf0);
  border-radius:18px; padding:22px; box-shadow:0 18px 50px rgba(16,24,40,.08);
}
.profile-card h1{ margin:0 0 10px 0; font-size:28px }
.profile-form{ display:grid; gap:12px }
.profile-form label{ font-weight:700; font-size:13px; color:#374151 }
.profile-form input, .profile-form textarea{
  width:100%; padding:12px; border:1px solid var(--psl-border, #e7eaf0); border-radius:12px; background:#fff; font-size:15px;
}
.profile-form input:focus, .profile-form textarea:focus{
  outline:none; box-shadow:0 0 0 6px rgba(110,91,255,.2); border-color:#cfd7ff;
}
.row{ display:grid; grid-template-columns: 1fr 1fr; gap:12px }
.col{ display:grid; gap:6px }
.alert{ border-radius:12px; padding:10px 12px; font-weight:600 }
.alert.error{ background:#fff3f3; border:1px solid #ffd2d2; color:#7a0c0c }
.alert.ok{ background:#f0fff6; border:1px solid #c3f0d0; color:#155e34 }
.save{
  width:max-content; padding:12px 16px; border-radius:12px; border:1px solid var(--psl-border,#e7eaf0);
  background:linear-gradient(90deg, var(--nav-accent,#6E5BFF), var(--nav-accent-2,#A78BFA)); color:#fff; font-weight:900; letter-spacing:.2px;
  box-shadow:0 14px 34px rgba(110,91,255,.22); cursor:pointer;
}
@media (max-width: 780px){ .row{ grid-template-columns: 1fr } }
`;
