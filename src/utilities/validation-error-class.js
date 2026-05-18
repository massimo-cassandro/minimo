
// uso
// throw new ValidationError('Sono presenti cicli duplicati', campiErrore );

export class ValidationError extends Error {
  constructor(message, fields) {
    super(message); // Passa il messaggio alla classe Error originale
    this.name = 'ValidationError';
    this.fields = fields; // Parametro custom
  }
}

