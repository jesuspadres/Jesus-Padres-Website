# Personal Site Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repaint the static personal/resume site to match the Solvr Labs brand and add an auto-loaded GitHub repos grid below the hand-curated featured projects.

**Architecture:** Static site (vanilla HTML/CSS/JS, no build step, no framework). The site loads `resume-data.json` via `fetch()` and renders sections from JS template strings into `#app`. The overhaul rewrites `styles.css` against a new design-token system, replaces hero markup, removes the liquid-glass layer, simplifies skills/experience to inline cards instead of modals, and adds a new `loadGitHubRepos()` function with `localStorage` cache.

**Tech Stack:** HTML5, CSS3 (custom properties + grid + flexbox), vanilla JavaScript (ES2017+ async/await, IntersectionObserver, fetch, localStorage), Google Fonts (DM Sans), GitHub public REST API v3.

**Verification model:** No test framework exists. Each task ends with manual browser verification at `http://localhost:8000` (using `python -m http.server 8000`) plus a checklist of what to look for. Frequent commits after each task.

**XSS note:** This site uses `el.innerHTML = ...` template-string rendering (carried over from the existing pattern). All interpolated values pass through `escapeHtml()`, defined in Task 7. The only inputs are static `resume-data.json` (author-controlled) and the GitHub API (which returns repo metadata; names, descriptions, languages are escaped on the way in). No user-typed input is ever rendered. If you later add a contact form or any user input, switch the rendering for that surface to `textContent` or DOMPurify.

**Reference spec:** [`docs/superpowers/specs/2026-04-30-personal-site-overhaul-design.md`](../specs/2026-04-30-personal-site-overhaul-design.md)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Modify | Update `<head>`: swap fonts, drop liquid-glass CSS+JS tags |
| `styles.css` | Rewrite | Full new visual system aligned to Solvr Labs |
| `app.js` | Modify | Update `renderHero`, `renderSkills`, `renderExperience`, `renderProjects`, `renderContact`, `renderEducation`; add `loadGitHubRepos`, `renderGitHubGrid`, helper utils. Remove liquid-glass init call. |
| `resume-data.json` | Modify | Add top-level `github` config block (`username`, `hiddenRepos`, `displayLimit`). No schema changes elsewhere. |
| `Liquid-glass.css` | Delete | No longer needed |
| `LiquidGlass.js` | Delete | No longer needed |

---

## Task 1: Set up local dev server and snapshot baseline

**Files:**
- Create: `.gitignore` entry for `.superpowers/` (if not already)

- [ ] **Step 1: Verify Python is available for local serving**

Run: `python --version`
Expected: Python 3.x output. If not, install or use any other static server (e.g. `npx serve`).

- [ ] **Step 2: Start the local server in the project root**

Run from `c:/Users/jezzi/OneDrive/Documents/JesusPadres-Website`:
```bash
python -m http.server 8000
```
Leave it running in a separate terminal. Open `http://localhost:8000` in a browser. Confirm the current dark-themed site loads with hero, experience, skills, projects, education, contact.

- [ ] **Step 3: Verify `.superpowers/` is gitignored**

Read `.gitignore`. If `.superpowers/` is not listed, append it:
```
.superpowers/
```

- [ ] **Step 4: Commit baseline state if anything changed**

```bash
git add .gitignore
git commit -m "chore: gitignore .superpowers brainstorm dir"
```

If nothing changed, skip the commit.

---

## Task 2: Update `index.html` head — fonts and remove liquid-glass

**Files:**
- Modify: `index.html` (entire `<head>` section, plus body script tags)

- [ ] **Step 1: Replace the font preconnect + link**

In `index.html`, find lines 16-18:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
```

Replace with:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Remove the liquid-glass stylesheet link**

Find line 22:
```html
<link rel="stylesheet" href="liquid-glass.css">
```
Delete that line.

- [ ] **Step 3: Remove the liquid-glass script tag**

Find lines 40-41:
```html
<!-- Liquid Glass Effects -->
<script src="liquid-glass.js"></script>
```
Delete both lines.

- [ ] **Step 4: Add a meta description for SEO**

Below the `<title>` tag, add:
```html
<meta name="description" content="Jesus Padres - Software Engineer and Founder. Building production SaaS, test automation, and AI tools. Open to SWE / STE / FDE roles.">
<meta name="theme-color" content="#4664d6">
```

- [ ] **Step 5: Reload the browser**

Refresh `http://localhost:8000`. The site will look broken (dark styles still apply but Space Mono is gone). That is expected - Task 4 fixes it.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "chore: swap fonts to DM Sans, drop liquid-glass refs"
```

---

## Task 3: Delete liquid-glass files

**Files:**
- Delete: `Liquid-glass.css`
- Delete: `LiquidGlass.js`

- [ ] **Step 1: Delete both files**

```bash
rm "Liquid-glass.css" "LiquidGlass.js"
```

- [ ] **Step 2: Verify no other file references them**

```bash
grep -rn "liquid-glass\|LiquidGlass\|initLiquidGlass" --include="*.js" --include="*.html" --include="*.css" .
```
Expected: only matches inside `app.js` line 61-63 (the `initLiquidGlass` guard call). Task 6 removes that call by replacing `renderApp()`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete liquid-glass css and js"
```

---

## Task 4: Rewrite `styles.css` - design tokens and base layer

**Files:**
- Rewrite: `styles.css` (this task replaces the entire file with the new base layer; later tasks add component blocks on top)

- [ ] **Step 1: Replace the entire contents of `styles.css` with the new base**

Overwrite `styles.css` with:

