import { useState, useEffect, useRef, useCallback } from 'react';

function DbIcon() {
  return (
    <svg className="tree-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <ellipse cx="8" cy="4" rx="6" ry="2.5" />
      <path d="M2 4v2.5C2 7.88 4.686 9 8 9s6-1.12 6-2.5V4C14 5.38 11.314 6.5 8 6.5S2 5.38 2 4z" />
      <path d="M2 8.5v2.5C2 12.38 4.686 13.5 8 13.5s6-1.12 6-2.5V8.5C14 9.88 11.314 11 8 11S2 9.88 2 8.5z" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg className="tree-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" />
      <line x1="5.5" y1="6" x2="5.5" y2="13.5" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg className="chevron" viewBox="0 0 16 16" fill="currentColor" aria-hidden style={{ transform: open ? 'rotate(90deg)' : 'none' }}>
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.294 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.294A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 2.93l1.25.834a6.957 6.957 0 0 1 1.416-.587L8.34 1.804ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
    </svg>
  );
}

function LockIcon({ locked }) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
      <rect x="3" y="8" width="10" height="7" rx="1.5" fill="currentColor" />
      <path
        d={locked
          ? 'M 5.5 8 L 5.5 5.5 A 2.5 2.5 0 0 0 10.5 5.5 L 10.5 8'
          : 'M 5.5 8 L 5.5 5.5 A 2.5 2.5 0 0 0 10.5 5.5 L 10.5 3.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function statusBadge(value) {
  const v = String(value).toLowerCase();
  let cls = 'badge';
  if (['approved', 'active', 'success', 'done', 'completed', 'pass', 'passed'].includes(v)) cls += ' badge-green';
  else if (['pending', 'raw', 'draft', 'in_progress', 'processing', 'warning'].includes(v)) cls += ' badge-yellow';
  else if (['rejected', 'failed', 'error', 'inactive', 'fail', 'failed'].includes(v)) cls += ' badge-red';
  else cls += ' badge-gray';
  return <span className={cls}>{value}</span>;
}

