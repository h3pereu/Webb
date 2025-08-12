import React, { useEffect, useMemo, useRef, useState } from "react";

/* Scoped styles for this page (prefix: psl-) */
const css = `
:root { --psl-accent:#6E5BFF; --psl-bg:#F7F9FC; --psl-border:#E7EAF0; --psl-text:#0b0b0c; --psl-muted:#6b7280; }

/* subnav flush under navbar */
.psl-subnav{
  position: sticky; top: 56px; z-index: 99;
  background:#fff; border-bottom:1px solid var(--psl-border);
  display:flex; align-items:center; gap:8px; padding:10px 18px;
}

/* lock page to viewport (no page scroll) */
.psl-shell{ height: calc(100vh - 56px - 40px); background:var(--psl-bg); overflow:hidden; }

/* two-column layout */
.psl-grid{ height:100%; display:grid; grid-template-columns: 280px 1fr; gap:16px; padding:16px 18px; }

/* sidebar */
.psl-side{
  background:#fff; border:1px solid var(--psl-border); border-radius:14px;
  overflow:auto; padding:12px;
  box-shadow:0 6px 16px rgba(0,0,0,.04);
}
.psl-side h4{ font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#8b8fa3; margin:8px 6px; }
.psl-search{ display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--psl-border); border-radius:10px; padding:8px 10px; margin:6px; }
.psl-search input{ border:none; outline:none; font-size:14px; width:100%; }
.psl-group{ border-top:1px dashed var(--psl-border); margin-top:12px; padding-top:10px; }
.psl-pills{ display:flex; flex-wrap:wrap; gap:8px; padding:6px; }
.psl-pill{ padding:7px 11px; border-radius:999px; background:#EFF1F6; border:1px solid transparent; font-size:13px; cursor:pointer; }
.psl-pill:hover{ transform:translateY(-1px); }
.psl-pill.selected{ background:#111; color:#fff; }
.psl-checks{ display:grid; gap:8px; padding:6px; }
.psl-check{ display:flex; align-items:center; gap:8px; font-size:14px; }
.psl-actions{ display:flex; gap:8px; padding:8px 6px; }
.psl-btn{ border:1px solid var(--psl-border); background:#fff; border-radius:10px; padding:8px 12px; font-weight:600; cursor:pointer; }
.psl-btn.primary{ background:var(--psl-accent); color:#fff; border-color:transparent; }

/* content column */
.psl-content{ min-width:0; display:flex; flex-direction:column; overflow:hidden; }
.psl-toolbar{
  display:flex; justify-content:space-between; align-items:center;
  background:#fff; border:1px solid var(--psl-border); border-radius:14px; padding:10px 12px; margin-bottom:10px;
}
.psl-count{ font-size:14px; font-weight:600; color:#333; }

/* table area */
.psl-tablewrap{ flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden; }
.psl-table{
  width:100%; border-collapse:separate; border-spacing:0; background:#fff;
  border:1px solid var(--psl-border); border-radius:14px; overflow:hidden;
  font-size:14px;
}
.psl-table thead th{
  position:sticky; top:0; background:#FAFBFE; border-bottom:1px solid var(--psl-border);
  text-align:left; padding:12px 10px; font-weight:700; color:#3b3f4a;
}
.psl-table tbody{ display:block; overflow:auto; }
.psl-table thead, .psl-table tbody tr{ display:table; width:100%; table-layout:fixed; }
.psl-table tbody td{ padding:12px 10px; border-bottom:1px solid #F1F3F8; }
.psl-table tbody tr:hover{ background:#f5f8ff; }
.psl-url{ text-decoration:none; font-weight:600; color:#111; }
.psl-url:hover{ text-decoration:underline; }

/* pagination — sits directly under the table */
.psl-pager{
  position: static;
  margin-top: 12px;
  padding: 10px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background: transparent;
  border-top: 1px solid var(--psl-border);
}
.psl-pager button, .psl-pager select{
  border:1px solid var(--psl-border);
  background:#fff;
  border-radius:10px;
  padding:8px 12px;
  font-size:14px;
  cursor:pointer;
}
.psl-pager button:disabled{ opacity:.45; cursor:not-allowed; }

/* responsive */
@media (max-width: 1000px){
  .psl-grid{ grid-template-columns: 1fr; }
}

.psl-pager { margin-top: 12px; }
`;

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-3.5-3.5"/>
  </svg>
);

