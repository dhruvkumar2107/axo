# Yashaswini Manjunath × Sagar Girisha — digital wedding invitation

A cinematic, mobile-first wedding invitation. A palace you walk through, an
editorial invitation, a date you scratch to reveal, the day's details, and an
RSVP the couple can actually read.

Built with Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind,
GSAP/ScrollTrigger, Lenis, Framer Motion and Three.js.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Development server                                  |
| `npm run build`    | Production build                                    |
| `npm run start`    | Serve the production build                          |
| `npm run typecheck`| `tsc --noEmit`                                      |
| `npm run lint`     | ESLint                                              |
| `npm run check`    | Typecheck + lint                                    |

---

## Everything the family will ever need to change

**`src/config/wedding.config.ts` is the only file you need to edit.** Names,
the date, the location, the RSVP functions, and the copy are all read from it.
Nothing else in the codebase hardcodes a wedding fact.

```ts
meta:     { bride, groom, brideCredentials, groomCredentials, monogram }
date:     { day, month, year, assumeNextOccurrence }
location: { venue, address, city, state, country, mapUrl }
events:   [{ name, dateLabel, startsAt, endsAt, timeLabel, venue, address }]
invites: [{ slug, salutation }]   // personalised /invite/<slug> links
```

### The year

The wedding date is confirmed as Thursday, 26 November 2026. Its year is set in
`date.year`, and the countdown and calendar links use the confirmed Muhurtham
start time.

The celebration scene lists Paidimudupu Shastram, reception and wedding in
chronological order; their dates, times and venue are configured in `events`.
The venue is Poornima Palace, Devam Hall, 36/2, Mysore Road, near Pattanagere
Metro Station, Rajarajeshwari Nagar, Bengaluru.

### Personalised links

`/invite/raj-family` says *"Dear Raj Family,"*. `invites` is empty by default;
without an entry the slug is still read as a name, so a link works the moment it
is sent. `mr-and-mrs-rao` becomes *"Dear Mr. & Mrs. Rao,"*.

Personalised pages are `noindex` and point their canonical at `/`.

---

## The guest list

Replies are stored as a single JSON file, written atomically, with no database
and no third party. Nothing about a guest is recorded beyond what they typed:
no IP address, no analytics, no tracking.

- **Guests reply** at `POST /api/rsvp` — same-origin, rate limited to 5 per
  minute, validated by the same rules the form uses.
- **The couple reads them** at `/admin`, behind `ADMIN_PASSWORD`. It is not
  linked from anywhere, `robots.txt` disallows it, and it is `noindex`. The
  password is held in memory for the tab only — closing the tab logs you out and
  a shared device keeps nothing behind. There is a CSV export.

> **Before deploying:** `RSVP_DATA_DIR` must point at persistent storage. On a
> host with an ephemeral filesystem (Vercel, Netlify, most containers) the
> default `./data/rsvp.json` will vanish on the next redeploy.

---

## Deploying

Any host that runs Next.js works. The invitation itself needs nothing but Node
20+; the RSVP needs a writable disk.

```bash
npm run build
npm run start          # http://localhost:3000
```

Set these in the host's environment:

| Variable             | Required | Purpose                                        |
| -------------------- | -------- | ---------------------------------------------- |
| `ADMIN_PASSWORD`     | yes, in practice | Unlocks `/admin`. Without it the guest list is unreadable. |
| `RSVP_DATA_DIR`      | on ephemeral hosts | Persistent location for replies.       |
| `NEXT_PUBLIC_SITE_URL` | no | Preferred origin for share previews. Falls back to the request origin. |
| `ALLOWED_ORIGINS`    | no       | Extra origins allowed to submit an RSVP.        |

**Vercel** — import the repository; the defaults are correct. If replies must
survive redeploys, attach a volume or move `rsvp-store.ts` to a database (it is
one file with `readAll`/`add`/`remove`/`toCsv`, so nothing else changes).

**Docker / VPS** — `npm ci && npm run build && npm run start`, with
`RSVP_DATA_DIR` mounted on a persistent volume.

---

## How it is put together

```
src/
  config/wedding.config.ts   the single source of truth
  app/                       routes, metadata, /api/rsvp, /api/og, robots, sitemap
  scenes/                    the invitation itself, one file per scene
  components/
    entry/                   preloader, Three.js palace, 2.5D fallback
    hud/                     nav, audio, cursor
    ui/  motion/  primitives/ building blocks
  lib/
    site.ts  date.ts  config.ts        derived content
    scroll.ts  experience.tsx         Lenis, device tier, entry phases
    rsvp.ts  calendar.ts  share.ts    shared logic, used on both sides
    server/                            password, rate limit, storage, origin
```

### The entry sequence

A palace, a door, and one decision. Device capability, WebGL support and a
runtime frame-rate watchdog decide between the Three.js palace and a CSS 2.5D
one; both play the same timeline, so the sequence never changes shape, only
material. Three.js is imported *dynamically*, only for a device that has already
been judged capable of it — until it arrives, the static palace is what is on
screen, and the swap happens behind the same animation.

### Graceful degradation

| Condition                        | What happens                                  |
| -------------------------------- | --------------------------------------------- |
| `prefers-reduced-motion`         | No parallax, no scratch puzzle, no Lenis glide |
| No WebGL, or a slow GPU          | The 2.5D palace, indefinitely                 |
| Touch device                     | No mouse-parallax on the palace                |
| No audio on first interaction    | Silent — never auto-plays                     |

### What is deliberately absent

There are no photographs, because none were supplied — the art is procedural SVG
(`ProceduralArt`, `MediaFrame`) and each panel has a documented slot for a real
image. There is no music file, so the ambience in `lib/audio.tsx` is synthesised
and will be replaced the moment real tracks are added.

Both are placeholders with a clear shape, not unfinished features.

---

## Verification

```bash
npm run check && npm run build
```

Typecheck, lint and the production build are clean. The RSVP API is exercised end
to end: unauthenticated and wrong-password reads are refused with `401`,
validation failures return `422`, submissions return `201`, the rate limiter
returns `429` past five per minute, CSV export and withdrawal both work, and
every route has been smoke-tested against a production server.

---

*The scratch-to-reveal date card is the only playful thing in here. It is also
the only part that needs a finger.*