# Horse & Hive Farm — website

A ground-up redesign of [horseandhive.com](https://horseandhive.com) for Horse & Hive Farm in Hydes, Maryland: riding lessons, boarding, summer camp and honey.

It's a fast, static site (plain HTML, CSS and a little JavaScript) with no framework and nothing to host but files. It works on GitHub Pages, Netlify, Cloudflare Pages or any ordinary web host.

## What's in the redesign

- **Editorial, photo-led design.** Big serif headlines (Fraunces) with honey-colored italic accents, a pasture-green and parchment palette, and a honeycomb motif drawn from the farm's name.
- **Built to convert.** Every page leads to one clear next step, "Book your first lesson". There's a sticky call/book bar on phones, a three-step "first ride" path, visible pricing, and an enquiry form that pre-selects the right topic from whichever button was clicked.
- **Pages:** Home, Lessons, Boarding, Camp, Our Farm (story, team, herd, honey), Visit & Contact, a 404, and an owner-only **Photo Lab**.
- **Photo upgrade pipeline.** Drop in phone photos and every image gets the same professional treatment: smart-cropped to the layout, auto-levelled, warmly color-graded, sharpened, stripped of GPS metadata, and exported as AVIF and WebP in several sizes.
- **Quality:** in local Lighthouse runs (simulated mobile, gzip enabled), it scores 94–95 for performance and 100 for accessibility, best practices and SEO. It has local-business structured data, social share cards, a sitemap, reduced-motion support, full keyboard navigation and self-hosted fonts.

## Quick start

```bash
npm install          # once
npm run build        # builds the pages from src/ into the site root
npm run dev          # build + preview at http://localhost:5173
npm run check        # checks links, anchors, assets and alt text
```

The built `*.html` files in the repository root are the live site. Edit pages in `src/`, not the root files.

## Adding the farm's photos

Every image on the site is a numbered "slot" (see `photos/slots.json`). Until a real photo is added, each slot shows a matching illustration so the site never looks unfinished.

1. Save a photo as `photos/original/<slot>.jpg`, for example `photos/original/hero.jpg`.
2. Run `npm run photos` (or `npm run photos -- hero` for just one).
3. Run `npm run build`, then open `/photo-lab.html` to drag a before/after slider over every upgraded photo.

| Slot | Shape | Where it appears | Best subject |
| --- | --- | --- | --- |
| `hero` | 3:2, 2400px+ | Homepage hero | The farm's best wide shot: horses in the field at golden hour |
| `story` | 4:5 | Homepage welcome, Our Farm | The barn or the farm entrance |
| `lessons` | 4:5 | Homepage "Riding lessons" card | A student mid-lesson in the arena |
| `intro` | 4:5 | Homepage card, Lessons page | A child meeting or grooming a horse |
| `camp` | 4:5 | Homepage card, Camp page | Campers with horses, big smiles |
| `boarding` | 4:5 | Homepage card, Boarding page | Horses turned out in pasture |
| `honey` | 1:1 | Hive section | Honeycomb frame, jars of honey or the hives |
| `facility-grass`, `facility-stone`, `facility-indoor`, `facility-dressage`, `facility-track`, `facility-pasture` | 4:3 | "The grounds" tiles | Each arena or area, empty and tidy |
| `horse-archie`, `horse-cloud`, `horse-dorito`, `horse-tatertot` | 4:5 | Meet the herd | Portrait of each horse, ears up |
| `team-ellie`, `team-lina`, `team-merideth`, `team-victoria`, `team-april`, `team-jim` | 1:1 | Our Farm → team | Head-and-shoulders, outdoors, natural light |
| `banner` | 21:9 | Homepage camp banner | Wide sunset or field shot |
| `page-lessons`, `page-boarding`, `page-camp`, `page-about`, `page-contact` | 16:9 | Top of each page | Wide, atmospheric shots |

Photo tips: landscape shots for wide slots, the subject roughly centered (the cropper looks for the most interesting area), the largest originals you have, and JPG/PNG/WebP/TIFF. iPhone HEIC files need exporting to JPG first.

To change the look of every photo at once, edit the `grade` settings at the top of `tools/photos.mjs` (warmth, saturation, matte, vignette, grain).

## Project structure

```
src/pages/        page content (edit these)
src/partials/     shared head, header, footer and icons
assets/css/       styles.css (source) → styles.min.css (built)
assets/js/        main.js (source) → main.min.js (built)
assets/fonts/     self-hosted Fraunces + Instrument Sans (latin)
assets/photos/    generated responsive images (don't edit by hand)
assets/img/       favicons and the social share image
photos/           slots.json + original/ (your source photos)
tools/            build, photo pipeline, placeholder art, link checker
docs/             design research and the owner content checklist
```

## Deploying

- **GitHub Pages:** Settings → Pages → deploy from the `main` branch, root folder. `.nojekyll` is included. Point the `horseandhive.com` DNS at GitHub Pages and add a `CNAME` file containing `horseandhive.com`.
- **Netlify / Cloudflare Pages:** no build command needed (the built files are committed); publish directory is the repository root.

The contact form opens the visitor's email app with a ready-to-send message to `hhfarm2012@gmail.com`, so it needs no server. To collect submissions in an inbox instead, swap in a form service such as Netlify Forms or Formspree.

## Before launch

Read [`docs/CONTENT-CHECKLIST.md`](docs/CONTENT-CHECKLIST.md). It lists every price, date, name and claim taken from the current site that the owner should confirm.

## Credits

Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) and [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans) (SIL Open Font License). Illustrations, icons and logo mark are original to this project.
