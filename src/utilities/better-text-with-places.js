// @ts-check
/*! minimo - Better Text with places */

import { betterText, NBSP_AFTER_PARTICLE_REGEX } from './better-text.js';

const places = [
  // EUROPA
  'Europa',

  // Italia
  'Italia',
  // città
  'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Bologna', 'Firenze', 'Venezia',
  // fiumi
  'Po', 'Adige', 'Tevere', 'Arno',
  // monti
  'Monte Bianco', 'Monte Rosa', 'Cervino', 'Etna', 'Vesuvio', 'Gran Sasso',
  // località
  'Costiera Amalfitana', 'Cinque Terre', 'Pompei', 'Dolomiti', 'Val d’Orcia', 'Capri', 'Lago di Como',

  // Francia
  'Francia',
  // città
  'Parigi', 'Marsiglia', 'Lione', 'Tolosa', 'Nizza', 'Nantes', 'Strasburgo',
  // fiumi
  'Senna', 'Loira', 'Rodano', 'Garonna',
  // monti
  'Barre des Écrins', 'Pic du Midi de Bigorre',
  // località
  'Mont Saint-Michel', 'Costa Azzurra', 'Valle della Loira', 'Chamonix', 'Versailles', 'Camargue',

  // Germania
  'Germania',
  // città
  'Berlino', 'Monaco di Baviera', 'Francoforte sul Meno', 'Amburgo', 'Colonia', 'Stoccarda',
  // fiumi
  'Reno', 'Danubio', 'Elba', 'Meno', 'Weser',
  // monti
  'Zugspitze', 'Watzmann', 'Feldberg',
  // località
  'Castello di Neuschwanstein', 'Foresta Nera', 'Valle del Reno', 'Isola di Rügen', 'Rothenburg ob der Tauber',

  // Spagna
  'Spagna',
  // città
  'Madrid', 'Barcellona', 'Valencia', 'Siviglia', 'Saragozza', 'Malaga',
  // fiumi
  'Tago', 'Ebro', 'Duero', 'Guadalquivir', 'Guadiana',
  // monti
  'Mulhacén', 'Pico Aneto', 'Teide',
  // località
  'Alhambra di Granada', 'Sagrada Família', 'Caminito del Rey', 'Ibiza', 'Ronda', 'Costa del Sol',

  // Regno Unito
  'Regno Unito',
  // città
  'Londra', 'Birmingham', 'Manchester', 'Glasgow', 'Edimburgo', 'Liverpool',
  // fiumi
  'Tamigi', 'Severn', 'Trent', 'Clyde',
  // monti
  'Ben Nevis', 'Scafell Pike', 'Snowdon',
  // località
  'Stonehenge', 'Loch Ness', 'Giant\'s Causeway', 'Cotswolds', 'Highlands scozzesi', 'Windsor',

  // Grecia
  'Grecia',
  // città
  'Atene', 'Salonicco', 'Patrasso', 'Candia', 'Larissa',
  // fiumi
  'Aliakmon', 'Achelous', 'Peneus',
  // monti
  'Monte Olimpo', 'Monte Parnasso', 'Monte Athos',
  // località
  'Meteora', 'Santorini', 'Mykonos', 'Delfi', 'Olimpia', 'Cnosso',

  // Svizzera
  'Svizzera',
  // città
  'Zurigo', 'Ginevra', 'Berna', 'Basilea', 'Losanna', 'Lucerna',
  // fiumi
  'Aare', 'Ticino',
  // monti
  'Dufourspitze', 'Eiger', 'Jungfrau',
  // località
  'Zermatt', 'St. Moritz', 'Grindelwald', 'Cascate del Reno', 'Interlaken',


  // AMERICA DEL NORD
  'America del Nord',

  // Stati Uniti
  'Stati Uniti',
  // città
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami', 'San Francisco', 'Las Vegas',
  // fiumi
  'Mississippi', 'Missouri', 'Colorado', 'Rio Grande', 'Hudson',
  // monti
  'Denali', 'Monte Whitney', 'Monte Rainier', 'Monte Elbert',
  // località
  'Grand Canyon', 'Parco di Yellowstone', 'Yosemite', 'Monument Valley', 'Cascate del Niagara', 'Key West',

  // Canada
  'Canada',
  // città
  'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Québec',
  // fiumi
  'San Lorenzo', 'Mackenzie', 'Yukon', 'Fraser',
  // monti
  'Monte Logan', 'Monte Robson', 'Monte Columbia',
  // località
  'Parco Nazionale di Banff', 'Lago Louise', 'Whistler', 'Capilano Suspension Bridge',

  // Messico
  'Messico',
  // città
  'Città del Messico', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún',
  // fiumi
  'Usumacinta', 'Grijalva',
  // monti
  'Pico de Orizaba', 'Popocatépetl', 'Iztaccíhuatl',
  // località
  'Chichén Itzá', 'Teotihuacan', 'Tulum', 'Cabo San Lucas', 'Oaxaca',


  // AMERICA DEL SUD
  'America del Sud',

  // Brasile
  'Brasile',
  // città
  'San Paolo', 'Rio de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza', 'Belo Horizonte',
  // fiumi
  'Rio delle Amazzoni', 'Paraná', 'São Francisco', 'Tocantins',
  // monti
  'Pico da Neblina', 'Pico 3 de Março', 'Pico da Bandeira',
  // località
  'Cristo Redentore', 'Cascate dell\'Iguazú', 'Foresta Amazzonica', 'Lençóis Maranhenses', 'Fernando de Noronha',

  // Argentina
  'Argentina',
  // città
  'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Carlos de Bariloche',
  // fiumi
  'Uruguay', 'Río de la Plata', 'Rio Negro',
  // monti
  'Aconcagua', 'Fitz Roy', 'Monte Pissis',
  // località
  'Ghiacciaio Perito Moreno', 'Patagonia', 'Ushuaia', 'Quebrada de Humahuaca',

  // Perù
  'Perù',
  // città
  'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Cusco', 'Iquitos',
  // fiumi
  'Ucayali', 'Marañón',
  // monti
  'Huascarán', 'Yerupajá', 'Ausangate',
  // località
  'Machu Picchu', 'Valle Sacra degli Inca', 'Lago Titicaca', 'Linee di Nazca', 'Vinicunca',


  // ASIA
  'Asia',

  // Giappone
  'Giappone',
  // città
  'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Kyoto', 'Fukuoka',
  // fiumi
  'Shinano', 'Tone', 'Ishikari',
  // monti
  'Monte Fuji', 'Monte Kita', 'Monte Hotaka',
  // località
  'Fushimi Inari-taisha', 'Miyajima', 'Nara', 'Takayama', 'Shirakawa-go',

  // Cina
  'Cina',
  // città
  'Pechino', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Chongqing', 'Xi\'an',
  // fiumi
  'Fiume Azzurro', 'Fiume Giallo', 'Fiume delle Perle',
  // monti
  'Huangshan', 'Monte Tai', 'K2',
  // località
  'Grande Muraglia Cinese', 'Città Proibita', 'Esercito di Terracotta', 'Guilin', 'Zhangjiajie',

  // India
  'India',
  // città
  'Mumbai', 'Nuova Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Calcutta', 'Jaipur',
  // fiumi
  'Gange', 'Indo', 'Brahmaputra', 'Godavari',
  // monti
  'Kangchenjunga', 'Nanda Devi', 'Kamet',
  // località
  'Taj Mahal', 'Varanasi', 'Backwaters del Kerala', 'Khajuraho',

  // Nepal
  'Nepal',
  // città
  'Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar',
  // fiumi
  'Kosi', 'Gandaki', 'Karnali',
  // monti
  'Everest', 'Lhotse', 'Makalu', 'Cho Oyu', 'Annapurna',
  // località
  'Piazza Durbar', 'Campo Base dell\'Everest', 'Lago Phewa', 'Parco di Chitwan',


  // AFRICA
  'Africa',

  // Egitto
  'Egitto',
  // città
  'Il Cairo', 'Alessandria', 'Giza', 'Sharm el-Sheikh', 'Luxor', 'Aswan',
  // fiumi
  'Nilo',
  // monti
  'Monte Caterina', 'Monte Sinai',
  // località
  'Piramidi di Giza', 'Valle dei Re', 'Tempio di Abu Simbel', 'Karnak',

  // Tanzania
  'Tanzania',
  // città
  'Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha', 'Zanzibar City',
  // fiumi
  'Rufiji', 'Ruvuma', 'Pangani',
  // monti
  'Kilimangiaro', 'Monte Meru',
  // località
  'Parco del Serengeti', 'Cratere di Ngorongoro', 'Zanzibar',

  // Sudafrica
  'Sudafrica',
  // città
  'Città del Capo', 'Johannesburg', 'Durban', 'Pretoria', 'Gqeberha',
  // fiumi
  'Orange', 'Limpopo', 'Vaal',
  // monti
  'Table Mountain', 'Mafadi',
  // località
  'Parco Nazionale Kruger', 'Capo di Buona Speranza', 'Garden Route', 'Robben Island',


  // OCEANIA
  'Oceania',

  // Australia
  'Australia',
  // città
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra',
  // fiumi
  'Murray', 'Darling', 'Murrumbidgee',
  // monti
  'Monte Kosciuszko', 'Mawson Peak',
  // località
  'Grande Barriera Corallina', 'Uluru', 'Opera House di Sydney', 'Twelve Apostles',

  // Nuova Zelanda
  'Nuova Zelanda',
  // città
  'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Dunedin', 'Queenstown',
  // fiumi
  'Waikato', 'Clutha', 'Whanganui',
  // monti
  'Aoraki / Monte Cook', 'Monte Aspiring', 'Monte Ruapehu',
  // località
  'Milford Sound', 'Hobbiton Movie Set', 'Rotorua', 'Waitomo Glowworm Caves',


  // --------------------

  // other countries
  // EUROPA
  'Portogallo', 'Lisbona',
  'Paesi Bassi', 'Amsterdam',
  'Belgio', 'Bruxelles',
  'Austria', 'Vienna',
  'Polonia', 'Varsavia',
  'Svezia', 'Stoccolma',
  'Norvegia', 'Oslo',
  'Danimarca', 'Copenaghen',
  'Finlandia', 'Helsinki',
  'Irlanda', 'Dublino',
  'Repubblica Ceca', 'Praga',
  'Ungheria', 'Budapest',
  'Romania', 'Bucarest',
  'Croazia', 'Zagabria',
  'Turchia', 'Ankara',
  'Ucraina', 'Kiev',

  // ASIA
  'Corea del Sud', 'Seoul',
  'Thailandia', 'Bangkok',
  'Vietnam', 'Hanoi',
  'Indonesia', 'Giacarta',
  'Filippine', 'Manila',
  'Malaysia', 'Kuala Lumpur',
  'Singapour', 'Singapore',
  'Emirati Arabi Uniti', 'Abu Dhabi', 'Dubai',
  'Arabia Saudita', 'Riad',
  'Israele', 'Gerusalemme',
  'Giordania', 'Amman',

  // AFRICA
  'Marocco', 'Rabat',
  'Tunisia', 'Tunisi',
  'Kenya', 'Nairobi',
  'Senegal', 'Dakar',
  'Madagascar', 'Antananarivo',
  'Mauritius', 'Port Louis',
  'Etiopia', 'Addis Abeba',

  // AMERICA DEL NORD E CARAIBI
  'Cuba', 'L’Avana',
  'Giamaica', 'Kingston',
  'Costa Rica', 'San José',
  'Panama', 'Città di Panama',
  'Repubblica Dominicana', 'Santo Domingo',

  // AMERICA DEL SUD
  'Cile', 'Santiago del Cile',
  'Colombia', 'Bogotà',
  'Ecuador', 'Quito',
  'Uruguay', 'Montevideo',
  'Bolivia', 'La Paz',

  // OCEANIA
  'Fiji', 'Suva',
  'Polinesia Francese', 'Papeete',

  // -------------------------
  // turistic places
  // Europa
  'Alpi Svizzere', 'Plitvice Lakes', 'Isola di Skye', 'Algarve', 'Santorini Caldera',
  'Isola di Capri', 'Costa del Sol', 'Hallstatt', 'Bled', 'Fiordi Norvegesi',

  // Asia e Medio Oriente
  'Petra', 'Taj Mahal Complex', 'Bagan', 'Halong Bay', 'Bali',
  'Cappadocia', 'Borobudur', 'Angkor Wat', 'Jeju Island', 'Maldivian Atolls',

  // America del Nord e Caraibi
  'Punta Cana', 'Varadero', 'Bermuda Beaches', 'Monteverde Cloud Forest', 'San Blas Islands',

  // America del Sud
  'Salar de Uyuni', 'Galapagos Islands', 'Torres del Paine', 'Cartagena Old Town', 'Atacama Desert',

  // Africa
  'Chefchaouen', 'Okavango Delta', 'Praslin Island', 'Le Morne Brabant', 'Victoria Falls',

  // Oceania
  'Bora Bora', 'Aoraki / Mount Cook Area', 'Whitsunday Islands', 'Matamata'
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
