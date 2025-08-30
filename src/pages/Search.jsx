import React, { useEffect, useMemo, useRef, useState } from "react";
const API_BASE = "http://127.0.0.1:8000";
import "./../styles/Search.css";

/* ------------------------------------------
   Credits (persistent via localStorage)
-------------------------------------------*/
function useCredits(defaultCredits = 3) {
  const [credits, setCredits] = useState(() => {
    try {
      const raw = localStorage.getItem("psl_credits");
      const n = parseInt(raw ?? "", 10);
      return Number.isFinite(n) ? n : defaultCredits;
    } catch {
      return defaultCredits;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("psl_credits", String(credits));
    } catch {}
  }, [credits]);

  const spend = (n = 1) => setCredits((c) => Math.max(0, c - n));
  const add = (n = 1) => setCredits((c) => c + n);

  return { credits, spend, add, setCredits };
}

/* ------------------------------------------
   Reveals – unlock BOTH email+ig together
-------------------------------------------*/
function useReveals() {
  const [reveals, setReveals] = useState(() => {
    try {
      const raw = localStorage.getItem("psl_reveals_both");
      return raw ? JSON.parse(raw) : {}; // { [playlistId]: true }
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("psl_reveals_both", JSON.stringify(reveals));
    } catch {}
  }, [reveals]);

  const revealBoth = (id) => setReveals((prev) => ({ ...prev, [id]: true }));
  const isRevealed = (id) => !!reveals[id];

  return { isRevealed, revealBoth };
}

/* ------------------------------------------
   Icons & helpers
-------------------------------------------*/
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-3.5-3.5" />
  </svg>
);

/** InfoDot with styled tooltip (uses .psl-help / .psl-info / .psl-tip CSS) */
const InfoDot = ({ title, children }) => (
  <span className="psl-help" tabIndex={0}>
    <span className="psl-info" aria-hidden>i</span>
    <div className="psl-tip" role="tooltip">
      {children ? children : <p>{title}</p>}
    </div>
  </span>
);

const COUNTRY_GROUPS = {
  Europe: ["Czechia", "Germany", "Italy", "France", "Spain", "Poland", "UK", "Netherlands", "Sweden", "Norway"],
  "North America": ["US", "Canada", "Mexico"],
  "South America": ["Brazil", "Argentina", "Chile", "Colombia"],
  Asia: ["Japan", "South Korea", "China", "India", "Singapore", "Thailand"],
  Oceania: ["Australia", "New Zealand"],
};
const COUNTRY_TO_MARKET = {
  Czechia: "CZ",
  Germany: "DE",
  Italy: "IT",
  France: "FR",
  Spain: "ES",
  Poland: "PL",
  UK: "GB",
  Netherlands: "NL",
  Sweden: "SE",
  Norway: "NO",
  US: "US",
  Canada: "CA",
  Mexico: "MX",
  Brazil: "BR",
  Argentina: "AR",
  Chile: "CL",
  Colombia: "CO",
  Japan: "JP",
  "South Korea": "KR",
  China: "HK",
  India: "IN",
  Singapore: "SG",
  Thailand: "TH",
  Australia: "AU",
  "New Zealand": "NZ",
};

