export function stripTags(str) {
  return (str || '')?.replace(/(<([^>]+)>)/gi, '').trim();
}

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