```css
/* =========================================================
   Jesus Padres - design tokens
   Aligned with solvrlabs.com (light mode, DM Sans, brand blue)
   ========================================================= */
:root {
  /* Brand */
  --brand-50:  #f0f5ff;
  --brand-100: #e1ebff;
  --brand-200: #c8d8fe;
  --brand-300: #a3bffc;
  --brand-400: #7da0f8;
  --brand-500: #5a7de6;
  --brand-600: #4664d6;
  --brand-700: #3a53bd;
  --brand-800: #33469a;
  --brand-900: #2c3a7c;
  --brand-950: #1d264e;

  /* Neutrals */
  --bg:          #ffffff;
  --surface:     #ffffff;
  --section-alt: #fafbff;
  --text:        #1d1e20;
  --text-body:   #4b5563;
  --text-muted:  #6b7280;
  --border:      #f3f4f6;
  --border-mid:  #e5e7eb;

  /* Type */
  --font:    'DM Sans', system-ui, -apple-system, sans-serif;
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Radii */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-sm:    0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:    0 4px 12px rgba(0,0,0,0.06);
  --shadow-lift:  0 20px 40px -12px rgba(70,100,214,0.18);

  /* Layout */
  --max-width: 1180px;
  --gutter: clamp(20px, 4vw, 40px);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

::selection { background: var(--brand-100); color: var(--brand-900); }

html { scroll-behavior: smooth; }

body {
  font-family: var(--font);
  font-weight: var(--weight-normal);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

body.modal-open { overflow: hidden; }

/* Ambient brand blobs */
body::before,
body::after {
  content: '';
  position: fixed;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.18;
  pointer-events: none;
  z-index: 0;
}
body::before {
  top: -200px;
  left: -200px;
  background: var(--brand-400);
}
body::after {
  bottom: -200px;
  right: -200px;
  background: var(--brand-300);
}

#app { position: relative; z-index: 1; }
#app.loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

/* Headings */
h1, h2, h3, h4 {
  color: var(--text);
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
  line-height: 1.15;
}
h1 { font-size: clamp(2.25rem, 5vw, 3.75rem); }
h2 { font-size: clamp(1.75rem, 3.5vw, 2.5rem); }
h3 { font-size: clamp(1.125rem, 2vw, 1.375rem); }

p { color: var(--text-body); }

a { color: inherit; text-decoration: none; }

/* Section scaffolding */
section {
  padding: clamp(64px, 8vw, 120px) var(--gutter);
  position: relative;
}
.section-inner {
  max-width: var(--max-width);
  margin: 0 auto;
}
.section-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 48px;
}
.section-eyebrow {
  font-size: 0.75rem;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brand-600);
}
.section-title { margin-bottom: 4px; }
.section-subtitle {
  color: var(--text-muted);
  font-size: 1rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semibold);
  font-size: 0.95rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn-primary {
  background: var(--brand-600);
  color: white;
  box-shadow: 0 4px 12px rgba(70,100,214,0.25);
}
.btn-primary:hover {
  background: var(--brand-700);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(70,100,214,0.32);
}
.btn-secondary {
  background: white;
  color: var(--text);
  border-color: var(--border-mid);
}
.btn-secondary:hover {
  border-color: var(--brand-300);
  color: var(--brand-700);
}

/* Pill chips */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background: var(--brand-50);
  color: var(--brand-800);
  border: 1px solid var(--brand-100);
  font-size: 0.8rem;
  font-weight: var(--weight-medium);
}
.chip-neutral {
  background: var(--bg);
  color: var(--text-body);
  border-color: var(--border-mid);
}

/* Reveal animation */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s ease-out, transform 0.7s ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-delay-1 { transition-delay: 100ms; }
.reveal-delay-2 { transition-delay: 200ms; }
.reveal-delay-3 { transition-delay: 300ms; }
.reveal-delay-4 { transition-delay: 400ms; }

/* Custom scrollbar */
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb {
  background: var(--brand-200);
  border-radius: 99px;
}
::-webkit-scrollbar-thumb:hover { background: var(--brand-400); }
```

- [ ] **Step 2: Reload the browser**

Refresh `http://localhost:8000`. The page will look stripped - no nav, no hero styling, just default-flow text on white. Layout is broken because the old class names no longer have rules. That's correct for this task; Task 5 adds component CSS.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat(styles): introduce DM Sans + brand blue design token base"
```

---

## Task 5: Add component CSS - nav, hero, sections, cards

**Files:**
- Modify: `styles.css` (append component blocks)

- [ ] **Step 1: Append the component CSS to `styles.css`**

Add to the end of `styles.css`:

```css
/* =========================================================
   Nav
   ========================================================= */
nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.nav-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 14px var(--gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.nav-logo {
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
  color: var(--text);
  cursor: pointer;
  font-size: 1.1rem;
}
.nav-links {
  list-style: none;
  display: flex;
  gap: 28px;
}
.nav-links a {
  color: var(--text-body);
  font-size: 0.92rem;
  font-weight: var(--weight-medium);
  transition: color 0.15s;
}
.nav-links a:hover { color: var(--brand-600); }
.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  background: var(--brand-600);
  color: white;
  font-size: 0.85rem;
  font-weight: var(--weight-semibold);
}
.nav-cta:hover { background: var(--brand-700); color: white; }

@media (max-width: 720px) {
  .nav-links { display: none; }
}

/* =========================================================
   Hero - split layout
   ========================================================= */
.hero {
  padding-top: clamp(48px, 7vw, 96px);
  padding-bottom: clamp(48px, 7vw, 96px);
}
.hero-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
}
@media (max-width: 880px) {
  .hero-inner { grid-template-columns: 1fr; }
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  color: var(--brand-700);
  font-size: 0.8rem;
  font-weight: var(--weight-semibold);
  margin-bottom: 20px;
}
.hero-eyebrow .pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-500);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.4); }
}