function MultiSelectCountries({ selected, onChange, groups = COUNTRY_GROUPS }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const flat = useMemo(() => {
    const items = [];
    Object.entries(groups).forEach(([region, arr]) => arr.forEach((c) => items.push({ region, name: c })));
    return items;
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return groups;
    const out = {};
    flat.forEach(({ region, name }) => {
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
    arr.forEach((c) => next.add(c));
    onChange(next);
  };
  const clearGroup = (region) => {
    const arr = groups[region] || [];
    const next = new Set(selected);
    arr.forEach((c) => next.delete(c));
    onChange(next);
  };
  const clearAll = () => onChange(new Set());

  const label = (() => {
    const arr = Array.from(selected);
    if (arr.length === 0) return "Countries (any)";
    if (arr.length <= 2) return arr.join(", ");
    return `${arr.slice(0, 2).join(", ")} +${arr.length - 2}`;
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
      <button type="button" className="psl-multi-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{label}</span>
        <span className="psl-multi-badge">▼</span>
      </button>

      {open && (
        <div className="psl-multi-pop" role="dialog" aria-label="Select countries by region">
          <div className="psl-multi-head">
            <input className="psl-multi-search" placeholder="Search countries..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="psl-multi-body">
            {Object.entries(filteredGroups).map(([region, arr]) => (
              <div className="psl-region" key={region}>
                <h5>
                  <span>{region}</span>
                  <span className="psl-group-actions">
                    <button className="psl-mini" type="button" onClick={() => selectGroup(region)}>Select all</button>
                    <button className="psl-mini" type="button" onClick={() => clearGroup(region)}>Clear</button>
                  </span>
                </h5>
                {arr.length === 0 && <div className="psl-country" style={{ color: "#8b8fa3" }}>No matches</div>}
                {arr.map((name) => (
                  <label className="psl-country" key={region + "_" + name}>
                    <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
                    {name}
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="psl-multi-foot">
            <button className="psl-btn" type="button" onClick={clearAll}>Clear all</button>
            <button className="psl-btn primary" type="button" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------
   Mask helpers
-------------------------------------------*/
const maskEmail = (email) => {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return "••••••";
  const u = user.length <= 2 ? user[0] + "•" : user.slice(0, 2) + "•••";
  const d = domain.split(".")[0];
  const tld = domain.slice(d.length);
  const dm = d.length <= 2 ? d[0] + "•" : d.slice(0, 2) + "•••";
  return `${u}@${dm}${tld}`;
};

const maskHandle = (handle) => {
  if (!handle) return "";
  const h = handle.replace(/^@/, "");
  if (h.length <= 2) return "@" + h[0] + "•";
  return "@" + h.slice(0, 2) + "•••";
};

/* ------------------------------------------
   Component
-------------------------------------------*/
// Keyword inference helpers
const norm = (s) => (s || "").trim().toLowerCase();
const BASE_TAGS = ["Chill", "EDM", "Hip-Hop", "Lo-fi", "Indie", "Pop", "Trap", "House", "Jazz", "Acoustic"];

const buildTagPool = (customTagLabels) => {
  const base = BASE_TAGS.map((label) => ({ norm: norm(label), label }));
  const custom = Object.entries(customTagLabels).map(([n, label]) => ({ norm: n, label }));
  return [...base, ...custom];
};

const inferKeywordsForRow = (row, tagPool) => {
  const existing = Array.isArray(row.keywords) ? row.keywords : [];
  if (existing.length) return existing;

  const hay = [row.name || "", row.curator || "", row.description || ""].join(" ").toLowerCase();
  const hits = [];
  for (const t of tagPool) {
    if (t.norm && hay.includes(t.norm)) hits.push(t.label);
  }
  return Array.from(new Set(hits));
};

const BASE_NORM = new Set(BASE_TAGS.map(norm));

export default function Search() {
  const { credits, spend } = useCredits(3);
  const { isRevealed, revealBoth } = useReveals();

  // data + ui state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [qInput, setQInput] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [customTagLabels, setCustomTagLabels] = useState({});
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [source, setSource] = useState("live"); // "live" | "db"
  const [activeTab, setActiveTab] = useState("live");

  // NEW: quick contact filters (client-side)
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [onlyIG, setOnlyIG] = useState(false);

  const [notice, setNotice] = useState("");
  const hideTimerRef = useRef(null);

  const tableWrapRef = useRef(null);
  const abortRef = useRef(null);

  // Apply optional contact filters client-side (AND if both toggled)
  const filtered = useMemo(() => {
    let arr = data;
    if (onlyEmail) arr = arr.filter((r) => r.email && String(r.email).trim());
    if (onlyIG) arr = arr.filter((r) => r.ig && String(r.ig).trim());
    return arr;
  }, [data, onlyEmail, onlyIG]);

  const pageSize = 14;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  useEffect(() => {
    tableWrapRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, filtered.length]);
  useEffect(() => { setActiveTab(source); }, [source]);
  useEffect(() => { setSource(activeTab); }, [activeTab]);

  const showNotice = (text, ms = 1800) => {
    setNotice(text);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setNotice(""), ms);
  };

  // Clear table and cancel in-flight search when switching modes
  useEffect(() => {
    try { abortRef.current?.abort(); } catch {}
    setData([]);
    setSelectedIds(new Set());
    setCurrentPage(1);
    setError("");
    if (data.length) showNotice(`Switched to ${source === "live" ? "Live" : "Database"} — previous search canceled`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const addTag = (raw) => {
    const label = (raw || "").trim();
    if (!label) return;
    const n = norm(label);
    setSelectedTags((prev) => {
      if (prev.has(n)) return prev;
      const next = new Set(prev);
      next.add(n);
      return next;
    });
    if (!BASE_NORM.has(n)) {
      setCustomTagLabels((prev) => ({ ...prev, [n]: label }));
    }
  };

  const removeTag = (tNorm) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.delete(tNorm);
      return next;
    });
    if (!BASE_NORM.has(tNorm)) {
      setCustomTagLabels((prev) => {
        const { [tNorm]: _drop, ...rest } = prev;
        return rest;
      });
    }
  };

  const toggleBaseTag = (label) => {
    const t = norm(label);
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = rows.map((r) => r.id);
    const allSel = visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const c = new Set(prev);
      if (allSel) visibleIds.forEach((id) => c.delete(id));
      else visibleIds.forEach((id) => c.add(id));
      return c;
    });
  };

  const clearAll = () => {
    setQInput("");
    setSelectedTags(new Set());
    setCustomTagLabels({});
    setSelectedCountries(new Set());
    setOnlyEmail(false);
    setOnlyIG(false);
    setCurrentPage(1);
    setSelectedIds(new Set());
    setData([]);
    setError("");
  };

  // export helpers (CSV only)
  const exportToCSV = (items, filename) => {
    const delimiter = ";";
    const header = ["Playlist Name", "Curator", "Countries", "Keywords", "Email", "URL", "IG"];
    const esc = (v) => {
      const s = String(v ?? "");
      return /["\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = items.map((r) =>
      [r.name, r.curator, (r.countries || []).join(", "), (r.keywords || []).join(", "), r.email, r.url, r.ig]
        .map(esc)
        .join(delimiter)
    );
    const csv = "\uFEFF" + [header.join(delimiter), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportVisible = () => { if (rows.length) exportToCSV(rows, "visible_playlists.csv"); };
  const exportAllFilt = () => { if (filtered.length) exportToCSV(filtered, "filtered_playlists.csv"); };
  const exportSelected = () => {
    const selRows = data.filter((r) => selectedIds.has(r.id));
    if (selRows.length) exportToCSV(selRows, "selected_playlists.csv");
  };

  // SEARCH
  const onSearch = async () => {
    if (qInput.trim()) {
      addTag(qInput);
      setQInput("");
    }

    const allTerms = Array.from(selectedTags);
    const query = allTerms.join(" ").trim();

    if (!query) {
      setError("Type a keyword and press Enter, or add some tags, then Search.");
      return;
    }

    setCurrentPage(1);
    setLoading(true);
    setError("");
    setData([]);
    setSelectedIds(new Set());
    showNotice("Searching…", 1200);

    try { abortRef.current?.abort(); } catch {}
    const controller = new AbortController();
    abortRef.current = controller;

    const markets = Array.from(selectedCountries).map((name) => COUNTRY_TO_MARKET[name]).filter(Boolean);
    try {
      const endpoint = source === "db" ? "/database/search" : "/spotify/search";
      const body =
        source === "db"
          ? { query, markets, require_contact: true, limit: 1000, offset: 0 }
          : { query, markets, limit_per_market: 1000, max_workers: 6, require_contact: true }; // 1000 per market

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} – ${t}`);
      }
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      const withContacts = items.filter(
        (r) => (r.email && String(r.email).trim()) || (r.ig && String(r.ig).trim())
      );
      const tagPool = buildTagPool({});
      const processed = withContacts.map((r) => ({
        ...r,
        keywords: inferKeywordsForRow(r, tagPool),
      }));
      setData(processed);
    } catch (e) {
      if (e?.name === "AbortError") { showNotice("Search canceled"); return; }
      console.error(e);
      setError("Search failed. Please try again.");
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  /* Reveal BOTH contact fields (−1 credit) */
  const revealContactsFor = (row) => {
    if (isRevealed(row.id)) return;
    const hasSomething = (row.email && row.email.trim()) || (row.ig && row.ig.trim());
    if (!hasSomething) { alert("Nothing to reveal for this row."); return; }
    if (credits <= 0) { alert("You're out of credits. Visit Pricing to top up."); return; }
    spend(1);
    revealBoth(row.id);
  };

  return (
    <>
      {/* SUBNAV */}
      <div className="psl-subnav">
        <div className="psl-brand" aria-label="Astra Radio Playlists">
          <span className="psl-dot" />
          <span>Playlists</span>
        </div>

        <div className="psl-tabs" role="tablist" aria-label="Search modes">
          <span className="psl-tabwrap">
            <button
              className={`psl-tab ${activeTab === "live" ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === "live"}
              onClick={() => setActiveTab("live")}
              title="Live Spotify crawler"
            >
              Live Search <InfoDot>
              <h6>Live Search</h6>
              <p>Crawls Spotify in real time across your selected countries.</p>
              <p>Freshest results. May be slower.</p>
            </InfoDot>
            </button>
            {/* Info tooltip next to Live Search */}
            
          </span>

          <span className="psl-tabwrap" style={{ marginLeft: 10 }}>
            <button
              className={`psl-tab ${activeTab === "db" ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === "db"}
              onClick={() => setActiveTab("db")}
              title="Database (faster)"
            >
              Database Search <InfoDot>
              <h6>Database Search</h6>
              <p>Queries cached results for near-instant speed.</p>
              <p>Great for quick scans. May be less fresh.</p>
            </InfoDot>
            </button>
            {/* Info tooltip next to Database Search */}
            
          </span>
        </div>

        <span className="psl-credits">
          <span>Credits:</span>
          <span className={"psl-credit-badge " + (credits > 0 ? "" : "zero")}>{credits}</span>
          <a href="/pricing" className="psl-btn" style={{ padding: "6px 10px" }}>Get more</a>
        </span>
      </div>

      <div className="psl-shell">
        <div className="psl-grid">
          {/* Sidebar */}
          <aside className="psl-side">
            <h4>Filters</h4>

            <label className="psl-search" aria-label="Detailed search">
              <SearchIcon />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (qInput.trim()) {
                      addTag(qInput);
                      setQInput("");
                    } else {
                      onSearch();
                    }
                  }
                }}
                placeholder="Type a keyword (e.g., edm) and press Enter…"
              />
            </label>

            <div className="psl-group">
              <h4>Keywords</h4>
              <div className="psl-pills">
                {BASE_TAGS.map((t) => {
                  const isOn = selectedTags.has(norm(t));
                  return (
                    <button
                      key={t}
                      className={"psl-pill " + (isOn ? "selected" : "")}
                      onClick={() => {
                        const label = t;
                        const tt = norm(label);
                        setSelectedTags((prev) => {
                          const next = new Set(prev);
                          next.has(tt) ? next.delete(tt) : next.add(tt);
                          return next;
                        });
                      }}
                    >
                      {t}
                    </button>
                  );
                })}

                {Array.from(selectedTags)
                  .filter((nTag) => !BASE_NORM.has(nTag))
                  .map((nTag) => (
                    <button
                      key={"custom_" + nTag}
                      className="psl-pill selected"
                      onClick={() => removeTag(nTag)}
                      title="Remove keyword"
                    >
                      {customTagLabels[nTag] || nTag}
                      <span style={{ marginLeft: 6, opacity: 0.85 }}>×</span>
                    </button>
                  ))}
              </div>
            </div>

          

            <div className="psl-group">
              <h4>Countries</h4>
              <MultiSelectCountries
                selected={selectedCountries}
                onChange={(next) => { setSelectedCountries(next); setCurrentPage(1); }}
              />
            </div>
            
              {/* NEW: Quick contact filters */}
            <div className="psl-group psl-last">
              <h4>Contacts</h4>
              <div className="psl-pills">
                <button
                  className={"psl-pill " + (onlyEmail ? "selected" : "")}
                  onClick={() => { setOnlyEmail((v) => !v); setCurrentPage(1); }}
                  title="Show only playlists that include an email"
                >
                  Email
                </button>
                <button
                  className={"psl-pill " + (onlyIG ? "selected" : "")}
                  onClick={() => { setOnlyIG((v) => !v); setCurrentPage(1); }}
                  title="Show only playlists that include an Instagram handle"
                >
                  IG
                </button>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0" }}>
                Tip: turn both on to require Email + IG.
              </p>
            </div>
            <div className="psl-actions">
              <button className="psl-btn" onClick={clearAll}>Clear</button>
              <button
                className="psl-btn primary"
                onClick={onSearch}
                disabled={loading || (selectedTags.size === 0 && !qInput.trim())}
                title="Search playlists"
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {error && <div style={{ color: "#9b1c1c", margin: "8px" }}>{error}</div>}
          </aside>

          {/* Main content */}
          <section className="psl-content">
            <div className="psl-toolbar">
              <div className="psl-count">
                {activeTab === 'live' ? 'Live' : 'Database'} • {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </div>
              <div className="psl-actions-row">
                <button className="psl-btn" onClick={() => exportToCSV(rows, "visible_playlists.csv")} disabled={rows.length === 0}>
                  Export Visible (CSV)
                </button>
                <button className="psl-btn" onClick={() => exportToCSV(filtered, "filtered_playlists.csv")} disabled={filtered.length === 0}>
                  Export All (filtered)
                </button>
                <button className="psl-btn primary" onClick={exportSelected} disabled={selectedIds.size === 0}>
                  Export Selected
                </button>
              </div>
            </div>

            <div className="psl-tableblock">
              <div className="psl-tablewrap" ref={tableWrapRef}>
                <table className="psl-table">
                  <thead>
                    <tr>
                      <th style={{ width: "4%" }}>
                        <input
                          className="psl-chk"
                          type="checkbox"
                          onChange={toggleAllVisible}
                          checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
                          aria-label="Toggle select all visible rows"
                        />
                      </th>
                      <th style={{ width: "22%" }}>Playlist Name</th>
                      <th style={{ width: "16%" }}>Curator</th>
                      <th style={{ width: "14%" }}>Countries</th>
                      <th style={{ width: "16%" }}>Keywords</th>
                      <th style={{ width: "6%" }}>URL</th>
                      <th style={{ width: "16%" }}>Email</th>
                      <th style={{ width: "6%" }}>IG</th>
                      <th style={{ width: "10%" }}>Reveal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const revealed = isRevealed(r.id);
                      const hasContact = (r.email && r.email.trim()) || (r.ig && r.ig.trim());
                      return (
                        <tr key={r.id} className={selectedIds.has(r.id) ? "is-selected" : ""}>
                          <td>
                            <input
                              className="psl-chk"
                              type="checkbox"
                              checked={selectedIds.has(r.id)}
                              onChange={() =>
                                setSelectedIds((prev) => {
                                  const n = new Set(prev);
                                  n.has(r.id) ? n.delete(r.id) : n.add(r.id);
                                  return n;
                                })
                              }
                            />
                          </td>
                          <td className="psl-col-name" title={r.name}>{r.name}</td>
                          <td>{r.curator}</td>
                          <td className="psl-col-countries">{(r.countries || []).join(", ")}</td>
                          <td className="psl-col-keywords">{(r.keywords || []).join(", ")}</td>
                          <td><a className="psl-url" href={r.url} target="_blank" rel="noreferrer">Link</a></td>
                          <td>
                            {r.email ? (
                              revealed ? (
                                <a className="psl-url" href={`mailto:${r.email}`}>{r.email}</a>
                              ) : (
                                <span>{maskEmail(r.email)}</span>
                              )
                            ) : (
                              <span style={{ color: "var(--psl-muted)" }}>—</span>
                            )}
                          </td>
                          <td>
                            {r.ig ? (
                              revealed ? (
                                <a className="psl-url" href={`https://instagram.com/${r.ig.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                                  {r.ig}
                                </a>
                              ) : (
                                <span>{maskHandle(r.ig)}</span>
                              )
                            ) : (
                              <span style={{ color: "var(--psl-muted)" }}>—</span>
                            )}
                          </td>
                          <td>
                            {revealed ? (
                              <span style={{ color: "var(--psl-muted)" }}>Revealed</span>
                            ) : hasContact ? (
                              <button className="psl-btn" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => revealContactsFor(r)}>
                                Reveal
                              </button>
                            ) : (
                              <span style={{ color: "var(--psl-muted)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="psl-pager">
                <div className="psl-pageinfo">
                  Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
                </div>
                <div className="psl-pagectrl">
                  <button aria-label="Prev" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>←</button>
                  <span>Page</span>
                  <select value={currentPage} onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                  <span>of {totalPages}</span>
                  <button aria-label="Next" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>→</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {notice && (
        <div className="psl-notice" role="status" aria-live="polite">
          <div>{notice}</div>
        </div>
      )}
    </>
  );
}
