/* ============================================================
   OS Study Site — Main JS
   ============================================================ */

// ── Theme Toggle ────────────────────────────────────────────
(function() {
  const html = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = prefersDark ? 'dark' : 'light';
  html.setAttribute('data-theme', currentTheme);

  function updateToggleIcon(btn, theme) {
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.querySelector('[data-theme-toggle]');
    updateToggleIcon(btn, currentTheme);

    if (btn) {
      btn.addEventListener('click', function() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', currentTheme);
        updateToggleIcon(btn, currentTheme);
      });
    }

    // Active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && (href === currentPage || href.includes(currentPage.replace('.html', '')))) {
        a.classList.add('active');
      }
    });

    // Tabs
    document.querySelectorAll('.tab-list').forEach(list => {
      const container = list.closest('.tab-container');
      const panels = container.querySelectorAll('.tab-panel');
      const btns = list.querySelectorAll('.tab-btn');

      btns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          panels[i]?.classList.add('active');
        });
      });
    });

    // Flashcards
    document.querySelectorAll('.flashcard').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('flipped'));
    });

    // TOC active section tracking
    const tocLinks = document.querySelectorAll('.toc-list a');
    if (tocLinks.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            tocLinks.forEach(link => link.classList.remove('active'));
            const id = entry.target.id;
            const link = document.querySelector(`.toc-list a[href="#${id}"]`);
            if (link) link.classList.add('active');
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });

      document.querySelectorAll('.section[id]').forEach(s => observer.observe(s));
    }

    // Animate on scroll
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.info-card, .callout, .feature-item, .algo-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      animObserver.observe(el);
    });
  });
})();

// ── Quiz Controller ──────────────────────────────────────────
function initQuiz(containerId, questions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let current = 0;

  function render() {
    const q = questions[current];
    const cardEl = container.querySelector('.flashcard');
    const front = container.querySelector('.flashcard-front');
    const back  = container.querySelector('.flashcard-back');
    const progress = container.querySelector('.quiz-progress');

    cardEl.classList.remove('flipped');
    front.querySelector('.flashcard-q').textContent = q.q;
    back.querySelector('.flashcard-a').textContent  = q.a;
    progress.textContent = `${current + 1} / ${questions.length}`;
  }

  const prevBtn = container.querySelector('[data-prev]');
  const nextBtn = container.querySelector('[data-next]');

  prevBtn?.addEventListener('click', () => {
    current = Math.max(0, current - 1);
    render();
  });

  nextBtn?.addEventListener('click', () => {
    current = Math.min(questions.length - 1, current + 1);
    render();
  });

  render();
}

// ── Process State Machine ────────────────────────────────────
function initStateMachine(containerId) {
  const info = {
    new:       { title: 'New', desc: 'Süreç oluşturuluyor. OS, PCB yapısını oluşturur ve süreci hazırlık aşamasına alır.' },
    ready:     { title: 'Ready', desc: 'İşlemciye atanmayı bekliyor. Belleğe yüklenmiş, çalışmaya hazır; CPU boşaldığında seçilecek.' },
    running:   { title: 'Running', desc: 'CPU\'da çalışıyor. Talimatlar aktif olarak yürütülüyor. Tek çekirdekte tek süreç çalışabilir.' },
    waiting:   { title: 'Waiting', desc: 'I/O veya olayı bekliyor. CPU\'yu terk etmiş; I/O tamamlandığında Ready\'e geri döner.' },
    terminated:{ title: 'Terminated', desc: 'Çalışma bitti. OS kaynakları geri alır, PCB silinir.' }
  };

  const container = document.getElementById(containerId);
  if (!container) return;

  const infoBox = container.querySelector('.state-info');
  const nodes   = container.querySelectorAll('.state-node');

  nodes.forEach(node => {
    node.addEventListener('click', () => {
      nodes.forEach(n => n.style.boxShadow = '');
      node.style.boxShadow = '0 0 0 4px var(--accent)';
      const state = node.dataset.state;
      if (infoBox && info[state]) {
        infoBox.innerHTML = `<strong>${info[state].title}:</strong> ${info[state].desc}`;
      }
    });
  });
}

// ── Scheduling Simulator ─────────────────────────────────────
function initScheduler(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const processes = [
    { name: 'P1', burst: 24, arrival: 0, color: '#2563eb' },
    { name: 'P2', burst: 3,  arrival: 0, color: '#059669' },
    { name: 'P3', burst: 3,  arrival: 0, color: '#d97706' },
  ];

  function renderFCFS() {
    let t = 0;
    return processes.map(p => {
      const start = t;
      t += p.burst;
      return { ...p, start, end: t, wait: start };
    });
  }

  function renderSJF() {
    const sorted = [...processes].sort((a, b) => a.burst - b.burst);
    let t = 0;
    return sorted.map(p => {
      const start = t;
      t += p.burst;
      return { ...p, start, end: t, wait: start };
    });
  }

  function renderRR(quantum = 4) {
    const result = [];
    const queue = processes.map(p => ({ ...p, remaining: p.burst, color: p.color }));
    let t = 0;
    const timeline = [];

    while (queue.some(p => p.remaining > 0)) {
      for (const p of queue) {
        if (p.remaining <= 0) continue;
        const run = Math.min(quantum, p.remaining);
        timeline.push({ name: p.name, start: t, end: t + run, color: p.color });
        p.remaining -= run;
        t += run;
      }
    }
    return timeline;
  }

  const totalTime = 30;
  const charts = {
    fcfs: container.querySelector('[data-gantt="fcfs"]'),
    sjf:  container.querySelector('[data-gantt="sjf"]'),
    rr:   container.querySelector('[data-gantt="rr"]'),
  };

  function drawGantt(el, bars) {
    if (!el) return;
    el.innerHTML = bars.map(b => `
      <div style="position:absolute;left:${(b.start/totalTime)*100}%;width:${((b.end-b.start)/totalTime)*100}%;background:${b.color};height:100%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:white;border-radius:4px">
        ${b.name}
      </div>
    `).join('');
  }

  if (charts.fcfs) drawGantt(charts.fcfs.querySelector('.gantt-bar-container .gantt-track'), renderFCFS());
  if (charts.sjf)  drawGantt(charts.sjf.querySelector('.gantt-bar-container .gantt-track'),  renderSJF());
  if (charts.rr)   drawGantt(charts.rr.querySelector('.gantt-bar-container .gantt-track'),   renderRR());
}

// ── Storage Pyramid tooltips ─────────────────────────────────
function initStoragePyramid() {
  const tooltips = {
    reg:   'CPU içindeki en hızlı depolama. Sadece byte/word boyutunda, çok az sayıda.',
    cache: 'SRAM tabanlı; ns hızında. L1/L2/L3 seviyeleri. CPU ile RAM arasında tampon.',
    ram:   'Ana bellek. CPU\'nun doğrudan eriştiği tek büyük depolama. Volatile (güç kesilince silinir).',
    ssd:   'Flash tabanlı; kalıcı; HDD\'den çok hızlı. NVMe ile GB/s hızlarına ulaşır.',
    hdd:   'Manyetik plakalar; tracks → sectors. Ucuz ama mekanik → ms gecikmeli.',
    tape:  'Tersiyer depolama. En ucuz, en yavaş. Backup ve arşiv için kullanılır.',
  };

  document.querySelectorAll('.storage-level[data-storage]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.storage;
      const box = el.closest('.diagram-box').querySelector('.storage-info');
      if (box && tooltips[key]) box.textContent = tooltips[key];
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStateMachine('process-state-machine');
  initStoragePyramid();
});
