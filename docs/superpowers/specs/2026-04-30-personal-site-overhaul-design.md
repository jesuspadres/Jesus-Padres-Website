# Personal Site Overhaul — Design

**Date:** 2026-04-30
**Owner:** Jesus Padres
**Repo:** `JesusPadres-Website`

## Goal

Repaint the personal/resume site (jesuspadres.com) so it visually aligns with the Solvr Labs business brand, reads as recruiter-friendly for SWE / STE / FDE roles, and adds a live Projects section that surfaces public GitHub repos in addition to the hand-curated featured projects already in `resume-data.json`.

The site stays a single-page vanilla HTML/CSS/JS app with no framework. Content continues to be data-driven from `resume-data.json`. This is a visual + structural refresh, not a rewrite.

## Audience & Voice

- **Primary audience:** recruiters and hiring managers evaluating Jesus for SWE, STE, and FDE roles.
- **Secondary audience:** prospective Solvr Labs clients who land here via the founder's profile.
- **Voice:** plain, confident, anti-jargon. First-person where it appears. Mirrors the Solvr Labs site's anti-hype tone.

## Visual System

Replace the current dark/neon/brutalist styling (`#0a0a0a` background, `#00ff88` accent, `Space Mono` + `Syne`, grid overlay, liquid-glass effect) with a light-mode system aligned to Solvr Labs.

| Token | Value |
|---|---|
| Font (single family) | `DM Sans` (system-ui fallback) |
| Background | `#ffffff` |
| Surface (cards) | `#ffffff` with `border: 1px solid #f3f4f6` |
| Section wash | `linear-gradient(to bottom, rgba(225,235,255,0.5), #ffffff, rgba(225,235,255,0.3))` |
| Brand 50 / 100 / 600 / 700 / 950 | `#f0f5ff` / `#e1ebff` / `#4664d6` / `#3a53bd` / `#1d264e` |
| Neutral text | `#1d1e20` (headings), `#4b5563` (body), `#6b7280` (muted) |
| Border | `#f3f4f6` (cards), `#e5e7eb` (dividers) |
| Card radius | `rounded-2xl` (16px) |
| Button radius | `rounded-full` (pill) |
| Card shadow (rest) | `0 1px 2px rgba(0,0,0,0.04)` |
| Card shadow (hover) | `0 20px 40px -12px rgba(70,100,214,0.15)` + `translateY(-4px)` |
| Pill chip | `bg-brand-50` + `border: 1px solid #e1ebff` + `color: #3a53bd` |
| Ambient | Two large blurred brand-color blobs (~500px, `blur(120px)`, `opacity 0.2`) behind hero and contact sections |

**Motion:** restrained `IntersectionObserver` reveal — `translateY(20px) → 0`, `opacity 0 → 1`, 700ms ease-out, staggered 100ms between siblings. Hover lifts on cards. No marquee, no parallax, no liquid-glass.

**Removed:** `Liquid-glass.css`, `LiquidGlass.js`, `Space Mono`, `Syne`, dark theme, grid overlay, `::after` ambient glow with neon hues, neon `::selection`.

## Page Structure

Single-page scroll. Same section order as today, redesigned.

1. **Sticky nav.** White, `backdrop-blur-md`, hairline bottom border. Left: "JP" mark. Center/right: anchor links (About, Experience, Skills, Projects, Contact). Far right: pill button "Resume PDF" (downloads `Jesus-Padres-Resume.pdf`).
2. **Hero (split).**
   - **Left column:** `Software Engineer & Founder`, name `Jesus Padres`, two-line bio ("3+ years shipping production SaaS at Qualtrics. Now building AI tools for service businesses at Solvr Labs."), location pill (📍 Tucson, AZ · EN/ES), two CTAs (primary `View work`, secondary `Email me`).
   - **Right column:** mock browser frame (red/yellow/green chrome dots + URL bar showing `taskline.solvrlabs.com`) containing a TaskLine product screenshot or styled placeholder. Subtle 3D tilt on hover.
   - **Background:** two blurred brand-color blobs.
