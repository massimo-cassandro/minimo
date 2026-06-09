/*
import url_concat from '@massimo-cassandro/m-utilities/js-utilities/url-concat';

url_concat(url, {param1: val, param2:[1, 'a', 2]})

oppure

url_concat(url, 'string')

oppure

url_concat(url, ['string1', 'string2'])

Negli ultimi due casi le varibiali vengono aggiunte senza valore

*/

export default function (url, queryParams = {}) {

  let params = new URLSearchParams();

  if(typeof queryParams === 'string') {
    params.set(queryParams, '');

  } else if(Array.isArray(queryParams)) {
    queryParams.forEach(item => {
      params.set(item, '');
    });

  } else {
    for(const i in queryParams) {
      if(Array.isArray(queryParams[i])) {
        queryParams[i].forEach(item => {
          params.append(`${i}[]`, item);
        });
      } else {
        params.set(i, queryParams[i]);
      }
    }
  }


  return url + (/\?/.test(url)? '&' : '?') + params.toString();
}
