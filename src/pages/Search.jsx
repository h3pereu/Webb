import React, { useEffect, useMemo, useRef, useState } from "react";

/* Page-scoped styles (prefix psl-) */
const css = String.raw`
:root{
  --psl-accent:#6E5BFF;
  --psl-accent-2:#A78BFA;
  --psl-ink:#111318;
  --psl-text:#0b0b0c;
  --psl-muted:#6b7280;
  --psl-bg: radial-gradient(1200px 600px at 50% -10%, #f4f6ff, #f7f9fc 40%, #f7f9fc);
  --psl-card: rgba(255,255,255,.72);
  --psl-card-solid:#fff;
  --psl-border: rgba(17, 24, 39, .08);
  --psl-soft:#FAFBFE;

  /* multiselect layout vars */
  --psl-popHeadH: 48px; /* search header height inside the countries popover */
}

/* Subnav */
.psl-subnav{
  position: sticky; top: 56px; z-index: 5;
  background: rgba(255,255,255,.7);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--psl-border);
  display:flex; align-items:center; gap:8px;
  padding: 8px 18px; height: 40px;
  font-weight: 700; color: var(--psl-ink);
}

/* Page shell */
.psl-shell{
  height: calc(100vh - 56px - 40px);
  background: var(--psl-bg);
  overflow: hidden; /* kill stray horizontal scroll */
}

/* Layout */
.psl-grid{
  height:100%;
  display:grid;
  grid-template-columns: 292px 1fr;
  gap:18px;
  padding:16px 18px;
  overflow: hidden; /* safety */
}

/* Sidebar card */
.psl-side{
  position:relative;
  background: var(--psl-card);
  border: 1px solid var(--psl-border);
  border-radius:16px;
  overflow:auto; padding:12px;
  box-shadow: 0 12px 30px rgba(16,24,40,.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: box-shadow .25s ease, transform .15s ease;
}
.psl-side:hover{ box-shadow: 0 16px 40px rgba(16,24,40,.12); }
.psl-side h4{
  font-size:11px; letter-spacing:.1em; text-transform:uppercase;
  color:#8b8fa3; margin:10px 8px 6px;
}

.psl-search{
  display:flex; align-items:center; gap:8px;
  background:#fff; border:1px solid var(--psl-border); border-radius:12px;
  padding:10px 12px; margin:8px;
  transition: box-shadow .2s ease, border-color .2s ease, transform .12s ease;
}
.psl-search:focus-within{
  box-shadow:0 0 0 4px rgba(110,91,255,.14);
  border-color:#dadff0;
  transform: translateY(-1px);
}
.psl-search input{ border:none; outline:none; font-size:14px; width:100%; color:var(--psl-ink); }

.psl-group{ border-top:1px dashed var(--psl-border); margin:12px 0 0; padding:12px 8px 0; }

.psl-pills{ display:flex; flex-wrap:wrap; gap:8px; }
.psl-pill{
  padding:7px 11px; border-radius:999px; font-size:13px; cursor:pointer;
  background:#F0F2F7; color:#1b1d23; border:1px solid transparent;
  transition: transform .12s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.psl-pill:hover{ transform:translateY(-1px); background:#e9edf6; }
.psl-pill.selected{
  background: linear-gradient(90deg, var(--psl-accent), var(--psl-accent-2));
  color:#fff; border-color:transparent;
  box-shadow:0 6px 20px rgba(110,91,255,.22);
}

.psl-actions{ display:flex; gap:8px; padding:10px 8px 8px; }
.psl-btn{
  border:1px solid var(--psl-border); background:#fff; color:var(--psl-ink);
  border-radius:12px; padding:10px 12px; font-weight:600; cursor:pointer;
  transition: transform .12s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.psl-btn:hover{ background:#F5F7FB; transform:translateY(-1px); }
.psl-btn.primary{
  background:linear-gradient(90deg, var(--psl-accent), var(--psl-accent-2)); color:#fff; border-color:transparent;
  box-shadow:0 10px 24px rgba(110,91,255,.22);
}
.psl-btn.primary:hover{ filter:brightness(.985); }

/* Countries Multi-select */
.psl-multi{ margin: 6px; }
.psl-multi-btn{
  width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:10px 12px; border:1px solid var(--psl-border); border-radius:12px; background:#fff; cursor:pointer; font-weight:600;
  transition: background .2s ease, transform .12s ease, border-color .2s ease;
}
.psl-multi-btn:hover{ background:#f9f9ff; transform: translateY(-1px); }
.psl-multi-badge{ font-size:12px; color:var(--psl-muted); }

/* Popover container */
.psl-multi-pop{
  position:absolute; left:12px; right:12px; z-index:20; margin-top:8px;
  background:#fff; border:1px solid var(--psl-border); border-radius:14px;
  box-shadow: 0 22px 60px rgba(16,24,40,.18);
  max-height: 56vh; overflow:auto; animation: psl-pop .14s ease;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--psl-accent) #f1f3f7;
  overflow-x: hidden;
}
@keyframes psl-pop{ from{ opacity:0; transform:translateY(-4px) scale(.99); } to{ opacity:1; transform:translateY(0) scale(1); } }

/* Sticky search header (top of popover) */
.psl-multi-head{
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255,255,255,.96);
  backdrop-filter: blur(6px);
  border-bottom:1px solid var(--psl-border);
  padding: 8px 10px;
  height: var(--psl-popHeadH);
  box-sizing: border-box;
}

.psl-multi-search{ width:100%; border:1px solid var(--psl-border); border-radius:10px; padding:8px 10px; font-size:14px; }

/* Body spacing */
.psl-multi-body{ padding:8px 12px 12px; display:grid; gap:12px; }

/* Region card */
.psl-region{ border:1px dashed var(--psl-border); border-radius:12px; padding:12px; background:#fff; }

/* Sticky region header */
.psl-region > h5{
  position: sticky;
  top: var(--psl-popHeadH);
  z-index: 4;

  display: grid;
  grid-template-columns: 1fr auto; /* title | actions */
  align-items: center;
  gap: 10px;

  margin: -12px;
  margin-bottom: 8px;
  padding: 10px 12px;

  background: #fff;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px dashed var(--psl-border);

  font-size: 12px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color:#8b8fa3;

  white-space: normal;  /* allow wrapping for long names */
  line-height: 1.1;
  min-width: 0;
}

/* soft fade under sticky header */
.psl-region > h5::after{
  content:"";
  position:absolute;
  left:0; right:0; bottom:-1px;
  height: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,0));
  pointer-events: none;
}

/* header actions */
.psl-group-actions{ display:inline-flex; gap:6px; justify-self:end; white-space:nowrap; }
.psl-mini{ border:1px solid var(--psl-border); background:#fff; border-radius:8px; padding:4px 8px; font-size:12px; cursor:pointer; }

.psl-country{ display:flex; align-items:center; gap:8px; padding:4px 2px; font-size:14px; }
.psl-country input{ width:16px; height:16px; }

/* Sticky footer in popover */
.psl-multi-foot{ display:flex; gap:8px; padding:10px; border-top:1px solid var(--psl-border); background:#fff; position:sticky; bottom:0; z-index:5; }

/* WebKit scrollbar for popover */
.psl-multi-pop::-webkit-scrollbar { width: 0; } /* hidden by default */
.psl-multi-pop:hover::-webkit-scrollbar { width: 6px; }
.psl-multi-pop::-webkit-scrollbar-track { background:#f1f3f7; border-radius:10px; }
.psl-multi-pop::-webkit-scrollbar-thumb{
  background: linear-gradient(180deg, var(--psl-accent), var(--psl-accent-2));
  border-radius:10px; border:2px solid #f1f3f7;
}

/* Right column */
.psl-content{ min-width:0; display:flex; flex-direction:column; overflow:hidden; }

/* Toolbar */
.psl-toolbar{
  display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;
  background:var(--psl-card); border:1px solid var(--psl-border); border-radius:16px;
  padding:10px 12px; margin-bottom:10px;
  box-shadow: 0 10px 24px rgba(16,24,40,.06);
  backdrop-filter: blur(8px);
}
.psl-count{ font-weight:700; color:var(--psl-ink); }
.psl-actions-row{ display:flex; gap:8px; flex-wrap:wrap; }
.psl-actions-row .psl-btn{ border-radius:10px; padding:8px 11px; }

/* Table Card */
.psl-tableblock{
  flex:1; min-height:0; display:flex; flex-direction:column;
  background:var(--psl-card-solid);
  border:1px solid var(--psl-border);
  border-radius:16px; overflow:hidden;
  box-shadow: 0 20px 50px rgba(16,24,40,.08);
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
.psl-table tbody tr{ animation: psl-row .18s ease both; }
@keyframes psl-row { from{ opacity:0; transform: translateY(2px);} to{ opacity:1; transform:none;} }
.psl-table tbody tr:hover{ background:#f7f9ff; }
.psl-table tbody tr.is-selected{ background: #efeaff; }
.psl-url{ text-decoration:none; font-weight:600; color:#111; }
.psl-url:hover{ text-decoration:underline; }

.psl-chk{ width:16px; height:16px; }

/* Ellipsis */
.psl-col-name{ max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.psl-col-keywords, .psl-col-countries{ max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.psl-col-email{ max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Pager */
.psl-pager{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:10px 16px; border-top:1px solid var(--psl-border); background:#fff;
}
.psl-pageinfo{ font-size:13px; color:var(--psl-muted); }
.psl-pagectrl{ display:flex; align-items:center; gap:10px; }
.psl-pager button, .psl-pager select{
  border:1px solid var(--psl-border); background:#fff; border-radius:10px; padding:8px 12px; font-size:14px; cursor:pointer;
  transition: background .2s ease, transform .12s ease, box-shadow .2s ease;
}
.psl-pager button:hover{ background:#f4f6fb; transform: translateY(-1px); }
.psl-pager button:disabled{ opacity:.45; cursor:not-allowed; }

/* Scrollbars (sidebar + table) */
.psl-tablewrap, .psl-side { scrollbar-width: thin; scrollbar-color: var(--psl-accent) #f1f3f7; }
.psl-tablewrap::-webkit-scrollbar, .psl-side::-webkit-scrollbar{ width:10px; height:10px; }
.psl-tablewrap::-webkit-scrollbar-track, .psl-side::-webkit-scrollbar-track{ background:#f1f3f7; border-radius:10px; }
.psl-tablewrap::-webkit-scrollbar-thumb, .psl-side::-webkit-scrollbar-thumb{
  background: linear-gradient(180deg, var(--psl-accent), var(--psl-accent-2));
  border-radius:10px; border:2px solid #f1f3f7;
}

/* Responsive tweaks */
@media (max-width: 1100px){
  .psl-col-name{ max-width: 220px; }
  .psl-col-keywords, .psl-col-countries{ max-width: 180px; }
}
@media (max-width: 1000px){
  .psl-grid{ grid-template-columns: 1fr; }
}
`;

