# SikaSense

Daily profit intelligence for West African social commerce — Next.js + Supabase.

## What's in this build

- **Auth**: login, signup (email confirmation), forgot password, reset password — all with validation and error handling
- **Dashboard**: portfolio snapshot + quick access to your most recent batches
- **Batches**: Net Verdict / Sourcing / History tabs (matches the partner mockups), "+1 Sold" quick logging with discount flagging, break-even bar
- **Analytics**: daily/weekly/monthly granularity, quick date presets, custom range, per-batch filter, revenue+profit chart
- **Design**: dark theme, Manrope + JetBrains Mono (Google Fonts), Material Symbols icons, bottom navigation on mobile, sidebar on desktop, fully responsive
- **Financial logic** (`src/lib/financials.ts`) is a pure module with zero UI or Supabase imports — matches the charter's non-negotiable decoupling principle

## 1. Install

```bash
npm install
```

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. In the dashboard, open **SQL Editor** → New query
3. Paste in the contents of `supabase/schema.sql` and run it — this creates the `products` (batches) and `sale_events` tables with Row Level Security already locked to each user

## 3. Environment variables

Copy the template and fill in your project's values (Project Settings → API):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Configure auth email redirects (important)

In the Supabase dashboard → **Authentication → URL Configuration**, add these to your allowed redirect URLs so signup confirmation and password reset links work:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/reset-password`
- (and the equivalent `https://your-domain.com/...` once deployed)

## 5. Run it

```bash
npm run dev
```

Open `http://localhost:3000` — you'll land on `/login` since there's no session yet.

## 6. Deploy

Push to GitHub, import into Vercel, add the same three env vars there (with `NEXT_PUBLIC_SITE_URL` set to your real domain), and add the production redirect URLs to Supabase as in step 4.

---

## Design decisions worth knowing about

- **Dropped Tailwind.** The earlier scaffold suggestion used Tailwind, but matching your partner's specific dark/gold/green identity closely was cleaner with a dedicated CSS design-token system (`src/app/globals.css`) — every color is a named variable (`--profit`, `--building`, `--loss`, `--brand`), so retheming later means editing one place, not hunting through utility classes.
- **The "building" amber is a different hue from the brand gold.** In the original mockups both used a similar orange, which risks reading as "brand color = warning" at a glance. I shifted the in-progress/"Building" status to a more yellow amber so it's visually distinct from the SikaSense brand mark, and every status also carries an icon + text label — not color alone.
- **Terminology note**: you asked for the bottom menu as a "snackbar" — in Material Design, the bottom menu bar is actually called **Bottom Navigation**; a **Snackbar** is the brief toast message that pops up after an action (e.g. "Sale logged"). I built both: bottom navigation for the mobile menu, and real snackbars for action feedback throughout the app.
- **Client-side data fetching.** Pages fetch via the browser Supabase client (like the original prototype) rather than Server Components, for simplicity and consistency with a fast-moving alpha. This is a reasonable trade-off for now; moving to server-fetched data later would improve initial load performance.
- **`user_id` defaults to `auth.uid()`** at the database level (see schema.sql), so the app never has to remember to attach it manually — one less place for bugs.

## Recommended next steps (not built yet)

- **PWA icons**: `public/manifest.json` has an empty `icons` array — add 192x192 and 512x512 PNGs for a proper "Add to Home Screen" experience
- **Offline logging**: for patchy mobile data, add IndexedDB (via Dexie.js) so "+1 Sold" works instantly offline and syncs when connectivity returns — flagged as a real risk in the charter's own risk section
- **Custom email templates**: Supabase's default confirmation/reset emails are plain — customize them under Authentication → Email Templates
- **Rate limiting** on auth endpoints (Supabase has built-in protections, but review them before a public launch)
- **Account deletion** — currently there's a sign-out but no self-serve account deletion
- **Multi-currency** — everything is hardcoded to GHS per the charter's Ghana-first scope; revisit if you expand beyond Ghana
