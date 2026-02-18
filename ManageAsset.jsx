<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Manage Asset – Modern UI Demo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  /* ── RESET & TOKENS ─────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-base:        #0d0f14;
    --bg-surface:     #13161e;
    --bg-raised:      #1a1e29;
    --bg-hover:       #1f2433;
    --border:         rgba(255,255,255,0.07);
    --border-focus:   #4f8ef7;
    --accent:         #4f8ef7;
    --accent-dim:     rgba(79,142,247,0.15);
    --accent-glow:    rgba(79,142,247,0.35);
    --green:          #3ecf8e;
    --green-dim:      rgba(62,207,142,0.15);
    --red:            #f76f72;
    --red-dim:        rgba(247,111,114,0.15);
    --amber:          #f5a623;
    --amber-dim:      rgba(245,166,35,0.12);
    --text-primary:   #e8eaf0;
    --text-secondary: #8891a5;
    --text-muted:     #4e5568;
    --font-body:      'IBM Plex Sans', sans-serif;
    --font-mono:      'IBM Plex Mono', monospace;
    --radius-sm:      4px;
    --radius:         8px;
    --radius-lg:      12px;
    --shadow-sm:      0 1px 4px rgba(0,0,0,0.4);
    --shadow:         0 4px 20px rgba(0,0,0,0.5);
    --shadow-glow:    0 0 0 3px var(--accent-glow);
  }

  body {
    font-family: var(--font-body);
    background: var(--bg-base);
    color: var(--text-primary);
    min-height: 100vh;
    font-size: 14px;
    line-height: 1.5;
  }

  /* ── IMPROVEMENT ANNOTATION OVERLAY ─────────────────────── */
  .improvement-badge {
    position: absolute;
    top: -10px; right: -10px;
    background: var(--amber);
    color: #000;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 20px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    z-index: 99;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(245,166,35,0.5);
    pointer-events: none;
  }
  .annotated { position: relative; }

  /* ── PAGE SHELL ─────────────────────────────────────────── */
  .page { display: flex; flex-direction: column; min-height: 100vh; }

  /* ── TOP NAV ─────────────────────────────────────────────── */
  .topnav {
    height: 52px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
  }
  .topnav-logo {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
    letter-spacing: 0.05em;
  }
  .topnav-sep { color: var(--text-muted); }
  .topnav-path { color: var(--text-secondary); font-size: 13px; }
  .topnav-path .active { color: var(--text-primary); }
  .topnav-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }

  /* ── STICKY ACTION BAR ────────────────────────────────────── */
  .action-bar {
    background: rgba(19,22,30,0.85);
    border-bottom: 1px solid var(--border);
    padding: 14px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    position: sticky;
    top: 52px;
    z-index: 90;
    backdrop-filter: blur(12px);
  }
  .action-bar-left { display: flex; flex-direction: column; gap: 4px; }
  .action-bar-title { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
  .action-bar-subtitle { font-size: 12px; color: var(--text-secondary); font-family: var(--font-mono); }
  .action-bar-right { display: flex; gap: 8px; align-items: center; }

  /* ── STATUS BADGES ────────────────────────────────────────── */
  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; }
  .badge-active {
    background: var(--green-dim); color: var(--green);
    border: 1px solid rgba(62,207,142,0.3);
  }
  .badge-active .badge-dot { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .badge-info {
    background: var(--accent-dim); color: var(--accent);
    border: 1px solid rgba(79,142,247,0.3);
  }

  /* ── BUTTONS ──────────────────────────────────────────────── */
  .btn {
    padding: 7px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500;
    border: 1px solid transparent; cursor: pointer; font-family: var(--font-body);
    transition: all 0.15s ease; display: inline-flex; align-items: center; gap: 6px;
    white-space: nowrap;
  }
  .btn-ghost {
    background: transparent; border-color: var(--border);
    color: var(--text-secondary);
  }
  .btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); border-color: rgba(255,255,255,0.15); }
  .btn-primary {
    background: var(--accent); color: #fff; border-color: var(--accent);
  }
  .btn-primary:hover { background: #6fa3f9; box-shadow: 0 0 16px var(--accent-glow); }
  .btn-success { background: var(--green); color: #000; }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-icon { padding: 7px 10px; }

  /* ── CONTENT LAYOUT ───────────────────────────────────────── */
  .content { display: flex; flex: 1; }

  /* ── SIDEBAR (NEW) ────────────────────────────────────────── */
  .sidebar {
    width: 220px;
    min-width: 220px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    padding: 20px 0;
    position: sticky;
    top: 104px; /* topnav + action bar */
    height: calc(100vh - 104px);
    overflow-y: auto;
  }
  .sidebar-section { padding: 0 12px; margin-bottom: 24px; }
  .sidebar-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-muted); padding: 0 8px; margin-bottom: 6px;
  }
  .sidebar-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: var(--radius-sm);
    cursor: pointer; color: var(--text-secondary);
    font-size: 13px; font-weight: 500;
    transition: all 0.12s ease; position: relative;
  }
  .sidebar-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .sidebar-item.active {
    background: var(--accent-dim); color: var(--accent);
  }
  .sidebar-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; border-radius: 0 3px 3px 0;
    background: var(--accent);
  }
  .sidebar-icon { opacity: 0.7; font-size: 15px; width: 18px; text-align: center; }
  .sidebar-count {
    margin-left: auto; background: var(--bg-raised); color: var(--text-muted);
    font-size: 11px; font-family: var(--font-mono);
    padding: 1px 7px; border-radius: 10px;
  }

  /* ── MAIN PANEL ───────────────────────────────────────────── */
  .main {
    flex: 1;
    padding: 24px 32px;
    max-width: 900px;
    overflow-y: auto;
  }

  /* ── SECTION CARDS ────────────────────────────────────────── */
  .section-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 0;
    margin-bottom: 16px;
    overflow: hidden;
    transition: border-color 0.2s ease;
  }
  .section-card:hover { border-color: rgba(255,255,255,0.12); }
  .section-card.error-card { border-color: rgba(247,111,114,0.4); }

  .section-head {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-raised);
  }
  .section-head-left { display: flex; align-items: center; gap: 10px; }
  .section-icon {
    width: 30px; height: 30px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    background: var(--accent-dim);
    border: 1px solid rgba(79,142,247,0.2);
  }
  .section-title { font-size: 13px; font-weight: 600; }
  .section-subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 1px; }
  .section-body { padding: 20px; }

  /* ── GRID ─────────────────────────────────────────────────── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
  .span-2 { grid-column: 1 / -1; }

  /* ── FORM FIELDS ──────────────────────────────────────────── */
  .field { display: flex; flex-direction: column; gap: 5px; padding: 8px 0; }
  .field-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
    color: var(--text-secondary); text-transform: uppercase;
    display: flex; align-items: center; gap: 5px;
  }
  .required { color: var(--red); }
  .field-hint { font-size: 11px; color: var(--text-muted); }
  .field-error-msg { font-size: 11px; color: var(--red); }

  .input {
    width: 100%; padding: 8px 12px;
    background: var(--bg-raised); color: var(--text-primary);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    font-size: 13px; font-family: var(--font-body);
    transition: all 0.15s ease;
    outline: none;
  }
  .input::placeholder { color: var(--text-muted); }
  .input:hover { border-color: rgba(255,255,255,0.15); }
  .input:focus { border-color: var(--border-focus); box-shadow: var(--shadow-glow); }
  .input.error { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-dim); }
  .input:disabled { opacity: 0.45; cursor: not-allowed; }
  textarea.input { resize: vertical; min-height: 80px; }

  .input-group { display: flex; gap: 6px; }
  .input-group .input { flex: 1; }

  select.input { cursor: pointer; }

  /* ── RADIO PILLS ──────────────────────────────────────────── */
  .radio-pills { display: flex; gap: 8px; flex-wrap: wrap; }
  .radio-pill {
    padding: 6px 14px; border-radius: 20px;
    border: 1px solid var(--border); cursor: pointer;
    font-size: 12px; font-weight: 500;
    color: var(--text-secondary);
    transition: all 0.15s ease;
    user-select: none;
  }
  .radio-pill:hover { border-color: rgba(255,255,255,0.2); color: var(--text-primary); }
  .radio-pill.selected-yes { background: var(--green-dim); color: var(--green); border-color: rgba(62,207,142,0.4); }
  .radio-pill.selected-no { background: var(--red-dim); color: var(--red); border-color: rgba(247,111,114,0.4); }
  .radio-pill.selected-blue { background: var(--accent-dim); color: var(--accent); border-color: rgba(79,142,247,0.4); }

  /* ── INLINE METRIC CARDS ──────────────────────────────────── */
  .metric-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .metric-card {
    background: var(--bg-raised); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px 16px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .metric-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); }
  .metric-value { font-size: 22px; font-weight: 600; font-family: var(--font-mono); }
  .metric-sub { font-size: 11px; color: var(--text-secondary); }
  .metric-green { color: var(--green); }
  .metric-blue  { color: var(--accent); }
  .metric-amber { color: var(--amber); }

  /* ── TABS (TOP BAR VARIANT) ───────────────────────────────── */
  .tab-bar {
    display: flex; gap: 2px;
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    background: var(--bg-surface);
    overflow-x: auto;
  }
  .tab {
    padding: 12px 18px; cursor: pointer; border-bottom: 2px solid transparent;
    font-size: 13px; font-weight: 500; color: var(--text-secondary);
    white-space: nowrap; display: flex; align-items: center; gap: 7px;
    transition: all 0.15s ease; margin-bottom: -1px;
  }
  .tab:hover { color: var(--text-primary); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-count {
    background: var(--bg-raised); font-size: 10px;
    padding: 1px 6px; border-radius: 10px;
    font-family: var(--font-mono);
  }

  /* ── PROGRESS BAR ─────────────────────────────────────────── */
  .progress-bar { height: 4px; background: var(--bg-raised); border-radius: 2px; overflow: hidden; margin-top: 6px; }
  .progress-fill { height: 100%; border-radius: 2px; background: var(--accent); transition: width 0.4s ease; }
  .progress-fill.green { background: var(--green); }
  .progress-fill.amber { background: var(--amber); }

  /* ── DIVIDER ──────────────────────────────────────────────── */
  .divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── IMPROVEMENT PANEL (sidebar annotation) ───────────────── */
  .annotation-panel {
    width: 260px; min-width: 260px;
    padding: 20px 16px;
    border-left: 1px solid var(--border);
    background: var(--bg-surface);
    position: sticky;
    top: 104px;
    height: calc(100vh - 104px);
    overflow-y: auto;
  }
  .ann-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 14px; }
  .ann-item {
    padding: 10px 12px; border-radius: var(--radius); margin-bottom: 8px;
    border: 1px solid var(--border); background: var(--bg-raised);
    cursor: pointer; transition: all 0.15s ease;
  }
  .ann-item:hover { border-color: var(--amber); }
  .ann-num {
    font-size: 10px; font-weight: 700; font-family: var(--font-mono);
    color: var(--amber); margin-bottom: 4px;
  }
  .ann-text { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
  .ann-tag {
    display: inline-block; margin-top: 6px;
    font-size: 10px; padding: 2px 8px; border-radius: 10px;
    background: var(--amber-dim); color: var(--amber); font-weight: 600;
  }

  /* ── TOAST ────────────────────────────────────────────────── */
  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--bg-raised); border: 1px solid var(--green);
    border-radius: var(--radius); padding: 12px 18px;
    display: flex; align-items: center; gap: 10px;
    box-shadow: var(--shadow), 0 0 20px rgba(62,207,142,0.2);
    font-size: 13px; z-index: 999;
    animation: slideIn 0.3s ease;
  }
  @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .toast-icon { color: var(--green); font-size: 16px; }

  /* ── SCROLLBAR ────────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--bg-raised); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
</style>
</head>
<body>

<!-- ── TOP NAV ──────────────────────────────────────────────── -->
<nav class="topnav">
  <span class="topnav-logo">◈ Splunk</span>
  <span class="topnav-sep">/</span>
  <span class="topnav-path">Data Catalog <span style="color:var(--text-muted)">›</span> <span class="active">Manage Asset</span></span>
  <div class="topnav-right">
    <span class="badge badge-info">
      <span class="badge-dot" style="background:var(--accent)"></span>
      Prisma Dark
    </span>
  </div>
</nav>

<!-- ── ACTION BAR ────────────────────────────────────────────── -->
<div class="action-bar annotated">
  <span class="improvement-badge">① Sticky Action Bar</span>
  <div class="action-bar-left">
    <div class="action-bar-title">
      prod_app_logs
      <span class="badge badge-active">
        <span class="badge-dot"></span>Active
      </span>
      <span class="badge badge-info">Event Index</span>
    </div>
    <div class="action-bar-subtitle">index_name · Last updated 2 hours ago by jdoe@corp.com</div>
  </div>
  <div class="action-bar-right">
    <button class="btn btn-ghost btn-sm">⟳ Refresh</button>
    <button class="btn btn-ghost btn-sm">✎ Edit</button>
    <button class="btn btn-primary btn-sm" onclick="showToast()">✓ Save Changes</button>
  </div>
</div>

<!-- ── TABS ──────────────────────────────────────────────────── -->
<div class="tab-bar annotated" style="position:sticky;top:104px;z-index:80;">
  <span class="improvement-badge" style="top:-8px;right:auto;left:50%;transform:translateX(-50%);">② Tab Bar with Counts</span>
  <div class="tab active" onclick="switchTab(this,'overview')">📋 Overview</div>
  <div class="tab" onclick="switchTab(this,'retention')">📦 Size & Retention</div>
  <div class="tab" onclick="switchTab(this,'contacts')">👥 Contacts <span class="tab-count">3</span></div>
  <div class="tab" onclick="switchTab(this,'docs')">📎 Documentation <span class="tab-count">2</span></div>
  <div class="tab" onclick="switchTab(this,'classification')">🏷 Classification</div>
</div>

<!-- ── MAIN CONTENT ──────────────────────────────────────────── -->
<div class="content">

  <!-- SIDEBAR -->
  <aside class="sidebar annotated">
    <span class="improvement-badge" style="top:0;right:0;">③ Nav Sidebar</span>
    <div class="sidebar-section">
      <div class="sidebar-label">Quick Jump</div>
      <div class="sidebar-item active"><span class="sidebar-icon">◉</span> Identity</div>
      <div class="sidebar-item"><span class="sidebar-icon">◎</span> Descriptions</div>
      <div class="sidebar-item"><span class="sidebar-icon">◎</span> Permissions</div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Asset Health</div>
      <div class="sidebar-item"><span class="sidebar-icon">📈</span> Usage <span class="sidebar-count">68%</span></div>
      <div class="sidebar-item"><span class="sidebar-icon">⏱</span> Retention <span class="sidebar-count">90d</span></div>
      <div class="sidebar-item"><span class="sidebar-icon">⚠️</span> Alerts <span class="sidebar-count" style="color:var(--amber)">2</span></div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Related</div>
      <div class="sidebar-item"><span class="sidebar-icon">🔗</span> Linked Indexes <span class="sidebar-count">4</span></div>
      <div class="sidebar-item"><span class="sidebar-icon">🧩</span> Apps <span class="sidebar-count">2</span></div>
    </div>
  </aside>

  <!-- MAIN PANEL -->
  <main class="main" id="main-overview">

    <!-- METRIC ROW -->
    <div class="metric-row annotated" style="position:relative;">
      <span class="improvement-badge">④ Metric Cards</span>
      <div class="metric-card">
        <div class="metric-label">Daily Volume</div>
        <div class="metric-value metric-blue">500 <span style="font-size:14px">MB</span></div>
        <div class="metric-sub">↑ 12% vs last week</div>
        <div class="progress-bar"><div class="progress-fill" style="width:68%"></div></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Retention</div>
        <div class="metric-value metric-green">90 <span style="font-size:14px">days</span></div>
        <div class="metric-sub">Expires Jan 2026</div>
        <div class="progress-bar"><div class="progress-fill green" style="width:82%"></div></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Contacts</div>
        <div class="metric-value metric-amber">3</div>
        <div class="metric-sub">2 active · 1 pending</div>
        <div class="progress-bar"><div class="progress-fill amber" style="width:40%"></div></div>
      </div>
    </div>

    <!-- SECTION: IDENTITY -->
    <div class="section-card annotated">
      <span class="improvement-badge">⑤ Section Cards</span>
      <div class="section-head">
        <div class="section-head-left">
          <div class="section-icon">🗂</div>
          <div>
            <div class="section-title">Index Identity</div>
            <div class="section-subtitle">Core identifiers and access role</div>
          </div>
        </div>
      </div>
      <div class="section-body">
        <div class="grid-2">
          <div class="field annotated" style="position:relative;">
            <span class="improvement-badge" style="top:-8px;right:-10px;">⑥ Inline Validation</span>
            <div class="field-label">Index Name <span class="required">*</span></div>
            <div class="input-group">
              <input class="input error" type="text" value="prod_app_logs" />
              <button class="btn btn-ghost btn-sm">Check</button>
            </div>
            <div class="field-error-msg">⚠ Index name already exists in Cluster B</div>
          </div>

          <div class="field">
            <div class="field-label">Role Name <span class="required">*</span></div>
            <input class="input" type="text" value="sc4s_writer" />
          </div>

          <div class="field">
            <div class="field-label">Ability App Name</div>
            <input class="input" type="text" placeholder="e.g. splunk_app_prod" />
          </div>

          <div class="field">
            <div class="field-label">AGS Entitlement Name <span class="required">*</span></div>
            <input class="input" type="text" value="ags-prod-write-001" />
          </div>

          <div class="field span-2">
            <div class="field-label">Index Active</div>
            <div class="radio-pills annotated" style="position:relative;">
              <span class="improvement-badge" style="top:-10px;right:auto;left:0;">⑦ Pill Selectors</span>
              <div class="radio-pill selected-yes">✓ Yes – Active</div>
              <div class="radio-pill">✗ No – Inactive</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION: DESCRIPTIONS -->
    <div class="section-card">
      <div class="section-head">
        <div class="section-head-left">
          <div class="section-icon">📝</div>
          <div>
            <div class="section-title">Descriptions</div>
            <div class="section-subtitle">Purpose and application context</div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">2 / 2 filled</div>
      </div>
      <div class="section-body">
        <div class="field">
          <div class="field-label">Index Description <span class="required">*</span></div>
          <textarea class="input" rows="3">Stores production application logs from the core payment processing service. Ingested via SC4S forwarders on port 514. Used by the security and compliance teams for audit trails.</textarea>
          <div class="field-hint">Describe the purpose, source, and intended consumers of this index.</div>
        </div>
        <div class="divider"></div>
        <div class="field">
          <div class="field-label">Application Description</div>
          <textarea class="input" rows="2">Core payment service — processes ~2M transactions/day across all customer segments. Written in Go, deployed on EKS.</textarea>
        </div>
      </div>
    </div>

    <!-- SECTION: LIFECYCLE (retention tab preview) -->
    <div class="section-card" id="retention-preview" style="display:none;">
      <div class="section-head">
        <div class="section-head-left">
          <div class="section-icon">⏱</div>
          <div>
            <div class="section-title">Lifecycle & Volume</div>
            <div class="section-subtitle">Storage, retention, and creation metadata</div>
          </div>
        </div>
      </div>
      <div class="section-body">
        <div class="grid-2">
          <div class="field">
            <div class="field-label">Index Size Per Day (MB) <span class="required">*</span></div>
            <input class="input" type="text" value="500" />
          </div>
          <div class="field">
            <div class="field-label">Avg Index Usage (MB)</div>
            <input class="input" type="text" value="320" />
          </div>
          <div class="field">
            <div class="field-label">Created By <span class="required">*</span></div>
            <select class="input">
              <option>Jane Smith (Architect)</option>
            </select>
          </div>
          <div class="field">
            <div class="field-label">Created Date <span class="required">*</span></div>
            <input class="input" type="date" value="2023-04-12" />
          </div>
          <div class="field">
            <div class="field-label">Retention Period (Days) <span class="required">*</span></div>
            <input class="input" type="text" value="90" />
          </div>
          <div class="field">
            <div class="field-label">Index In Use</div>
            <div class="radio-pills">
              <div class="radio-pill selected-yes">✓ Yes</div>
              <div class="radio-pill">✗ No</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION: CONTACTS TAB PREVIEW -->
    <div class="section-card" id="contacts-preview" style="display:none;">
      <div class="section-head">
        <div class="section-head-left">
          <div class="section-icon">👥</div>
          <div>
            <div class="section-title">Additional Contacts</div>
            <div class="section-subtitle">People responsible for this index</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm">+ Add Contact</button>
      </div>
      <div class="section-body">
        <!-- Contact rows -->
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end;" class="annotated">
            <span class="improvement-badge">⑧ Structured Row Layout</span>
            <div class="field">
              <div class="field-label">Name</div>
              <input class="input" type="text" value="Jane Smith" />
            </div>
            <div class="field">
              <div class="field-label">Email</div>
              <input class="input" type="text" value="jane.smith@corp.com" />
            </div>
            <div class="field">
              <div class="field-label">Role</div>
              <select class="input"><option>Owner</option><option>Backup</option></select>
            </div>
            <button class="btn btn-ghost btn-icon" style="margin-bottom:8px;">🗑</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end;">
            <div class="field"><div class="field-label">Name</div><input class="input" type="text" value="Bob Nguyen" /></div>
            <div class="field"><div class="field-label">Email</div><input class="input" type="text" value="b.nguyen@corp.com" /></div>
            <div class="field"><div class="field-label">Role</div><select class="input"><option>Backup</option></select></div>
            <button class="btn btn-ghost btn-icon" style="margin-bottom:8px;">🗑</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CLASSIFICATION TAB PREVIEW -->
    <div class="section-card" id="classification-preview" style="display:none;">
      <div class="section-head">
        <div class="section-head-left">
          <div class="section-icon">🏷</div>
          <div>
            <div class="section-title">Data Classification</div>
          </div>
        </div>
      </div>
      <div class="section-body">
        <div class="field">
          <div class="field-label">Customer Segment</div>
          <div class="radio-pills">
            <div class="radio-pill selected-blue">Enterprise</div>
            <div class="radio-pill">SMB</div>
            <div class="radio-pill">Internal</div>
            <div class="radio-pill">Partner</div>
          </div>
        </div>
        <div class="divider" style="margin:16px 0"></div>
        <div class="field">
          <div class="field-label">Index Classification</div>
          <div class="radio-pills">
            <div class="radio-pill">Public</div>
            <div class="radio-pill">Internal</div>
            <div class="radio-pill selected-blue">Confidential</div>
            <div class="radio-pill">Restricted</div>
          </div>
        </div>
        <div class="divider" style="margin:16px 0"></div>
        <div class="field">
          <div class="field-label">Index Cluster</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <div class="radio-pill selected-blue">Cluster A ✕</div>
            <div class="radio-pill selected-blue">Cluster C ✕</div>
            <div class="radio-pill">+ Add Cluster</div>
          </div>
        </div>
      </div>
    </div>

  </main>

  <!-- ANNOTATION PANEL -->
  <aside class="annotation-panel">
    <div class="ann-title">💡 Improvements Made</div>

    <div class="ann-item">
      <div class="ann-num"># 01</div>
      <div class="ann-text">Sticky action bar with breadcrumb, live status badge, and contextual buttons (Edit vs Save+Cancel).</div>
      <span class="ann-tag">Navigation</span>
    </div>
    <div class="ann-item">
      <div class="ann-num"># 02</div>
      <div class="ann-text">Tabs show item counts (Contacts: 3) so users know what's populated without clicking.</div>
      <span class="ann-tag">Discoverability</span>
    </div>
    <div class="ann-item">
      <div class="ann-num"># 03</div>
      <div class="ann-text">Left sidebar adds quick-jump anchors, health stats, and related-asset links without requiring new pages.</div>
      <span class="ann-tag">Information Density</span>
    </div>
    <div class="ann-item">
      <div class="ann-num"># 04</div>
      <div class="ann-text">Key metrics (volume, retention, contacts) surfaced at the top as scannable cards with progress bars.</div>
      <span class="ann-tag">Data Visibility</span>
    </div>
    <div class="ann-item">
      <div class="ann-num"># 05</div>
      <div class="ann-text">Section cards with icon, title, and subtitle replace a flat field dump — clear grouping at a glance.</div>
      <span class="ann-tag">Visual Hierarchy</span>
    </div>
    <div class="ann-item">
      <div class="ann-num"># 06</div>
      <div class="ann-text">Inline field-level error messages with red ring focus state replace generic top-level alerts.</div>
      <span class="ann-tag">Error Feedback</span>
    </div>
    <div class="ann-item">
      <div class="ann-num"># 07</div>
      <div class="ann-text">Pill selectors for Yes/No/enum fields replace RadioList — they're smaller, clearer, and color-coded.</div>
      <span class="ann-tag">Input UX</span>
    </div>
    <div class="ann-item">
      <div class="ann-num"># 08</div>
      <div class="ann-text">FormRows (Contacts, Docs) use a structured grid with column headers instead of bare stacked inputs.</div>
      <span class="ann-tag">Form Layout</span>
    </div>
  </aside>

</div>

<!-- TOAST -->
<div class="toast" id="toast" style="display:none">
  <span class="toast-icon">✓</span>
  Asset saved successfully — <strong>prod_app_logs</strong>
</div>

<script>
  function switchTab(el, tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    // Hide all section groups
    document.getElementById('main-overview').querySelectorAll('.section-card, .metric-row').forEach(c => c.style.display = 'none');
    document.querySelectorAll('[id$="-preview"]').forEach(c => c.style.display = 'none');
    if (tab === 'overview') {
      document.querySelectorAll('#main-overview > .metric-row, #main-overview > .section-card:not([id])').forEach(c => c.style.display = '');
    } else {
      const p = document.getElementById(tab + '-preview');
      if (p) { p.style.display = ''; }
    }
  }

  function showToast() {
    const t = document.getElementById('toast');
    t.style.display = 'flex';
    setTimeout(() => t.style.display = 'none', 3500);
  }
</script>
</body>
</html>
