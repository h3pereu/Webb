import React, { useEffect, useMemo, useState } from "react";

/* Page-scoped styles (prefix psl-) — polished */
const css = `
:root {
  --psl-accent:#6E5BFF;
  --psl-accent-2:#A78BFA;
  --psl-bg:#F7F9FC;
  --psl-card:#FFFFFF;
  --psl-border:#E7EAF0;
  --psl-muted:#6b7280;
  --psl-text:#0b0b0c;
  --psl-ink:#111318;
  --psl-soft:#FAFBFE;
}

/* Subnav with subtle glass and tight height */
.psl-subnav{
  position: sticky; top: 56px; z-index: 5;
  background: rgba(255,255,255,.9);
  backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--psl-border);
  display:flex; align-items:center; gap:8px;
  padding: 8px 18px; height: 40px;
  font-weight: 700; color: var(--psl-ink);
}

/* Page shell locked to viewport */
.psl-shell{ height: calc(100vh - 56px - 40px); background:var(--psl-bg); overflow:hidden; }

/* Layout */
.psl-grid{ height:100%; display:grid; grid-template-columns: 292px 1fr; gap:18px; padding:16px 18px; }

/* --- Sidebar card --- */
.psl-side{
  position:relative;
  background:var(--psl-card);
  border:1px solid var(--psl-border);
  border-radius:16px;
  overflow:auto; padding:12px;
  box-shadow: 0 8px 20px rgba(16,24,40,.06);
}
.psl-side h4{
  font-size:11px; letter-spacing:.1em; text-transform:uppercase;
  color:#8b8fa3; margin:10px 8px 6px;
}

.psl-search{
  display:flex; align-items:center; gap:8px;
  background:#fff; border:1px solid var(--psl-border); border-radius:12px;
  padding:10px 12px; margin:8px;
  transition: box-shadow .2s ease, border-color .2s ease;
}
.psl-search:focus-within{ box-shadow:0 0 0 3px rgba(110,91,255,.12); border-color:#ddd; }
.psl-search input{ border:none; outline:none; font-size:14px; width:100%; color:var(--psl-ink); }

.psl-group{ border-top:1px dashed var(--psl-border); margin:12px 0 0; padding:12px 8px 0; }

.psl-pills{ display:flex; flex-wrap:wrap; gap:8px; }
.psl-pill{
  padding:7px 11px; border-radius:999px; font-size:13px; cursor:pointer;
  background:#F0F2F7; color:#1b1d23; border:1px solid transparent;
  transition: transform .12s ease, background .2s ease, border-color .2s ease;
}
.psl-pill:hover{ transform:translateY(-1px); }
.psl-pill.selected{ background:#111; color:#fff; border-color:#111; box-shadow:0 2px 10px rgba(0,0,0,.08); }

.psl-actions{ display:flex; gap:8px; padding:10px 8px 8px; }
.psl-btn{
  border:1px solid var(--psl-border); background:#fff; color:var(--psl-ink);
  border-radius:12px; padding:10px 12px; font-weight:600; cursor:pointer;
  transition: transform .12s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.psl-btn:hover{ background:#F5F7FB; transform:translateY(-1px); }
.psl-btn.primary{ background:linear-gradient(90deg, var(--psl-accent), var(--psl-accent-2)); color:#fff; border-color:transparent; }
.psl-btn.primary:hover{ filter:brightness(.98); }

/* --- Countries Multi-select --- */
.psl-multi{ margin: 6px; }
.psl-multi-btn{
  width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:10px 12px; border:1px solid var(--psl-border); border-radius:12px; background:#fff; cursor:pointer; font-weight:600;
}
.psl-multi-btn:hover{ background:#f9f9ff; }
.psl-multi-badge{ font-size:12px; color:var(--psl-muted); }

.psl-multi-pop{
  position:absolute; left:12px; right:12px; z-index:20; margin-top:8px;
  background:#fff; border:1px solid var(--psl-border); border-radius:14px;
  box-shadow: 0 16px 40px rgba(16,24,40,.14);
  max-height: 56vh; overflow:auto;
  animation: psl-pop .14s ease;
}
@keyframes psl-pop{ from{ opacity:0; transform:translateY(-4px) scale(.99); } to{ opacity:1; transform:translateY(0) scale(1); } }
.psl-multi-head{ position:sticky; top:0; background:rgba(255,255,255,.92); backdrop-filter: blur(6px); border-bottom:1px solid var(--psl-border); padding:10px; }
.psl-multi-search{ width:100%; border:1px solid var(--psl-border); border-radius:10px; padding:8px 10px; font-size:14px; }
.psl-multi-body{ padding:8px 10px 12px; display:grid; gap:12px; }
.psl-region{ border:1px dashed var(--psl-border); border-radius:12px; padding:8px; }
.psl-region h5{
  margin:0 0 8px; font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:#8b8fa3;
  display:flex; justify-content:space-between; align-items:center;
}
.psl-group-actions{ display:flex; gap:6px; }
.psl-mini{ border:1px solid var(--psl-border); background:#fff; border-radius:8px; padding:4px 8px; font-size:12px; cursor:pointer; }
.psl-country{ display:flex; align-items:center; gap:8px; padding:4px 2px; font-size:14px; }
.psl-country input{ width:16px; height:16px; }
.psl-multi-foot{ display:flex; gap:8px; padding:10px; border-top:1px solid var(--psl-border); background:#fff; position:sticky; bottom:0; }

/* --- Right column --- */
.psl-content{ min-width:0; display:flex; flex-direction:column; overflow:hidden; }

/* Toolbar turns into pill row on small screens */
.psl-toolbar{
  display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;
  background:var(--psl-card); border:1px solid var(--psl-border); border-radius:16px;
  padding:10px 12px; margin-bottom:10px;
  box-shadow: 0 6px 16px rgba(16,24,40,.05);
}
.psl-count{ font-weight:700; color:var(--psl-ink); }
.psl-actions-row{ display:flex; gap:8px; flex-wrap:wrap; }
.psl-actions-row .psl-btn{ border-radius:10px; padding:8px 11px; }

/* --- Table Card (table + footer) --- */
.psl-tableblock{
  flex:1; min-height:0; display:flex; flex-direction:column;
  background:var(--psl-card); border:1px solid var(--psl-border); border-radius:16px; overflow:hidden;
  box-shadow: 0 8px 20px rgba(16,24,40,.06);
}
.psl-tablewrap{ flex:1; min-height:0; overflow:auto; }

/* Table */
.psl-table{ width:100%; border-collapse:separate; border-spacing:0; font-size:14px; color:var(--psl-text); }
.psl-table thead th{
  position:sticky; top:0;
  background:linear-gradient(180deg, var(--psl-soft), #fff);
  border-bottom:1px solid var(--psl-border);
  text-align:left; padding:10px 12px; font-weight:700; color:#3b3f4a; z-index:1;
}
.psl-table tbody td{ padding:10px 12px; border-bottom:1px solid #F1F3F8; }
.psl-table tbody tr:hover{ background:#f7f9ff; }
.psl-url{ text-decoration:none; font-weight:600; color:#111; }
.psl-url:hover{ text-decoration:underline; }

.psl-chk{ width:16px; height:16px; }

/* Column width & ellipsis for long text */
.psl-col-name{ max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.psl-col-keywords, .psl-col-countries{ max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.psl-col-email{ max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Footer pager (attached) */
.psl-pager{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:10px 16px; border-top:1px solid var(--psl-border); background:#fff;
}
.psl-pageinfo{ font-size:13px; color:var(--psl-muted); }
.psl-pagectrl{ display:flex; align-items:center; gap:10px; }
.psl-pager button, .psl-pager select{
  border:1px solid var(--psl-border); background:#fff; border-radius:10px; padding:8px 12px; font-size:14px; cursor:pointer;
}
.psl-pager button:hover{ background:#f4f6fb; }
.psl-pager button:disabled{ opacity:.45; cursor:not-allowed; }

/* custom scrollbars for sidebar + table */
.psl-tablewrap, .psl-side { scrollbar-width: thin; scrollbar-color: var(--psl-accent) #f1f3f7; }
.psl-tablewrap::-webkit-scrollbar, .psl-side::-webkit-scrollbar{ width:10px; height:10px; }
.psl-tablewrap::-webkit-scrollbar-track, .psl-side::-webkit-scrollbar-track{ background:#f1f3f7; border-radius:10px; }
.psl-tablewrap::-webkit-scrollbar-thumb, .psl-side::-webkit-scrollbar-thumb{
  background: linear-gradient(180deg, var(--psl-accent), var(--psl-accent-2));
  border-radius:10px; border:2px solid #f1f3f7;
}

@media (max-width: 1100px){
  .psl-col-name{ max-width: 220px; }
  .psl-col-keywords, .psl-col-countries{ max-width: 180px; }
}
@media (max-width: 1000px){ .psl-grid{ grid-template-columns: 1fr; } }
`;

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-3.5-3.5"/>
  </svg>
);

