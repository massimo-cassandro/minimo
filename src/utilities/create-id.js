/*! minimo - Create Id */
import { stripTags } from './strip-tags.js';

/**
 * Crea un id a partire da una stringa (utile per generare ancore automatiche dal contenuto di un tag).
 * Rimuove i tag HTML e normalizza caratteri accentati, punteggiatura e spazi.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function createId(str) {
  return (stripTags(str) || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\p{P}\p{S}]+/gu, '') // rimuove tutta la punteggiatura e i simboli Unicode
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
