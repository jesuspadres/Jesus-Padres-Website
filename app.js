// Resume data - loaded from external JSON file
let resumeData = null;

// Load data from JSON file
async function loadResumeData() {
  try {
    const response = await fetch('resume-data.json');
    if (!response.ok) {
      throw new Error('Failed to load resume data');
    }
    resumeData = await response.json();
    renderApp();
  } catch (error) {
    console.error('Error loading resume data:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 4rem; text-align: center; color: var(--accent);">
        <h2>Error loading resume data</h2>
        <p style="color: var(--text-muted);">Make sure resume-data.json is in the same folder as index.html</p>
      </div>
    `;
  }
}

// ===== RENDER FUNCTIONS =====

function renderApp() {
  const app = document.getElementById('app');
  app.className = '';
  app.innerHTML = `
    <nav>
      <div class="nav-inner">
        <div class="logo" onclick="scrollToTop()">${resumeData.personal.shortName}</div>
        <ul class="nav-links">
          <li><a href="#experience">Experience</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#education">Education</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>
    </nav>

    ${renderHero()}
    ${renderExperience()}
    ${renderSkills()}
    ${renderProjects()}
    ${renderEducation()}
    ${renderContact()}

    <footer>
      <div class="footer-inner">
        <p>© ${new Date().getFullYear()} ${resumeData.personal.name} — Built with <span>code</span> and intention.</p>
      </div>
    </footer>
  `;

  // Initialize animations
  initAnimations();
  
  // Initialize liquid glass effects after render
  if (typeof initLiquidGlass === 'function') {
    setTimeout(initLiquidGlass, 100);
  }
}

function renderHero() {
  const { personal, stats } = resumeData;
  const imageContent = personal.image 
    ? `<img src="${personal.image}" alt="${personal.name}" class="profile-image">`
    : `<span class="initials">${personal.initials}</span>`;
  
  return `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content">
          <p class="hero-label">${personal.title}</p>
          <h1>${personal.tagline.replace('digital', '<span class="highlight">digital</span>')}</h1>
          <p class="hero-intro">${personal.bio}</p>
          <div class="hero-stats">
            ${stats.map(s => `
              <div class="stat">
                <div class="stat-value">${s.value}</div>
                <div class="stat-label">${s.label}</div>
              </div>
            `).join('')}
          </div>
          <div class="cta-group">
            <a href="#contact" class="cta-btn primary">Get in Touch</a>
            <a href="#experience" class="cta-btn secondary">View Work</a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="brutalist-shape" onclick="openAboutModal()">
            <div class="shape-layer shape-layer-1"></div>
            <div class="shape-layer shape-layer-2"></div>
            <div class="shape-layer shape-layer-3">
              ${imageContent}
            </div>
          </div>
          <div class="floating-badge badge-1" onclick="openEducationModal()">
            <span>${resumeData.education.gpa}</span>
            GPA
          </div>
          <div class="floating-badge badge-2">
            <span>${personal.languages.map(l => l.substring(0,2).toUpperCase()).join('/')}</span>
            BILINGUAL
          </div>
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
          <span class="section-number">01</span>
          <div>
            <h2 class="section-title">Experience</h2>
            <p class="section-subtitle">Where I've contributed</p>
          </div>
        </div>
        <div class="experience-grid">
          ${resumeData.experience.map(exp => `
            <div class="exp-item" onclick="openExperienceModal('${exp.id}')">
              <div class="exp-date">${exp.date}</div>
              <div class="exp-content">
                <h3>${exp.title}</h3>
                <p class="exp-company">${exp.company}</p>
                <p class="exp-summary">${exp.summary}</p>
              </div>
              <span class="exp-type">${exp.type}</span>
            </div>
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
          <span class="section-number">02</span>
          <div>
            <h2 class="section-title">Skills</h2>
            <p class="section-subtitle">Technical proficiencies</p>
          </div>
        </div>
        <div class="skills-container">
          ${resumeData.skills.map((skill, i) => `
            <div class="skill-block" data-index="0${i+1}" onclick="openSkillModal('${skill.id}')">
              <h3 class="skill-name">${skill.name}</h3>
              <p class="skill-tags">${skill.tags.join(', ')}</p>
              <div class="skill-bar">
                <div class="skill-bar-fill" data-progress="${skill.proficiency}"></div>
              </div>
              <p class="skill-expand">CLICK FOR DETAILS →</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderProjects() {
  return `
    <section id="projects">
      <div class="section-inner">
        <div class="section-header">
          <span class="section-number">03</span>
          <div>
            <h2 class="section-title">Projects</h2>
            <p class="section-subtitle">Selected work</p>
          </div>
        </div>
        <div class="projects-grid">
          ${resumeData.projects.map(proj => `
            <div class="project-card" onclick="openProjectModal('${proj.id}')">
              <span class="project-tag">${proj.tag}</span>
              <h3 class="project-title">${proj.title}</h3>
              <p class="project-summary">${proj.summary}</p>
              <div class="project-tech">
                ${proj.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
              </div>
              <div class="project-footer">
                ${proj.link ? `
                  <a href="${proj.link}" class="project-link" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
                    ${proj.link.includes('github.com') ? `
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
                      </svg>
                      VIEW CODE
                    ` : `
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      VIEW LIVE
                    `}
                  </a>
                ` : ''}
                <p class="project-expand">CLICK FOR DETAILS →</p>
              </div>
            </div>
        `).join('')}
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
          <span class="section-number">04</span>
          <div>
            <h2 class="section-title">Education</h2>
            <p class="section-subtitle">Academic background</p>
          </div>
        </div>
        <div class="edu-card" onclick="openEducationModal()">
          <div class="edu-main">
            <h3>${edu.school}</h3>
            <p>${edu.degree}</p>
            <p class="edu-cert">+ ${edu.certifications.join(', ')}</p>
            <p class="edu-expand">CLICK FOR DETAILS →</p>
          </div>
          <div class="edu-details">
            <div class="edu-stat">
              <div class="edu-stat-value">${edu.gpa}</div>
              <div class="edu-stat-label">GPA</div>
            </div>
            <div class="edu-stat">
              <div class="edu-stat-value">B.S.</div>
              <div class="edu-stat-label">Degree</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderContact() {
  const { personal } = resumeData;
  return `
    <section id="contact">
      <div class="section-inner">
        <h2 class="section-title">Let's Build Something</h2>
        <p>Open to new opportunities and collaborations. Let's connect and create impact together.</p>
        <div class="contact-grid">
          ${personal.phone ? `
            <a href="tel:${personal.phone.replace(/[^0-9]/g, '')}" class="contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              ${personal.phone}
            </a>
          ` : ''}
          ${personal.email ? `
            <a href="mailto:${personal.email}" class="contact-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 6l-10 7L2 6"/>
              </svg>
              ${personal.email}
            </a>
          ` : ''}
          ${personal.linkedin ? `
            <a href="${personal.linkedin}" class="contact-link" target="_blank">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          ` : ''}
          ${personal.github ? `
            <a href="${personal.github}" class="contact-link" target="_blank">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          ` : ''}
        </div>
        <div class="lang-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          Fluent in ${personal.languages.map(l => `<strong>${l}</strong>`).join(' & ')}
        </div>
      </div>
    </section>
  `;
}

// ===== MODAL FUNCTIONS =====

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

function openAboutModal() {
  const { personal } = resumeData;
  openModal(
    `
      <span class="modal-tag">About</span>
      <h2 class="modal-title">${personal.name}</h2>
      <p class="modal-subtitle">${personal.title}</p>
    `,
    `
      <div class="modal-section">
        <h3 class="modal-section-title">Overview</h3>
        <p class="modal-description">${personal.bio}</p>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Details</h3>
        <ul class="modal-list">
          <li>Location: ${personal.location}</li>
          <li>Languages: ${personal.languages.join(', ')}</li>
          <li>Email: ${personal.email}</li>
          ${personal.phone ? `<li>Phone: ${personal.phone}</li>` : ''}
        </ul>
      </div>
    `
  );
}

function openExperienceModal(id) {
  const exp = resumeData.experience.find(e => e.id === id);
  if (!exp) return;
  
  openModal(
    `
      <span class="modal-tag">${exp.type}</span>
      <h2 class="modal-title">${exp.title}</h2>
      <p class="modal-subtitle">${exp.company} · ${exp.date}</p>
    `,
    `
      <div class="modal-section">
        <h3 class="modal-section-title">Overview</h3>
        <p class="modal-description">${exp.details.description}</p>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Responsibilities</h3>
        <ul class="modal-list">
          ${exp.details.responsibilities.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Key Achievements</h3>
        <ul class="modal-list">
          ${exp.details.achievements.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Technologies</h3>
        <div class="modal-tech-grid">
          ${exp.details.technologies.map(t => `<span class="modal-tech-tag">${t}</span>`).join('')}
        </div>
      </div>
    `
  );
}

function openSkillModal(id) {
  const skill = resumeData.skills.find(s => s.id === id);
  if (!skill) return;
  
  openModal(
    `
      <span class="modal-tag">Skill</span>
      <h2 class="modal-title">${skill.name}</h2>
      <p class="modal-subtitle">${skill.proficiency}% Proficiency</p>
    `,
    `
      <div class="modal-section">
        <h3 class="modal-section-title">Overview</h3>
        <p class="modal-description">${skill.details.description}</p>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Breakdown</h3>
        <div class="modal-stats">
          ${skill.details.breakdown.map(b => `
            <div class="modal-stat">
              <div class="modal-stat-value">${b.name}</div>
              <div class="modal-stat-label">${b.years ? b.years + ' years' : b.level}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  );
}

function openProjectModal(id) {
  const proj = resumeData.projects.find(p => p.id === id);
  if (!proj) return;
  
  openModal(
    `
      <span class="modal-tag">${proj.tag}</span>
      <h2 class="modal-title">${proj.title}</h2>
      ${proj.link ? `
        <a href="${proj.link}" class="modal-project-link" target="_blank" rel="noopener noreferrer">
          ${proj.link.includes('github.com') ? `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
            </svg>
            View on GitHub
          ` : `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View Live Site
          `}
        </a>
      ` : ''}
    `,
    `
      <div class="modal-section">
        <h3 class="modal-section-title">Overview</h3>
        <p class="modal-description">${proj.details.description}</p>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Features</h3>
        <ul class="modal-list">
          ${proj.details.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Impact</h3>
        <p class="modal-description">${proj.details.impact}</p>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">My Role</h3>
        <p class="modal-description">${proj.details.role}</p>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Technologies</h3>
        <div class="modal-tech-grid">
          ${proj.technologies.map(t => `<span class="modal-tech-tag">${t}</span>`).join('')}
        </div>
      </div>
    `
  );
}

function openEducationModal() {
  const edu = resumeData.education;
  
  openModal(
    `
      <span class="modal-tag">Education</span>
      <h2 class="modal-title">${edu.school}</h2>
      <p class="modal-subtitle">${edu.degree}</p>
    `,
    `
      <div class="modal-section">
        <div class="modal-stats">
          <div class="modal-stat">
            <div class="modal-stat-value">${edu.gpa}</div>
            <div class="modal-stat-label">GPA</div>
          </div>
          <div class="modal-stat">
            <div class="modal-stat-value">B.S.</div>
            <div class="modal-stat-label">Degree</div>
          </div>
        </div>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Certifications</h3>
        <ul class="modal-list">
          ${edu.certifications.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Relevant Coursework</h3>
        <div class="modal-tech-grid">
          ${edu.coursework.map(c => `<span class="modal-tech-tag">${c}</span>`).join('')}
        </div>
      </div>
      <div class="modal-section">
        <h3 class="modal-section-title">Activities</h3>
        <ul class="modal-list">
          ${edu.activities.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    `
  );
}

// ===== UTILITY FUNCTIONS =====

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initAnimations() {
  // Skill bar animations
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target.querySelector('.skill-bar-fill');
        if (bar) {
          bar.style.width = bar.dataset.progress + '%';
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.skill-block').forEach(block => observer.observe(block));

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ===== EVENT LISTENERS =====

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Initialize - load data from JSON file
loadResumeData();