.hero-content h1 {
  margin-bottom: 18px;
}
.hero-content h1 .accent { color: var(--brand-600); }

.hero-bio {
  font-size: 1.1rem;
  color: var(--text-body);
  margin-bottom: 24px;
  max-width: 520px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
}

.hero-cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* Hero visual: mock browser frame */
.hero-visual {
  position: relative;
}
.mock-browser {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lift);
  overflow: hidden;
  transform-style: preserve-3d;
  transition: transform 0.35s ease;
}
.mock-browser:hover {
  transform: perspective(1200px) rotateY(-3deg) rotateX(2deg);
}
.mock-browser-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #f7f8fa;
  border-bottom: 1px solid var(--border);
}
.mock-browser-bar .dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.mock-browser-bar .dot.r { background: #ff5f57; }
.mock-browser-bar .dot.y { background: #febc2e; }
.mock-browser-bar .dot.g { background: #28c840; }
.mock-browser-url {
  flex: 1;
  margin-left: 8px;
  padding: 5px 12px;
  background: white;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
  text-align: center;
}
.mock-browser-body {
  aspect-ratio: 16/10;
  background: linear-gradient(135deg, var(--brand-50), white);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.mock-browser-body img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mock-browser-fallback {
  text-align: center;
  padding: 32px;
}
.mock-browser-fallback h4 {
  font-size: 1.4rem;
  color: var(--brand-700);
  margin-bottom: 8px;
}
.mock-browser-fallback p { color: var(--text-muted); }

/* =========================================================
   Stats strip
   ========================================================= */
.stats-strip {
  background: var(--section-alt);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 32px var(--gutter);
}
.stats-strip-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
@media (max-width: 720px) {
  .stats-strip-inner { grid-template-columns: repeat(2, 1fr); }
}
.stat {
  text-align: center;
}
.stat-value {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: var(--weight-bold);
  color: var(--brand-600);
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 0.78rem;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 4px;
}

/* =========================================================
   About section
   ========================================================= */
.about-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  align-items: center;
}
@media (max-width: 720px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .about-grid img { max-width: 200px; margin: 0 auto; }
}
.about-prose p {
  font-size: 1.05rem;
  margin-bottom: 16px;
}
.about-photo {
  width: 100%;
  border-radius: var(--radius-xl);
  aspect-ratio: 1;
  object-fit: cover;
  border: 1px solid var(--border);
}

/* =========================================================
   Cards (shared)
   ========================================================= */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lift);
  border-color: var(--brand-100);
}
.card.is-clickable { cursor: pointer; }

/* =========================================================
   Experience timeline
   ========================================================= */
.exp-grid {
  display: grid;
  gap: 16px;
}
.exp-card {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 24px;
  align-items: start;
}
@media (max-width: 720px) {
  .exp-card {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
.exp-date {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: var(--weight-medium);
}
.exp-title {
  font-size: 1.2rem;
  margin-bottom: 4px;
}
.exp-company {
  color: var(--brand-600);
  font-weight: var(--weight-semibold);
  margin-bottom: 8px;
}
.exp-summary {
  color: var(--text-body);
  margin-bottom: 12px;
}
.exp-highlights {
  list-style: none;
  display: grid;
  gap: 6px;
}
.exp-highlights li {
  position: relative;
  padding-left: 20px;
  color: var(--text-body);
  font-size: 0.95rem;
}
.exp-highlights li::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-400);
}
.exp-type-badge {
  align-self: start;
  font-size: 0.72rem;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand-700);
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}

/* =========================================================
   Skills
   ========================================================= */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 880px) {
  .skills-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .skills-grid { grid-template-columns: 1fr; }
}
.skill-card h3 { margin-bottom: 12px; font-size: 1rem; }
.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* =========================================================
   Projects (featured)
   ========================================================= */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
@media (max-width: 720px) {
  .projects-grid { grid-template-columns: 1fr; }
}
.project-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.project-tag {
  align-self: flex-start;
  font-size: 0.72rem;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--brand-700);
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}
.project-title { font-size: 1.4rem; }
.project-summary { color: var(--text-body); }
.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.project-tech .chip { font-size: 0.75rem; }
.project-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--brand-700);
  font-weight: var(--weight-semibold);
  font-size: 0.9rem;
  margin-top: 4px;
}
.project-link:hover { color: var(--brand-800); }
.project-link svg { width: 14px; height: 14px; }

/* =========================================================
   GitHub auto-grid
   ========================================================= */
