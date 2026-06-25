import { stripTags } from './strip-tags.js';

/**
 * Creates an id from a string (useful for generating automatic anchors from tag content).
 * Strips HTML tags, normalizes accented characters, punctuation, and whitespace.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function createId(str) {
  return (stripTags(str) || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\p{P}\p{S}]+/gu, '') // strips all Unicode punctuation and symbols
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
