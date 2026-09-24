# Plan: Convert the WPO site to WordPress

## 0. Context and honest framing

This repo is a static site (plain HTML/CSS, 24 lines of JS) served free from GitHub
Pages at `wpo.org.uk`. There is a WordPress export in `exported-from-wordpress/`
dated 2026-03-17, so the site was migrated *off* WordPress earlier this year. Moving
back reverses that decision, so the plan should start by being clear about the
trade-off.

**What WordPress buys us**

- Non-technical committee members can edit concerts, news and pages in a browser,
  with no git, no HTML, no deploy step.
- Built-in media library for PDFs (AGM papers, programme notes) and images.
- Scheduled publishing, revisions, roles/permissions.

**What it costs**

- Real hosting is now required (PHP + MySQL). GitHub Pages cannot run WordPress.
  Budget ~£8–15/month managed, or more for a good managed WP host.
- Ongoing maintenance: core/plugin/theme updates, backups, security, spam.
- Performance and reliability drop from "static CDN" to "database-backed PHP",
  unless we add caching.
- The current site's hand-tuned accessibility, structured data (JSON-LD
  `MusicGroup` / `MusicEvent`), and tiny page weight must be deliberately
  re-created; they do not come for free.

**Recommendation:** confirm the driver is "committee needs to self-serve content
edits". If the only pain is "editing HTML is fiddly for one or two people", a
lighter option (a headless CMS feeding the existing static build, or Netlify CMS /
Decap on the current repo) may solve it with far less overhead. If we do want the
full WordPress editing experience, the rest of this plan applies.

---

## 1. Decisions to lock down first

| Decision | Options | Default recommendation |
|---|---|---|
| Hosting | Managed WordPress (WP Engine, Kinsta, Krystal, 34SP), generic cPanel host, or self-managed VPS | Managed/shared UK host with one-click WP, staging, daily backups (e.g. Krystal / 34SP). Avoid a VPS — no one wants to be sysadmin. |
| Domain / DNS | Keep `wpo.org.uk` registrar as-is, repoint records | Keep registrar; change A/CNAME at cutover. Remove `docs/CNAME` from Pages only after cutover succeeds. |
| Theme | Off-the-shelf theme, or custom lightweight theme porting `style.css` | Custom minimal **block theme** (see §4). The existing CSS is small and good; a bought theme would fight it. |
| Page builder | None / Gutenberg blocks / Elementor etc. | Core Gutenberg only. No Elementor — it would bloat the site we just made lean. |
| Concerts data model | Plain Pages, or a Custom Post Type | **Custom Post Type `concert`** with fields for date, time, venue, programme, soloists, ticket URL, flyer, programme-notes PDF. |
| News | WordPress Posts | Yes — Posts, shown on the home page. |
| Content migration | Import old XML, or re-enter by hand | **Re-enter by hand.** ~15 pages; the March export is stale and the site has moved on. Manual is faster and cleaner than fixing a bad import. |
| Forms | Contact + membership join | A form plugin (§6). |
| Keep static site | — | Yes. Leave this repo intact as the rollback and as a reference for content/markup. |

---

## 2. Information architecture — current → WordPress

### Pages (WordPress Pages, one-to-one)

| Current file | WordPress page | Slug / path to preserve |
|---|---|---|
| `docs/index.html` | Front page (static front page = "Home") | `/` |
| `docs/about/index.html` | About | `/about/` |
| `docs/about/history.html` | History (child of About) | `/about/history/` |
| `docs/about/people.html` | People | `/about/people/` |
| `docs/about/images.html` | Gallery | `/about/images/` |
| `docs/about/previous-seasons.html` | Previous Seasons | `/about/previous-seasons/` |
| `docs/players/index.html` | Players / Join | `/players/` |
| `docs/players/members.html` | Members | `/players/members/` |
| `docs/players/membership-join.html` | Membership sign-up | `/players/membership-join/` |
| `docs/players/membership-thanks.html` | Thank-you page | `/players/membership-thanks/` |
| `docs/support.html` | Support Us | `/support/` (add redirect from `/support.html`) |
| `docs/contact.html` | Contact | `/contact/` (redirect from `/contact.html`) |

Section sub-navigation (`about/`, `players/`) becomes a WordPress **menu** per
section, or is rendered by the theme from page hierarchy. The `aria-current="page"`
treatment is handled by the theme's nav walker / block markup.

