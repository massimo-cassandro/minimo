// imposta un testo in cui ogni parola è minuscola tranne la prima lettera
export function titleCase(str) {

  if(str) {

    let parole = str.toLowerCase().split(' ');
    for (let i = 0; i < parole.length; i++) {
      parole[i] = parole[i].charAt(0).toUpperCase() + parole[i].slice(1);
    }
    str = parole.join(' ');
  }

  return str;
} // end title_case
