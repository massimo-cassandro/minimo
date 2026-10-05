// @ts-check
/*! minimo - Better Text with places */

import { betterText, NBSP_AFTER_PARTICLE_REGEX } from './better-text.js';

const places = [
  // EUROPA
  'Europa',

  'Italia', 'Roma',
  // città
  'Milano', 'Napoli', 'Torino', 'Palermo', 'Bologna', 'Firenze', 'Venezia', 'Genova', 'Bari', 'Catania',
  'Verona', 'Padova', 'Trieste', 'Pisa', 'Siena', 'Cagliari', 'Parma', 'Modena', 'Bergamo', 'Brescia',
  'Trento', 'Bolzano', 'Aosta', 'Perugia', 'Assisi', 'Ancona', 'Rimini', 'Ravenna', 'Lucca', 'Matera',
  'Taranto', 'Siracusa', 'Messina', 'Lecce', 'Cuneo',
  // regioni
  'Sicilia', 'Sardegna', 'Toscana', 'Lombardia', 'Piemonte', 'Veneto', 'Puglia', 'Calabria', 'Umbria',
  'Lazio', 'Campania', 'Liguria', 'Abruzzo', 'Friuli-Venezia Giulia', 'Trentino-Alto Adige',
  'Emilia-Romagna', 'Basilicata', 'Molise', 'Valle d’Aosta',
  // fiumi
  'Po', 'Adige', 'Tevere', 'Arno',
  // monti
  'Monte Bianco', 'Monte Rosa', 'Cervino', 'Etna', 'Vesuvio', 'Gran Sasso',
  // località
  'Costiera Amalfitana', 'Cinque Terre', 'Pompei', 'Dolomiti', 'Val d’Orcia', 'Capri', 'Isola di Capri',
  'Lago di Como', 'Salento',

  'Francia', 'Parigi',
  // città
  'Marsiglia', 'Lione', 'Tolosa', 'Nizza', 'Nantes', 'Strasburgo', 'Bordeaux', 'Lilla', 'Cannes', 'Avignone',
  // fiumi
  'Senna', 'Loira', 'Rodano', 'Garonna',
  // monti
  'Barre des Écrins', 'Pic du Midi de Bigorre',
  // località
  'Mont Saint-Michel', 'Costa Azzurra', 'Valle della Loira', 'Chamonix', 'Versailles', 'Camargue',
  'Corsica', 'Normandia', 'Bretagna', 'Provenza', 'Alsazia',

  'Germania', 'Berlino',
  // città
  'Monaco di Baviera', 'Francoforte sul Meno', 'Amburgo', 'Colonia', 'Stoccarda', 'Dresda', 'Lipsia',
  'Norimberga', 'Düsseldorf', 'Hannover', 'Brema', 'Heidelberg',
  // fiumi
  'Reno', 'Danubio', 'Elba', 'Meno', 'Weser',
  // monti
  'Zugspitze', 'Watzmann', 'Feldberg',
  // località
  'Castello di Neuschwanstein', 'Foresta Nera', 'Valle del Reno', 'Isola di Rügen', 'Rothenburg ob der Tauber',
  'Baviera',

  'Spagna', 'Madrid',
  // città
  'Barcellona', 'Valencia', 'Siviglia', 'Saragozza', 'Malaga', 'Bilbao', 'Granada', 'San Sebastián',
  'Santiago de Compostela', 'Toledo', 'Cordova',
  // fiumi
  'Tago', 'Ebro', 'Duero', 'Guadalquivir', 'Guadiana',
  // monti
  'Mulhacén', 'Pico Aneto', 'Teide',
  // località
  'Alhambra di Granada', 'Sagrada Família', 'Caminito del Rey', 'Ibiza', 'Ronda', 'Costa del Sol',
  'Maiorca', 'Minorca', 'Tenerife', 'Lanzarote', 'Fuerteventura', 'Gran Canaria', 'Isole Canarie',
  'Isole Baleari', 'Catalogna', 'Andalusia',

  'Gran Bretagna', 'Regno Unito', 'Londra',
  // città
  'Birmingham', 'Manchester', 'Glasgow', 'Edimburgo', 'Liverpool', 'Cardiff', 'Belfast', 'Oxford',
  'Cambridge', 'Bristol', 'Leeds',
  // fiumi
  'Tamigi', 'Severn', 'Trent', 'Clyde',
  // monti
  'Ben Nevis', 'Scafell Pike', 'Snowdon',
  // località
  'Stonehenge', 'Loch Ness', 'Giant\'s Causeway', 'Cotswolds', 'Highlands scozzesi', 'Windsor',
  'Isola di Skye', 'Inghilterra', 'Scozia', 'Galles', 'Irlanda del Nord',

  'Grecia', 'Atene',
  // città
  'Salonicco', 'Patrasso', 'Candia', 'Larissa',
  // fiumi
  'Aliakmon', 'Achelous', 'Peneus',
  // monti
  'Monte Olimpo', 'Monte Parnasso', 'Monte Athos',
  // località
  'Meteora', 'Santorini', 'Mykonos', 'Delfi', 'Olimpia', 'Cnosso', 'Santorini Caldera', 'Creta', 'Rodi', 'Corfù',

  'Svizzera', 'Berna',
  // città
  'Zurigo', 'Ginevra', 'Basilea', 'Losanna', 'Lucerna', 'Lugano',
  // fiumi
  'Aare', 'Ticino',
  // monti
  'Dufourspitze', 'Eiger', 'Jungfrau',
  // località
  'Zermatt', 'St. Moritz', 'Grindelwald', 'Cascate del Reno', 'Interlaken', 'Davos', 'Alpi Svizzere',

  'Portogallo', 'Lisbona', 'Oporto', 'Madeira', 'Azzorre', 'Sintra', 'Algarve',
  'Paesi Bassi', 'Amsterdam', 'Rotterdam', 'L’Aia', 'Utrecht',
  'Belgio', 'Bruxelles', 'Anversa', 'Bruges',
  'Austria', 'Vienna', 'Salisburgo', 'Innsbruck', 'Graz', 'Hallstatt',
  'Polonia', 'Varsavia', 'Cracovia', 'Danzica', 'Breslavia',
  'Svezia', 'Stoccolma', 'Göteborg', 'Malmö',
  'Norvegia', 'Oslo', 'Bergen', 'Tromsø', 'Fiordi Norvegesi',
  'Danimarca', 'Copenaghen',
  'Finlandia', 'Helsinki',
  'Irlanda', 'Dublino', 'Galway',
  'Repubblica Ceca', 'Praga', 'Brno',
  'Ungheria', 'Budapest',
  'Romania', 'Bucarest', 'Transilvania',
  'Croazia', 'Zagabria', 'Spalato', 'Dubrovnik', 'Zara', 'Plitvice Lakes',
  'Turchia', 'Ankara', 'Istanbul', 'Smirne', 'Antalya', 'Cappadocia',
  'Ucraina', 'Kiev', 'Kyiv', 'Odessa', 'Leopoli',
  'Islanda', 'Reykjavik',
  'Lussemburgo', 'Liechtenstein', 'Principato di Monaco',
  'Malta', 'La Valletta',
  'Cipro', 'Nicosia',
  'Estonia', 'Tallinn',
  'Lettonia', 'Riga',
  'Lituania', 'Vilnius',
  'Bielorussia', 'Minsk',
  'Moldavia', 'Chisinau',
  'Serbia', 'Belgrado',
  'Bosnia ed Erzegovina', 'Sarajevo',
  'Montenegro', 'Podgorica',
  'Albania', 'Tirana',
  'Macedonia del Nord', 'Skopje',
  'Kosovo', 'Pristina',
  'Slovenia', 'Lubiana', 'Bled',
  'Slovacchia', 'Bratislava',
  'Bulgaria', 'Sofia',
  'San Marino', 'Città del Vaticano', 'Andorra',
  'Russia', 'Mosca', 'San Pietroburgo',
  'Georgia', 'Tbilisi',
  'Armenia', 'Erevan',
  'Azerbaigian', 'Baku',


  // AMERICA DEL NORD
  'America del Nord',

  'Stati Uniti', 'Washington',
  // città
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami', 'San Francisco', 'Las Vegas',
  'Boston', 'Seattle', 'San Diego', 'Dallas', 'Atlanta', 'New Orleans', 'Filadelfia', 'Denver',
  'Orlando', 'Detroit', 'Honolulu',
  // stati
  'Alaska', 'Hawaii', 'Texas', 'Florida', 'California', 'Nevada', 'Arizona',
  // fiumi
  'Mississippi', 'Missouri', 'Colorado', 'Rio Grande', 'Hudson',
  // monti
  'Denali', 'Monte Whitney', 'Monte Rainier', 'Monte Elbert',
  // località
  'Grand Canyon', 'Parco di Yellowstone', 'Yosemite', 'Monument Valley', 'Cascate del Niagara', 'Key West',

  'Canada', 'Ottawa',
  // città
  'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Québec',
  // province
  'Nuova Scozia', 'Terranova', 'Manitoba', 'Saskatchewan', 'Ontario',
  // fiumi
  'San Lorenzo', 'Mackenzie', 'Yukon', 'Fraser',
  // monti
  'Monte Logan', 'Monte Robson', 'Monte Columbia',
  // località
  'Parco Nazionale di Banff', 'Lago Louise', 'Whistler', 'Capilano Suspension Bridge',

  'Messico', 'Città del Messico',
  // città
  'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún',
  // fiumi
  'Usumacinta', 'Grijalva',
  // monti
  'Pico de Orizaba', 'Popocatépetl', 'Iztaccíhuatl',
  // località
  'Chichén Itzá', 'Teotihuacan', 'Tulum', 'Cabo San Lucas', 'Oaxaca',

  // altri paesi dell'America del Nord, Centrale e Caraibi
  'Cuba', 'L’Avana', 'Varadero',
  'Giamaica', 'Kingston',
  'Costa Rica', 'San José', 'Monteverde Cloud Forest',
  'Panama', 'Città di Panama', 'San Blas Islands',
  'Repubblica Dominicana', 'Santo Domingo', 'Punta Cana', 'Bayahibe',
  'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Belize',
  'Haiti', 'Porto Rico', 'Bahamas', 'Nassau', 'Barbados', 'Trinidad e Tobago', 'Martinica', 'Guadalupa',
  'Bermuda', 'Bermuda Beaches',


  // AMERICA DEL SUD
  'America del Sud',

  'Brasile', 'Brasilia',
  // città
  'San Paolo', 'Rio de Janeiro', 'Salvador', 'Fortaleza', 'Belo Horizonte',
  // fiumi
  'Rio delle Amazzoni', 'Paraná', 'São Francisco', 'Tocantins',
  // monti
  'Pico da Neblina', 'Pico 3 de Março', 'Pico da Bandeira',
  // località
  'Cristo Redentore', 'Cascate dell\'Iguazú', 'Foresta Amazzonica', 'Lençóis Maranhenses', 'Fernando de Noronha',

  'Argentina', 'Buenos Aires',
  // città
  'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Carlos de Bariloche',
  // fiumi
  'Uruguay', 'Río de la Plata', 'Rio Negro',
  // monti
  'Aconcagua', 'Fitz Roy', 'Monte Pissis',
  // località
  'Ghiacciaio Perito Moreno', 'Patagonia', 'Ushuaia', 'Quebrada de Humahuaca',

  'Perù', 'Lima',
  // città
  'Arequipa', 'Trujillo', 'Chiclayo', 'Cusco', 'Iquitos', 'Cuzco',
  // fiumi
  'Ucayali', 'Marañón',
  // monti
  'Huascarán', 'Yerupajá', 'Ausangate',
  // località
  'Machu Picchu', 'Valle Sacra degli Inca', 'Lago Titicaca', 'Linee di Nazca', 'Vinicunca',

  // altri paesi dell'America del Sud
  'Cile', 'Santiago del Cile', 'Valparaíso', 'Isola di Pasqua', 'Torres del Paine', 'Atacama Desert',
  'Colombia', 'Bogotà', 'Medellín', 'Cartagena Old Town',
  'Ecuador', 'Quito', 'Guayaquil', 'Galapagos Islands',
  'Uruguay', 'Montevideo',
  'Bolivia', 'La Paz', 'Cochabamba', 'Sucre', 'Salar de Uyuni',
  'Venezuela', 'Caracas',
  'Paraguay', 'Asunción',
  'Guyana', 'Suriname',


  // ASIA
  'Asia',

  'Giappone', 'Tokyo',
  // città
  'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Kyoto', 'Fukuoka', 'Hiroshima', 'Nagasaki',
  // fiumi
  'Shinano', 'Tone', 'Ishikari',
  // monti
  'Monte Fuji', 'Monte Kita', 'Monte Hotaka',
  // località
  'Fushimi Inari-taisha', 'Miyajima', 'Nara', 'Takayama', 'Shirakawa-go', 'Okinawa', 'Hokkaido',

  'Cina', 'Pechino',
  // città
  'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Chongqing', 'Xi\'an', 'Hong Kong', 'Macao', 'Lhasa',
  // fiumi
  'Fiume Azzurro', 'Fiume Giallo', 'Fiume delle Perle',
  // monti
  'Huangshan', 'Monte Tai', 'K2',
  // località
  'Grande Muraglia Cinese', 'Città Proibita', 'Esercito di Terracotta', 'Guilin', 'Zhangjiajie', 'Tibet',

  'India', 'Nuova Delhi',
  // città
  'Mumbai', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Calcutta', 'Jaipur', 'Delhi', 'Chennai',
  // fiumi
  'Gange', 'Indo', 'Brahmaputra', 'Godavari',
  // monti
  'Kangchenjunga', 'Nanda Devi', 'Kamet',
  // località
  'Taj Mahal', 'Taj Mahal', 'Varanasi', 'Backwaters del Kerala', 'Khajuraho', 'Kerala', 'Goa',

  'Nepal', 'Kathmandu',
  // città
  'Pokhara', 'Lalitpur', 'Biratnagar',
  // fiumi
  'Kosi', 'Gandaki', 'Karnali',
  // monti
  'Everest', 'Lhotse', 'Makalu', 'Cho Oyu', 'Annapurna',
  // località
  'Piazza Durbar', 'Campo Base dell\'Everest', 'Lago Phewa', 'Parco di Chitwan',

  // altri paesi asiatici
  'Corea del Sud', 'Seoul', 'Busan', 'Jeju Island',
  'Thailandia', 'Bangkok', 'Phuket', 'Chiang Mai',
  'Vietnam', 'Hanoi', 'Ho Chi Minh', 'Halong Bay',
  'Indonesia', 'Giacarta', 'Bali', 'Borobudur',
  'Filippine', 'Manila',
  'Malaysia', 'Kuala Lumpur',
  'Singapour', 'Singapore',
  'Emirati Arabi Uniti', 'Abu Dhabi', 'Dubai',
  'Arabia Saudita', 'Riad',
  'Israele', 'Gerusalemme',
  'Giordania', 'Amman', 'Petra',
  'Kazakistan', 'Astana',
  'Uzbekistan', 'Tashkent', 'Samarcanda',
  'Mongolia', 'Ulan Bator',
  'Corea del Nord', 'Pyongyang',
  'Taiwan', 'Taipei',
  'Cambogia', 'Phnom Penh', 'Angkor Wat',
  'Laos', 'Vientiane',
  'Myanmar', 'Bagan',
  'Sri Lanka', 'Colombo',
  'Bangladesh', 'Dacca',
  'Pakistan', 'Islamabad', 'Karachi',
  'Afghanistan', 'Kabul',
  'Bhutan', 'Thimphu',
  'Maldive', 'Maldivian Atolls',
  'Brunei',
  'Iran', 'Teheran',
  'Iraq', 'Baghdad',
  'Siria', 'Damasco',
  'Libano', 'Beirut',
  'Kuwait', 'Qatar', 'Doha',
  'Oman', 'Mascate',
  'Bahrein', 'Yemen',


  // AFRICA
  'Africa',

  'Egitto', 'Il Cairo',
  // città
  'Alessandria', 'Giza', 'Sharm el-Sheikh', 'Luxor', 'Aswan',
  // fiumi
  'Nilo',
  // monti
  'Monte Caterina', 'Monte Sinai',
  // località
  'Piramidi di Giza', 'Valle dei Re', 'Tempio di Abu Simbel', 'Karnak',

  'Tanzania', 'Dodoma',
  // città
  'Dar es Salaam', 'Mwanza', 'Arusha', 'Zanzibar City',
  // fiumi
  'Rufiji', 'Ruvuma', 'Pangani',
  // monti
  'Kilimangiaro', 'Monte Meru',
  // località
  'Parco del Serengeti', 'Cratere di Ngorongoro', 'Zanzibar',

  'Sudafrica', 'Pretoria',
  // città
  'Città del Capo', 'Johannesburg', 'Durban', 'Gqeberha',
  // fiumi
  'Orange', 'Limpopo', 'Vaal',
  // monti
  'Table Mountain', 'Mafadi',
  // località
  'Parco Nazionale Kruger', 'Capo di Buona Speranza', 'Garden Route', 'Robben Island',

  // altri paesi africani
  'Marocco', 'Rabat', 'Marrakech', 'Casablanca', 'Fes', 'Tangeri', 'Chefchaouen',
  'Tunisia', 'Tunisi',
  'Kenya', 'Nairobi',
  'Senegal', 'Dakar',
  'Madagascar', 'Antananarivo',
  'Mauritius', 'Port Louis', 'Le Morne Brabant',
  'Etiopia', 'Addis Abeba',
  'Algeria', 'Algeri',
  'Libia', 'Tripoli',
  'Nigeria', 'Abuja', 'Lagos',
  'Ghana', 'Accra',
  'Costa d’Avorio', 'Camerun',
  'Uganda', 'Kampala',
  'Ruanda', 'Kigali',
  'Mozambico', 'Maputo',
  'Zimbabwe', 'Harare', 'Victoria Falls',
  'Zambia', 'Lusaka',
  'Namibia', 'Windhoek',
  'Botswana', 'Gaborone', 'Okavango Delta',
  'Angola', 'Luanda',
  'Sudan', 'Khartum',
  'Seychelles', 'Praslin Island',
  'Capo Verde',
  'Congo', 'Kinshasa',
  'Somalia', 'Mogadiscio',
  'Eritrea', 'Asmara',
  'Gambia', 'Niger', 'Ciad', 'Mauritania', 'Malawi', 'Lesotho', 'Eswatini', 'Gabon', 'Togo', 'Benin',
  'Burkina Faso', 'Sierra Leone', 'Liberia', 'Guinea', 'Gibuti',


  // OCEANIA
  'Oceania',

  'Australia', 'Canberra',
  // città
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Gold Coast', 'Cairns', 'Darwin',
  // fiumi
  'Murray', 'Darling', 'Murrumbidgee',
  // monti
  'Monte Kosciuszko', 'Mawson Peak',
  // località
  'Grande Barriera Corallina', 'Uluru', 'Opera House di Sydney', 'Twelve Apostles', 'Whitsunday Islands',
  'Tasmania',

  'Nuova Zelanda', 'Wellington',
  // città
  'Auckland', 'Christchurch', 'Hamilton', 'Dunedin', 'Queenstown',
  // fiumi
  'Waikato', 'Clutha', 'Whanganui',
  // monti
  'Aoraki / Monte Cook', 'Monte Aspiring', 'Monte Ruapehu',
  // località
  'Milford Sound', 'Hobbiton Movie Set', 'Rotorua', 'Waitomo Glowworm Caves', 'Aoraki / Mount Cook Area',
  'Matamata',

  // altri paesi dell'Oceania
  'Fiji', 'Suva',
  'Polinesia Francese', 'Papeete', 'Tahiti', 'Bora Bora',
  'Papua Nuova Guinea', 'Port Moresby',
  'Samoa', 'Tonga', 'Vanuatu', 'Nuova Caledonia', 'Isole Cook', 'Isole Salomone',


  // --------------------
  // places not tied to a single country (seas, oceans, regions, polar areas)
  'Mar Mediterraneo', 'Mediterraneo', 'Mar Adriatico', 'Mar Tirreno', 'Mar Ionio', 'Mar Ligure',
  'Mar Nero', 'Mar Baltico', 'Mare del Nord', 'Mar Rosso', 'Mar Morto', 'Mar dei Caraibi', 'Caraibi',
  'Oceano Atlantico', 'Oceano Pacifico', 'Oceano Indiano',
  'Artide', 'Polo Nord', 'Antartide', 'Polo Sud',
  'Groenlandia', 'Lapponia', 'Siberia',
  'Sahara', 'Kalahari', 'Namib',
  'Ande', 'Amazzonia', 'Terra del Fuoco'
];


