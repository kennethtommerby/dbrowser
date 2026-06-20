const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || '/data';
const DIST_DIR = path.join(__dirname, 'dist');

const CONFIG_PATHS = [
  path.join(DATA_DIR, 'config.json'),
  '/opt/dbrowser/config.json',
];

function loadConfig() {
  for (const p of CONFIG_PATHS) {
    try {
      const raw = fs.readFileSync(p, 'utf8');
      const cfg = JSON.parse(raw);
      if (Array.isArray(cfg.databases) && cfg.databases.length > 0) {
        return cfg;
      }
    } catch (_) {}
  }
  return null;
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATHS[0], JSON.stringify(cfg, null, 2), 'utf8');
}

function isWithinDataDir(absPath) {
  const base = path.resolve(DATA_DIR) + path.sep;
  return absPath.startsWith(base);
}

function findDatabases(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findDatabases(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.db')) {
        results.push(fullPath);
      }
    }
  } catch (_) {}
  return results;
}

function findDbPath(dbName) {
  const cfg = loadConfig();
  if (cfg) {
    const entry = cfg.databases.find(d => d.name === dbName);
    if (!entry) return null;
    const resolved = path.resolve(entry.path);
    if (!isWithinDataDir(resolved)) return null;
    return resolved;
  }

  if (dbName.includes('/') || dbName.includes('..') || dbName.includes('\0') || dbName.includes('\\')) {
    return null;
  }
  const files = findDatabases(DATA_DIR);
  const found = files.find(f => path.basename(f, '.db') === dbName);
  if (found && isWithinDataDir(path.resolve(found))) {
    return found;
  }
  return null;
}

function q(name) {
  return '"' + name.replace(/"/g, '""') + '"';
}

app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json(cfg || { databases: [] });
});

app.post('/api/config', (req, res) => {
  const { databases } = req.body || {};
  if (!Array.isArray(databases)) {
    return res.status(400).json({ error: 'databases skal være et array' });
  }
  for (const d of databases) {
    if (typeof d.name !== 'string' || !d.name.trim()) {
      return res.status(400).json({ error: 'Hvert entry skal have et navn' });
    }
    if (typeof d.path !== 'string' || !d.path.trim()) {
      return res.status(400).json({ error: 'Hvert entry skal have en sti' });
    }
    const resolved = path.resolve(d.path);
    if (!isWithinDataDir(resolved)) {
      return res.status(400).json({ error: `Stien "${d.path}" er ikke tilladt — skal være inden for ${DATA_DIR}` });
    }
  }
  try {
    saveConfig({ databases: databases.map(d => ({ name: d.name.trim(), path: d.path.trim() })) });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/scan', (req, res) => {
  const files = findDatabases(DATA_DIR);
  const cfg = loadConfig();
  const configured = new Set((cfg?.databases || []).map(d => path.resolve(d.path)));
  const results = files
    .filter(f => !configured.has(path.resolve(f)))
    .map(f => ({ name: path.basename(f, '.db'), path: f }));
  res.json(results);
});

app.get('/api/databases', (req, res) => {
  const cfg = loadConfig();
  if (cfg) {
    res.json(cfg.databases.map(d => ({ name: d.name, path: d.path })));
    return;
  }
  const files = findDatabases(DATA_DIR);
  const dbs = files.map(f => ({
    name: path.basename(f, '.db'),
    path: f.slice(DATA_DIR.length + 1),
  }));
  res.json(dbs);
});

app.get('/api/databases/:dbName/tables', (req, res) => {
  const dbPath = findDbPath(req.params.dbName);
  if (!dbPath) return res.status(404).json({ error: 'Database ikke fundet' });
  let db;
  try {
    db = new Database(dbPath, { readonly: true });
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    res.json(tables.map(t => t.name));
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    db?.close();
  }
});

app.get('/api/databases/:dbName/tables/:tableName/schema', (req, res) => {
  const dbPath = findDbPath(req.params.dbName);
  if (!dbPath) return res.status(404).json({ error: 'Database ikke fundet' });
  let db;
  try {
    db = new Database(dbPath, { readonly: true });
    const cols = db.prepare(`PRAGMA table_info(${q(req.params.tableName)})`).all();
    res.json(cols);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    db?.close();
  }
});

app.get('/api/databases/:dbName/tables/:tableName', (req, res) => {
  const dbPath = findDbPath(req.params.dbName);
  if (!dbPath) return res.status(404).json({ error: 'Database ikke fundet' });

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
  const search = (req.query.search || '').trim();
  const offset = (page - 1) * limit;
  const { tableName } = req.params;

  let db;
  try {
    db = new Database(dbPath, { readonly: true });
    const cols = db.prepare(`PRAGMA table_info(${q(tableName)})`).all();
    if (cols.length === 0) return res.status(404).json({ error: 'Tabel ikke fundet' });

    let where = '';
    let params = [];
    if (search) {
      const conditions = cols.map(c => `CAST(${q(c.name)} AS TEXT) LIKE ?`);
      where = 'WHERE ' + conditions.join(' OR ');
      params = cols.map(() => `%${search}%`);
    }

    const total = db.prepare(`SELECT COUNT(*) as n FROM ${q(tableName)} ${where}`).get(...params).n;
    const rows = db.prepare(`SELECT * FROM ${q(tableName)} ${where} LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      columns: cols.map(c => ({ name: c.name, type: c.type })),
      rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    db?.close();
  }
});

app.post('/api/databases/:dbName/query', (req, res) => {
  const { sql } = req.body || {};
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'Mangler sql felt' });
  }

  if (/^\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|ATTACH|DETACH|REPLACE|TRUNCATE)\b/i.test(sql)) {
    return res.status(403).json({ error: 'Kun SELECT-queries er tilladt' });
  }

  const dbPath = findDbPath(req.params.dbName);
  if (!dbPath) return res.status(404).json({ error: 'Database ikke fundet' });

  let db;
  try {
    db = new Database(dbPath, { readonly: true });
    const stmt = db.prepare(sql);
    let columns = [];
    try {
      columns = stmt.columns().map(c => ({ name: c.name, type: c.type || '' }));
    } catch (_) {}
    const rows = stmt.all();
    if (columns.length === 0 && rows.length > 0) {
      columns = Object.keys(rows[0]).map(name => ({ name, type: '' }));
    }
    res.json({ columns, rows, total: rows.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    db?.close();
  }
});

app.use(express.static(DIST_DIR));
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`dbrowser running on port ${PORT}`));
