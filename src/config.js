// Server-side copy of the shop settings. KEEP IN SYNC with the constants in public/index.html
// (MENU prices, HOURS, AREAS, FREE_DELIVERY_MIN). The server recomputes every total from these,
// so a customer can never change a price from their browser.

export const MENU = {
  tapsilog: {name:'Tapsilog', price:89}, longsilog:{name:'Longsilog', price:79}, porksilog:{name:'Porksilog', price:95},
  chicksilog:{name:'Chicksilog', price:99}, hotsilog:{name:'Hotsilog', price:69}, cornsilog:{name:'Cornsilog', price:79},
  bangsilog:{name:'Bangsilog', price:99}, tinapsilog:{name:'Tinapsilog', price:85}, spamsilog:{name:'Spamsilog', price:85},
  'extra-rice':{name:'Extra Rice', price:20}, egg:{name:'Extra Egg', price:15}, softdrink:{name:'Softdrink 16oz', price:35},
};

// 0 = Sunday ... 6 = Saturday, Philippine time. [open, close] or null = closed.
export const HOURS = {
  0:['07:00','18:00'], 1:['06:00','20:00'], 2:['06:00','20:00'], 3:['06:00','20:00'],
  4:['06:00','20:00'], 5:['06:00','20:00'], 6:['06:00','20:00'],
};

export const AREAS = {
  'Sto. Niño Villa De Lipa 2': 0,
  'Sto. Niño Villa De Lipa 3': 0,
  'Villa Sto. Niño': 5,
  'City Park, Sabang': 5,
  'Rest of Brgy. Sabang': 10,
};

export const FREE_DELIVERY_MIN = 0;   // 0 = off
export const ORDER_AHEAD_DAYS = 7;
export const LEAD_MINUTES = 30;
export const SLOT_STEP = 30;
export const MAX_ITEM_QTY = 30;

export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

export function manilaNow(date = new Date()) {
  // Philippines has no DST: UTC+8 all year.
  const d = new Date(date.getTime() + 8 * 3600 * 1000);
  return {
    dateStr: d.toISOString().slice(0, 10),      // YYYY-MM-DD in Manila
    day: d.getUTCDay(),
    min: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

export function dayOfDateStr(dateStr) { return new Date(dateStr + 'T00:00:00Z').getUTCDay(); }
export function addDays(dateStr, n) { return new Date(new Date(dateStr + 'T00:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10); }
export function fmt12(min) { let h = Math.floor(min / 60); const m = min % 60; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; }