export default function Search() {
  // demo data
  const playlistNames = ["Chill Vibes","EDM Blast","Morning Acoustic","Late Night Drive","Study Beats","Hip-Hop Central","Lo-fi Focus","Jazz Lounge","Summer Party","Throwback Mix"];
  const descriptions  = ["Perfect for relaxing afternoons.","High energy beats to keep you moving.","Gentle acoustic tunes for the morning.","Great for night drives.","Focus music for work or study.","The best in classic and modern hip-hop.","Soothing lo-fi sounds.","Smooth jazz to set the mood.","Get the party started!","Hits from the 90s and 2000s."];
  const infos         = ["Updated weekly","Over 100 tracks","Handpicked selection","Top charts","User favorites","Editor's choice"];
  const creators      = ["DJ Smooth","Anna Beats","Mike Wave","LoFiMaster","ChillZone","PlaylistPro"];
  const countriesList = ["USA","UK","Germany","Canada"];
  const tagOptions    = ["Chill","EDM","Hip-Hop","Lo-fi"];

  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const tableRef = useRef(null);
  const tbodyRef = useRef(null);

  // seed demo rows
  useEffect(() => {
    const rnd = (arr) => arr[Math.floor(Math.random()*arr.length)];
    const rows = [];
    for (let i=0;i<120;i++){
      const name = rnd(playlistNames), desc=rnd(descriptions), info=rnd(infos), creator=rnd(creators), c=rnd(countriesList);
      rows.push({ name, desc, info, creator, country:c, url:`https://example.com/${name.replace(/\s+/g,'-').toLowerCase()}` });
    }
    setData(rows);
  }, []);

  // Fit the table body height & page size to viewport (pager is below the table)
  useEffect(() => {
    const compute = () => {
      const navbarH = document.querySelector(".navbar")?.getBoundingClientRect().height ?? 56;
      const subnavH = document.querySelector(".psl-subnav")?.getBoundingClientRect().height ?? 40;
      const vh = window.innerHeight;
      const shellH = vh - navbarH - subnavH;

      const toolbarH = document.querySelector(".psl-toolbar")?.getBoundingClientRect().height ?? 48;
      const headerH  = tableRef.current?.querySelector("thead")?.getBoundingClientRect().height ?? 44;
      const innerPad = 24;
      const pagerH = 56; // pagination is after the table, so we don't reserve space above

      const tbodyHeight = shellH - toolbarH - pagerH - innerPad - headerH;
      if (tbodyRef.current) tbodyRef.current.style.height = `${Math.max(120, tbodyHeight)}px`;

      const rowH = tableRef.current?.querySelector("tbody tr")?.getBoundingClientRect().height ?? 48;
      const rows = Math.max(5, Math.floor(tbodyHeight / rowH));
      setPageSize(rows);
      setCurrentPage(1);
    };
    const t = setTimeout(compute, 0);
    window.addEventListener("resize", compute);
    return () => { clearTimeout(t); window.removeEventListener("resize", compute); };
  }, []);

  // filtering
  const filtered = useMemo(() => {
    const qx = q.trim().toLowerCase();
    return data.filter(row => {
      if (selectedCountries.size && !selectedCountries.has(row.country)) return false;
      if (selectedTags.size){
        const tags = Array.from(selectedTags);
        const hay = (row.name+" "+row.desc+" "+row.info+" "+row.creator+" "+row.country).toLowerCase();
        if (!tags.some(t => hay.includes(t.toLowerCase()))) return false;
      }
      if (qx){
        const hay = (row.name+" "+row.desc+" "+row.info+" "+row.creator+" "+row.country).toLowerCase();
        if (!hay.includes(qx)) return false;
      }
      return true;
    });
  }, [data, q, selectedTags, selectedCountries]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (currentPage-1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  // helpers
  const toggleTag = (t) =>
    setSelectedTags(prev => { const n=new Set(prev); n.has(t)?n.delete(t):n.add(t); setCurrentPage(1); return n; });

  const toggleCountry = (c) =>
    setSelectedCountries(prev => { const n=new Set(prev); n.has(c)?n.delete(c):n.add(c); setCurrentPage(1); return n; });

  const clearAll = () => { setQ(""); setSelectedTags(new Set()); setSelectedCountries(new Set()); setCurrentPage(1); };

  return (
    <>
      <style>{css}</style>

      <div className="psl-subnav"><strong>Playlists</strong></div>

      <div className="psl-shell">
        <div className="psl-grid">
          {/* LEFT: Filters */}
          <aside className="psl-side">
            <h4>Filters</h4>
            <div className="psl-search">
              <SearchIcon/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search playlists, creators…" />
            </div>

            <div className="psl-group">
              <h4>Keywords</h4>
              <div className="psl-pills">
                {["Chill","EDM","Hip-Hop","Lo-fi"].map(t => (
                  <button key={t} className={`psl-pill ${selectedTags.has(t)?"selected":""}`} onClick={()=>toggleTag(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="psl-group">
              <h4>Country</h4>
              <div className="psl-checks">
                {["USA","UK","Germany","Canada"].map(c => (
                  <label key={c} className="psl-check">
                    <input type="checkbox" checked={selectedCountries.has(c)} onChange={()=>toggleCountry(c)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div className="psl-actions">
              <button className="psl-btn" onClick={clearAll}>Clear</button>
              <button className="psl-btn primary" onClick={()=>setCurrentPage(1)}>Apply</button>
            </div>
          </aside>

          {/* RIGHT: Table */}
          <section className="psl-content">
            <div className="psl-toolbar">
              <div className="psl-count">Total ({filtered.length})</div>
              <div style={{fontSize:12, color:"#7b8297"}}>
                {selectedTags.size>0 && <>Tags: {Array.from(selectedTags).join(", ")} • </>}
                {selectedCountries.size>0 && <>Countries: {Array.from(selectedCountries).join(", ")} • </>}
                {q && <>Query: “{q}”</>}
              </div>
            </div>

            <div className="psl-tablewrap">
              <table className="psl-table" ref={tableRef}>
                <thead>
                  <tr>
                    <th style={{width:"22%"}}>Playlist</th>
                    <th style={{width:"28%"}}>Description</th>
                    <th style={{width:"16%"}}>Info</th>
                    <th style={{width:"18%"}}>Creator</th>
                    <th style={{width:"10%"}}>Country</th>
                    <th style={{width:"6%"}}>URL</th>
                  </tr>
                </thead>
                <tbody ref={tbodyRef}>
                  {rows.map((r,i)=>(
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.desc}</td>
                      <td>{r.info}</td>
                      <td>{r.creator}</td>
                      <td>{r.country}</td>
                      <td><a className="psl-url" href={r.url} target="_blank" rel="noreferrer">View</a></td>
                    </tr>
                  ))}
                  {rows.length===0 && (
                    <tr><td colSpan="6" style={{textAlign:"center", padding:"18px 0", color:"var(--psl-muted)"}}>No results match your filters.</td></tr>
                  )}
                </tbody>
              </table>

              {/* Pagination directly UNDER the table */}
              <div className="psl-pager">
                <button aria-label="Prev" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}>←</button>
                <span>Page</span>
                <select value={currentPage} onChange={e=>setCurrentPage(parseInt(e.target.value,10))}>
                  {Array.from({length: totalPages}, (_,i)=>i+1).map(p=><option key={p} value={p}>{p}</option>)}
                </select>
                <span>of {totalPages}</span>
                <button aria-label="Next" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>→</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
