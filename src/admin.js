const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const STATUSES = ['new', 'preparing', 'ready', 'completed', 'cancelled'];

function authorized(request, env) {
  const given = request.headers.get('x-admin-key') || '';
  const real = env.ADMIN_PASSWORD || '';
  if (!real || given.length !== real.length) return false;
  let diff = 0; for (let i = 0; i < real.length; i++) diff |= given.charCodeAt(i) ^ real.charCodeAt(i);   // constant-time compare
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return json({ ok: false, error: 'Wrong password' }, 401);
  const { results } = await env.DB.prepare(
    `SELECT * FROM orders ORDER BY id DESC LIMIT 300`
  ).all();
  const orders = results.map(r => ({ ...r, items: JSON.parse(r.items_json || '[]'), items_json: undefined }));
  return json({ ok: true, orders, serverTime: new Date().toISOString() });
}

export async function onRequestPatch({ request, env }) {
  if (!authorized(request, env)) return json({ ok: false, error: 'Wrong password' }, 401);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'Invalid request' }, 400); }
  if (!Number.isInteger(b.id) || !STATUSES.includes(b.status)) return json({ ok: false, error: 'Invalid request' }, 400);
  await env.DB.prepare(`UPDATE orders SET status = ?, status_updated_at = datetime('now') WHERE id = ?`).bind(b.status, b.id).run();
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'Method not allowed' }, 405);
