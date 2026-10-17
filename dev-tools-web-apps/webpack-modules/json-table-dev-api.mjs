/*
  Endpoint server-side fittizio per la demo di json-table (solo devServer).

  Serve `/demo-api/json-table` paginando, ordinando e filtrando il set di dati della demo sul
  "server", come farebbe un vero backend quando si usa `<json-table serverside>`.
  Parametri della query string (nomi di default dei `serverParams` di json-table):
    page, start, perPage, sort, dir, search
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
  const sort = q.get('sort');
  const dir = q.get('dir') === 'desc' ? -1 : 1;
  const search = (q.get('search') ?? '').trim().toLowerCase();

  let filtered = rows;

  if (search) {
    const words = search.split(/\s+/);
    filtered = rows.filter(row => {
      const haystack = Object.values(row).map(v => (v && typeof v === 'object' ? v.date : v)).join(' ').toLowerCase();
      return words.every(w => haystack.includes(w));
    });
  }

  if (sort) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sort] && typeof a[sort] === 'object' ? a[sort].date : a[sort];
      const vb = b[sort] && typeof b[sort] === 'object' ? b[sort].date : b[sort];
      return compare(va, vb) * dir;
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
