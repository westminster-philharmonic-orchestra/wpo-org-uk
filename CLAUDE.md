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

## Structure

Website files live in `docs/`. Other directories (`exported-from-wordpress/`, `making-music-logos/`) are support and administration material.

Within `docs/`:

- `index.html` — home page; includes upcoming concerts listing
- `previous-seasons.html` — archive of past concert seasons
- `concerts/YYYY-MM-DD/` — one subdirectory per concert, containing the detail page and assets (flyer, programme notes)
- `schedule-YYYY-YYYY.html` / `schedule-YYYY-YYYY.ics` — per-season rehearsal schedule and iCal feed
- `about.html`, `history.html`, `people.html` — orchestra information
- `players.html` — player/member directory
- `images.html` — gallery
- `members.html` — member resources
- `membership-join.html`, `membership-thanks.html` — membership sign-up flow
- `support.html`, `contact.html` — supporting and contacting the orchestra
- `css/style.css` — single stylesheet
- `js/main.js` — minimal site-wide JavaScript (nav toggle etc.)
- `assets/` — images, logos, icons; subdirectories include `agm/` and `images/`
- `fonts/` — web fonts

## Conventions

- Semantic HTML throughout
- Accessibility: use ARIA attributes and skip-links as established in existing pages
- JavaScript: dependency-free, minimal, progressive enhancement only
- CSS: plain, no preprocessors; single `style.css`
- Support both desktop and mobile browsers
- New concert pages go in `concerts/YYYY-MM-DD/` following the existing subdirectory pattern
