# JsonTable Demo

Clone the repo and launch `npm install` to get all requested libraries.

To run the demo you need to start the server typing (`npm run 'launch-json-demo-server'`); it use [typicode/json-server](https://github.com/typicode/json-server).

Show the json server opening <http://localhost:3004>.

The demo pages, for convenience, use [Bootstrap 5](https://getbootstrap.com/) css (from CDN), but it is not absolutely essential for JsonTable, and you can replace it with any other css library.


Json data files are generated using https://json-generator.com/ with these configs:

Ajax: 

```javascript
{
  "draw": 1,
  "recordsTotal": 600,
  "recordsFiltered": 600,
  "data": [
    '{{repeat(600)}}',
    {
      id: '{{integer(350, 1250)}}',
      bool: '{{bool()}}',
      amount1: '{{floating(1000, 4000, 2, "0.00")}}',
      amount2: '{{floating(3000, 5000, 2, "0.00")}}',
      age: '{{integer(20, 40)}}',
      email: '{{email(true)}}',
      phone: '{{phone("3xx.xx.xx.xxx")}}',
      date: '{{date(new Date(2014, 0, 1), new Date(), "ISODateTimeTZ")}}',
      sfdate: {
        date: '{{date(new Date(2014, 0, 1), new Date(), "YYYY-MM-dd hh:mm:ss")}}',
        timezone_type: 3,
        timezone: "Europe/Berlin"
      },
      about: '{{lorem(integer(2, 25), "words")}}'
    }
  ]
}
```

Static:

```javascript
[
  '{{repeat(30, 30)}}',
  {
    id: '{{integer(350, 1250)}}',
    bool: '{{random(true,false,null)}}',
    boolCustomized: '{{random(true,false,null)}}',
    number1: '{{floating(1000, 4000, 2, "0.00")}}',
    number2: '{{floating(3000, 5000, 2, "0.00")}}',
    date: '{{date(new Date(2014, 0, 1), new Date(), "YYYY-MM-dd")}}',
    sfDatetime: {
        date: '{{date(new Date(2014, 0, 1), new Date(), "YYYY-MM-dd hh:mm:ss")}}',
        timezone_type: 3,
        timezone: "Europe/Berlin"
      },
    text: '{{lorem(integer(2, 10), "words")}}',
    perc: '{{floating(0, 100, 2, "0.00")}}',
    percDecimal: '{{floating(0, 1, 2, "0.00")}}',
    euro: '{{floating(100, 1000, 2, "0.00")}}'
  }
]
```
