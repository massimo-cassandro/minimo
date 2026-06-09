// mustache-like text parsing
// utilizzare html-react-parser per stringhe html da inserire in un componente react

/*
es:

// template_string = '<div>{{key1}}</h3><p>{{key2}}</p><p>{{key3.key4}}</p></div>'

parseText(template_string, {
	key1: 'xxxx',
  key2: 'yyy',
  key3: {
  	key4: 'zzz'
  }
});

*/

export function parseText(template, vars_obj) {

  return template.replace(/\{\{(.*?)\}\}/g, (match, keys_string) => {
    const keys = keys_string.split('.');
    return (keys.reduce((obj, current) => {
      return obj[current];
    }, vars_obj)?? '');
  });
}
