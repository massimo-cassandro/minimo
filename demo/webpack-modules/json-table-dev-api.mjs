/*
  Endpoint server-side fittizio per la demo di json-table (solo devServer).

  Serve `/demo-api/json-table` paginando, ordinando e filtrando il set di dati della demo sul
  "server", come farebbe un vero backend quando si usa `<json-table serverside>`.
  Parametri della query string (nomi di default dei `serverParams` di json-table):
    page, start, perPage, sort, dir, search
  Filtri (form di filtro collegato con `filterForm`, tutti facoltativi):
    attivo (1|0), importoMin, importoMax, anni[] (anni del campo `date`, valori ripetuti)
  Risposta: { data: [...righe della pagina richiesta], totRec, filteredRec }

  Non usato nella build di produzione: la demo "server-side" funziona solo in sviluppo.
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, '../demo-files/json-table/demo-data.json');

/** costruisce un set di dati ampio (circa 1.000 righe) ripetendo i record demo con id univoci */
function buildRows() {
  const base = JSON.parse(fs.readFileSync(dataPath, 'utf-8')).data;
  const rows = [];
  for (let i = 0; i < 35; i++) {
    base.forEach((row, idx) => {
      rows.push({
        ...row,
        id: i * base.length + idx + 1,
        text: `${row.text} (${i + 1})`,
        number1: Math.round(row.number1 * (1 + i / 10) * 100) / 100,
        euro: Math.round(row.euro * (1 + i / 7) * 100) / 100
      });
    });
  }
  return rows;
}

const rows = buildRows();

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'it-IT', { numeric: true, sensitivity: 'base' });
}

/**
 * middleware per devServer
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Function} next
 */
export function jsonTableDevApi(req, res, next) {

  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname !== '/demo-api/json-table') {
    next();
    return;
  }

  const q = url.searchParams;
  const perPage = Math.max(1, Number(q.get('perPage')) || 25);
  const page = Math.max(1, Number(q.get('page')) || Math.floor((Number(q.get('start')) || 0) / perPage) + 1);
  // criteri di ordinamento: `sort` e `dir` sono liste separate da virgola, con una direzione per chiave
  const dirs = (q.get('dir') ?? '').split(',');
  const sort = (q.get('sort') ?? '').split(',').filter(Boolean)
    .map((key, idx) => ({ key, sign: dirs[idx] === 'desc' ? -1 : 1 }));
  const search = (q.get('search') ?? '').trim().toLowerCase();

  // filtri del form (vuoto = nessun filtro)
  const attivo = q.get('attivo');
  const importoMin = q.get('importoMin') ? Number(q.get('importoMin')) : null;
  const importoMax = q.get('importoMax') ? Number(q.get('importoMax')) : null;
  const anni = q.getAll('anni[]');

  let filtered = rows.filter(row =>
    (attivo !== '1' && attivo !== '0' || row.bool === (attivo === '1'))
    && (importoMin === null || Number.isNaN(importoMin) || row.euro >= importoMin)
    && (importoMax === null || Number.isNaN(importoMax) || row.euro <= importoMax)
    && (!anni.length || anni.includes(String(row.date).slice(0, 4)))
  );

  if (search) {
    const words = search.split(/\s+/);
    filtered = filtered.filter(row => {
      const haystack = Object.values(row).map(v => (v && typeof v === 'object' ? v.date : v)).join(' ').toLowerCase();
      return words.every(w => haystack.includes(w));
    });
  }

  if (sort.length) {
    const value = (row, key) => (row[key] && typeof row[key] === 'object' ? row[key].date : row[key]);
    filtered = [...filtered].sort((a, b) => {
      for (const { key, sign } of sort) {
        const cmp = compare(value(a, key), value(b, key)) * sign;
        if (cmp !== 0) {
          return cmp;
        }
      }
      return 0;
    });
  }

  const start = (page - 1) * perPage;
  const body = {
    data: filtered.slice(start, start + perPage),
    totRec: rows.length,
    filteredRec: filtered.length
  };

  // piccolo ritardo artificiale, per rendere visibile lo stato di caricamento
  setTimeout(() => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
  }, 300);
}