.gh-section {
  margin-top: 64px;
}
.gh-section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 20px;
  gap: 16px;
}
.gh-section-header h3 {
  font-size: 1.25rem;
}
.gh-section-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.gh-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 880px) {
  .gh-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .gh-grid { grid-template-columns: 1fr; }
}
.gh-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.gh-card:hover {
  border-color: var(--brand-200);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.gh-card-name {
  font-weight: var(--weight-semibold);
  color: var(--brand-700);
  font-size: 0.95rem;
}
.gh-card-desc {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-body);
  line-height: 1.5;
}
.gh-card-meta {
  display: flex;
  gap: 14px;
  font-size: 0.78rem;
  color: var(--text-muted);
  align-items: center;
}
.gh-lang-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}
.gh-skeleton {
  height: 130px;
  background: linear-gradient(90deg, var(--border) 0%, #fafafa 50%, var(--border) 100%);
  background-size: 200% 100%;
  border-radius: var(--radius-md);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.gh-error {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
}
.gh-error a { color: var(--brand-600); font-weight: var(--weight-semibold); }
.gh-show-all {
  display: block;
  margin: 24px auto 0;
}

/* =========================================================
   Education
   ========================================================= */
.edu-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: center;
}
@media (max-width: 560px) {
  .edu-card { grid-template-columns: 1fr; }
}
.edu-school { font-size: 1.3rem; margin-bottom: 4px; }
.edu-degree { color: var(--text-body); margin-bottom: 8px; }
.edu-meta { color: var(--text-muted); font-size: 0.9rem; }
.edu-stat-block {
  display: flex;
  gap: 24px;
}
.edu-stat .stat-value { font-size: 1.6rem; }

/* =========================================================
   Contact
   ========================================================= */
#contact {
  background: linear-gradient(180deg, var(--bg), var(--brand-50));
  text-align: center;
}
.contact-inner {
  max-width: 720px;
  margin: 0 auto;
}
.contact-inner h2 { margin-bottom: 12px; }
.contact-inner > p {
  color: var(--text-body);
  font-size: 1.05rem;
  margin-bottom: 32px;
}
.contact-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}
.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: white;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-pill);
  color: var(--text);
  font-weight: var(--weight-medium);
  font-size: 0.9rem;
  transition: border-color 0.2s, color 0.2s, transform 0.2s;
}
.contact-link:hover {
  border-color: var(--brand-300);
  color: var(--brand-700);
  transform: translateY(-1px);
}
.contact-link svg { width: 16px; height: 16px; }
.contact-footer-note {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* =========================================================
   Footer
   ========================================================= */
footer {
  padding: 32px var(--gutter);
  border-top: 1px solid var(--border);
  background: white;
}
.footer-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.footer-inner a:hover { color: var(--brand-600); }

/* =========================================================
   Modal (kept for any inline detail expansion)
   ========================================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-overlay.active { display: flex; }
.modal {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 640px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
  box-shadow: var(--shadow-lift);
}
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--border);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1;
}
.modal-close:hover { background: var(--brand-100); color: var(--brand-700); }
```

- [ ] **Step 2: Reload the browser**

Refresh `http://localhost:8000`. The page is still broken because `app.js` emits old class names (`hero-content`, `hero-stats`, `exp-item`, `skill-block`, `project-card`, `edu-card`, etc.). Some sections will show partially. That's fine - the next tasks update `app.js`.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat(styles): add component CSS (nav, hero, cards, gh grid, modal)"
```

---

## Task 6: Update `app.js` - nav, hero, and remove liquid-glass init

**Files:**
- Modify: `app.js` lines 26-64 (renderApp, init), lines 66-112 (renderHero)

- [ ] **Step 1: Replace `renderApp()` (lines 26-64)**

Replace the function body with:

```js
function renderApp() {
  const app = document.getElementById('app');
  app.className = '';
  app.innerHTML = `
    <nav>
      <div class="nav-inner">
        <div class="nav-logo" onclick="scrollToTop()">${escapeHtml(resumeData.personal.shortName)}</div>
        <ul class="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#experience">Experience</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <a href="${resumeData.personal.resumePdf || '#contact'}" class="nav-cta" ${resumeData.personal.resumePdf ? 'download' : ''}>
          ${resumeData.personal.resumePdf ? 'Resume PDF' : 'Get in Touch'}
        </a>
      </div>
    </nav>

    ${renderHero()}
    ${renderStatsStrip()}
    ${renderAbout()}
    ${renderExperience()}
    ${renderSkills()}
    ${renderProjects()}
    ${renderEducation()}
    ${renderContact()}

    <footer>
      <div class="footer-inner">
        <p>© ${new Date().getFullYear()} ${escapeHtml(resumeData.personal.name)}</p>
        <p>
          <a href="${escapeHtml(resumeData.personal.github)}" target="_blank" rel="noopener">GitHub</a>
          &nbsp;·&nbsp;
          <a href="${escapeHtml(resumeData.personal.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
          &nbsp;·&nbsp;
          <a href="https://solvrlabs.com" target="_blank" rel="noopener">Solvr Labs</a>
        </p>
      </div>
    </footer>
  `;

  initAnimations();
  loadGitHubRepos();
}
```

- [ ] **Step 2: Replace `renderHero()` (lines 66-112)**

```js
function renderHero() {
  const { personal } = resumeData;
  const featured = (resumeData.projects || []).find(p => p.id === 'taskline') || resumeData.projects?.[0];
  const featuredUrl = featured?.link || '';
  const featuredTitle = featured?.title || 'Project';
  const heroImage = personal.heroImage || (featured?.screenshot ?? '');

  let displayUrl = 'taskline.solvrlabs.com';
  if (featuredUrl) {
    try { displayUrl = new URL(featuredUrl).host; } catch { /* keep default */ }
  }

  const taglineHtml = escapeHtml(personal.tagline).replace(
    /(digital experiences|production software|software|AI tools)/i,
    '<span class="accent">$1</span>'
  );

  return `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content">
          <span class="hero-eyebrow"><span class="pulse-dot"></span> ${escapeHtml(personal.title)}</span>
          <h1>${taglineHtml}</h1>
          <p class="hero-bio">${escapeHtml(personal.bio)}</p>
          <div class="hero-meta">
            <span class="chip">📍 ${escapeHtml(personal.location)}</span>
            <span class="chip">${personal.languages.map(escapeHtml).join(' / ')}</span>
            <span class="chip">Open to SWE / STE / FDE</span>
          </div>
          <div class="hero-cta-group">
            <a href="#projects" class="btn btn-primary">View work</a>
            <a href="mailto:${escapeHtml(personal.email)}" class="btn btn-secondary">Email me</a>
          </div>
        </div>
        <div class="hero-visual reveal">
          <div class="mock-browser">
            <div class="mock-browser-bar">
              <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
              <span class="mock-browser-url">${escapeHtml(displayUrl)}</span>
            </div>
            <div class="mock-browser-body">
              ${heroImage
                ? `<img src="${escapeHtml(heroImage)}" alt="${escapeHtml(featuredTitle)} preview">`
                : `<div class="mock-browser-fallback">
                     <h4>${escapeHtml(featuredTitle)}</h4>
                     <p>${escapeHtml(featured?.summary || '')}</p>
                   </div>`}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
```