/**
 * Key used to match a place regardless of case, spacing and apostrophe style
 * @param {string} str
 * @returns {string}
 */
const placeKey = str => str.toLowerCase().replace(/[ \u00A0]+/g, ' ').replace(/['‘’]/g, '’');

/**
 * Builds the matcher for a list of places: a single regex (longest places first, so that
 * e.g. "Lago di Como" wins over a shorter overlapping name) and a key → canonical form map.
 * The canonical form uses the typographic apostrophe and non-breaking spaces after particles,
 * consistently with betterText().
 *
 * @param {string[]} list - places list
 * @returns {{regex: RegExp, canonical: Map<string, string>} | null} null if the list is empty
 */
function buildPlacesMatcher(list) {
  const canonical = new Map();

  list.filter(Boolean).forEach(place => {
    const key = placeKey(place);
    if (!canonical.has(key)) {
      canonical.set(
        key,
        place.trim()
          .replace(/'/g, '’')
          .replace(NBSP_AFTER_PARTICLE_REGEX, match => match.replace(/ +/g, '\u00A0'))
      );
    }
  });

  if (!canonical.size) {
    return null;
  }

  const patterns = [...canonical.values()]
    .sort((a, b) => b.length - a.length)
    .map(place => place
      .replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
      .replace(/[ \u00A0]+/g, '[ \\u00A0]+')
      .replace(/’/g, '[\'’‘]')
    );

  return {
    // custom boundaries instead of \b, which doesn't work with accented edge letters (e.g. "Perù")
    regex: new RegExp(`(?<![\\p{L}\\p{N}])(?:${patterns.join('|')})(?![\\p{L}\\p{N}])`, 'giu'),
    canonical
  };
}

const defaultMatcher = buildPlacesMatcher(places);

/**
 * Version of betterText() that also normalizes the occurrences of known places
 * (countries, cities, rivers, mountains, tourist locations) found in the text:
 * matching is case-insensitive and tolerant to spacing and apostrophe style, and every
 * match is replaced by the canonical form listed in `places` (casing, typographic
 * apostrophe, non-breaking spaces after particles).
 * Places replacement runs after betterText(), so it takes precedence over the casing
 * enforced on particles and custom words.
 *
 * NOTE: places that are also common words (e.g. "Meno", "Po", "Reno") are capitalized
 * wherever they appear.
 *
 * @param {string} str - input string to process
 * @param {string[]} [custom_words] - list of words whose exact casing must be preserved (e.g. `['iPhone', 'macOS']`) (default: [])
 * @param {string[]} [extra_places] - additional places, merged with the built-in list (default: [])
 * @returns {string} processed string, or empty string if input is falsy
 *
 * @example
 * betterTextWithPlaces("vacanza a  new york e  nel lago di como ,l'avana");
 * // → "vacanza a New York e nel Lago di Como, L’Avana"
 *
 * betterTextWithPlaces('gita a monte cervino', ['iPhone'], ['Monte Cervino']);
 * // → 'gita a Monte Cervino'
 */
export function betterTextWithPlaces(str, custom_words = [], extra_places = []) {

  str = betterText(str, custom_words);

  if (!str) {
    return str;
  }

  const matcher = extra_places.length
    ? buildPlacesMatcher([...places, ...extra_places])
    : defaultMatcher;

  return matcher
    ? str.replace(matcher.regex, match => matcher.canonical.get(placeKey(match)) ?? match)
    : str;
}
