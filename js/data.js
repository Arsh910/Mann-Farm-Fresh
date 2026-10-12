// Shared data for every page: the catalogue, delivery routes, the next-delivery
// calculation and the quote basket that carries picks between pages.
(function () {
const PRODUCTS={
  "Vegetables":{
    "Root vegetables":["Potato|aloo,alu","Baby Potato|baby aloo","Radish|mooli","Red Radish|lal mooli","Beetroot|chukandar"],
    "Bulb and allium":["Onion|pyaz,pyaaz,piyaz","Garlic|lehsun,lahsun","Peeled Garlic|chila lehsun","Chinese Garlic","Spring Onion|hara pyaz","Leeks"],
    "Cruciferous":["Cabbage|patta gobhi,band gobhi","Cauliflower|phool gobhi,gobhi","Broccoli","Red Cabbage","Chinese Cabbage","Brussels Sprouts","Kale Leaves|kale"],
    "Fruiting vegetables":["Tomato|tamatar","Cherry Tomato","Green Capsicum|shimla mirch,capsicum","Red Capsicum|lal shimla","Yellow Capsicum|peeli shimla","Brinjal|baingan,eggplant","Green Zucchini|zucchini","Yellow Zucchini","Green Chilli|hari mirch,mirch,chilli","Fresh Red Chilli|lal mirch","Thai Eggplant","Achar Mirch","Raw Papaya|kacha papita","Bottle Gourd|lauki,ghiya"],
    "Beans and peas":["French Beans|beans,phali","Green Peas|matar,mattar,peas","Snow Peas","Edamame"]
  },
  "Leafy and herbs":{
    "Leafy and lettuce":["Spinach|palak","Baby Spinach","Iceberg Lettuce|iceberg","Green Lettuce|lettuce","Red Lettuce","Romaine Lettuce|romaine","Rocket Lettuce|rocket,arugula","Pak Choy|bok choy","Celery"],
    "Fresh herbs":["Mint|pudina","Coriander|dhaniya,dhania","Basil|tulsi","Parsley","Rosemary","Thyme","Dill|soya saag","Curry Leaves|kadi patta","Chives","Lemon Leaves","Lemongrass"]
  },
  "Fruits":{
    "Fresh fruits":["Avocado","Lemon|nimbu,neembu","Banana|kela","Coconut|nariyal","Black Grapes|kale angoor","Green Grapes|angoor","Kiwi","Mausambi|mosambi,sweet lime","Orange / Malta|santra,malta,orange","Papaya|papita","Pineapple|ananas","Pomegranate|anar","Watermelon|tarbooz","Blueberry","Strawberry","Green Apple","Red Apple|seb,apple","Mango|aam"],
    "Dry fruits":["Almonds|badam"]
  },
  "Specialty":{
    "Specialty and Asian":["Asparagus","Baby Corn","Lotus Stem|kamal kakdi","Ginger|adrak","Thai Ginger|galangal","Turmeric|haldi","Drumstick|sahjan","Sweet Corn|bhutta","Banana Leaves|kele ke patte"],
    "Mushrooms":["Button Mushroom|mushroom,khumb","Enoki Mushroom|enoki","Shimeji Mushroom|shimji,shimeji","Shiitake Mushroom|shiitake"],
    "Sprouts and microgreens":["Sprouts","Microgreens","Edible Flowers"],
    "Processed and frozen":["Soya Chaap","Frozen Green Peas|frozen matar","Staff Vegetables|staff veg"]
  }
};

// "Potato|aloo,alu" -> {name, hi, aliases, group, sub, slug}
const slug = s => s.toLowerCase().replace(/\s*\/\s*/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ITEMS = [];
for (const [group, subs] of Object.entries(PRODUCTS))
  for (const [sub, list] of Object.entries(subs))
    for (const e of list) {
      const [name, al] = e.split('|');
      ITEMS.push({ name, hi: al ? al.split(',')[0] : '', aliases: [name.toLowerCase(), ...(al ? al.split(',') : [])], group, sub, slug: slug(name) });
    }

// How each line is packed and how often it is available (as on the previous site)
const PACK = { 'Fresh fruits': 'Carton', 'Dry fruits': 'Carton', 'Processed and frozen': 'On requirement' };
const packFor = i => PACK[i.sub] || 'Reusable crate';
const supplyFor = i => (i.sub === 'Processed and frozen' ? 'On requirement' : 'Regular supply');

// Delivery routes. Later entries win when several match (Mohali pincodes start like Chandigarh's).
// cutH: order cut-off hour on the day before delivery; days: delivery weekdays (0 = Sunday).
// Sample route rules for the prototype: confirm with Mann before launch.
const DAILY = [0, 1, 2, 3, 4, 5, 6];
const ROUTES = [
  { test: /^14[1-8]|^15[0-2]|ludhiana|amritsar|jalandhar|patiala|bathinda|punjab/i, area: 'Punjab route', market: 'punjab', cut: '4pm the day before', cutH: 16, win: '7am to 11am', min: '₹8,000', days: 'Mon, Wed, Fri', dayList: [1, 3, 5] },
  { test: /^11|^12[12]|^201|delhi|gurugram|gurgaon|noida|faridabad|ghaziabad/i, area: 'Delhi NCR route', market: 'delhi-ncr', cut: '2pm the day before', cutH: 14, win: '6am to 10am', min: '₹15,000', days: 'Tue, Thu, Sat', dayList: [2, 4, 6] },
  { test: /^1600|chandigarh/i, area: 'Chandigarh', market: 'tricity', cut: '10pm the night before', cutH: 22, win: '5:30am to 7:30am', min: '₹2,000', days: 'Daily', dayList: DAILY },
  { test: /^1600(5|6|7)|^1403|mohali|kharar/i, area: 'Mohali and Kharar', market: 'tricity', cut: '10pm the night before', cutH: 22, win: '5:30am to 7:30am', min: '₹2,000', days: 'Daily', dayList: DAILY },
  { test: /^1341|panchkula/i, area: 'Panchkula', market: 'tricity', cut: '10pm the night before', cutH: 22, win: '6am to 8am', min: '₹2,000', days: 'Daily', dayList: DAILY },
  { test: /^1406|zirakpur|dera ?bassi/i, area: 'Zirakpur and Dera Bassi', market: 'tricity', cut: '9pm the night before', cutH: 21, win: '6am to 8am', min: '₹2,500', days: 'Daily', dayList: DAILY }
];
function findRoute(v) { let r = null; for (const x of ROUTES) if (x.test.test(String(v).trim())) r = x; return r; }

// The first delivery you can still make if you order now, e.g. {label:'tomorrow', orderBy:'10pm today'}
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const hourText = h => (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
function nextDelivery(r, now = new Date()) {
  for (let k = 1; k <= 8; k++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
    if (!r.dayList.includes(d.getDay())) continue;
    const cutoff = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, r.cutH);
    if (now >= cutoff) continue;
    const label = k === 1 ? 'tomorrow' : `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
    const cutDay = k === 1 ? 'today' : `${DAY[cutoff.getDay()]} ${cutoff.getDate()} ${MON[cutoff.getMonth()]}`;
    return { date: d, label, orderBy: `${hourText(r.cutH)} ${cutDay}` };
  }
  return null;
}

// Quote basket: products added on the catalogue or product pages wait here until the
// quote form picks them up. Every change fires 'basket:change' on the document.
const KEY = 'mannQuote';
const changed = () => document.dispatchEvent(new Event('basket:change'));
const basket = {
  read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
  write(b) { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {} changed(); },
  set(name, qty, unit) { const b = basket.read(); if (qty > 0) b[name] = { qty: String(qty), unit }; else delete b[name]; basket.write(b); },
  clear() { try { localStorage.removeItem(KEY); } catch (e) {} changed(); },
  count() { return Object.keys(basket.read()).length; }
};

// Units a quantity can be given in, and how much one tap of + or - changes it
const UNITS = ['kg', 'g', 'dozen', 'pcs', 'bunch', 'crate', 'box'];
const QTY_STEP = { kg: 1, g: 250, dozen: 1, pcs: 1, bunch: 1, crate: 1, box: 1 };

Object.assign(MANN, { PRODUCTS, ITEMS, ROUTES, UNITS, QTY_STEP, findRoute, nextDelivery, packFor, supplyFor, basket });
})();