3. **Stats strip.** Four metrics in a row: `3+ Years`, `95% Test Efficiency`, `2 Products Shipped`, `Bilingual EN/ES`. Each is a centered stat in a pill-bordered box.
4. **About.** Two paragraphs of plain prose. Headshot floats right at desktop, top at mobile. No buzzwords.
5. **Experience.** Vertical timeline. Each entry is a `rounded-2xl` card with: company logo dot + role + company + date on top, 1-line summary, 3 bullet highlights. Click to expand inline (replaces current modal flow); the existing detail content from `resume-data.json` stays.
6. **Skills.** Six category cards in a 3×2 (desktop) / 1-col (mobile) grid. Each card: category name + tag chips for `tags`. **Drop the proficiency percentages and bars** — recruiters discount them and they add visual noise.
7. **Projects.**
   - **Featured (hand-curated).** Large cards rendered from every entry in `resume-data.json` `projects` array (currently: Test Automation Framework, TaskLine, MealMaster, Solvr Labs). Each: screenshot or styled icon-block, title, tag, summary, tech-stack chips, "Visit →" link (hidden if `link` is empty). Same data structure as today.
   - **More on GitHub (auto-loaded).** Below the featured cards, a smaller-card grid auto-populated from `https://api.github.com/users/jesuspadres/repos?per_page=100&sort=updated`. Each card: repo name, primary language with color dot, description, star count, last-updated relative time, "View →" link. Loads client-side after page render. Cached in `localStorage` for 24 hours under key `gh:jesuspadres:repos:v1`. Loading state = skeleton cards. Error state = inline message + link to github.com/jesuspadres.
8. **Education.** Compact card: UofA, BS CS, 3.7 GPA, Tucson, certifications, key coursework as chips.
9. **Contact.** Centered block on a section wash. Email button (mailto), LinkedIn pill, GitHub pill, phone (optional, behind a "Show contact" toggle to limit scraping). Closing line: "Open to SWE / STE / FDE roles. Currently in Tucson, AZ."
10. **Footer.** "© 2026 Jesus Padres" + small links to Solvr Labs, GitHub, LinkedIn.

## Projects: GitHub Integration Detail

**Endpoint:** `GET https://api.github.com/users/jesuspadres/repos?per_page=100&sort=updated&type=owner`

**Filtering rules (client-side):**
- Drop repos where `fork === true`.
- Drop repos whose name appears in a hardcoded `HIDDEN_REPOS = ['rep1']` array (extendable).
- Drop repos whose name matches any featured project's GitHub link (avoid duplicates between featured and grid).
- Sort by `pushed_at` descending.
- Cap display at 12 cards initially, with a "Show all" button to reveal the rest.

**Cache:** `localStorage` key `gh:jesuspadres:repos:v1`, value `{ fetchedAt: number, data: Repo[] }`. TTL 24h. On expired or missing cache, fetch fresh; on fetch failure, fall back to expired cache if available.

**Rate limit:** unauthenticated GitHub API allows 60 requests/hr/IP. With 24h cache this is a non-issue for solo traffic. No token required, no serverless function, no build step.

**Language color dots:** small map of common languages → hex (e.g., TypeScript `#3178c6`, JavaScript `#f1e05a`, Python `#3572A5`, Java `#b07219`, Swift `#F05138`, HTML `#e34c26`, CSS `#563d7c`). Unknown languages get a neutral gray dot.

## Files to Touch

| File | Change |
|---|---|
| `index.html` | Update fonts (drop Space Mono + Syne, add DM Sans), drop `liquid-glass.css` and `liquid-glass.js` script tags, keep modal container (used by experience expand) |
| `styles.css` | Full rewrite to the new visual system. Keep selectors stable so `app.js` doesn't break. |
| `Liquid-glass.css` | Delete |
| `LiquidGlass.js` | Delete |
| `app.js` | Update render functions for new section structures (skills without bars, projects with featured + GitHub grid). Add GitHub fetcher + cache. Keep data-driven approach reading `resume-data.json`. |
| `resume-data.json` | Add `hiddenRepos: []` and (optionally) update featured projects with screenshot paths. Otherwise unchanged. |
| `Jesus-Padres-Resume.pdf` | Add (user supplies) for the nav download button. If absent, hide the button. |

## Out of Scope

- No framework migration (stays vanilla).
- No CMS / content backend.
- No analytics, no cookie banner.
- No blog.
- No internationalization (site stays English; `EN/ES` is just a credibility marker).
- No build step / bundler — site continues to be served as static files.

## Success Criteria

- Site is visually cohesive with solvrlabs.com (same fonts, palette, button style, card style).
- Above-the-fold reads as a recruiter-friendly engineer profile within 6 seconds.
- Projects section shows hand-curated featured projects plus an auto-loaded grid of public GitHub repos, with no build step required.
- All existing `resume-data.json` content renders correctly with the new layout.
- Lighthouse: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95 on mobile.
- Site is responsive at 320px / 768px / 1024px / 1440px breakpoints.
- No external runtime dependencies beyond Google Fonts (DM Sans) and the GitHub public API.