function DataTable({ columns, rows }) {
  if (!columns.length) return <p className="empty-msg">Ingen kolonner</p>;
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.name}>
              <span className="col-name">{col.name}</span>
              {col.type && <span className="col-type">{col.type}</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
            {columns.map(col => {
              const val = row[col.name];
              const isNull = val === null || val === undefined;
              const isStatus = col.name.toLowerCase() === 'status' && !isNull;
              return (
                <td key={col.name}>
                  {isNull
                    ? <span className="null-val">NULL</span>
                    : isStatus
                    ? statusBadge(val)
                    : String(val)}
                </td>
              );
            })}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="empty-msg">Ingen rækker</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function SettingsPanel({ onClose, onSaved }) {
  const [entries, setEntries] = useState([]);
  const [scanned, setScanned] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(cfg => setEntries(cfg.databases || []));
    fetch('/api/scan').then(r => r.json()).then(setScanned);
  }, []);

  function updateEntry(i, field, value) {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  }

  function removeEntry(i) {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  }

  function addEmpty() {
    setEntries(prev => [...prev, { name: '', path: '' }]);
  }

  function addFromScan(item) {
    setEntries(prev => [...prev, { name: item.name, path: item.path }]);
    setScanned(prev => prev.filter(s => s.path !== item.path));
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databases: entries }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error); setSaving(false); return; }
      onSaved();
      onClose();
    } catch (e) {
      setSaveError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span className="settings-title">Databaser</span>
        <button className="sql-close-btn" onClick={onClose} aria-label="Luk indstillinger">✕</button>
      </div>
      <div className="settings-body">
        <div className="settings-list">
          {entries.length === 0 && (
            <p className="settings-empty">Ingen databaser konfigureret — tilføj nedenfor eller vælg fra fundne filer</p>
          )}
          {entries.map((e, i) => (
            <div key={i} className="settings-entry">
              <input
                className="settings-input settings-name"
                placeholder="Visningsnavn"
                value={e.name}
                onChange={ev => updateEntry(i, 'name', ev.target.value)}
              />
              <input
                className="settings-input settings-path"
                placeholder="/data/..."
                value={e.path}
                onChange={ev => updateEntry(i, 'path', ev.target.value)}
              />
              <button
                className="settings-del"
                onClick={() => removeEntry(i)}
                aria-label="Slet database"
                title="Fjern"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button className="settings-add-btn" onClick={addEmpty}>+ Tilføj database</button>

        {scanned.length > 0 && (
          <div className="settings-scan">
            <div className="settings-scan-title">Fundne databaser</div>
            {scanned.map((s, i) => (
              <div key={i} className="settings-scan-entry">
                <span className="settings-scan-name">{s.name}</span>
                <span className="settings-scan-path">{s.path}</span>
                <button className="settings-scan-add" onClick={() => addFromScan(s)}>Tilføj</button>
              </div>
            ))}
          </div>
        )}

        {saveError && <div className="settings-error" role="alert">{saveError}</div>}

        <div className="settings-footer">
          <button className="run-btn" onClick={save} disabled={saving}>
            {saving ? 'Gemmer...' : 'Gem'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [databases, setDatabases] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [tableMap, setTableMap] = useState({});
  const [selected, setSelected] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sqlInput, setSqlInput] = useState('');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlError, setSqlError] = useState(null);
  const [drawerMode, setDrawerMode] = useState('closed'); // 'closed' | 'minimized' | 'open'
  const [copied, setCopied] = useState(false);
  const [sqlLocked, setSqlLocked] = useState(false);
  const [lockedContext, setLockedContext] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchTimer = useRef(null);

  // Which db/table queries run against (locked stays frozen on table switch)
  const queryTarget = (sqlLocked && lockedContext) ? lockedContext : selected;

  const loadDatabases = useCallback(() => {
    fetch('/api/databases')
      .then(r => r.json())
      .then(data => {
        setDatabases(data);
        setExpanded(new Set());
        setTableMap({});
        setSelected(null);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (drawerMode === 'open') setDrawerMode('closed');
        else if (settingsOpen) setSettingsOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerMode, settingsOpen]);

  useEffect(() => { loadDatabases(); }, [loadDatabases]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  useEffect(() => {
    if (!selected) { setTableData(null); return; }
    let cancelled = false;
    setTableLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (search) params.set('search', search);
    fetch(`/api/databases/${encodeURIComponent(selected.db)}/tables/${encodeURIComponent(selected.table)}?${params}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) { setTableData(data); setTableLoading(false); } })
      .catch(() => { if (!cancelled) setTableLoading(false); });
    return () => { cancelled = true; };
  }, [selected, search, page]);

  async function toggleDb(dbName) {
    const next = new Set(expanded);
    if (next.has(dbName)) {
      next.delete(dbName);
    } else {
      next.add(dbName);
      if (!tableMap[dbName]) {
        const r = await fetch(`/api/databases/${encodeURIComponent(dbName)}/tables`);
        const data = await r.json();
        setTableMap(prev => ({ ...prev, [dbName]: data }));
      }
    }
    setExpanded(next);
  }

  function selectTable(db, table) {
    setSelected({ db, table });
    setSearchInput('');
    setSearch('');
    setPage(1);
    setSettingsOpen(false);
    if (!sqlLocked) {
      setSqlResult(null);
      setSqlError(null);
      setSqlInput(`SELECT * FROM "${table}" LIMIT 100;`);
    }
  }

  function minimize() {
    if (sqlInput.trim() && !sqlLocked) {
      setSqlLocked(true);
      setLockedContext(selected);
    }
    setDrawerMode('minimized');
  }

  function toggleLock() {
    if (sqlLocked) {
      setSqlLocked(false);
      setLockedContext(null);
    } else {
      setSqlLocked(true);
      setLockedContext(selected);
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(el);
    }
    return Promise.resolve();
  }

  function copyResult() {
    if (!sqlResult) return;
    const header = sqlResult.columns.map(c => c.name).join('\t');
    const rows = sqlResult.rows.map(row =>
      sqlResult.columns.map(c => {
        const v = row[c.name];
        return v === null || v === undefined ? '' : String(v);
      }).join('\t')
    );
    copyToClipboard([header, ...rows].join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function runQuery() {
    if (!queryTarget || !sqlInput.trim()) return;
    setSqlError(null);
    setSqlResult(null);
    try {
      const res = await fetch(`/api/databases/${encodeURIComponent(queryTarget.db)}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlInput }),
      });
      const data = await res.json();
      if (!res.ok) setSqlError(data.error);
      else setSqlResult(data);
    } catch (e) {
      setSqlError(e.message);
    }
  }

  const drawerClass = `sql-drawer${
    drawerMode === 'open' ? ' sql-drawer-open' :
    drawerMode === 'minimized' ? ' sql-drawer-minimized' : ''
  }`;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-title">dbrowser</div>
        <nav className="tree">
          {databases.length === 0 && <p className="tree-empty">Ingen databaser fundet</p>}
          {databases.map(db => (
            <div key={db.name}>
              <button
                  className="tree-db"
                  onClick={() => toggleDb(db.name)}
                  aria-expanded={expanded.has(db.name)}
                >>
                <ChevronIcon open={expanded.has(db.name)} />
                <DbIcon />
                <span className="tree-label">{db.name}</span>
              </button>
              {expanded.has(db.name) && (
                <div className="tree-tables">
                  {tableMap[db.name]
                    ? tableMap[db.name].map(table => (
                        <button
                          key={table}
                          className={`tree-table ${selected?.db === db.name && selected?.table === table ? 'active' : ''}`}
                          onClick={() => selectTable(db.name, table)}
                        >
                          <TableIcon />
                          <span className="tree-label">{table}</span>
                        </button>
                      ))
                    : <p className="tree-loading">Henter...</p>}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            className={`settings-gear-btn${settingsOpen ? ' active' : ''}`}
            onClick={() => setSettingsOpen(v => !v)}
            title="Indstillinger"
            aria-label="Indstillinger"
          >
            <GearIcon />
          </button>
        </div>
      </aside>

      <div className="main">
        {settingsOpen ? (
          <SettingsPanel
            onClose={() => setSettingsOpen(false)}
            onSaved={loadDatabases}
          />
        ) : (
          <div
            className="content"
            onClick={() => drawerMode === 'open' && setDrawerMode('closed')}
          >
            {!selected ? (
              <div className="welcome">
                <p>Vælg en tabel til venstre</p>
              </div>
            ) : (
              <>
                <div className="toolbar">
                  <span className="breadcrumb">
                    <span className="breadcrumb-db">{selected.db}</span>
                    <span className="breadcrumb-sep">/</span>
                    <span className="breadcrumb-table">{selected.table}</span>
                  </span>
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Søg i alle kolonner..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                  />
                  {tableData && (
                    <span className="row-count">{tableData.total.toLocaleString('da-DK')} rækker</span>
                  )}
                </div>

                <div className="table-scroll">
                  {tableLoading ? (
                    <p className="loading-msg">Henter...</p>
                  ) : tableData?.error ? (
                    <p className="error-msg">{tableData.error}</p>
                  ) : tableData ? (
                    <DataTable columns={tableData.columns} rows={tableData.rows} />
                  ) : null}
                </div>

                {tableData && tableData.pages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ‹ Forrige
                    </button>
                    <span className="page-info">Side {tableData.page} af {tableData.pages}</span>
                    <button
                      className="page-btn"
                      disabled={page >= tableData.pages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Næste ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {drawerMode === 'closed' && (
          <button
            className="sql-tab"
            onClick={() => setDrawerMode('open')}
            title="Åbn SQL Editor"
            aria-label="Åbn SQL Editor"
          >
            <span className="sql-tab-label">SQL</span>
          </button>
        )}

        <div
          className={drawerClass}
          role="dialog"
          aria-label="SQL Editor"
          onClick={e => e.stopPropagation()}
        >
          <div className="sql-drawer-header">
            <span className="sql-drawer-title">SQL Editor</span>
            {queryTarget && (
              <span className="sql-drawer-context">
                {queryTarget.db} / {queryTarget.table}
              </span>
            )}
            <div className="sql-drawer-actions">
              <button
                className={`sql-lock-btn${sqlLocked ? ' locked' : ''}`}
                onClick={toggleLock}
                title={sqlLocked ? 'Lås op — tabelskift nulstiller SQL' : 'Lås — bevar SQL ved tabelskift'}
                aria-label={sqlLocked ? 'Lås op' : 'Lås'}
              >
                <LockIcon locked={sqlLocked} />
              </button>
              {drawerMode === 'open' && (
                <button
                  className="sql-minimize-btn"
                  onClick={minimize}
                  title="Minimer"
                  aria-label="Minimer"
                >
                  →
                </button>
              )}
              {drawerMode === 'minimized' && (
                <button
                  className="sql-minimize-btn"
                  onClick={() => setDrawerMode('open')}
                  title="Udvid"
                  aria-label="Udvid"
                >
                  ←
                </button>
              )}
              {drawerMode === 'open' && (
                <button
                  className="run-btn"
                  onClick={runQuery}
                  disabled={!queryTarget}
                  title="Ctrl+Enter"
                >
                  Kør
                </button>
              )}
              <button
                className="sql-close-btn"
                onClick={() => setDrawerMode('closed')}
                title="Luk (Esc)"
                aria-label="Luk SQL Editor"
              >
                ✕
              </button>
            </div>
          </div>

          {drawerMode === 'minimized' && (
            sqlInput.trim() ? (
              <div className="sql-mini-preview" onClick={() => setDrawerMode('open')}>
                <pre className="sql-mini-text">{sqlInput}</pre>
              </div>
            ) : (
              <div className="sql-mini-empty" onClick={() => setDrawerMode('open')}>
                Klik for at åbne editor
              </div>
            )
          )}

          {drawerMode === 'open' && (
            <div className="sql-drawer-body">
              <textarea
                className="sql-textarea"
                value={sqlInput}
                onChange={e => setSqlInput(e.target.value)}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') runQuery(); }}
                placeholder="SELECT * FROM ..."
                spellCheck={false}
              />
              {sqlError && <div className="sql-error" role="alert">{sqlError}</div>}
              {sqlResult && (
                <div className="sql-result">
                  <div className="sql-result-meta">
                    {sqlResult.total.toLocaleString('da-DK')} rækker
                    <button className="copy-btn" onClick={copyResult}>
                      {copied ? 'Kopieret!' : 'Kopiér'}
                    </button>
                  </div>
                  <div className="sql-table-scroll">
                    <DataTable columns={sqlResult.columns} rows={sqlResult.rows} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
