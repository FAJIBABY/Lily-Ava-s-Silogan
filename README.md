# Lily Ava's Silogan — website + order inbox (Cloudflare Workers)

What's inside
- `public/index.html` — the customer website (menu, ordering, order-ahead, delivery, GCash, privacy notice)
- `public/admin/index.html` — your Orders Inbox (password-protected) at `yourdomain.com/admin/`
- `src/` — the order API (a Cloudflare Worker). It re-checks prices, fees and hours on the server.
- `schema.sql` — the orders table (Cloudflare D1 database)
- `wrangler.toml` — Cloudflare settings

> Important: the Cloudflare drag-and-drop uploader cannot deploy this project (it has an API and a database).
> Use Route A (GitHub) or Route B (terminal). Both end with the same site.

## Step 1 — Create the database (both routes)

Dashboard: **Storage & Databases → D1 SQL database → Create database**, name it `lily-avas-orders`.
1. Open the new database → **Console** tab → paste everything from `schema.sql` → **Execute**.
2. Copy the **Database ID** and paste it into `wrangler.toml` where it says `PASTE-YOUR-DATABASE-ID-HERE`.

## Route A — GitHub + dashboard (no terminal)

1. Create a free GitHub account and a new **private** repository. Upload ALL files of this folder
   (keep the `public` and `src` folders as they are, with `wrangler.toml` at the top level).
2. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick the repo.
3. Build settings: leave **Build command** empty. **Deploy command**: `npx wrangler deploy`. Save and deploy.
4. Open the new Worker → **Settings → Variables and Secrets → Add** → type **Secret**,
   name `ADMIN_PASSWORD`, value = your admin password (long and private) → Deploy.
5. Worker → **Settings → Domains & Routes** to add your own domain.

Every time you change a file on GitHub, Cloudflare redeploys automatically.

## Route B — terminal (needs Node.js)

```
npx wrangler login
npx wrangler d1 create lily-avas-orders          # put the printed database_id in wrangler.toml
npx wrangler d1 execute lily-avas-orders --remote --file=schema.sql
npx wrangler deploy
npx wrangler secret put ADMIN_PASSWORD
```

## Test it
Open `https://<your-worker>.workers.dev/admin/`, sign in, then place a test order on the main site and watch it appear.

## Things to fill in
In `public/index.html` (search for `EDIT ME`):
- `GCASH_NUMBER`, `GCASH_NAME`; and save your QR image as `public/gcash-qr.png`
- Photos: the dish images are embedded in the `IMAGES` object; replace when your real photos are ready

If you change a menu price, hours, delivery area or fee, change it in BOTH places:
`public/index.html` and `src/config.js` (the server uses its own copy so customers can't tamper with prices).

## Good to know
- Export orders any time: D1 database → Console → `SELECT * FROM orders`, or
  `npx wrangler d1 execute lily-avas-orders --remote --command "SELECT * FROM orders" --json`
- Delete old customer data now and then (the privacy notice says data is kept only as needed):
  `DELETE FROM orders WHERE created_at < date('now','-90 days')` (run it in the D1 Console)
- Extra lock for `/admin`: Cloudflare Zero Trust → Access → add an application for `yourdomain.com/admin*`
  and `yourdomain.com/api/admin*` (free for small teams).
- Spam: a hidden honeypot field is included. If spam appears, add Cloudflare Turnstile.
- If the order system is unreachable, the site tells the customer to message you on WhatsApp so no order is lost.