- [ ] **Step 3: Add `renderStatsStrip()` immediately after `renderHero()`**

```js
function renderStatsStrip() {
  const stats = resumeData.stats || [];
  if (stats.length === 0) return '';
  return `
    <section class="stats-strip">
      <div class="stats-strip-inner">
        ${stats.map(s => `
          <div class="stat">
            <div class="stat-value">${escapeHtml(s.value)}</div>
            <div class="stat-label">${escapeHtml(s.label)}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}
```

- [ ] **Step 4: Add `renderAbout()` after `renderStatsStrip()`**

```js
function renderAbout() {
  const { personal } = resumeData;
  const photo = personal.image
    ? `<img src="${escapeHtml(personal.image)}" alt="${escapeHtml(personal.name)}" class="about-photo">`
    : '';
  return `
    <section id="about">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-eyebrow">About</span>
        </div>
        <div class="about-grid">
          <div class="about-prose">
            <h2>${escapeHtml(personal.name)}</h2>
            <p>${escapeHtml(personal.bio)}</p>
            <p>I focus on shipping production software end-to-end - from test automation that catches regressions before customers do, to client-facing portals and AI-driven tooling for service businesses. Bilingual (EN/ES), based in Tucson, AZ.</p>
          </div>
          ${photo}
        </div>
      </div>
    </section>
  `;
}
```

- [ ] **Step 5: Sanity check the file**

Reload the browser. Expected:
- Nav with logo + 5 links + CTA pill button
- Hero with split layout (text left, mock browser right)
- Stats strip below hero
- Below stats: About section heading
- Other sections still appear with old (broken) class names - fixed in next tasks

Open DevTools console; there should be no `ReferenceError`. (Note: `escapeHtml` and `loadGitHubRepos` are referenced here but defined in Tasks 7 and 11 - if you reload between these tasks expect a console error until both are added. That's fine; advance to the next task.)

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat(app): rewrite renderApp/renderHero, add stats strip and about"
```

---

## Task 7: Add HTML-escape and time-formatting utilities

**Files:**
- Modify: `app.js` (add helpers near the top, after `let resumeData = null;`)

- [ ] **Step 1: Add the helper block right after line 2 (`let resumeData = null;`)**

```js
// ===== UTILITIES =====

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function relativeTime(isoDate) {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const mo = Math.floor(day / 30);
  const yr = Math.floor(day / 365);
  if (yr >= 1) return `${yr}y ago`;
  if (mo >= 1) return `${mo}mo ago`;
  if (day >= 1) return `${day}d ago`;
  if (hr >= 1) return `${hr}h ago`;
  if (min >= 1) return `${min}m ago`;
  return 'just now';
}

const LANGUAGE_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  Swift: '#F05138',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  C: '#555555',
  'C++': '#f34b7d'
};

function getLanguageColor(lang) {
  return LANGUAGE_COLORS[lang] || '#9ca3af';
}
```

- [ ] **Step 2: Reload the browser, open DevTools console**

There should be no `ReferenceError` for `escapeHtml`. Type `escapeHtml('<b>x</b>')` in the console - expect `'&lt;b&gt;x&lt;/b&gt;'`.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat(app): add escapeHtml, relativeTime, getLanguageColor utils"
```

---

## Task 8: Rewrite `renderExperience` to inline cards

**Files:**
- Modify: `app.js` `renderExperience()` (lines ~114-141 in the original)

- [ ] **Step 1: Replace `renderExperience()`**

```js
function renderExperience() {
  return `
    <section id="experience">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-eyebrow">Experience</span>
        </div>
        <div class="exp-grid">
          ${resumeData.experience.map((exp, i) => `
            <article class="card exp-card reveal reveal-delay-${(i % 4) + 1}">
              <div class="exp-date">${escapeHtml(exp.date)}</div>
              <div>
                <h3 class="exp-title">${escapeHtml(exp.title)}</h3>
                <div class="exp-company">${escapeHtml(exp.company)}</div>
                <p class="exp-summary">${escapeHtml(exp.summary)}</p>
                <ul class="exp-highlights">
                  ${exp.highlights.slice(0, 3).map(h => `<li>${escapeHtml(h)}</li>`).join('')}
                </ul>
              </div>
              <span class="exp-type-badge">${escapeHtml(exp.type)}</span>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
```

- [ ] **Step 2: Reload and verify**

Refresh `http://localhost:8000`. Scroll to Experience section. Expect:
- Three cards stacked vertically
- Each card: date on left, role + company + summary + 3 bullet highlights in middle, type badge on right
- Hover lifts the card slightly with brand-color shadow

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat(app): rewrite experience as inline timeline cards"
```

---

## Task 9: Rewrite `renderSkills` (drop proficiency bars)

**Files:**
- Modify: `app.js` `renderSkills()` (lines ~143-169)

- [ ] **Step 1: Replace `renderSkills()`**

```js
function renderSkills() {
  return `
    <section id="skills">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-eyebrow">Skills</span>
        </div>
        <div class="skills-grid">
          ${resumeData.skills.map((skill, i) => `
            <div class="card skill-card reveal reveal-delay-${(i % 4) + 1}">
              <h3>${escapeHtml(skill.name)}</h3>
              <div class="skill-tags">
                ${skill.tags.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
```

- [ ] **Step 2: Update `initAnimations()` (line ~520) - remove the skill-bar code**

Replace `initAnimations()` with the version below (the IntersectionObserver becomes a generic `.reveal` observer; the skill-bar logic is dropped):

```js
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
```

- [ ] **Step 3: Reload and verify**

Refresh. Scroll to Skills. Expect:
- 6 cards in a 3x2 grid (2-col on tablet, 1-col on mobile)
- Each card: category name + tag chips
- No proficiency bar, no percentages
- Hover lifts the card

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat(app): simplify skills (no bars), unify reveal observer"
```

---

## Task 10: Rewrite `renderProjects` - featured cards

**Files:**
- Modify: `app.js` `renderProjects()` (lines ~171-217)

- [ ] **Step 1: Replace `renderProjects()`**

```js
function renderProjects() {
  const ghUsername = resumeData.github?.username || 'jesuspadres';
  return `
    <section id="projects">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-eyebrow">Projects</span>
          <p class="section-subtitle">Selected work - click through for live products and code.</p>
        </div>
        <div class="projects-grid">
          ${resumeData.projects.map((proj, i) => `
            <article class="card project-card reveal reveal-delay-${(i % 4) + 1}">
              <span class="project-tag">${escapeHtml(proj.tag)}</span>
              <h3 class="project-title">${escapeHtml(proj.title)}</h3>
              <p class="project-summary">${escapeHtml(proj.summary)}</p>
              <div class="project-tech">
                ${proj.technologies.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('')}
              </div>
              ${proj.link ? `
                <a class="project-link" href="${escapeHtml(proj.link)}" target="_blank" rel="noopener noreferrer">
                  ${proj.link.includes('github.com') ? 'View code' : 'Visit live'} →
                </a>
              ` : ''}
            </article>
          `).join('')}
        </div>

        <div class="gh-section">
          <div class="gh-section-header">
            <div>
              <h3>More on GitHub</h3>
              <p>Auto-loaded from <a href="${escapeHtml(resumeData.personal.github)}" target="_blank" rel="noopener">github.com/${escapeHtml(ghUsername)}</a></p>
            </div>
          </div>
          <div id="gh-grid" class="gh-grid">
            ${Array(6).fill('<div class="gh-skeleton"></div>').join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}
```

- [ ] **Step 2: Reload and verify featured cards**

Refresh. Scroll to Projects. Expect:
- Featured projects in a 2-col grid (1-col on mobile)
- Below them, a "More on GitHub" subsection with 6 shimmering skeleton cards (placeholder for the API fetch added in Task 11)

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat(app): rewrite featured projects + add GH grid skeleton"
```

---

## Task 11: Add GitHub repos fetch + render

**Files:**
- Modify: `app.js` (add new functions, append at the bottom of the utilities section)
- Modify: `resume-data.json` (add `github` config block)

- [ ] **Step 1: Add `github` config to `resume-data.json`**

Open `resume-data.json`. Add a top-level `github` block right after the `personal` block (before `stats`):

```json
  "github": {
    "username": "jesuspadres",
    "hiddenRepos": ["rep1", "Jesus-Padres-Website"],
    "displayLimit": 12
  },
```

(Reason: hide the repo backing this very site, plus any throwaway named `rep1`. `displayLimit` controls how many cards show before "Show all".)

- [ ] **Step 2: Add `loadGitHubRepos` and supporting functions to `app.js`**

Append to the bottom of `app.js`, before the final `loadResumeData();` call (line ~561):

```js
// ===== GITHUB INTEGRATION =====

async function loadGitHubRepos() {
  const grid = document.getElementById('gh-grid');
  if (!grid) return;

  const cfg = resumeData.github || {};
  const username = cfg.username || 'jesuspadres';
  const hidden = new Set(cfg.hiddenRepos || []);
  const featuredLinks = new Set(
    (resumeData.projects || [])
      .map(p => p.link)
      .filter(l => l && l.includes('github.com'))
      .map(l => l.split('/').pop().toLowerCase())
  );
  const cacheKey = `gh:${username}:repos:v1`;
  const ttlMs = 24 * 60 * 60 * 1000;

  const fromCache = readGhCache(cacheKey, ttlMs);
  if (fromCache) {
    renderGitHubGrid(filterRepos(fromCache, hidden, featuredLinks), cfg.displayLimit || 12);
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`);
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const repos = await res.json();
    writeGhCache(cacheKey, repos);
    renderGitHubGrid(filterRepos(repos, hidden, featuredLinks), cfg.displayLimit || 12);
  } catch (err) {
    console.warn('GitHub fetch failed:', err);
    const stale = readGhCache(cacheKey, Infinity);
    if (stale) {
      renderGitHubGrid(filterRepos(stale, hidden, featuredLinks), cfg.displayLimit || 12);
      return;
    }
    grid.innerHTML = `
      <div class="gh-error" style="grid-column: 1 / -1;">
        Couldn't load repos right now.
        <a href="https://github.com/${escapeHtml(username)}" target="_blank" rel="noopener">View on GitHub →</a>
      </div>
    `;
  }
}

function readGhCache(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { fetchedAt, data } = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    if (Date.now() - fetchedAt > ttlMs) return null;
    return data;
  } catch {
    return null;
  }
}

function writeGhCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), data }));
  } catch {
    /* quota exceeded - ignore */
  }
}

