// Resume data - loaded from external JSON file
let resumeData = null;

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

// ===== DATA LOAD =====

async function loadResumeData() {
  try {
    const response = await fetch('resume-data.json');
    if (!response.ok) throw new Error('Failed to load resume data');
    resumeData = await response.json();
    renderApp();
  } catch (error) {
    console.error('Error loading resume data:', error);
    const app = document.getElementById('app');
    app.textContent = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:4rem;text-align:center';
    const h = document.createElement('h2');
    h.textContent = 'Error loading resume data';
    const p = document.createElement('p');
    p.textContent = 'Make sure resume-data.json is in the same folder as index.html.';
    wrap.appendChild(h);
    wrap.appendChild(p);
    app.appendChild(wrap);
  }
}

// ===== RENDER =====

function renderApp() {
  const app = document.getElementById('app');
  app.className = '';
  const { personal } = resumeData;
  const html = `
    <nav>
      <div class="nav-inner">
        <div class="nav-logo" onclick="scrollToTop()">${escapeHtml(personal.shortName)}</div>
        <ul class="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#experience">Experience</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <a href="${personal.resumePdf || '#contact'}" class="nav-cta" ${personal.resumePdf ? 'download' : ''}>
          ${personal.resumePdf ? 'Resume PDF' : 'Get in touch'}
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
        <p>© ${new Date().getFullYear()} ${escapeHtml(personal.name)}</p>
        <p>
          <a href="${escapeHtml(personal.github)}" target="_blank" rel="noopener">GitHub</a>
          &nbsp;·&nbsp;
          <a href="${escapeHtml(personal.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
          &nbsp;·&nbsp;
          <a href="https://solvrlabs.com" target="_blank" rel="noopener">Solvr Labs</a>
        </p>
      </div>
    </footer>
  `;
  app.innerHTML = html;

  initAnimations();
  loadGitHubRepos();
}

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
            <p>I focus on shipping production software end-to-end — from test automation that catches regressions before customers do, to client-facing portals and AI-driven tooling for service businesses. Bilingual (EN/ES), based in Tucson, AZ.</p>
          </div>
          ${photo}
        </div>
      </div>
    </section>
  `;
}

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

function renderProjects() {
  const ghUsername = resumeData.github?.username || 'jesuspadres';
  return `
    <section id="projects">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-eyebrow">Projects</span>
          <p class="section-subtitle">Selected work — click through for live products and code.</p>
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

// ===== ANIMATIONS / SCROLL =====

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
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
    grid.textContent = '';
    const errEl = document.createElement('div');
    errEl.className = 'gh-error';
    errEl.style.gridColumn = '1 / -1';
    errEl.textContent = `Couldn't load repos right now. `;
    const a = document.createElement('a');
    a.href = `https://github.com/${username}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'View on GitHub →';
    errEl.appendChild(a);
    grid.appendChild(errEl);
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
    grid.textContent = '';
    const empty = document.createElement('div');
    empty.className = 'gh-error';
    empty.style.gridColumn = '1 / -1';
    empty.textContent = 'No public repos to show.';
    grid.appendChild(empty);
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

// ===== MODAL (kept minimal — no openers wired up; available for future inline expansion) =====

function openModal(headerContent, bodyContent) {
  document.getElementById('modal-header-content').innerHTML = headerContent;
  document.getElementById('modal-body-content').innerHTML = bodyContent;
  document.getElementById('modal-overlay').classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.classList.remove('modal-open');
}

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== INIT =====

loadResumeData();