### Concerts (Custom Post Type `concert`)

Current: one directory per concert `docs/concerts/YYYY-MM-DD/`, optional
`concert-YYYY-MM-DD.html`, plus flyer images and programme-notes PDF alongside.

WordPress:

- CPT `concert`, `has_archive` true, rewrite slug `concerts`, permalink
  `/concerts/%concert_date%/` or `/concerts/<post-slug>/`.
- Fields (ACF, Meta Box, or `register_post_meta` + block bindings):
  - `concert_date` (date), `concert_time` (text, e.g. "7:30pm")
  - `venue_name`, `venue_address`
  - `programme` (repeater: composer, work, note) or rich text
  - `soloists` (repeater: name, instrument, URL)
  - `ticket_url`
  - `season` (taxonomy, e.g. "2026–2027") — drives the home-page season table
  - Featured image = flyer; `programme_notes` = PDF (media library file field)
- A concert can exist with no flyer/notes yet — template must omit those blocks
  gracefully (matches current CLAUDE.md rule).
- Archive template renders the **season schedule table** on the home page and the
  `/concerts/` listing, ordered by `concert_date`.
- "Next concert" hero overlay on the home page = query for the next `concert`
  with `concert_date >= today`, output date/time/venue/programme/ticket link.

### News (Posts)

`#news` list on `docs/index.html` → latest N Posts on the front page. Each news item
is a short Post; link targets (PDFs, external ticket pages, internal pages) are just
links in the post body.

### Rehearsal schedules

`players/schedule-YYYY-YYYY.html` + `.ics`:

- Simplest: keep each season schedule as a **Page** under `/players/`, content
  pasted as a table/list.
- The `.ics` feed: either
  (a) keep hand-maintained `.ics` files uploaded to the media library (low tech,
      fine), or
  (b) generate from a `rehearsal` CPT / events plugin. Given the size, (a) is
      probably enough. Decide based on how often the schedule changes mid-season.

### Documents / assets

- AGM PDFs (`docs/assets/agm/YYYY/`), programme notes, flyers → **Media Library**.
  Organise with a "Documents" category plugin or a consistent naming scheme.
- Photos (`docs/assets/images/`) → Media Library; gallery page uses a core Gallery
  block.
- Logos, icons, Making Music logo → theme assets or media library.
- Fonts (`docs/fonts/*.woff2`, Merriweather / Merriweather Sans) → bundled in the
  theme, `@font-face` via the theme stylesheet (do **not** switch to Google Fonts
  hotlinking — keep them self-hosted for privacy and speed).

---

## 3. Hosting and environments

1. Provision hosting with **three** environments if possible: local, staging
   (`staging.wpo.org.uk` or host-provided), production.
2. Local dev: `wp-env`, LocalWP, or DDEV. Put the theme (and any custom plugin) in
   git — a new repo, or a `wp-content/` subtree in this one.
3. Staging is where content entry and review happen before cutover.
4. Backups: daily automated (host feature or UpdraftPlus). Verify a restore once.
5. TLS: Let's Encrypt via host. Force HTTPS.

---

## 4. Theme

Build a **custom block theme** ("wpo-theme") rather than buying one. Rationale: the
existing `docs/css/style.css` (~1,170 lines) is already the design system, and the
markup is clean and semantic.

Steps:

1. Scaffold with `@wordpress/create-block-theme` or Create Block Theme plugin.
2. Port `style.css` into the theme, mapping current classes
   (`.section-inner`, `.schedule-table`, `.concert-overlay`, `.hero-image`,
   `.header-subnav-bar`, `.pull-quote-overlay`, `.news-item`, etc.) to block
   markup / `theme.json` where sensible. Keep custom classes where a block
   equivalent would be more trouble than it's worth.
3. `theme.json`: colour palette, font families (Merriweather / Merriweather Sans),
   spacing scale, content width. Self-host the woff2 files via `@font-face` in the
   theme and register the families in `theme.json`.
4. Templates needed:
   - `index.html` / `home.html` — front page: hero + next-concert overlay +
     pull quote + season table + news list.
   - `single-concert.html` — concert detail (port
     `concert-2026-10-17.html` layout: hero info block, intro paragraphs,
     Programme list, optional flyer, optional programme-notes link).
   - `archive-concert.html` — all concerts / season listings.
   - `single.html` — news post.
   - `page.html` + `page-no-title.html` variants.
   - `404.html`, `search.html`.
   - Parts: `header.html` (brand + main nav + social links), `footer.html`
     (copyright with dynamic year, contact link, Making Music logo),
     section sub-nav part(s).
