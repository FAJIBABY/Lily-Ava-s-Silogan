import * as order from './order.js';
import * as admin from './admin.js';

const notAllowed = () => new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ctxArg = { request, env, ctx };

    if (url.pathname === '/api/order') {
      return request.method === 'POST' ? order.onRequestPost(ctxArg) : notAllowed();
    }
    if (url.pathname === '/api/admin/orders') {
      if (request.method === 'GET') return admin.onRequestGet(ctxArg);
      if (request.method === 'PATCH') return admin.onRequestPatch(ctxArg);
      return notAllowed();
    }
    if (url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });

    // everything else is the website (public/ folder)
    return env.ASSETS.fetch(request);
  },
};
