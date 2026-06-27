import { useState, useEffect, useRef } from "react";

// ── Palette (V2lop dark-blue) ──────────────────────────────
// bg-deep  : #0a0e1a   sidebar + page bg
// bg-card  : #0f1629   card surface
// bg-card2 : #141c35   slightly lighter card
// accent-y : #f5c518   yellow ring / highlights
// accent-b : #3b82f6   blue buttons / badges
// accent-g : #22c55e   green ok
// accent-r : #ef4444   red error
// text-dim : #6b7db3   muted label

const DEEP = "#0a0e1a";
const CARD = "#0f1629";
const CARD2 = "#141c35";

// ── tiny helpers ──────────────────────────────────────────
function cn(...cls) { return cls.filter(Boolean).join(" "); }

function Badge({ color = "blue", children, small }) {
  const map = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    green: "bg-green-500/20 text-green-400 border-green-500/40",
    red: "bg-red-500/20 text-red-400 border-red-500/40",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    gray: "bg-slate-700 text-slate-300 border-slate-600",
  };
  return (
    <span className={cn("border rounded-full font-mono font-medium", small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5", map[color])}>
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: CARD2, border: "1px solid #1e2d5a" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#6b7db3" }}>{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={cn("text-3xl font-bold tracking-tight", accent)}>{value}</div>
      {sub && <div className="text-xs" style={{ color: "#6b7db3" }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
      ✓ {msg}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.75)" }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: CARD, border: "1px solid #1e2d5a" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#1e2d5a" }}>
          <span className="text-white font-semibold">{title}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", mono }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7db3" }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={cn("w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500 transition", mono && "font-mono")}
        style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }}
      />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7db3" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
        style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ── DATA DEFAULTS ─────────────────────────────────────────
const defaultApis = [
  { id: 1, name: "StarkAPI", baseUrl: "https://stark.railway.app/api", key: "sk-stark-xxxx", status: "active", totalReq: 846, success: 665, errors: 181, last24h: 399, avgMs: 6303 },
];
const defaultEndpoints = [
  { id: 1, apiId: 1, path: "/mobile", method: "GET", variable: "number", desc: "Mobile number lookup" },
  { id: 2, apiId: 1, path: "/gst", method: "GET", variable: "gstin", desc: "GST number lookup" },
  { id: 3, apiId: 1, path: "/pan", method: "GET", variable: "pan", desc: "PAN card lookup" },
  { id: 4, apiId: 1, path: "/ifsc", method: "GET", variable: "code", desc: "Bank IFSC lookup" },
];
const defaultBlocklist = ["restricted", "banned", "error", "unavailable", "forbidden", "blocked", "invalid", "null", "undefined", "failed", "denied"];

// ══════════════════════════════════════════════════════════
// PAGE: DASHBOARD
// ══════════════════════════════════════════════════════════
function Dashboard({ apis, endpoints, blocklist, logs }) {
  const api = apis[0] || {};
  const totalReq = logs.length;
  const success = logs.filter(l => l.status < 400 && !l.blocked).length;
  const errors = logs.filter(l => l.status >= 400 || l.blocked).length;
  const avgMs = logs.length ? Math.round(logs.reduce((a, l) => a + l.ms, 0) / logs.length) : 0;
  const pct = totalReq ? Math.round((success / totalReq) * 100) : 0;
  const circum = 2 * Math.PI * 52;
  const dash = circum * (pct / 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
        <span className="text-green-400 text-xs font-medium">Postgres connected</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* donut */}
        <div className="rounded-2xl p-5 flex flex-col items-center justify-center" style={{ background: CARD2, border: "1px solid #1e2d5a" }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="52" fill="none" stroke="#1e2d5a" strokeWidth="10" />
            <circle cx="65" cy="65" r="52" fill="none" stroke="#f5c518" strokeWidth="10"
              strokeDasharray={`${dash} ${circum}`} strokeDashoffset={circum * 0.25}
              strokeLinecap="round" style={{ transition: "stroke-dasharray .6s ease" }} />
            <text x="65" y="60" textAnchor="middle" fill="#f5c518" fontSize="22" fontWeight="bold">{pct}%</text>
            <text x="65" y="78" textAnchor="middle" fill="#6b7db3" fontSize="10">SUCCESS</text>
          </svg>
          <div className="flex gap-4 mt-3">
            <div className="text-center"><div className="text-green-400 font-bold text-lg">{success}</div><div className="text-[10px] text-slate-500">OK</div></div>
            <div className="text-center"><div className="text-red-400 font-bold text-lg">{errors}</div><div className="text-[10px] text-slate-500">ERRORS</div></div>
            <div className="text-center"><div className="text-yellow-400 font-bold text-lg">{pct}%</div><div className="text-[10px] text-slate-500">OK RATE</div></div>
          </div>
        </div>

        {/* stat cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <StatCard label="Total Requests" value={totalReq} icon="📡" accent="text-white" />
          <StatCard label="Avg Latency" value={`${avgMs}ms`} icon="⚡" accent="text-yellow-400" />
          <StatCard label="Active Endpoints" value={`${endpoints.length}/${endpoints.length}`} icon="🔗" accent="text-blue-400" />
          <StatCard label="Last 24 Hours" value={logs.filter(l => Date.now() - l.ts < 86400000).length || logs.length} icon="📅" accent="text-blue-300" />
          <div className="col-span-2 rounded-2xl p-4 flex items-center justify-between" style={{ background: CARD2, border: "1px solid #1e2d5a" }}>
            <div>
              <div className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#6b7db3" }}>🚫 Blacklisted Values</div>
              <div className="text-xs text-slate-400">Filtered across all endpoints</div>
            </div>
            <div className="text-3xl font-bold text-red-400">{blocklist.length}</div>
          </div>
        </div>
      </div>

      {/* recent logs */}
      <div>
        <div className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#6b7db3" }}>Recent Activity</div>
        <div className="space-y-1.5">
          {logs.slice(0, 8).map(l => (
            <div key={l.id} className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs" style={{ background: CARD2, border: "1px solid #1e2d5a" }}>
              <span className={cn("font-mono font-bold w-8", l.status < 400 ? "text-green-400" : "text-red-400")}>{l.status}</span>
              <span className="font-mono text-blue-300 flex-1 truncate">{l.endpoint}</span>
              <span className="text-slate-500">{l.ms}ms</span>
              {l.blocked && <Badge color="red" small>blocked</Badge>}
              <span className="text-slate-600 hidden sm:block">{new Date(l.ts).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE: API ENDPOINTS (manage + search)
// ══════════════════════════════════════════════════════════
function ApiEndpointsPage({ apis, setApis, endpoints, setEndpoints, blocklist, addLog, toast }) {
  const [showApiModal, setShowApiModal] = useState(false);
  const [showEpModal, setShowEpModal] = useState(false);
  const [editApi, setEditApi] = useState(null);
  const [editEp, setEditEp] = useState(null);
  const [apiForm, setApiForm] = useState({ name: "", baseUrl: "", key: "", status: "active" });
  const [epForm, setEpForm] = useState({ apiId: "", path: "", method: "GET", variable: "", desc: "" });
  const [searchQ, setSearchQ] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const openAddApi = () => { setEditApi(null); setApiForm({ name: "", baseUrl: "", key: "", status: "active" }); setShowApiModal(true); };
  const openEditApi = (a) => { setEditApi(a); setApiForm({ name: a.name, baseUrl: a.baseUrl, key: a.key, status: a.status }); setShowApiModal(true); };
  const saveApi = () => {
    if (!apiForm.name || !apiForm.baseUrl) return;
    if (editApi) {
      setApis(p => p.map(a => a.id === editApi.id ? { ...a, ...apiForm } : a));
    } else {
      setApis(p => [...p, { id: Date.now(), ...apiForm, totalReq: 0, success: 0, errors: 0, last24h: 0, avgMs: 0 }]);
    }
    setShowApiModal(false);
    toast(editApi ? "API updated" : "API added");
  };
  const deleteApi = (id) => { setApis(p => p.filter(a => a.id !== id)); setEndpoints(p => p.filter(e => e.apiId !== id)); toast("API deleted"); };

  const openAddEp = (apiId) => { setEditEp(null); setEpForm({ apiId: String(apiId), path: "/", method: "GET", variable: "q", desc: "" }); setShowEpModal(true); };
  const openEditEp = (ep) => { setEditEp(ep); setEpForm({ apiId: String(ep.apiId), path: ep.path, method: ep.method, variable: ep.variable, desc: ep.desc }); setShowEpModal(true); };
  const saveEp = () => {
    if (!epForm.path || !epForm.apiId) return;
    if (editEp) {
      setEndpoints(p => p.map(e => e.id === editEp.id ? { ...e, ...epForm, apiId: parseInt(epForm.apiId) } : e));
    } else {
      setEndpoints(p => [...p, { id: Date.now(), ...epForm, apiId: parseInt(epForm.apiId) }]);
    }
    setShowEpModal(false);
    toast(editEp ? "Endpoint updated" : "Endpoint added");
  };
  const deleteEp = (id) => { setEndpoints(p => p.filter(e => e.id !== id)); toast("Endpoint deleted"); };

  const doSearch = async (ep, api) => {
    const q = (searchQ[ep.id] || "").trim();
    if (!q) return;
    setLoading(p => ({ ...p, [ep.id]: true }));
    setResults(p => ({ ...p, [ep.id]: null }));
    const url = `${api.baseUrl}${ep.path}?${ep.variable}=${encodeURIComponent(q)}`;
    const start = Date.now();
    try {
      const r = await fetch(url);
      const ms = Date.now() - start;
      let data;
      try { data = await r.json(); } catch { data = await r.text(); }

      // apply blocklist
      let filtered = JSON.stringify(data, null, 2);
      blocklist.forEach(w => {
        filtered = filtered.replace(new RegExp(`"[^"]*${w}[^"]*"`, "gi"), '"[BLOCKED]"');
      });

      setResults(p => ({ ...p, [ep.id]: { ok: r.ok, status: r.status, ms, raw: filtered } }));
      addLog({ endpoint: `${ep.path}?${ep.variable}=${q}`, status: r.status, ms, blocked: false, apiId: api.id });
    } catch (err) {
      const ms = Date.now() - start;
      setResults(p => ({ ...p, [ep.id]: { ok: false, status: 0, ms, raw: String(err) } }));
      addLog({ endpoint: `${ep.path}?${ep.variable}=${q}`, status: 0, ms, blocked: false, apiId: api.id });
    }
    setLoading(p => ({ ...p, [ep.id]: false }));
  };

  const mcolor = { GET: "blue", POST: "green", DELETE: "red", PUT: "yellow" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">APIs & Endpoints</h2>
        <button onClick={openAddApi} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl font-medium transition">＋ Add API</button>
      </div>

      {apis.map(api => (
        <div key={api.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1e2d5a" }}>
          {/* API header */}
          <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ background: "#0d1530" }}>
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", api.status === "active" ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-slate-500")} />
              <div>
                <div className="text-white font-semibold text-sm">{api.name}</div>
                <div className="text-blue-400 font-mono text-xs">{api.baseUrl}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openAddEp(api.id)} className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400 px-3 py-1.5 rounded-lg transition">＋ Endpoint</button>
              <button onClick={() => openEditApi(api)} className="text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg transition">Edit</button>
              <button onClick={() => deleteApi(api.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg transition">Delete</button>
            </div>
          </div>

          {/* Endpoints list */}
          <div className="divide-y" style={{ background: CARD, borderColor: "#1e2d5a", divideColor: "#1e2d5a" }}>
            {endpoints.filter(e => e.apiId === api.id).length === 0 && (
              <div className="px-4 py-6 text-center text-slate-600 text-sm">No endpoints yet — add one above.</div>
            )}
            {endpoints.filter(e => e.apiId === api.id).map(ep => {
              const fullUrl = `${api.baseUrl}${ep.path}`;
              const res = results[ep.id];
              const isLoad = loading[ep.id];
              return (
                <div key={ep.id} className="p-4 space-y-3" style={{ borderTop: "1px solid #1e2d5a" }}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color={mcolor[ep.method] || "gray"} small>{ep.method}</Badge>
                      <span className="text-white font-mono text-sm">{ep.path}</span>
                      {ep.desc && <span className="text-slate-500 text-xs">— {ep.desc}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditEp(ep)} className="text-xs text-slate-400 hover:text-white border border-slate-700 px-2 py-1 rounded-lg transition">Edit</button>
                      <button onClick={() => deleteEp(ep.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-2 py-1 rounded-lg transition">Del</button>
                    </div>
                  </div>

                  {/* full URL preview */}
                  <div className="text-xs font-mono px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }}>
                    <span style={{ color: "#6b7db3" }}>{fullUrl}?{ep.variable}=</span>
                    <span className="text-yellow-400">{searchQ[ep.id] || "{query}"}</span>
                  </div>

                  {/* search bar */}
                  <div className="flex gap-2">
                    <input
                      value={searchQ[ep.id] || ""}
                      onChange={e => setSearchQ(p => ({ ...p, [ep.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && doSearch(ep, api)}
                      placeholder={`Enter ${ep.variable}...`}
                      className="flex-1 text-sm rounded-xl px-3 py-2 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }}
                    />
                    <button
                      onClick={() => doSearch(ep, api)}
                      disabled={isLoad}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl font-medium transition min-w-[80px]"
                    >
                      {isLoad ? "..." : "Search"}
                    </button>
                  </div>

                  {/* result */}
                  {res && (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2d5a" }}>
                      <div className="flex items-center gap-3 px-3 py-2" style={{ background: "#0d1530" }}>
                        <Badge color={res.ok ? "green" : "red"} small>{res.status || "ERR"}</Badge>
                        <span className="text-xs text-slate-400">{res.ms}ms</span>
                        <span className="text-xs text-slate-600 ml-auto">response</span>
                      </div>
                      <pre className="text-xs text-green-300 font-mono p-3 overflow-auto max-h-48 leading-relaxed"
                        style={{ background: "#050810" }}>
                        {res.raw}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* API Modal */}
      {showApiModal && (
        <Modal title={editApi ? "Edit API" : "Add API"} onClose={() => setShowApiModal(false)}>
          <Field label="API Name" value={apiForm.name} onChange={v => setApiForm(p => ({ ...p, name: v }))} placeholder="My Search API" />
          <Field label="Base URL" value={apiForm.baseUrl} onChange={v => setApiForm(p => ({ ...p, baseUrl: v }))} placeholder="https://stark.railway.app/api" mono />
          <Field label="API Key (optional)" value={apiForm.key} onChange={v => setApiForm(p => ({ ...p, key: v }))} placeholder="sk-xxxx" mono />
          <Sel label="Status" value={apiForm.status} onChange={v => setApiForm(p => ({ ...p, status: v }))} options={[{ v: "active", l: "Active" }, { v: "inactive", l: "Inactive" }]} />
          <div className="flex gap-3 mt-1">
            <button onClick={() => setShowApiModal(false)} className="flex-1 text-slate-300 text-sm py-2.5 rounded-xl border transition" style={{ borderColor: "#1e2d5a" }}>Cancel</button>
            <button onClick={saveApi} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl font-medium transition">Save API</button>
          </div>
        </Modal>
      )}

      {/* Endpoint Modal */}
      {showEpModal && (
        <Modal title={editEp ? "Edit Endpoint" : "Add Endpoint"} onClose={() => setShowEpModal(false)}>
          <Sel label="API" value={epForm.apiId} onChange={v => setEpForm(p => ({ ...p, apiId: v }))} options={apis.map(a => ({ v: String(a.id), l: a.name }))} />
          <Sel label="Method" value={epForm.method} onChange={v => setEpForm(p => ({ ...p, method: v }))} options={["GET","POST","PUT","DELETE"].map(m => ({ v: m, l: m }))} />
          <Field label="Path" value={epForm.path} onChange={v => setEpForm(p => ({ ...p, path: v }))} placeholder="/mobile" mono />
          <Field label="Query Variable" value={epForm.variable} onChange={v => setEpForm(p => ({ ...p, variable: v }))} placeholder="number" mono />
          <Field label="Description" value={epForm.desc} onChange={v => setEpForm(p => ({ ...p, desc: v }))} placeholder="Mobile number lookup" />
          {epForm.apiId && epForm.path && (
            <div className="mb-4 px-3 py-2 rounded-xl text-xs font-mono" style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }}>
              <span style={{ color: "#6b7db3" }}>{apis.find(a => a.id === parseInt(epForm.apiId))?.baseUrl}{epForm.path}?{epForm.variable}=</span>
              <span className="text-yellow-400">query</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setShowEpModal(false)} className="flex-1 text-slate-300 text-sm py-2.5 rounded-xl border transition" style={{ borderColor: "#1e2d5a" }}>Cancel</button>
            <button onClick={saveEp} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl font-medium transition">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE: BLACKLIST
// ══════════════════════════════════════════════════════════
function BlacklistPage({ blocklist, setBlocklist, toast }) {
  const [inp, setInp] = useState("");
  const [test, setTest] = useState("");
  const [testOut, setTestOut] = useState("");

  const add = () => {
    const ws = inp.split(",").map(w => w.trim().toLowerCase()).filter(w => w && !blocklist.includes(w));
    if (ws.length) { setBlocklist(p => [...p, ...ws]); setInp(""); toast(`${ws.length} word(s) blocked`); }
  };
  const remove = (w) => { setBlocklist(p => p.filter(x => x !== w)); toast("Word removed"); };
  const testFilter = () => {
    let r = test;
    blocklist.forEach(w => { r = r.replace(new RegExp(`\\b${w}\\b`, "gi"), "█".repeat(w.length)); });
    setTestOut(r);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-white font-semibold">Blacklist Manager</h2>

      <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD2, border: "1px solid #1e2d5a" }}>
        <div className="text-xs font-medium" style={{ color: "#6b7db3" }}>Add words to block (comma-separated)</div>
        <div className="flex gap-2">
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="word1, word2, word3"
            className="flex-1 text-sm rounded-xl px-3 py-2.5 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-red-500"
            style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }} />
          <button onClick={add} className="bg-red-600 hover:bg-red-500 text-white text-sm px-4 py-2 rounded-xl font-medium transition">Block</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-12">
        {blocklist.map(w => (
          <span key={w} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", color: "#f87171" }}>
            {w}
            <button onClick={() => remove(w)} className="opacity-60 hover:opacity-100 text-base leading-none ml-0.5">×</button>
          </span>
        ))}
        {blocklist.length === 0 && <div className="text-slate-600 text-sm py-2">No blocked words.</div>}
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD2, border: "1px solid #1e2d5a" }}>
        <div className="text-xs font-medium" style={{ color: "#6b7db3" }}>🧪 Test Filter — paste API response</div>
        <textarea value={test} onChange={e => setTest(e.target.value)} placeholder='{"name":"John","status":"restricted","data":"..."}' rows={3}
          className="w-full text-sm rounded-xl px-3 py-2.5 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-slate-500 resize-none font-mono"
          style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }} />
        <button onClick={testFilter} className="border text-slate-300 text-sm px-4 py-2 rounded-xl hover:text-white transition" style={{ borderColor: "#1e2d5a" }}>Run Filter</button>
        {testOut && (
          <pre className="text-sm font-mono text-green-300 p-3 rounded-xl overflow-auto leading-relaxed" style={{ background: "#050810", border: "1px solid #1e2d5a" }}>{testOut}</pre>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE: REQUEST LOGS
// ══════════════════════════════════════════════════════════
function LogsPage({ logs, apis }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const totalReq = logs.length;
  const success = logs.filter(l => l.status >= 200 && l.status < 400 && !l.blocked).length;
  const blocked = logs.filter(l => l.blocked).length;
  const avgMs = logs.length ? Math.round(logs.reduce((a, l) => a + l.ms, 0) / logs.length) : 0;
  const pct = totalReq ? ((success / totalReq) * 100).toFixed(1) : "0.0";

  const filtered = logs.filter(l => {
    const ms = filter === "all" || (filter === "ok" && l.status < 400 && !l.blocked) || (filter === "err" && l.status >= 400) || (filter === "blocked" && l.blocked);
    const ss = !search || l.endpoint.includes(search);
    return ms && ss;
  });

  return (
    <div className="space-y-5">
      <h2 className="text-white font-semibold">Request Logs</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={totalReq} icon="📡" accent="text-white" />
        <StatCard label="Success" value={success} icon="✅" accent="text-green-400" />
        <StatCard label="Blocked" value={blocked} icon="🚫" accent="text-red-400" />
        <StatCard label="Avg ms" value={`${avgMs}ms`} icon="⚡" accent="text-yellow-400" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search endpoint..."
          className="flex-1 min-w-32 text-sm rounded-xl px-3 py-2 text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
          style={{ background: CARD2, border: "1px solid #1e2d5a" }} />
        {[["all","All"],["ok","OK"],["err","Errors"],["blocked","Blocked"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={cn("text-xs px-3 py-2 rounded-xl font-medium transition", filter === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}
            style={filter !== v ? { background: CARD2, border: "1px solid #1e2d5a" } : {}}>
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filtered.map(l => (
          <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs" style={{ background: l.blocked ? "rgba(239,68,68,.05)" : CARD2, border: `1px solid ${l.blocked ? "rgba(239,68,68,.2)" : "#1e2d5a"}` }}>
            <span className={cn("font-mono font-bold w-10", l.status >= 400 ? "text-red-400" : "text-green-400")}>{l.status || "ERR"}</span>
            <span className="font-mono text-blue-300 flex-1 truncate">{l.endpoint}</span>
            <span className="text-slate-500">{l.ms}ms</span>
            {l.blocked && <Badge color="red" small>blocked</Badge>}
            <span className="text-slate-600 hidden sm:block">{new Date(l.ts).toLocaleTimeString()}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-slate-600 py-10 text-sm">No logs match.</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE: LIVE API SEARCH (quick search across all endpoints)
// ══════════════════════════════════════════════════════════
function LiveApiPage({ apis, endpoints, blocklist, addLog }) {
  const [selEp, setSelEp] = useState(endpoints[0]?.id || "");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);

  const ep = endpoints.find(e => e.id === parseInt(selEp));
  const api = ep ? apis.find(a => a.id === ep.apiId) : null;
  const previewUrl = ep && api ? `${api.baseUrl}${ep.path}?${ep.variable}=${q || "{query}"}` : "";

  const doSearch = async () => {
    if (!ep || !api || !q.trim()) return;
    setLoading(true); setRes(null);
    const url = `${api.baseUrl}${ep.path}?${ep.variable}=${encodeURIComponent(q.trim())}`;
    const start = Date.now();
    try {
      const r = await fetch(url);
      const ms = Date.now() - start;
      let data;
      try { data = await r.json(); } catch { data = await r.text(); }
      let filtered = JSON.stringify(data, null, 2);
      blocklist.forEach(w => { filtered = filtered.replace(new RegExp(`"[^"]*${w}[^"]*"`, "gi"), '"[BLOCKED]"'); });
      setRes({ ok: r.ok, status: r.status, ms, raw: filtered });
      addLog({ endpoint: `${ep.path}?${ep.variable}=${q}`, status: r.status, ms, blocked: false, apiId: api.id });
    } catch (err) {
      const ms = Date.now() - start;
      setRes({ ok: false, status: 0, ms, raw: String(err) });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-white font-semibold">Live API Search</h2>
      <div className="rounded-2xl p-5 space-y-4" style={{ background: CARD2, border: "1px solid #1e2d5a" }}>
        <Sel label="Select Endpoint" value={String(selEp)} onChange={v => { setSelEp(v); setRes(null); }}
          options={endpoints.map(e => {
            const a = apis.find(x => x.id === e.apiId);
            return { v: String(e.id), l: `${a?.name || "?"} → ${e.path}` };
          })} />
        <Field label={`Query (${ep?.variable || "q"})`} value={q} onChange={setQ} placeholder={`Enter ${ep?.variable || "value"}...`} mono />
        {previewUrl && (
          <div className="px-3 py-2 rounded-xl text-xs font-mono" style={{ background: "#0a0e1a", border: "1px solid #1e2d5a" }}>
            <span style={{ color: "#6b7db3" }}>{api?.baseUrl}{ep?.path}?{ep?.variable}=</span>
            <span className="text-yellow-400">{q || "{query}"}</span>
          </div>
        )}
        <button onClick={doSearch} disabled={loading || !ep}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition">
          {loading ? "Searching..." : "🔍 Search"}
        </button>
      </div>

      {res && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1e2d5a" }}>
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#0d1530" }}>
            <Badge color={res.ok ? "green" : "red"}>{res.status || "Error"}</Badge>
            <span className="text-slate-400 text-xs">{res.ms}ms</span>
          </div>
          <pre className="text-sm text-green-300 font-mono p-4 overflow-auto max-h-96 leading-relaxed" style={{ background: "#050810" }}>{res.raw}</pre>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "endpoints", icon: "🔗", label: "API Endpoints" },
  { id: "blacklist", icon: "🚫", label: "Blacklist" },
  { id: "logs", icon: "📋", label: "Request Logs" },
  { id: "live", icon: "⚡", label: "Live API" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [apis, setApis] = useState(defaultApis);
  const [endpoints, setEndpoints] = useState(defaultEndpoints);
  const [blocklist, setBlocklist] = useState(defaultBlocklist);
  const [logs, setLogs] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);

  const toast = (msg) => setToastMsg(msg);
  const addLog = (entry) => setLogs(p => [{ id: Date.now(), ts: Date.now(), ...entry }, ...p].slice(0, 200));

  // simulate live logs
  useEffect(() => {
    const paths = endpoints.map(e => e.path);
    const t = setInterval(() => {
      if (paths.length && Math.random() > 0.55) {
        const ep = paths[Math.floor(Math.random() * paths.length)];
        addLog({ endpoint: ep, status: Math.random() > 0.1 ? 200 : 500, ms: Math.floor(Math.random() * 400 + 50), blocked: Math.random() < 0.12, apiId: apis[0]?.id });
      }
    }, 3000);
    return () => clearInterval(t);
  }, [endpoints, apis]);

  const navItem = (n) => (
    <button key={n.id} onClick={() => { setPage(n.id); setSideOpen(false); }}
      className={cn("flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition", page === n.id ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5")}
      style={page === n.id ? { background: "rgba(59,130,246,.2)", color: "#60a5fa" } : {}}>
      <span className="text-base w-5 text-center">{n.icon}</span>
      {n.label}
    </button>
  );

  const sidebar = (
    <div className="flex flex-col h-full py-4 px-3 gap-1">
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>S</div>
        <div>
          <div className="text-white font-bold text-sm">StarkAPI</div>
          <div className="text-slate-500 text-xs">Admin Panel</div>
        </div>
      </div>
      {NAV.map(navItem)}
      <div className="mt-auto px-2 pt-4 border-t" style={{ borderColor: "#1e2d5a" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
          <span className="text-green-400 text-xs">Live • {logs.length} logs</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex text-white" style={{ background: DEEP, fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 sticky top-0 h-screen" style={{ background: "#080c1a", borderRight: "1px solid #1e2d5a" }}>
        {sidebar}
      </aside>

      {/* mobile sidebar overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSideOpen(false)} style={{ background: "rgba(0,0,0,.6)" }}>
          <div className="w-56 h-full" style={{ background: "#080c1a", borderRight: "1px solid #1e2d5a" }} onClick={e => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}

      {/* main */}
      <main className="flex-1 min-w-0">
        {/* top bar */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 md:px-6" style={{ background: "rgba(8,12,26,.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1e2d5a" }}>
          <button className="md:hidden text-slate-400 hover:text-white text-xl" onClick={() => setSideOpen(true)}>☰</button>
          <div className="text-white font-semibold capitalize">{NAV.find(n => n.id === page)?.label}</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
            <span className="text-green-400 text-xs font-medium hidden sm:block">Online</span>
          </div>
        </div>

        {/* page content */}
        <div className="p-4 md:p-6 max-w-4xl">
          {page === "dashboard" && <Dashboard apis={apis} endpoints={endpoints} blocklist={blocklist} logs={logs} />}
          {page === "endpoints" && <ApiEndpointsPage apis={apis} setApis={setApis} endpoints={endpoints} setEndpoints={setEndpoints} blocklist={blocklist} addLog={addLog} toast={toast} />}
          {page === "blacklist" && <BlacklistPage blocklist={blocklist} setBlocklist={setBlocklist} toast={toast} />}
          {page === "logs" && <LogsPage logs={logs} apis={apis} />}
          {page === "live" && <LiveApiPage apis={apis} endpoints={endpoints} blocklist={blocklist} addLog={addLog} />}
        </div>
      </main>

      {toastMsg && <Toast msg={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}