/* tiny search icon */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-3.5-3.5"/>
  </svg>
);

/* Region -> Countries */
const COUNTRY_GROUPS = {
  Europe: ["Czechia","Germany","Italy","France","Spain","Poland","UK","Netherlands","Sweden","Norway"],
  "North America": ["US","Canada","Mexico"],
  "South America": ["Brazil","Argentina","Chile","Colombia"],
  Asia: ["Japan","South Korea","China","India","Singapore","Thailand"],
  Oceania: ["Australia","New Zealand"],
};
const ALL_COUNTRIES = Object.values(COUNTRY_GROUPS).flat();

/* Grouped multi-select */
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

  const label = (() => {
    const arr = Array.from(selected);
    if (arr.length === 0) return "Countries (any)";
    if (arr.length <= 2) return arr.join(", ");
    return `${arr.slice(0,2).join(", ")} +${arr.length-2}`;
  })();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => {
      const pop = document.querySelector(".psl-multi-pop");
      if (pop && !pop.contains(e.target) && !e.target.closest(".psl-multi-btn")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
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
            <input className="psl-multi-search" placeholder="Search countries..." value={q} onChange={e=>setQ(e.target.value)} />
          </div>

          <div className="psl-multi-body">
            {Object.entries(filteredGroups).map(([region, arr]) => (
              <div className="psl-region" key={region}>
                <h5>
                  <span>{region}</span>
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
  const [qInput, setQInput] = useState("");  // raw input
  const [q, setQ] = useState("");            // debounced value
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const tableWrapRef = useRef(null);

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

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput); setCurrentPage(1); }, 250);
    return () => clearTimeout(t);
  }, [qInput]);

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
  const pageSize = 16;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (currentPage-1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  // auto-scroll table to top when page or filters change
  useEffect(() => {
    tableWrapRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, q, selectedTags, selectedCountries]);

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

  const clearAll = () => { setQInput(""); setQ(""); setSelectedTags(new Set()); setSelectedCountries(new Set()); setCurrentPage(1); };

  // CSV / TSV helpers
  const exportToCSV = (items, filename) => {
    const delimiter = ";";
    const header = ["Playlist Name","Curator","Countries","Keywords","Email","URL","IG"];
    const esc = (v) => {
      const s = String(v ?? "");
      return /["\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = items.map(r => [
      r.name, r.curator, r.countries.join(", "), r.keywords.join(", "), r.email, r.url, r.ig
    ].map(esc).join(delimiter));
    const csv = "\uFEFF" + [header.join(delimiter), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const exportToTSV = (items, filename) => {
    const header = ["Playlist Name","Curator","Countries","Keywords","Email","URL","IG"];
    const esc = (v) => String(v ?? "").replace(/\r?\n/g, " ");
    const lines = items.map(r => [
      r.name, r.curator, r.countries.join(", "), r.keywords.join(", "), r.email, r.url, r.ig
    ].map(esc).join("\t"));
    const tsv = "\uFEFF" + [header.join("\t"), ...lines].join("\n");
    const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // export buttons
  const exportVisible  = () => { if (rows.length)     exportToCSV(rows, "visible_playlists.csv"); };
  const exportAllFilt  = () => { if (filtered.length) exportToCSV(filtered, "filtered_playlists.csv"); };
  const exportSelected = () => {
    const selRows = data.filter(r => selectedIds.has(r.id));
    if (selRows.length) exportToCSV(selRows, "selected_playlists.csv");
  };

  return (
    <>
      <style>{css}</style>

      <div className="psl-subnav">Playlists</div>

      <div className="psl-shell">
        <div className="psl-grid">
          {/* LEFT: Filters */}
          <aside className="psl-side">
            <h4>Filters</h4>

            <label className="psl-search" aria-label="Search">
              <SearchIcon/>
              <input
                value={qInput}
                onChange={e=>setQInput(e.target.value)}
                placeholder="Search name, curator, email, IG..."
              />
            </label>

            <div className="psl-group">
              <h4>Keywords</h4>
              <div className="psl-pills">
                {["Chill","EDM","Hip-Hop","Lo-fi","Indie","Pop","Trap","House","Jazz","Acoustic"].map(t => (
                  <button
                    key={t}
                    className={"psl-pill " + (selectedTags.has(t) ? "selected" : "")}
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
              <div className="psl-tablewrap" ref={tableWrapRef}>
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
                      <tr key={r.id} className={selectedIds.has(r.id) ? "is-selected" : ""}>
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
                  Showing {filtered.length === 0 ? 0 : (start + 1)}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
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
