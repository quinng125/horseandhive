# Horse & Hive Farm — website

A ground-up redesign of [horseandhive.com](https://horseandhive.com) for Horse & Hive Farm in Hydes, Maryland: riding lessons, boarding, summer camp and honey.

It's a fast, static site (plain HTML, CSS and a little JavaScript) with no framework and nothing to host but files. It works on GitHub Pages, Netlify, Cloudflare Pages or any ordinary web host.

## What's in the redesign

- **Editorial, photo-led design.** Big serif headlines (Fraunces) with honey-colored italic accents, a pasture-green and parchment palette, and a honeycomb motif drawn from the farm's name.
- **Built to convert.** Every page leads to one clear next step, "Book your first lesson". There's a sticky call/book bar on phones, a three-step "first ride" path, visible pricing, and an enquiry form that pre-selects the right topic from whichever button was clicked.
- **Pages:** Home, Lessons, Boarding, Camp, Our Farm (story, team, herd, honey), Visit & Contact, a 404, and an owner-only **Photo Lab**.
- **Photo upgrade pipeline.** Drop in phone photos and every image gets the same professional treatment: smart-cropped to the layout, auto-levelled, warmly color-graded, sharpened, stripped of GPS metadata, and exported as AVIF and WebP in several sizes.
- **Quality:** in local Lighthouse runs (simulated mobile, gzip enabled), it scores 89–91 for performance and 100 for accessibility, best practices and SEO. It has local-business structured data, social share cards, a sitemap, reduced-motion support, full keyboard navigation and self-hosted fonts.

## Quick start

```bash
npm install          # once
npm run build        # builds the pages from src/ into the site root
npm run dev          # build + preview at http://localhost:5173
npm run check        # checks links, anchors, assets and alt text
```

The built `*.html` files in the repository root are the live site. Edit pages in `src/`, not the root files.

## Photos

Every image on the site is a real Horse & Hive photo, taken from the media library of the current horseandhive.com. Each one is a "slot" defined in `photos/slots.json`, with its original in `photos/original/<slot>.jpg`. Each one is run through the photo pipeline, which:

- crops it to the layout's shape, around the subject or around a focus point set in `slots.json`
- auto-levels it and applies a film-style grade: gentle contrast, calmer phone-camera greens, warm highlights and soft matte blacks
- sharpens it at each output size (or softens it slightly, for full-width photos behind text) and adds a subtle vignette
- strips metadata and exports AVIF and WebP in several sizes

To replace or add a photo:

1. Save it as `photos/original/<slot>.jpg`, for example `photos/original/hero.jpg`.
2. If the crop misses the subject, set `"focus": [x, y]` for that slot in `photos/slots.json`, as fractions of the width and height (for example `[0.6, 0.4]`).
3. Run `npm run photos -- <slot>` (or `npm run photos` for all), then `npm run build`.
4. Open `/photo-lab.html` to drag a before/after slider over every photo.

Every slot must have a real photo. If an original is missing, `npm run photos` stops with an error and leaves that slot's existing images alone, so no placeholder or drawing can ever reach the site.

| Slots | Where they appear |
| --- | --- |
| `hero`, `banner`, `page-*` | Full-width photos behind text: homepage hero, camp banner, top of each page |
| `story`, `lessons`, `intro`, `camp`, `boarding`, `card-companion`, `card-clinics` | Homepage welcome and program cards |
| `honey` | Hive section (the farm's hens; no beehive photo exists yet) |
| `facility-*` (6) | "The grounds" tiles on Home and Boarding |
| `horse-*` (12) | Meet the herd, one portrait per lesson horse |
| `team-lina`, `team-merideth`, `team-victoria` | Our Farm → team |
| `value-*`, `about-*` | Our Farm → values and "more at the farm" |
| `lessons-companion`, `lessons-wear`, `lessons-clinic` | Lessons page sections |
| `boarding-tack`, `boarding-trainer` | Boarding amenities |
| `camp-1` … `camp-8` | Camp page gallery |
| `contact-sign` | Contact page: the entrance sign |

The best upgrades from here: a real beehive or honey photo, a higher-resolution hero (at least 2400px wide), and a few golden-hour shots of the herd.

To change the look of every photo at once, edit the `grade` settings at the top of `tools/photos.mjs`. Film grain is added by a tiny tiled texture in CSS rather than baked into the files, which keeps the photos small.

## Logo

The header, footer, favicons and share image use the farm's own beehive-and-horseshoe mark (`assets/img/logo-mark.png`, extracted from `photos/logo-source.png`). It's a single-color shape recolored with CSS: honey on dark backgrounds, the farm's green on light ones. Run `node tools/brand.mjs` to regenerate the favicons after changing it.

## Project structure

```
src/pages/        page content (edit these)
src/partials/     shared head, header, footer and icons
assets/css/       styles.css (source) → styles.min.css (built)
assets/js/        main.js (source) → main.min.js (built)
assets/fonts/     self-hosted Fraunces + Instrument Sans (latin)
assets/photos/    generated responsive images (don't edit by hand)
assets/img/       favicons and the social share image
photos/           slots.json + original/ (source photos)
tools/            build, photo pipeline, favicons, link checker
docs/             design research and the owner content checklist
```

## Deploying

### Vercel (recommended)

The repo is ready for Vercel. `vercel.json` handles the build, output folder, security headers and caching, so there's nothing to configure.

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import **quinng125/horseandhive**. If it isn't listed, choose "Adjust GitHub App Permissions" and grant access to the repo.
3. Leave every setting as detected (Framework preset "Other"; the build command and output directory come from `vercel.json`) and click **Deploy**.
4. To use the real domain, open Project → Settings → Domains, add `horseandhive.com` and `www.horseandhive.com`, and update the DNS records at the domain registrar as Vercel instructs.

Every push to the production branch redeploys automatically, and other branches get preview URLs. On Vercel, the build runs `npm run build:dist`, which rebuilds the pages and collects only the website files into `dist/`. Source, tools, docs and original photos are never published.

### Other hosts

- **Netlify / Cloudflare Pages:** build command `npm run build:dist`, publish directory `dist`.
- **GitHub Pages:** deploy from the repository root (built pages are committed; `.nojekyll` is included).

The contact form opens the visitor's email app with a ready-to-send message to `hhfarm2012@gmail.com`, so it needs no server. To collect submissions in an inbox instead, swap in a form service such as Netlify Forms or Formspree.

## Before launch

Read [`docs/CONTENT-CHECKLIST.md`](docs/CONTENT-CHECKLIST.md). It lists every price, date, name and claim taken from the current site that the owner should confirm.

## Credits

Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) and [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (SIL Open Font License). Photography and the beehive-and-horseshoe logo mark © Horse & Hive Farm, from the farm's existing website. Interface icons are original to this project.
