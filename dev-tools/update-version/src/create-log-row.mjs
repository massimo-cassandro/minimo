import { params } from './params.mjs';

export function createLogRow() {

  // Con --log-patch si registra la semver completa, altrimenti solo major.minor
  const vers = params.toLog.includes('patch')
    ? params.logRow.vers
    : String(params.logRow.vers).split('.').slice(0, 2).join('.');

  if (params.markdownLog) {
    const dateStr = params.logRow.date.toLocaleString(params.locale, {
      year: 'numeric', month: 'short', day: '2-digit'
    });
    params.logRow.fullText = `* ${vers} (${dateStr})${params.logRow.descr ? ' - ' + params.logRow.descr : ''}`;

  } else {
    const dateStr = params.logRow.date.toISOString();
    params.logRow.fullText = `${dateStr} | ${(' '.repeat(16) + vers).slice(-16)} | ${params.logRow.descr || ''}`;

  }
}


