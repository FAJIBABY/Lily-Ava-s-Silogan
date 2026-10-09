import { MENU, HOURS, AREAS, FREE_DELIVERY_MIN, ORDER_AHEAD_DAYS, LEAD_MINUTES, SLOT_STEP, MAX_ITEM_QTY,
         toMin, manilaNow, dayOfDateStr, addDays, fmt12 } from './config.js';

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const bad = (error) => json({ ok: false, error }, 400);
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return bad('Invalid request.'); }

  if (body.website) return json({ ok: true, orderNumber: 'LA-0000' });          // honeypot: pretend success to bots

  const name = clean(body.name, 80), phone = clean(body.phone, 30), notes = clean(body.notes, 300);
  const orderType = body.orderType === 'Delivery' ? 'Delivery' : body.orderType === 'Pickup' ? 'Pickup' : null;
  const payMethod = body.payMethod === 'gcash' ? 'gcash' : 'cash';
  const gcashRef = clean(body.gcashRef, 40);
  if (!name || !phone || !orderType) return bad('Please enter your name and contact number.');
  if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) return bad('Please enter a valid contact number.');

  // items — prices always come from the server menu
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 20) return bad('Your order is empty.');
  const items = []; let subtotal = 0;
  for (const it of body.items) {
    const m = MENU[it?.id]; const qty = Math.floor(Number(it?.qty));
    if (!m || !(qty >= 1) || qty > MAX_ITEM_QTY) return bad('One of the items in your order is not valid.');
    items.push({ id: it.id, name: m.name, qty, price: m.price }); subtotal += m.price * qty;
  }

  // delivery
  let area = '', address = '', fee = 0;
  if (orderType === 'Delivery') {
    area = clean(body.area, 60); address = clean(body.address, 200);
    if (!(area in AREAS)) return bad('Please choose a valid delivery area.');
    if (!address) return bad('Please enter a delivery address.');
    fee = (FREE_DELIVERY_MIN > 0 && subtotal >= FREE_DELIVERY_MIN) ? 0 : AREAS[area];
  }
  const total = subtotal + fee;

  // timing (Philippine time)
  const now = manilaNow(); let scheduledFor = null, scheduledLabel = null;
  if (body.schedule) {
    const date = clean(body.schedule.date, 10), minute = Number(body.schedule.minute);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(minute)) return bad('Please choose a valid date and time.');
    const diff = Math.round((new Date(date + 'T00:00:00Z') - new Date(now.dateStr + 'T00:00:00Z')) / 864e5);
    if (diff < 0 || diff >= ORDER_AHEAD_DAYS) return bad('Please choose a date within the next 7 days.');
    const h = HOURS[dayOfDateStr(date)];
    if (!h) return bad('We are closed on that day.');
    if (minute < toMin(h[0]) || minute > toMin(h[1]) - SLOT_STEP || (minute - toMin(h[0])) % SLOT_STEP !== 0) return bad('That time is outside our hours.');
    if (diff === 0 && minute < now.min + LEAD_MINUTES - 5) return bad('That time is too soon — please pick a later slot.');
    scheduledFor = `${date} ${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    scheduledLabel = `${new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' })} at ${fmt12(minute)}`;
  } else {
    const h = HOURS[now.day];
    if (!h || now.min < toMin(h[0]) || now.min >= toMin(h[1])) return bad('Sorry, we are closed right now. Please schedule your order for a time we are open.');
  }

  const res = await env.DB.prepare(
    `INSERT INTO orders (created_at, status, name, phone, order_type, area, address, pay_method, gcash_ref, notes, items_json, subtotal, delivery_fee, total, scheduled_for, scheduled_label)
     VALUES (datetime('now'), 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, phone, orderType, area, address, payMethod, gcashRef, notes, JSON.stringify(items), subtotal, fee, total, scheduledFor, scheduledLabel).run();

  const id = res.meta.last_row_id;
  return json({ ok: true, id, orderNumber: 'LA-' + String(id).padStart(4, '0'), total });
}

export const onRequest = () => json({ ok: false, error: 'Method not allowed' }, 405);