5. Re-create accessibility features that are currently hand-coded:
   - Skip link (`<a class="skip-link" href="#main-content">`).
   - `aria-current="page"` in nav — block theme nav does this; verify.
   - Mobile nav toggle: the core Navigation block ships its own responsive
     behaviour. Either use it, or port the 24-line `main.js` toggle if the design
     needs the exact current behaviour (including the sub-nav bar opening in
     sync).
   - Footer year: server-side `date('Y')` in a block or shortcode instead of JS.
6. Performance: enable a caching plugin (see §5), keep the theme JS-free or near
   it, lazy-load images (WP does this by default), set explicit image dimensions.

Do **not** rely on the WordPress block editor's default styles leaking into the
front end — lock the design to the ported stylesheet.

---

## 5. Plugins (keep the list short)

| Need | Plugin | Notes |
|---|---|---|
| Custom fields for `concert` | ACF (free) or Meta Box | Or hand-rolled `register_post_meta` if we want zero plugin dependency. |
| SEO + structured data + OG tags | Rank Math or Yoast | Must reproduce per-page `<meta name="description">`, Open Graph tags, and JSON-LD. `MusicEvent` schema per concert may need a custom snippet — see §7. |
| Caching / performance | Host cache, or WP Super Cache / W3TC / LiteSpeed | Static-page cache is essential to get back near current speed. |
| Forms | Fluent Forms, WPForms Lite, or Contact Form 7 + spam guard | Contact form + membership join form. |
| Spam | Akismet or a honeypot/turnstile plugin | Needed once forms exist. |
| Backups | UpdraftPlus (if host doesn't cover it) | Test a restore. |
| Security | Limit Login Attempts Reloaded, or Wordfence (lighter config) | Plus strong admin passwords, 2FA, non-`admin` username. |
| Redirects | Redirection plugin | Map old `.html` URLs (see §8). |

Avoid: page builders, "all-in-one" mega plugins, slider plugins, jQuery-heavy
add-ons.

---

## 6. Forms

- **Contact** (`contact.html`): name, email, message → email to `contact@wpo.org.uk`.
  Keep a plain `mailto:` fallback in the footer as now.
- **Membership join** (`membership-join.html` → `membership-thanks.html`): port the
  existing fields; on submit, redirect to a `/players/membership-thanks/` page and
  email the membership secretary. Check current form fields and any payment / Gift
  Aid text before rebuilding.
- GDPR: add a privacy note near each form; confirm where submissions are stored
  (email only vs database) with the committee.

---

## 7. Structured data, meta, and SEO parity

The current site is careful about this; don't lose it.

- Per-page `<meta name="description">` and Open Graph tags → SEO plugin, set per
  Page / per concert (use the concert's own fields to populate OG description and
  image).
- Site-wide `MusicGroup` JSON-LD (founding date, charity number 1053703, `sameAs`
  Facebook/Instagram) → SEO plugin's organisation schema, or a small custom
  `wp_head` snippet in the theme (most reliable for the exact fields).
- Per-concert `MusicEvent` JSON-LD (start date/time with `+01:00`/`+00:00`
  offset, `MusicVenue` with `PostalAddress`, performer, organizer) → generate in
  `single-concert.html` template from the concert fields via a `wp_head` filter.
  This is the one piece most likely to need hand-written PHP.
- Preserve `lang="en"`, `format-detection` telephone=no, favicon
  (`assets/wpo-icon.jpeg`), canonical URLs.
- `robots.txt` / sitemap: let the SEO plugin generate the sitemap; submit to
  Search Console after cutover.

---

## 8. URL preservation and redirects

Current URLs are `.html` files; WordPress will use trailing-slash paths. Add 301s:

| Old | New |
|---|---|
| `/index.html` | `/` |
| `/support.html` | `/support/` |
| `/contact.html` | `/contact/` |
| `/about/history.html` | `/about/history/` |
| `/about/people.html` | `/about/people/` |
| `/about/images.html` | `/about/images/` |
| `/about/previous-seasons.html` | `/about/previous-seasons/` |
| `/players/members.html` | `/players/members/` |
| `/players/membership-join.html` | `/players/membership-join/` |
| `/players/membership-thanks.html` | `/players/membership-thanks/` |
| `/players/schedule-2025-2026.html` | `/players/schedule-2025-2026/` |
| `/players/schedule-2026-2027.html` | `/players/schedule-2026-2027/` |
| `/concerts/2026-05-09/concert-2026-05-09.html` | `/concerts/2026-05-09/` |
| `/concerts/2026-10-17/concert-2026-10-17.html` | `/concerts/2026-10-17/` |

- Keep asset URLs (`/assets/agm/2025/agm-2025-minutes.pdf`,
  `/concerts/2026-05-09/programme-notes-2026-05-09.pdf`, flyer images) reachable —
  either upload to matching paths, or 301 each to its new media-library URL. The
  home page and Members page link to these directly and they may be linked
  externally / in emails.
- Decide the `.ics` feed URL and keep it stable (calendar subscribers).
- Crawl the live site first (`wget --mirror` or Screaming Frog) to get the full
  URL inventory before finalising the redirect map.

---

## 9. Migration sequence

**Phase 0 — Prep (0.5 day)**
- Confirm decisions in §1 with the committee.
- Full crawl/backup of current live site. Snapshot this repo (tag it).

**Phase 1 — Infrastructure (0.5–1 day)**
- Provision hosting + staging.
- Install WordPress, set permalinks, create admin users with real roles.
- Install the short plugin list; configure caching, backups, security.

**Phase 2 — Theme (2–4 days)**
- Scaffold block theme, port `style.css` and fonts, build `theme.json`.
- Build templates and parts (§4). Match header/footer/nav exactly.
- Register `concert` CPT + fields + `season` taxonomy.

**Phase 3 — Content entry (2–3 days)**
- Create all Pages (§2) with content adapted from the current HTML.
- Enter concerts as `concert` posts (past + upcoming), attach flyers/PDFs.
- Enter recent news as Posts.
- Upload all documents/images to the media library; fix internal links.
- Build menus (main nav + section sub-navs).
- Set static front page.

**Phase 4 — Parity pass (1–2 days)**
- Structured data / meta / OG per §7 — validate with Google Rich Results Test.
- Accessibility: keyboard nav, skip link, focus states, colour contrast,
  screen-reader check of nav and concert pages. Match current behaviour.
- Forms: submit tests, confirm delivery to the right mailboxes.
- Responsive check: mobile nav toggle, tables, hero overlay.
- Redirects (§8) configured and tested on staging with rewritten host mapping.
- Performance: Lighthouse on staging vs current site; tune caching until close.

**Phase 5 — Cutover (0.5 day)**
- Freeze content edits on the static site.
- Final content sync (any news/concert changes since Phase 3).
- Lower DNS TTL 24–48h ahead. At cutover, repoint `wpo.org.uk` A/AAAA/CNAME to
  the new host; keep GitHub Pages live until DNS fully propagates.
- Verify TLS, redirects, forms, sitemap on the real domain.
- Submit new sitemap to Search Console; watch 404s / crawl errors for two weeks.

**Phase 6 — Decommission (after ~2 weeks stable)**
- Remove the GitHub Pages custom domain (but **keep this repo** as archive +
  rollback; do not delete `docs/CNAME` from history).
- Document the editing workflow for the committee (how to add a concert, post
  news, upload AGM papers, publish the schedule).

**Rough total: ~8–14 working days** depending on theme fidelity and how much
committee review each phase needs.

---

## 10. Rollback

Because the static site stays in git and GitHub Pages can be re-enabled in
minutes: if the WordPress site has a serious problem within the first weeks, point
DNS back to GitHub Pages (restore `docs/CNAME` handling) and the old site is live
again. Keep this option available until at least one full concert cycle and one
AGM-document publish have gone through WordPress successfully.

---

## 11. Ongoing ownership (name it now, not later)

- Who applies WordPress/plugin/theme updates monthly?
- Who holds hosting billing and admin credentials (and a backup person)?
- Where are backups, and who has tested a restore?
- Editorial: who can publish vs draft; a one-page "how to" for the committee.

If the answer to "who maintains it" is unclear, reconsider whether the static
site plus a lightweight git-backed editor is the better fit after all.
