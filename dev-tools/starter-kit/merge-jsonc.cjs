#!/usr/bin/env node
// Merge JSONC: aggiunge in fondo al file di destinazione le chiavi di primo
// livello del template, prefissate con '_', preservando commenti e
// formattazione di entrambi i file.
// Uso: node merge-jsonc.cjs <template> <destinazione>

const fs = require('fs');

// Analizza un testo JSONC ignorando stringhe e commenti: individua
// l'oggetto principale, le virgole a profondità 1 e la posizione
// dell'ultimo carattere significativo (non spazio, non commento)
function scan(text) {
  let depth = 0;
  let open = -1;
  let close = -1;
  let last = -1;
  const commas = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') i++;
        i++;
      }
      last = i;
    } else if (c === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    } else if (c === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
    } else {
      if (c === '{' || c === '[') {
        if (depth === 0 && open === -1 && c === '{') open = i;
        depth++;
      } else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0 && close === -1) close = i;
      } else if (c === ',' && depth === 1) {
        commas.push(i);
      }
      if (!/\s/.test(c)) last = i;
    }
    i++;
  }
  return { open, close, commas, last };
}

// Posizione della prima doppia virgoletta fuori dai commenti
function firstQuotePos(text) {
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++;
    } else if (c === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
    } else if (c === '"') {
      return i;
    } else {
      i++;
    }
  }
  return -1;
}

const [tplPath, destPath] = process.argv.slice(2);

try {
  const tpl = fs.readFileSync(tplPath, 'utf8');
  const dest = fs.readFileSync(destPath, 'utf8');
  const t = scan(tpl);
  const d = scan(dest);
  if (t.open < 0 || t.close < 0) throw new Error(tplPath + ': oggetto JSON non trovato');
  if (d.open < 0 || d.close < 0) throw new Error(destPath + ': oggetto JSON non trovato');

  // voci di primo livello del template (spezzate sulle virgole a profondità 1)
  const body = tpl.slice(t.open + 1, t.close);
  const offset = t.open + 1;
  const bounds = t.commas.map((p) => p - offset).concat(body.length);
  const entries = [];
  let prev = 0;
  for (const b of bounds) {
    entries.push(body.slice(prev, b));
    prev = b + 1;
  }

  // prefissa con '_' la chiave di ogni voce (voci di soli commenti/spazi escluse)
  const renamed = [];
  for (const entry of entries) {
    const cleaned = entry.replace(/^\s+/, '').replace(/\s+$/, '');
    const q = firstQuotePos(cleaned);
    if (q < 0) continue;
    renamed.push('\n  ' + cleaned.slice(0, q + 1) + '_' + cleaned.slice(q + 1));
  }
  if (renamed.length === 0) process.exit(0);

  // aggiunge le voci prima della chiusura dell'oggetto principale della
  // destinazione, inserendo una virgola dopo l'ultima voce esistente se serve
  const dBody = dest.slice(d.open + 1, d.close);
  const b = scan(dBody);
  const needsComma = b.last >= 0 && dBody[b.last] !== ',';
  const insertAt = d.open + 1 + b.last + 1;
  const out = needsComma
    ? dest.slice(0, insertAt) + ',' + dest.slice(insertAt, d.close) + renamed.join(',') + '\n' + dest.slice(d.close)
    : dest.slice(0, d.close) + renamed.join(',') + '\n' + dest.slice(d.close);

  fs.writeFileSync(destPath, out);
} catch (err) {
  console.error('merge-jsonc: ' + err.message);
  process.exit(1);
}
