
// prima lettera maiuscola, il resto minuscolo
export function sentenceCase(str) {
  if(str) {
    return  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
  }
  return str;
}