/* Region → Countries */
const COUNTRY_GROUPS = {
  Europe: ["Czechia","Germany","Italy","France","Spain","Poland","UK","Netherlands","Sweden","Norway"],
  "North America": ["US","Canada","Mexico"],
  "South America": ["Brazil","Argentina","Chile","Colombia"],
  Asia: ["Japan","South Korea","China","India","Singapore","Thailand"],
  Oceania: ["Australia","New Zealand"],
};
const ALL_COUNTRIES = Object.values(COUNTRY_GROUPS).flat();

/* Grouped, searchable multi-select */
function MultiSelectCountries({ selected, onChange, groups = COUNTRY_GROUPS }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const flat = useMemo(() => {
    const items = [];
    Object.entries(groups).forEach(([region, arr]) => arr.forEach(c => items.push({ region, name:c })));
    return items;
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return groups;
    const out = {};
    flat.forEach(({region, name}) => {
      if (name.toLowerCase().includes(needle)) (out[region] ||= []).push(name);
    });
    return out;
  }, [q, groups, flat]);

  const toggle = (name) => {
    const next = new Set(selected);
    next.has(name) ? next.delete(name) : next.add(name);
    onChange(next);
  };
  const selectGroup = (region) => {
    const arr = groups[region] || [];
    const next = new Set(selected);
    arr.forEach(c => next.add(c));
    onChange(next);
  };
  const clearGroup = (region) => {
    const arr = groups[region] || [];
    const next = new Set(selected);
    arr.forEach(c => next.delete(c));
    onChange(next);
  };
  const clearAll = () => onChange(new Set());

  // label
  const label = (() => {
    const arr = Array.from(selected);
    if (arr.length === 0) return "Countries (any)";
    if (arr.length <= 2) return arr.join(", ");
    return `${arr.slice(0,2).join(", ")} +${arr.length-2}`;
  })();

  // close popover on ESC / outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => {
      const pop = document.querySelector(".psl-multi-pop");
      if (pop && !pop.contains(e.target) && !e.target.closest(".psl-multi-btn")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("mousedown", onClick); };
  }, [open]);

  return (
    <div className="psl-multi">
      <button type="button" className="psl-multi-btn" onClick={()=>setOpen(o=>!o)} aria-expanded={open}>
        <span>{label}</span>
        <span className="psl-multi-badge">▼</span>
      </button>

      {open && (
        <div className="psl-multi-pop" role="dialog" aria-label="Select countries by region">
          <div className="psl-multi-head">
            <input className="psl-multi-search" placeholder="Search countries…" value={q} onChange={e=>setQ(e.target.value)} />
          </div>

          <div className="psl-multi-body">
            {Object.entries(filteredGroups).map(([region, arr]) => (
              <div className="psl-region" key={region}>
                <h5>
                  {region}
                  <span className="psl-group-actions">
                    <button className="psl-mini" type="button" onClick={()=>selectGroup(region)}>Select all</button>
                    <button className="psl-mini" type="button" onClick={()=>clearGroup(region)}>Clear</button>
                  </span>
                </h5>
                {arr.length === 0 && <div className="psl-country" style={{color:"#8b8fa3"}}>No matches</div>}
                {arr.map(name => (
                  <label className="psl-country" key={region + "_" + name}>
                    <input type="checkbox" checked={selected.has(name)} onChange={()=>toggle(name)} />
                    {name}
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="psl-multi-foot">
            <button className="psl-btn" type="button" onClick={clearAll}>Clear all</button>
            <button className="psl-btn primary" type="button" onClick={()=>setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Search() {
  // demo data setup
  const keywordsAll   = ["Chill","EDM","Hip-Hop","Lo-fi","Indie","Pop","Trap","House","Jazz","Acoustic"];
  const playlistNames = ["Chill Vibes","EDM Blast","Morning Acoustic","Late Night Drive","Study Beats","Hip-Hop Central","Lo-fi Focus","Jazz Lounge","Summer Party","Throwback Mix"];
  const curators      = ["DJ Smooth","Anna Beats","Mike Wave","LoFiMaster","ChillZone","PlaylistPro"];

  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [pageSize] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const rnd = (arr) => arr[Math.floor(Math.random()*arr.length)];
    const rndMany = (arr, n) => { const a=[...arr]; const out=[]; for(let i=0;i<n && a.length;i++){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; };
    const rows = [];
    for (let i=0;i<220;i++){
      const name = rnd(playlistNames);
      const curator = rnd(curators);
      const countries = rndMany(ALL_COUNTRIES, Math.ceil(Math.random()*2)).sort();
      const keywords  = rndMany(keywordsAll, Math.ceil(Math.random()*3)).sort();
      const email = `${curator.replace(/\s+/g,'.').toLowerCase()}@example.com`;
      const ig = `@${curator.replace(/\s+/g,'').toLowerCase()}`;
      rows.push({
        id: crypto.randomUUID(),
        name, curator, countries, keywords, email,
        url: `https://example.com/${name.replace(/\s+/g,'-').toLowerCase()}`,
        ig
      });
    }
    setData(rows);
  }, []);

  // filtering
  const filtered = useMemo(() => {
    const qx = q.trim().toLowerCase();
    return data.filter(row => {
      if (selectedCountries.size && !row.countries.some(c => selectedCountries.has(c))) return false;
      if (selectedTags.size && !row.keywords.some(k => selectedTags.has(k))) return false;
      if (qx){
        const hay = [row.name,row.curator,row.countries.join(" "),row.keywords.join(" "),row.email,row.ig,row.url].join(" ").toLowerCase();
        if (!hay.includes(qx)) return false;
      }
      return true;
    });
  }, [data, q, selectedTags, selectedCountries]);

  // paging
  const totalPages = Math.max(1, Math.ceil(filtered.length / 16));
  const start = (currentPage-1) * 16;
  const rows = filtered.slice(start, start + 16);

  // selection
  const toggleRow = (id) => setSelectedIds(prev => { const c=new Set(prev); c.has(id)?c.delete(id):c.add(id); return c; });
  const toggleAllVisible = () => {
    const visibleIds = rows.map(r => r.id);
    const allSel = visibleIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const c=new Set(prev);
      if (allSel) visibleIds.forEach(id => c.delete(id)); else visibleIds.forEach(id => c.add(id));
      return c;
    });
  };

  const clearAll = () => { setQ(""); setSelectedTags(new Set()); setSelectedCountries(new Set()); setCurrentPage(1); };

  // exports (semicolon CSV for CZ Excel; TSV fallback)
  const exportToCSV = (items, filename) => {
    const delimiter = ";";
    const header = ["Playlist Name","Curator","Countries","Keywords","Email","URL","IG"];
    const esc = (v) => { const s=String(v ?? ""); return /["\n;]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
    const lines = items.map(r => [
      r.name, r.curator, r.countries.join(", "), r.keywords.join(", "), r.email, r.url, r.ig
    ].map(esc).join(delimiter));
    const csv = "\\uFEFF" + [header.join(delimiter), ...lines].join("\\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const exportToTSV = (items, filename) => {
    const header = ["Playlist Name","Curator","Countries","Keywords","Email","URL","IG"];
    const esc = (v) => String(v ?? "").replace(/\\r?\\n/g," ");
    const lines = items.map(r => [r.name, r.curator, r.countries.join(", "), r.keywords.join(", "), r.email, r.url, r.ig].map(esc).join("\\t"));
    const tsv = "\\uFEFF" + [header.join("\\t"), ...lines].join("\\n");
    const blob = new Blob([tsv], { type:"text/tab-separated-values;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const exportSelected = () => { const items = data.filter(r => selectedIds.has(r.id)); if (items.length) exportToCSV(items, "selected_playlists.csv"); };
  const exportVisible  = () => { if (rows.length) exportToCSV(rows, "visible_playlists.csv"); };
  const exportAllFilt  = () => { if (filtered.length) exportToCSV(filtered, "all_filtered_playlists.csv"); };

  return (
    <>
      <style>{css}</style>

      <div className="psl-subnav">Playlists</div>

      <div className="psl-shell">
        <div className="psl-grid">
          {/* LEFT: Filters */}
          <aside className="psl-side">
            <h4>Filters</h4>

            <div className="psl-search">
              <SearchIcon/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, curator, email, IG…" />
            </div>

            <div className="psl-group">
              <h4>Keywords</h4>
              <div className="psl-pills">
                {["Chill","EDM","Hip-Hop","Lo-fi","Indie","Pop","Trap","House","Jazz","Acoustic"].map(t => (
                  <button key={t}
                    className={`psl-pill ${selectedTags.has(t)?"selected":""}`}
                    onClick={()=>setSelectedTags(p=>{const n=new Set(p); n.has(t)?n.delete(t):n.add(t); setCurrentPage(1); return n;})}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="psl-group">
              <h4>Countries</h4>
              <MultiSelectCountries
                selected={selectedCountries}
                onChange={(next)=>{ setSelectedCountries(next); setCurrentPage(1); }}
              />
            </div>

            <div className="psl-actions">
              <button className="psl-btn" onClick={clearAll}>Clear</button>
              <button className="psl-btn primary" onClick={()=>setCurrentPage(1)}>Apply</button>
            </div>
          </aside>

          {/* RIGHT: Toolbar + Table card with attached pager */}
          <section className="psl-content">
            <div className="psl-toolbar">
              <div className="psl-count">Total {filtered.length}</div>
              <div className="psl-actions-row">
                <button className="psl-btn" onClick={exportVisible} disabled={rows.length===0}>Export Visible (CSV)</button>
                <button className="psl-btn" onClick={()=>exportToTSV(rows,"visible_playlists.tsv")} disabled={rows.length===0}>Export Visible (TSV)</button>
                <button className="psl-btn" onClick={exportAllFilt} disabled={filtered.length===0}>Export All (filtered)</button>
                <button className="psl-btn primary" onClick={exportSelected} disabled={selectedIds.size===0}>Export Selected</button>
              </div>
            </div>

            <div className="psl-tableblock">
              <div className="psl-tablewrap">
                <table className="psl-table">
                  <thead>
                    <tr>
                      <th style={{width:"4%"}}>
                        <input
                          className="psl-chk"
                          type="checkbox"
                          onChange={toggleAllVisible}
                          checked={rows.length>0 && rows.every(r => selectedIds.has(r.id))}
                          aria-label="Toggle select all visible rows"
                        />
                      </th>
                      <th style={{width:"22%"}}>Playlist Name</th>
                      <th style={{width:"16%"}}>Curator</th>
                      <th style={{width:"14%"}}>Countries</th>
                      <th style={{width:"16%"}}>Keywords</th>
                      <th style={{width:"16%"}}>Email</th>
                      <th style={{width:"6%"}}>URL</th>
                      <th style={{width:"6%"}}>IG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r)=>(
                      <tr key={r.id}>
                        <td><input className="psl-chk" type="checkbox" checked={selectedIds.has(r.id)} onChange={()=>toggleRow(r.id)} aria-label={`Select ${r.name}`}/></td>
                        <td className="psl-col-name" title={r.name}>{r.name}</td>
                        <td>{r.curator}</td>
                        <td className="psl-col-countries" title={r.countries.join(", ")}>{r.countries.join(", ")}</td>
                        <td className="psl-col-keywords" title={r.keywords.join(", ")}>{r.keywords.join(", ")}</td>
                        <td className="psl-col-email" title={r.email}><a className="psl-url" href={`mailto:${r.email}`}>{r.email}</a></td>
                        <td><a className="psl-url" href={r.url} target="_blank" rel="noreferrer">Link</a></td>
                        <td><a className="psl-url" href={`https://instagram.com/${r.ig.replace(/^@/,"")}`} target="_blank" rel="noreferrer">{r.ig}</a></td>
                      </tr>
                    ))}
                    {rows.length===0 && (
                      <tr><td colSpan="8" style={{textAlign:"center", padding:"18px 0", color:"var(--psl-muted)"}}>No results match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="psl-pager">
                <div className="psl-pageinfo">
                  Showing {filtered.length === 0 ? 0 : (start + 1)}–{Math.min(start + 16, filtered.length)} of {filtered.length}
                </div>
                <div className="psl-pagectrl">
                  <button aria-label="Prev" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}>←</button>
                  <span>Page</span>
                  <select value={currentPage} onChange={e=>setCurrentPage(parseInt(e.target.value,10))}>
                    {Array.from({length: totalPages}, (_,i)=>i+1).map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                  <span>of {totalPages}</span>
                  <button aria-label="Next" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>→</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