function filterRepos(repos, hidden, featuredLinks) {
  return repos
    .filter(r => !r.fork)
    .filter(r => !hidden.has(r.name))
    .filter(r => !featuredLinks.has(r.name.toLowerCase()))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
}

function renderGitHubGrid(repos, displayLimit) {
  const grid = document.getElementById('gh-grid');
  if (!grid) return;

  if (repos.length === 0) {
    grid.innerHTML = `<div class="gh-error" style="grid-column: 1 / -1;">No public repos to show.</div>`;
    return;
  }

  const initial = repos.slice(0, displayLimit);
  grid.innerHTML = initial.map(repoCard).join('');

  if (repos.length > displayLimit) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary gh-show-all';
    btn.textContent = `Show all ${repos.length}`;
    btn.onclick = () => {
      grid.insertAdjacentHTML('beforeend', repos.slice(displayLimit).map(repoCard).join(''));
      btn.remove();
    };
    grid.parentElement.appendChild(btn);
  }
}

function repoCard(r) {
  const lang = r.language || '';
  return `
    <a class="gh-card" href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener">
      <div class="gh-card-name">${escapeHtml(r.name)}</div>
      <div class="gh-card-desc">${escapeHtml(r.description || 'No description.')}</div>
      <div class="gh-card-meta">
        ${lang ? `<span><span class="gh-lang-dot" style="background:${getLanguageColor(lang)}"></span>${escapeHtml(lang)}</span>` : ''}
        <span>★ ${Number(r.stargazers_count) || 0}</span>
        <span>${escapeHtml(relativeTime(r.pushed_at))}</span>
      </div>
    </a>
  `;
}
```

- [ ] **Step 3: Reload and verify**

Refresh `http://localhost:8000`. Scroll to "More on GitHub". Expect:
- Skeleton cards briefly, then real repo cards appear
- Each card: repo name, description, language dot + name, star count, last-pushed relative time
- Hover lifts card
- If you have more than 12 public repos (excluding hidden + featured), a "Show all N" button appears

