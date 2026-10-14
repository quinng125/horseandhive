# Design research & rationale

What we looked at before redesigning horseandhive.com, what the best equestrian and award-winning sites do, and how each finding shaped this build.

## 1. The farm today

Horse & Hive Farm sits at 13220 Long Green Pike, Hydes, MD 21082, at the corner of Long Green Pike and Hydes Road, between Baltimore and Harford County. The current WordPress site covers a lot of real substance:

- Riding lessons (private, semi-private, group) for ages 5+, beginner to advanced, English and Western, six days a week
- An "Introduction to Horses" experience and a ground-only Companion program
- Boarding (field, bad-weather stall, special care, 24-hour stall, 12/12), currently full
- Summer camp (weeks, single days, half days, an advanced week, an adult day)
- Clinics, Paint & Ride, equine-assisted coaching consultations
- Honey and eggs from the farm's own bees and chickens, which is where the name comes from
- A herd of about 11 named lesson horses, and instructors with CHA credentials
- A 4.6-star average across 53 reviews, with warm testimonials

**Where the current site holds it back**

*(Based on the site's page structure, published content and its media library of about 320 images.)*

- Content is spread across 20+ thin WordPress pages: separate pages for each lesson type, multi-step registration pages, newsletters and past events. Key facts like prices, ages and what to wear live on different pages.
- Some information is stale (a 2024 fall camp, 2022 clinic dates, a "Summer Camp 27'" header) and some conflicts (two sets of lesson prices, two review counts), which undermines trust.
- The farm's most distinctive story, the bees behind the name, appears only in passing.
- The photo library is genuinely good (real horses, kids, arenas and sunsets) but inconsistent: mixed phone-camera color, crops and resolutions, plus stock and theme-demo images mixed in. The redesign uses only real farm photos and runs every one through the same grade.

## 2. What the best sites in this space do

**Award-winning sites (Awwwards, CSS Design Awards) in 2025–26**
- *Typography as the hero.* Oversized display serifs, often variable fonts like Fraunces, used as the main visual, with italic accents for warmth. ([Line25 — Web Design Trends 2026](https://line25.com/articles/web-design-trends-2026/), [Really Good Designs — 2026 trends](https://reallygooddesigns.com/web-design-trends-2026/))
- *Restrained, purposeful motion.* Scroll-triggered reveals and subtle parallax that "feel inevitable", never at the expense of load speed or Core Web Vitals. ([Line25](https://line25.com/articles/web-design-trends-2026/), [Bellaworks — 2026 trends](https://bellaworksweb.com/website-design-trends-2026/))
- *Bento grids and editorial layouts.* Mixed-size cards that let one feature lead while others support it. ([Studio Meyer — Webdesign Trends 2026](https://studiomeyer.io/en/blog/webdesign-trends-2026))
- Equine work recognized on Awwwards includes **Ghost Horses** (Site of the Day) plus honorable mentions for **Medallion Equine**, **Preakness 145** and **Ranch Barba Tone**. Common threads: full-bleed cinematic photography, dark/earthy palettes, generous whitespace and a few confident typographic moments. ([Awwwards — "horse" search](https://www.awwwards.com/inspiration_search/horse/))

**Equestrian specialists and riding-school templates**
- *Photos sell the experience.* Most riding-lesson inquiries come from local search on a phone, so mobile-first layout and clear local signals matter. Showing pricing and credentials up front builds trust before the first visit. ([LowCode Agency — equestrian website redesign](https://www.lowcode.agency/blog/equestrian-website-redesign))
- *Answer the parent's first questions.* Which lesson fits? When does it run? What does it cost? What happens on the first ride? The best lesson-barn templates (for example Framer's "Canter") put a three-step "first lesson" path and a short request form front and center. ([Framer — Canter template](https://www.framer.com/marketplace/templates/canter/))
- Specialist agencies emphasize brand storytelling, i.e. why *this* barn, alongside the practical facts. ([Alice Rose & Co](https://aliceroseandco.co.uk/equestrian-website-design/), [Equiluxe Marketing](https://equiluxemarketing.com/equine-horse-website-design/))

## 3. How the redesign applies it

| Finding | What we built |
| --- | --- |
| Typography as hero | Fraunces variable serif (with its soft, "wonky" italic axes) for display type; Instrument Sans for body; honey-colored italic accents carry the brand voice |
| A memorable brand idea | "Horse & Hive" became a visual system: honeycomb patterns, hexagon bullets, badges and image masks, a horseshoe-in-hexagon mark, and a dedicated honey section with floating bees |
| Photos sell the experience | Full-bleed hero and image-led cards, plus a pipeline that gives every farm photo the same warm, cohesive grade |
| One clear next step | "Book your first lesson" in the header, hero, steps, footer and a sticky mobile bar; enquiry links pre-select the right topic |
| Answer parents' questions | A three-step first-ride path, visible pricing on every program, what to wear, and FAQs on every page |
| Consolidate thin pages | Twenty-plus WordPress pages became six focused pages with anchored sections |
| Trust signals | 4.6★ / 53 reviews, real testimonials, CHA credentials, named horses and instructors |
| Restrained motion | Staggered headline reveal, scroll reveals, gentle parallax and a slow marquee, all disabled for visitors who prefer reduced motion |
| Speed & accessibility | No framework, self-hosted Latin-subset fonts, AVIF/WebP responsive images, minified assets; in local Lighthouse runs (simulated mobile), 89–91 performance and 100 accessibility, best practices and SEO |
| Local SEO | LocalBusiness structured data, descriptive titles and meta descriptions, a sitemap, social cards, and pages that answer local queries ("riding lessons Hydes MD") |

## 4. Photography direction

The pipeline (`tools/photos.mjs`) applies one "house grade" so photos taken on different phones in different seasons look like one shoot:

- **Crop:** attention-based smart crop to each layout's fixed shape, so nothing gets awkwardly cut and nothing shifts while the page loads
- **Tone:** auto-levels, a gentle warm shift in the highlights, slightly lowered saturation (calm, modern, editorial) and lifted blacks for a soft film-like matte
- **Finish:** a light sharpen at each output size, a subtle vignette, and a whisper of grain
- **Hygiene:** auto-rotation, sRGB, and stripped metadata, which removes GPS location from phone photos

For new photography, shoot in the golden hour (first and last hour of sun), with backlit manes and dust in the light. Get eye-level portraits of each horse with ears forward, candid moments of kids with horses, and wide, tidy shots of each arena. Keep horizons level and leave space around the subject for cropping.
