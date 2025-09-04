// src/pages/Search.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// Keep base empty so proxy is used
const API_BASE = "";

import "./../styles/Search.css";

/* ------------------------------------------
   Credits from server (JWT cookie)
-------------------------------------------*/
function useServerCredits() {
  const [credits, setCredits] = useState(null);
  const [subscription, setSubscription] = useState({ status: "free", name: "Free" });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      // use JWT-backed endpoint that also returns subscription
      const r = await fetch("/api/me", { credentials: "include" });
      if (!r.ok) throw new Error("me_failed");
      const j = await r.json();
      const c = j?.credits?.balance ?? 0;
      setCredits(typeof c === "number" ? c : 0);
      setSubscription(j?.subscription || { status: "free", name: "Free" });
    } catch {
      setCredits(null);
      setSubscription({ status: "free", name: "Free" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const spend = async (amount = 1) => {
    // keep using the spend endpoint (server validates)
    const r = await fetch("/api/credits/use", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    let text = "";
    try { text = await r.text(); } catch { }

    if (r.status === 401) throw new Error("not_signed_in");
    if (r.status === 402) {
      let j; try { j = JSON.parse(text); } catch { }
      if (j && typeof j.credits === "number") setCredits(j.credits);
      throw new Error(j?.error || "insufficient_credits");
    }
    if (!r.ok) throw new Error(text || "spend_failed");

    let j; try { j = JSON.parse(text); } catch { j = {}; }
    if (typeof j.credits === "number") setCredits(j.credits);
    return j.credits;
  };

  return { credits, subscription, loading, refresh, spend };

}


/* ------------------------------------------
   Revealed items — server-backed only
-------------------------------------------*/
function useRevealedApi() {
  const [items, setItems] = useState([]); // array of revealed rows
  const [ids, setIds] = useState(new Set()); // Set of revealed playlist ids
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/revealed", { credentials: "include" });
      if (!r.ok) throw new Error("load_failed");
      const j = await r.json();
      const arr = Array.isArray(j.items) ? j.items : [];
      setItems(arr);
      setIds(new Set(arr.map((x) => x.id)));
    } catch (e) {
      setErr(e.message || "Failed to load revealed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const add = async (item) => {
    const r = await fetch("/api/revealed", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist_id: item.id, data: item }),
    });
    if (!r.ok) throw new Error("save_failed");

    setItems((prev) =>
      prev.find((x) => x.id === item.id) ? prev : [{ ...item }, ...prev]
    );
    setIds((prev) => new Set(prev).add(item.id));
  };

  const remove = async (id) => {
    const r = await fetch(`/api/revealed/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!r.ok) throw new Error("delete_failed");
    setItems((p) => p.filter((x) => x.id !== id));
    setIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const clear = async () => {
    const r = await fetch("/api/revealed", {
      method: "DELETE",
      credentials: "include",
    });
    if (!r.ok) throw new Error("clear_failed");
    setItems([]);
    setIds(new Set());
  };

  const isRevealed = (id) => ids.has(id);
  return { items, ids, isRevealed, add, remove, clear, refresh, loading, err };
}

/* ------------------------------------------
   Icons & helpers
-------------------------------------------*/
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-3.5-3.5" />
  </svg>
);

const InfoDot = ({ title, children }) => (
  <span className="psl-help" tabIndex={0}>
    <span className="psl-info" aria-hidden>
      i
    </span>
    <div className="psl-tip" role="tooltip">
      {children ? children : <p>{title}</p>}
    </div>
  </span>
);

const COUNTRY_GROUPS = {
  Europe: [
    "Czechia",
    "Germany",
    "Italy",
    "France",
    "Spain",
    "Poland",
    "UK",
    "Netherlands",
    "Sweden",
    "Norway",
  ],
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
    Object.entries(groups).forEach(([region, arr]) =>
      arr.forEach((c) => items.push({ region, name: c }))
    );
    return items;
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return groups;
    const out = {};
    flat.forEach(({ region, name }) => {
      if (name.toLowerCase().includes(needle))
        (out[region] ||= []).push(name);
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
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e) => {
      const pop = document.querySelector(".psl-multi-pop");
      if (pop && !pop.contains(e.target) && !e.target.closest(".psl-multi-btn"))
        setOpen(false);
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
      <button
        type="button"
        className="psl-multi-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="psl-multi-badge">▼</span>
      </button>

      {open && (
        <div className="psl-multi-pop" role="dialog" aria-label="Select countries by region">
          <div className="psl-multi-head">
            <input
              className="psl-multi-search"
              placeholder="Search countries..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="psl-multi-body">
            {Object.entries(filteredGroups).map(([region, arr]) => (
              <div className="psl-region" key={region}>
                <h5>
                  <span>{region}</span>
                  <span className="psl-group-actions">
                    <button
                      className="psl-mini"
                      type="button"
                      onClick={() => selectGroup(region)}
                    >
                      Select all
                    </button>
                    <button
                      className="psl-mini"
                      type="button"
                      onClick={() => clearGroup(region)}
                    >
                      Clear
                    </button>
                  </span>
                </h5>
                {arr.length === 0 && (
                  <div className="psl-country" style={{ color: "#8b8fa3" }}>
                    No matches
                  </div>
                )}
                {arr.map((name) => (
                  <label className="psl-country" key={region + "_" + name}>
                    <input
                      type="checkbox"
                      checked={selected.has(name)}
                      onChange={() => toggle(name)}
                    />
                    {name}
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="psl-multi-foot">
            <button className="psl-btn" type="button" onClick={clearAll}>
              Clear all
            </button>
            <button
              className="psl-btn primary"
              type="button"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
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
   Keywords inference
-------------------------------------------*/
const norm = (s) => (s || "").trim().toLowerCase();
const BASE_TAGS = [
  "Chill",
  "EDM",
  "Hip-Hop",
  "Lo-fi",
  "Indie",
  "Pop",
  "Trap",
  "House",
  "Jazz",
  "Acoustic",
];
const BASE_NORM = new Set(BASE_TAGS.map(norm));

const buildTagPool = (customTagLabels) => {
  const base = BASE_TAGS.map((label) => ({ norm: norm(label), label }));
  const custom = Object.entries(customTagLabels).map(([n, label]) => ({
    norm: n,
    label,
  }));
  return [...base, ...custom];
};
const inferKeywordsForRow = (row, tagPool) => {
  const existing = Array.isArray(row.keywords) ? row.keywords : [];
  if (existing.length) return existing;
  const hay = [row.name || "", row.curator || "", row.description || ""]
    .join(" ")
    .toLowerCase();
  const hits = [];
  for (const t of tagPool) {
    if (t.norm && hay.includes(t.norm)) hits.push(t.label);
  }
  return Array.from(new Set(hits));
};

/* ------------------------------------------
   Component
-------------------------------------------*/
export default function Search() {
  const { credits, spend, subscription, loading: creditsLoading } = useServerCredits(); // 👈 include subscription
  const revealed = useRevealedApi();


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
  const [activeTab, setActiveTab] = useState("live");
  const [source, setSource] = useState("live");
  const [sortBy, setSortBy] = useState("followers");
  const [sortDir, setSortDir] = useState("desc");

  // quick contact filters (for live/db)
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [onlyIG, setOnlyIG] = useState(false);

  const [notice, setNotice] = useState("");
  const hideTimerRef = useRef(null);

  const tableWrapRef = useRef(null);
  const abortRef = useRef(null);
  const hasShownNoCreditsRef = useRef(false);
  useEffect(() => {
  if (creditsLoading) return;
  const c = credits ?? 0;

  if (c <= 0) {
    if (activeTab !== "revealed") setActiveTab("revealed");
    if (!hasShownNoCreditsRef.current) {
      setShowNoCredits(true);
      hasShownNoCreditsRef.current = true;
    }
  } else {
    // allow showing it again in the future if they run out later
    hasShownNoCreditsRef.current = false;
  }
}, [creditsLoading, credits, activeTab]);
  const [showNoCredits, setShowNoCredits] = useState(false); // 👈 popup flag
  useEffect(() => {
  if (creditsLoading) return;
  const c = credits ?? 0;

  if (c <= 0) {
    if (activeTab !== "revealed") setActiveTab("revealed");
    if (!hasShownNoCreditsRef.current) {
      setShowNoCredits(true);
      hasShownNoCreditsRef.current = true; // prevent re-opening until credits go > 0 again
    }
  }
}, [creditsLoading, credits, activeTab]);

// If user gets credits again, allow the modal to show in the future when it returns to 0
useEffect(() => {
  if (creditsLoading) return;
  if ((credits ?? 0) > 0) {
    hasShownNoCreditsRef.current = false;
  }
}, [creditsLoading, credits]);

  // keep source in sync when activeTab is live/db
  useEffect(() => {
    if (activeTab === "live" || activeTab === "db") setSource(activeTab);
  }, [activeTab]);

  // dataset switching: do not clear when going to "revealed"
  useEffect(() => {
    try {
      abortRef.current?.abort();
    } catch { }
    if (activeTab === "revealed") return;
    setData([]);
    setSelectedIds(new Set());
    setCurrentPage(1);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const showNotice = (text, ms = 1800) => {
    setNotice(text);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setNotice(""), ms);
  };

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
    const header = [
      "Playlist Name",
      "Curator",
      "Countries",
      "Keywords",
      "Followers",
      "Email",
      "URL",
      "IG",
    ];
    const esc = (v) => {
      const s = String(v ?? "");
      return /["\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = items.map((r) =>
      [
        r.name,
        r.curator,
        (r.countries || []).join(", "),
        (r.keywords || []).join(", "),
        r.followers ?? 0,
        r.email,
        r.url,
        r.ig,
      ]
        .map(esc)
        .join(delimiter)
    );
    const csv = "\uFEFF" + [header.join(delimiter), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportVisible = () => {
    if (rows.length) exportToCSV(rows, "visible_playlists.csv");
  };
  const exportSelected = () => {
    const selRows = baseDataset.filter((r) => selectedIds.has(r.id));
    if (selRows.length) exportToCSV(selRows, "selected_playlists.csv");
  };
  const exportAllFilt = () => {
    if (sorted.length) exportToCSV(sorted, "all_filtered_playlists.csv");
  };

  // SEARCH
  const onSearch = async () => {
    if (!creditsLoading && (credits ?? 0) <= 0) { setShowNoCredits(true); return; }
    if (qInput.trim()) {
      addTag(qInput);
      setQInput("");
    }

    const allTerms = Array.from(selectedTags);
    const query = allTerms.join(" ").trim();
    if (!query) {
      setError(
        "Type a keyword and press Enter, or add some tags, then Search."
      );
      return;
    }

    setCurrentPage(1);
    setLoading(true);
    setError("");
    setData([]);
    setSelectedIds(new Set());
    showNotice("Searching…", 1200);

    try {
      abortRef.current?.abort();
    } catch { }
    const controller = new AbortController();
    abortRef.current = controller;

    const markets = Array.from(selectedCountries)
      .map((name) => COUNTRY_TO_MARKET[name])
      .filter(Boolean);

    try {
      const endpoint = source === "db" ? "/database/search" : "/spotify/search";
      const body =
        source === "db"
          ? {
            query,
            markets,
            require_contact: true,
            sort: sortBy,
            direction: sortDir,
            limit: 1000,
            offset: 0,
          }
          : {
            query,
            markets,
            limit_per_market: 1000,
            max_workers: 6,
            require_contact: true,
          };

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
        (r) =>
          (r.email && String(r.email).trim()) ||
          (r.ig && String(r.ig).trim())
      );
      const tagPool = buildTagPool(customTagLabels);
      const processed = withContacts.map((r) => ({
        ...r,
        keywords: inferKeywordsForRow(r, tagPool),
      }));
      setData(processed);
    } catch (e) {
      if (e?.name === "AbortError") {
        showNotice("Search canceled");
        return;
      }
      console.error(e);
      setError("Search failed. Please try again.");
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  /* Reveal BOTH contact fields (−1 credit, then save in DB) */
  const revealContactsFor = async (row) => {
    if (revealed.isRevealed(row.id)) return;

    const hasSomething =
      (row.email && row.email.trim()) || (row.ig && row.ig.trim());
    if (!hasSomething) {
      alert("Nothing to reveal for this row.");
      return;
    }

    try {
      await spend(1); // server spend
      // persist this item for the "Revealed" tab (DB only)
      await revealed.add({
        id: row.id,
        name: row.name,
        curator: row.curator,
        countries: row.countries || [],
        keywords: row.keywords || [],
        url: row.url,
        email: row.email || "",
        ig: row.ig || "",
      });
      showNotice("1 credit used ✓");
    } catch (e) {
      const msg = e?.message || "";
      if (msg === "not_signed_in") alert("Please log in to use credits.");
      else if (msg.includes("insufficient"))
        alert("You're out of credits. Go to Pricing to top up.");
      else alert(msg || "Could not spend a credit. Please try again.");
    }
  };

  /* --------------------------
     Dataset + filters + pages
  ---------------------------*/
  const baseDataset = useMemo(() => {
    if (activeTab === "revealed") return revealed.items;
    return data;
  }, [activeTab, data, revealed.items]);

  const filtered = useMemo(() => {
    let arr = baseDataset;
    if (activeTab !== "revealed") {
      if (onlyEmail) arr = arr.filter((r) => r.email && String(r.email).trim());
      if (onlyIG) arr = arr.filter((r) => r.ig && String(r.ig).trim());
    }
    return arr;
  }, [baseDataset, onlyEmail, onlyIG, activeTab]);
  // === Bulk reveal helpers (place after baseDataset/filtered/sorted) ===
  const revealableSelected = useMemo(() => {
    const sel = new Set(selectedIds);
    return baseDataset.filter((r) => {
      if (!sel.has(r.id)) return false;
      if (revealed.isRevealed(r.id)) return false;
      const hasContact = (r.email && r.email.trim()) || (r.ig && r.ig.trim());
      return !!hasContact;
    });
  }, [baseDataset, selectedIds, revealed]);

  const revealableCount = revealableSelected.length;

  const revealSelected = async () => {
    if (revealableCount === 0) {
      alert("No selected rows to reveal.");
      return;
    }
    if (!confirm(`Reveal ${revealableCount} selected item(s)? This uses ${revealableCount} credit(s).`)) {
      return;
    }

    try {
      await spend(revealableCount); // spend once for all
      await Promise.allSettled(
        revealableSelected.map((row) =>
          revealed.add({
            id: row.id,
            name: row.name,
            curator: row.curator,
            countries: row.countries || [],
            keywords: row.keywords || [],
            url: row.url,
            email: row.email || "",
            ig: row.ig || "",
          })
        )
      );
      showNotice(`${revealableCount} credit${revealableCount > 1 ? "s" : ""} used ✓`);
    } catch (e) {
      const msg = e?.message || "";
      if (msg === "not_signed_in") alert("Please log in to use credits.");
      else if (msg.includes("insufficient")) alert("You're out of credits. Go to Pricing to top up.");
      else alert(msg || "Could not spend credits. Please try again.");
    }
  };

  const sorted = useMemo(() => {
    let arr = [...filtered];
    arr.sort((a, b) => {
      let av = a[sortBy] ?? "";
      let bv = b[sortBy] ?? "";

      if (sortBy === "followers") {
        av = Number(a.followers ?? 0);
        bv = Number(b.followers ?? 0);
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const pageSize = 14;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  useEffect(() => {
    tableWrapRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, filtered.length]);

  const maskedEmail = (row) =>
    revealed.isRevealed(row.id) ? row.email || "" : maskEmail(row.email);
  const maskedIG = (row) =>
    revealed.isRevealed(row.id) ? row.ig || "" : maskHandle(row.ig);

  return (
    <>
      {/* SUBNAV */}
      <div className="psl-subnav">
        <div className="psl-brand" aria-label="Playlists Searcher">
          <span className="psl-dot" />
          <span>Playlists</span>
        </div>

        <div className="psl-tabs" role="tablist" aria-label="Search modes">
          <span className="psl-tabwrap">
            <button
              className={`psl-tab ${activeTab === "live" ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === "live"}
              onClick={() => {
                if (!creditsLoading && (credits ?? 0) <= 0) {
                  setShowNoCredits(true);
                  return;
                }
                setActiveTab("live");
              }}
              title="Live Spotify crawler"
            >
              Live Search
              <InfoDot>
                <h6>Live Search</h6>
                <p>Crawls Spotify in real time across your selected countries.</p>
                <p>Freshest results. May be slower.</p>
              </InfoDot>
            </button>
          </span>

          <span className="psl-tabwrap" style={{ marginLeft: 10 }}>
            <button
              className={`psl-tab ${activeTab === "db" ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === "db"}
              onClick={() => {
                if (!creditsLoading && (credits ?? 0) <= 0) {
                  setShowNoCredits(true);
                  return;
                }
                setActiveTab("db");
              }}
              title="Database (faster)"
            >
              Database Search
              <InfoDot>
                <h6>Database Search</h6>
                <p>Queries cached results for near-instant speed.</p>
                <p>Great for quick scans. May be less fresh.</p>
              </InfoDot>
            </button>
          </span>

          <span className="psl-tabwrap" style={{ marginLeft: 10 }}>
            <button
              className={`psl-tab ${activeTab === "revealed" ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === "revealed"}
              onClick={() => setActiveTab("revealed")}
              title="Your revealed contacts"
            >
              Revealed{" "}
              <span style={{ marginLeft: 6, opacity: 0.8 }}>
                ({revealed.items.length})
              </span>
            </button>
          </span>
        </div>

        <span className="psl-credits">
          <span>Credits:</span>
          <span className={"psl-credit-badge " + (credits > 0 ? "" : "zero")}>
            {creditsLoading ? "…" : credits}
          </span>
          <a href="/pricing" className="psl-btn" style={{ padding: "6px 10px" }}>
            Get more
          </a>
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
                        const tt = norm(t);
                        setSelectedTags(prev => {
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
                onChange={(next) => {
                  setSelectedCountries(next);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Quick contact filters (disabled for "revealed") */}
            <div
              className="psl-group psl-last"
              aria-disabled={activeTab === "revealed"}
            >
              <h4>Contacts</h4>
              <div className="psl-pills">
                <button
                  className={"psl-pill " + (onlyEmail ? "selected" : "")}
                  disabled={activeTab === "revealed"}
                  onClick={() => {
                    setOnlyEmail((v) => !v);
                    setCurrentPage(1);
                  }}
                  title="Show only playlists that include an email"
                >
                  Email
                </button>
                <button
                  className={"psl-pill " + (onlyIG ? "selected" : "")}
                  disabled={activeTab === "revealed"}
                  onClick={() => {
                    setOnlyIG((v) => !v);
                    setCurrentPage(1);
                  }}
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
              <button className="psl-btn" onClick={clearAll}>
                Clear
              </button>
              <button
                className="psl-btn primary"
                onClick={onSearch}
                disabled={
                  loading ||
                  activeTab === "revealed" ||
                  (!creditsLoading && (credits ?? 0) <= 0) ||
                  (selectedTags.size === 0 && !qInput.trim())
                }
                title="Search playlists"
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {error && (
              <div style={{ color: "#9b1c1c", margin: "8px" }}>{error}</div>
            )}
            {activeTab === "revealed" && revealed.err && (
              <div style={{ color: "#9b1c1c", margin: "8px" }}>
                {revealed.err}
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="psl-main">
            <div className="psl-toolbar">
              <div className="psl-count">
                {activeTab === "live"
                  ? "Live"
                  : activeTab === "db"
                    ? "Database"
                    : "Revealed"}{" "}
                • {sorted.length} result{sorted.length === 1 ? "" : "s"}
              </div>

              <div className="psl-actions-row">
                {/* Sleek sort control */}
                <label className="psl-sort">
                  <span className="psl-sort-label">Sort</span>
                  <select
                    className="psl-sort-field"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    title="Sort field"
                  >
                    <option value="followers">Followers</option>
                    <option value="name">Name</option>
                    <option value="curator">Curator</option>
                    <option value="created_at">Newest</option>
                  </select>

                  <span className="psl-sort-dir" role="group" aria-label="Sort direction">
                    <button
                      type="button"
                      className={`psl-sort-btn ${sortDir === "asc" ? "active" : ""}`}
                      onClick={() => setSortDir("asc")}
                      title="Ascending"
                      aria-pressed={sortDir === "asc"}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className={`psl-sort-btn ${sortDir === "desc" ? "active" : ""}`}
                      onClick={() => setSortDir("desc")}
                      title="Descending"
                      aria-pressed={sortDir === "desc"}
                    >
                      ▼
                    </button>
                  </span>
                </label>

                {/* Export buttons */}
                <button
                  className="psl-btn"
                  onClick={revealSelected}
                  disabled={revealableCount === 0 || activeTab === "revealed"}
                  title={
                    revealableCount > 0
                      ? `Reveal ${revealableCount} selected (uses ${revealableCount} credits)`
                      : "Select rows with contact info to reveal"
                  }
                >
                  Reveal Selected
                  {revealableCount > 0 ? ` (−${revealableCount})` : ""}
                </button>
                <button
                  className="psl-btn"
                  onClick={exportVisible}
                  disabled={rows.length === 0}
                >
                  Export Visible
                </button>
                <button
                  className="psl-btn"
                  onClick={exportAllFilt}
                  disabled={sorted.length === 0}
                >
                  Export All
                </button>
                <button
                  className="psl-btn primary"
                  onClick={exportSelected}
                  disabled={selectedIds.size === 0}
                >
                  Export Selected
                </button>
                {activeTab === "revealed" && (
                  <button
                    className="psl-btn"
                    onClick={() => revealed.clear()}
                    style={{ marginLeft: 8 }}
                  >
                    Clear Revealed
                  </button>
                )}
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

                      {/* SORTABLE: name */}
                      <th style={{ width: "22%" }}>
                        <button
                          type="button"
                          className={`psl-th-sortable ${sortBy === "name" ? "active" : ""}`}
                          aria-sort={sortBy === "name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                          onClick={() => {
                            setSortBy("name");
                            setSortDir((d) => (sortBy === "name" ? (d === "asc" ? "desc" : "asc") : "asc"));
                          }}
                        >
                          Playlist Name
                          {sortBy === "name" && <span className="psl-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                        </button>
                      </th>

                      {/* SORTABLE: curator */}
                      <th style={{ width: "16%" }}>
                        <button
                          type="button"
                          className={`psl-th-sortable ${sortBy === "curator" ? "active" : ""}`}
                          aria-sort={sortBy === "curator" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                          onClick={() => {
                            setSortBy("curator");
                            setSortDir((d) => (sortBy === "curator" ? (d === "asc" ? "desc" : "asc") : "asc"));
                          }}
                        >
                          Curator
                          {sortBy === "curator" && <span className="psl-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                        </button>
                      </th>

                      <th style={{ width: "14%" }}>Countries</th>
                      <th style={{ width: "16%" }}>Keywords</th>

                      {/* SORTABLE: followers */}
                      <th style={{ width: "10%" }}>
                        <button
                          type="button"
                          className={`psl-th-sortable ${sortBy === "followers" ? "active" : ""}`}
                          aria-sort={sortBy === "followers" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                          onClick={() => {
                            setSortBy("followers");
                            setSortDir((d) => (sortBy === "followers" ? (d === "asc" ? "desc" : "asc") : "desc"));
                          }}
                        >
                          Followers
                          {sortBy === "followers" && <span className="psl-sort-caret">{sortDir === "asc" ? "▲" : "▼"}</span>}
                        </button>
                      </th>

                      <th style={{ width: "6%" }}>URL</th>

                      {/* Non-sort (Email/IG) */}
                      <th style={{ width: "16%" }}>Email</th>
                      <th style={{ width: "6%" }}>IG</th>

                      {/* SORTABLE: created_at (when present) */}
                      {/* If you want this column visible instead of in dropdown, add its TH and the cell values. */}
                      <th style={{ width: "10%" }}>
                        {activeTab === "revealed" ? "Actions" : "Reveal"}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r) => {
                      const isRev = revealed.isRevealed(r.id);
                      const hasContact =
                        (r.email && r.email.trim()) ||
                        (r.ig && r.ig.trim());
                      return (
                        <tr
                          key={r.id}
                          className={selectedIds.has(r.id) ? "is-selected" : ""}
                        >
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
                          <td className="psl-col-name" title={r.name}>
                            {r.name}
                          </td>
                          <td>{r.curator}</td>
                          <td className="psl-col-countries">
                            {(r.countries || []).join(", ")}
                          </td>
                          <td className="psl-col-keywords">
                            {(r.keywords || []).join(", ")}
                          </td>
                          <td>
                            {typeof r.followers === "number"
                              ? r.followers.toLocaleString?.() ?? r.followers
                              : "—"}
                          </td>

                          <td>
                            {r.url ? (
                              <a
                                className="psl-url"
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Link
                              </a>
                            ) : (
                              <span style={{ color: "var(--psl-muted)" }}>—</span>
                            )}
                          </td>

                          {/* EMAIL */}
                          <td>
                            {activeTab === "revealed" ? (
                              r.email ? (
                                <a className="psl-url" href={`mailto:${r.email}`}>
                                  {r.email}
                                </a>
                              ) : (
                                <span style={{ color: "var(--psl-muted)" }}>
                                  —
                                </span>
                              )
                            ) : r.email ? (
                              isRev ? (
                                <a
                                  className="psl-url"
                                  href={`mailto:${r.email}`}
                                >
                                  {r.email}
                                </a>
                              ) : (
                                <span>{maskedEmail(r)}</span>
                              )
                            ) : (
                              <span style={{ color: "var(--psl-muted)" }}>—</span>
                            )}
                          </td>

                          {/* IG */}
                          <td>
                            {activeTab === "revealed" ? (
                              r.ig ? (
                                <a
                                  className="psl-url"
                                  href={`https://instagram.com/${r.ig.replace(
                                    /^@/,
                                    ""
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {r.ig}
                                </a>
                              ) : (
                                <span style={{ color: "var(--psl-muted)" }}>
                                  —
                                </span>
                              )
                            ) : r.ig ? (
                              isRev ? (
                                <a
                                  className="psl-url"
                                  href={`https://instagram.com/${r.ig.replace(
                                    /^@/,
                                    ""
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {r.ig}
                                </a>
                              ) : (
                                <span>{maskedIG(r)}</span>
                              )
                            ) : (
                              <span style={{ color: "var(--psl-muted)" }}>—</span>
                            )}
                          </td>

                          {/* ACTION / REVEAL */}
                          <td>
                            {activeTab === "revealed" ? (
                              <button
                                className="psl-btn"
                                style={{ padding: "2px 8px", fontSize: 12 }}
                                onClick={() => revealed.remove(r.id)}
                              >
                                Remove
                              </button>
                            ) : isRev ? (
                              <span style={{ color: "var(--psl-muted)" }}>
                                Revealed
                              </span>
                            ) : hasContact ? (
                              <button
                                className="psl-btn"
                                style={{ padding: "2px 8px", fontSize: 12 }}
                                onClick={() => revealContactsFor(r)}
                              >
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
                  Showing {filtered.length === 0 ? 0 : start + 1}–
                  {Math.min(start + pageSize, filtered.length)} of{" "}
                  {filtered.length}
                </div>
                <div className="psl-pagectrl">
                  <button
                    aria-label="Prev"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                  >
                    ←
                  </button>
                  <span>Page</span>
                  <select
                    value={currentPage}
                    onChange={(e) =>
                      setCurrentPage(parseInt(e.target.value, 10))
                    }
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      )
                    )}
                  </select>
                  <span>of {totalPages}</span>
                  <button
                    aria-label="Next"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {notice && (
        <div className="psl-notice" role="status" aria-live="polite">
          <div>{notice}</div>
        </div>
      )}
      {showNoCredits && (
        <div className="psl-modal-overlay" role="dialog" aria-modal="true" aria-label="No credits">
          <div className="psl-modal">
            <h3>You’re out of credits</h3>
            <p style={{ marginTop: 6 }}>
              You have <strong>0 credits</strong>. Searching is disabled.
              You can still view your <em>Revealed</em> contacts.
            </p>

            <div className="psl-modal-actions" style={{ marginTop: 14, display: "flex", gap: 8 }}>
              {/* Upgrade only if on Free */}
              {subscription?.status === "free" && (
                <a className="psl-btn primary" href="/pricing">Upgrade</a>
              )}

              {/* “Buy credits” available only for Artist (you can tweak this check) */}
              {subscription?.name === "Artist" ? (
                <button
                  className="psl-btn"
                  onClick={() => { window.location.href = "/buy-credits"; }} // or your actual route
                >
                  Buy Credits
                </button>
              ) : (
                <button className="psl-btn" disabled title="Available on Artist plan">
                  Buy Credits (Soon)
                </button>
              )}

              <button className="psl-btn" onClick={() => setShowNoCredits(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