DevTools → Application → Local Storage → `http://localhost:8000` should show key `gh:jesuspadres:repos:v1`.

- [ ] **Step 4: Test cache hit**

Refresh again. Cards should appear instantly (no skeleton flash). Network tab should show no request to `api.github.com`.

- [ ] **Step 5: Test error fallback**

In DevTools console:
```js
localStorage.removeItem('gh:jesuspadres:repos:v1');
```
Then DevTools → Network → set to "Offline". Reload. Expect the inline error message with a link to your GitHub.

Restore Online. Refresh once to repopulate cache.

- [ ] **Step 6: Commit**

```bash
git add app.js resume-data.json
git commit -m "feat(app): add GitHub repos auto-grid with localStorage cache"
```

---

## Task 12: Rewrite `renderEducation` and `renderContact`

**Files:**
- Modify: `app.js` `renderEducation()` (lines ~219-252) and `renderContact()` (lines ~254-306)

- [ ] **Step 1: Replace `renderEducation()`**

```js
function renderEducation() {
  const edu = resumeData.education;
  return `
    <section id="education">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-eyebrow">Education</span>
        </div>
        <article class="card edu-card reveal">
          <div>
            <h3 class="edu-school">${escapeHtml(edu.school)}</h3>
            <p class="edu-degree">${escapeHtml(edu.degree)}</p>
            <p class="edu-meta">${escapeHtml(edu.location)} · GPA ${escapeHtml(edu.gpa)}</p>
            <div class="skill-tags" style="margin-top:14px">
              ${edu.coursework.map(c => `<span class="chip chip-neutral">${escapeHtml(c)}</span>`).join('')}
            </div>
            ${edu.certifications?.length ? `
              <p style="margin-top:14px;color:var(--text-muted);font-size:0.9rem">
                Certifications: ${edu.certifications.map(escapeHtml).join(' · ')}
              </p>` : ''}
          </div>
          <div class="edu-stat-block">
            <div class="stat edu-stat">
              <div class="stat-value">${escapeHtml(edu.gpa)}</div>
              <div class="stat-label">GPA</div>
            </div>
            <div class="stat edu-stat">
              <div class="stat-value">B.S.</div>
              <div class="stat-label">CS</div>
            </div>
          </div>
        </article>
      </div>
    </section>
  `;
}
```

- [ ] **Step 2: Replace `renderContact()`**

```js
function renderContact() {
  const { personal } = resumeData;
  return `
    <section id="contact">
      <div class="section-inner contact-inner">
        <h2>Let's talk</h2>
        <p>Open to SWE / STE / FDE roles. Currently in ${escapeHtml(personal.location)}.</p>
        <div class="contact-grid">
          <a href="mailto:${escapeHtml(personal.email)}" class="contact-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
            ${escapeHtml(personal.email)}
          </a>
          <a href="${escapeHtml(personal.linkedin)}" class="contact-link" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a href="${escapeHtml(personal.github)}" class="contact-link" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
        <p class="contact-footer-note">Bilingual: ${personal.languages.map(escapeHtml).join(' · ')}</p>
      </div>
    </section>
  `;
}
```

- [ ] **Step 3: Reload and verify**

Refresh. Scroll to Education and Contact sections. Expect:
- Education: card with UofA, degree, location/GPA, coursework chips, certifications line, GPA + B.S. stat blocks on the right
- Contact: heading, paragraph, email/LinkedIn/GitHub pill buttons, bilingual footer note, soft brand-color background fade

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat(app): rewrite education and contact sections"
```

---

## Task 13: Clean up unused modal functions and stale code

**Files:**
- Modify: `app.js` (delete dead modal openers no longer wired up)

- [ ] **Step 1: Delete dead modal-opener functions**

The new design has experience and skills inlined; no modals are wired up by any onclick handler. Delete the now-orphan functions to reduce surface area:

In `app.js` delete these functions entirely (between the render functions and utilities):
- `openAboutModal` (lines ~322-346 of the original)
- `openExperienceModal` (lines ~348-383)
- `openSkillModal` (lines ~385-413)
- `openProjectModal` (lines ~415-468)
- `openEducationModal` (lines ~470-512)

**Keep:** `openModal`, `closeModal`, the modal-overlay click handler, and the Escape-key handler (lines ~310-320 and 551-558). The `index.html` modal container can be reused later if needed.

- [ ] **Step 2: Verify no remaining `onclick="openXxxModal"` references**

```bash
grep -n "open[A-Z][a-z]*Modal" app.js
```
Expected: only `openModal` and `closeModal` references remain.

```bash
grep -rn "open[A-Z][a-z]*Modal" index.html
```
Expected: no matches.

- [ ] **Step 3: Reload and click around**

Refresh. Click an experience card, a skill card, the headshot, the education card - none should open a modal. Check DevTools console for errors. There should be none.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "chore: drop unused modal openers"
```

