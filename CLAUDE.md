# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project

Static website for the Westminster Philharmonic Orchestra (WPO). Plain HTML, CSS, and minimal JavaScript — no build tools, no framework, no site generator.

## Audience

- Orchestra members — rehearsal schedules, concert details
- The public — upcoming concerts, how to attend or support
- Curious visitors — orchestra history, people, and how to get involved

## Development

Serve locally to avoid CORS issues with any fetch calls:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser. Files can also be opened directly, but fetch-based features may not work.

## Deployment

The `docs/` directory is served via GitHub Pages. `docs/CNAME` sets the custom domain. Do not remove or rename the CNAME file.

## Structure

Website files live in `docs/`. Other directories (`exported-from-wordpress/`, `making-music-logos/`) are support and administration material.

The `supporting/` directory is a local working area for admin documents (AGM minutes, reports, etc.) — it is not committed to the repo and should not be linked from the site directly; PDFs for publication are copied into `docs/assets/agm/YYYY/`.

Within `docs/`:

- `index.html` — home page; includes upcoming concerts listing
- `support.html`, `contact.html` — supporting and contacting the orchestra
- `concerts/YYYY-MM-DD/` — one subdirectory per concert; the detail page (if present) is named `concert-YYYY-MM-DD.html`; assets (flyers, programme notes) live alongside it. Some directories contain only flyer images with no HTML page — that is valid.
- `css/style.css` — single stylesheet
- `js/main.js` — minimal site-wide JavaScript (nav toggle etc.)
- `assets/` — images, logos, icons; `assets/images/` for photos; `assets/agm/YYYY/` for AGM PDFs organised by year
- `fonts/fonts.css` — `@font-face` declarations for the Merriweather family
- `fonts/` — web font files (.woff2)

`about/` — public-facing orchestra information:
- `about/index.html` — about page
- `about/history.html` — orchestra history
- `about/people.html` — people
- `about/images.html` — gallery
- `about/previous-seasons.html` — archive of past concert seasons

`players/` — player and member resources:
- `players/index.html` — join the orchestra, rehearsal info
- `players/members.html` — member resources, including links to AGM documents (from `assets/agm/YYYY/`)
- `players/membership-join.html`, `players/membership-thanks.html` — membership sign-up flow
- `players/schedule-YYYY-YYYY.html` / `players/schedule-YYYY-YYYY.ics` — per-season rehearsal schedule and iCal feed

## Sub-navigation

Each section (`about/`, `players/`) has a sub-nav bar that appears on every page within that section. When adding a new page to a section:

- Add a `<li><a href="new-page.html">Title</a></li>` to the sub-nav on every existing page in that section
- On the new page itself, use `<li><span aria-current="page">Title</span></li>` instead of a link

## Conventions

- Semantic HTML throughout
- Accessibility: use ARIA attributes and skip-links as established in existing pages
- JavaScript: dependency-free, minimal, progressive enhancement only
- CSS: plain, no preprocessors; single `style.css`
- Support both desktop and mobile browsers
- New concert pages go in `concerts/YYYY-MM-DD/` following the existing subdirectory pattern