---

## Task 14: Responsive polish + cross-browser smoke test

**Files:**
- (Adjustments only - likely small CSS tweaks to `styles.css`)

- [ ] **Step 1: Test breakpoints in DevTools device toolbar**

Open `http://localhost:8000` in Chrome. DevTools → Toggle device toolbar (Ctrl/Cmd+Shift+M). Test:
- 320px (iPhone SE) - nav collapses to logo + CTA only; hero stacks; all grids 1-col
- 768px (iPad) - hero may be 1-col; skills 2-col; projects 1-col
- 1024px - hero 2-col; skills 3-col; projects 2-col
- 1440px+ - content centered, max-width applied

Note any overflow, awkward wrapping, or unreadable text.

- [ ] **Step 2: Fix any issues**

Common ones to check: hero text overflow, mock browser image clipping, contact pills wrapping awkwardly, footer links wrapping. Edit `styles.css` as needed.

- [ ] **Step 3: Run a Lighthouse audit**

DevTools → Lighthouse → Mobile → Analyze. Target: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95.

Common fixes if it dings:
- Add `loading="lazy"` to non-hero images
- Add `width`/`height` attrs to images to prevent layout shift
- Add `aria-label` to icon-only buttons
- Increase color contrast if any chip/text fails

- [ ] **Step 4: Test in a second browser**

Open the site in Firefox or Safari. Verify backdrop-filter (nav blur), `aspect-ratio` (mock browser), and grid behave the same.

- [ ] **Step 5: Commit fixes**

```bash
git add styles.css app.js
git commit -m "polish: responsive breakpoints and lighthouse fixes"
```

---

## Task 15: Final smoke test and ship

**Files:**
- (No code changes; verification only)

- [ ] **Step 1: Run the full smoke checklist**

With `python -m http.server 8000` running, open `http://localhost:8000` in a fresh incognito tab and verify:

- [ ] Nav sticks on scroll, blurs background, "Resume PDF" button visible (or "Get in Touch" if PDF not provided)
- [ ] Hero: headline + bio + meta chips + two CTA buttons on left, mock browser frame on right with TaskLine URL
- [ ] Stats strip: stats from `resume-data.json`
- [ ] About section renders headshot + bio
- [ ] Experience: 3 cards with date / role+company / highlights / type badge
- [ ] Skills: 6 cards with category name + tag chips, no proficiency bars
- [ ] Projects: featured cards from `resume-data.json` + GitHub auto-grid below
- [ ] GitHub grid loads real repos within ~1s; cached on second load
- [ ] Education: card with UofA info, coursework chips, GPA + B.S. stats
- [ ] Contact: email/LinkedIn/GitHub pill buttons, all clickable
- [ ] Footer: copyright + GitHub/LinkedIn/Solvr Labs links
- [ ] No console errors in DevTools
- [ ] All anchor links scroll smoothly to their section

- [ ] **Step 2: Validate HTML**

Visit https://validator.w3.org/nu/ and paste the rendered HTML from DevTools → Elements → `<html>` → "Edit as HTML" → copy. Fix any errors (warnings are OK).

- [ ] **Step 3: Final commit + push**

If anything else changed:
```bash
git add -A
git commit -m "chore: final smoke test fixes"
```

Push to origin:
```bash
git push origin main
```

(If deployed on Vercel/Netlify, deployment auto-triggers.)

- [ ] **Step 4: Manually verify on the live URL**

Open `https://jesuspadres.com` (or wherever it deploys). Repeat the smoke checklist.

---

## Out of Scope (deferred)

- Adding a `Jesus-Padres-Resume.pdf` (user supplies separately; nav button gracefully falls back)
- Project detail modals (deleted in Task 13; can be re-added later if desired)
- Blog, analytics, contact form
- Server-side GitHub proxy (24h client cache is sufficient at current traffic)
- Internationalization (site is EN; bilingual is just a credibility marker)

---

## Self-Review Notes

- **Spec coverage:** every section in the spec maps to a task. Nav→T6, hero→T6, stats→T6, about→T6, experience→T8, skills→T9, projects featured→T10, GitHub grid→T11, education→T12, contact→T12. Visual system tokens map to T4 + T5. Deletion of liquid-glass is T2 + T3.
- **Type consistency:** `escapeHtml`, `relativeTime`, `getLanguageColor` defined in T7 and used consistently in T6, T8-T12. `loadGitHubRepos` defined in T11 and called from T6's `renderApp`. `gh-grid` element ID is identical across T10 (skeleton render) and T11 (target lookup). The `gh:jesuspadres:repos:v1` cache key is identical across the read/write/error paths.
- **XSS:** every interpolation of dynamic data uses `escapeHtml()`. The two `${...}` slots that don't (`Number(r.stargazers_count) || 0` and `Array(6).fill(...)`) are not user-controlled.
- **Verification:** every task ends with a browser-reload check + commit. No automated test framework exists in this repo; that is intentional for a vanilla static site.
- **Frequent commits:** 15 commits across 15 tasks, each a self-contained logical unit.
