const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -45px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileMenu.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('open');
  document.body.classList.remove('menu-open');
}));

const chapterCards = [...document.querySelectorAll('.chapter-card')];
const chapterNumber = document.querySelector('#chapter-number');
const chapterName = document.querySelector('#chapter-name');
const chapterProgress = document.querySelector('#chapter-progress');

const setChapter = (card) => {
  const index = chapterCards.indexOf(card);
  chapterNumber.textContent = card.dataset.chapter;
  chapterName.textContent = card.querySelector('summary strong').textContent;
  chapterProgress.style.width = `${((index + 1) / chapterCards.length) * 100}%`;
  chapterCards.forEach((item) => item.classList.toggle('active', item === card));
};

const chapterObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
  if (visible[0]) setChapter(visible[0].target);
}, { rootMargin: '-32% 0px -52%', threshold: 0 });

chapterCards.forEach((card) => {
  chapterObserver.observe(card);
  card.addEventListener('toggle', () => {
    if (!card.open) return;
    setChapter(card);
    chapterCards.forEach((other) => {
      if (other !== card) other.open = false;
    });
  });
});

setChapter(chapterCards[0]);

const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('p');

document.querySelectorAll('.gallery-item').forEach((item) => {
  item.addEventListener('click', () => {
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = item.querySelector('img').alt;
    lightboxCaption.textContent = item.dataset.caption;
    lightbox.showModal();
  });
});

lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ticking = true;
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--molecule-one-y', `${window.scrollY * 0.035}px`);
    document.documentElement.style.setProperty('--molecule-two-y', `${window.scrollY * -0.025}px`);
    ticking = false;
  });
}, { passive: true });

const phaseButtons = [...document.querySelectorAll('[data-select-term]')];
function selectPioTerm(term, updateUrl = true) {
  term = term === 'prelims' ? 'prelims' : 'midterms';
  phaseButtons.forEach(button => {
    const active = button.dataset.selectTerm === term;
    button.setAttribute('aria-selected',String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[data-term]').forEach(panel => {
    panel.hidden = panel.dataset.term !== term;
    if (!panel.hidden) panel.querySelectorAll('.reveal').forEach(element=>revealObserver.observe(element));
  });
  document.querySelectorAll('[data-reflection-term]').forEach(panel => {
    panel.hidden = panel.dataset.reflectionTerm !== term;
    if (!panel.hidden) panel.querySelectorAll('.reveal').forEach(element=>revealObserver.observe(element));
  });
  const label = term === 'prelims' ? 'Prelims' : 'Midterms';
  document.querySelector('#phase-readout').textContent = `${label.toUpperCase()} / ACTIVE`;
  const enter = document.querySelector('.phase-enter');
  enter.textContent = `Enter ${label} ↓`;
  enter.href = term === 'prelims' ? '#journey' : '#journey-midterms';
  document.querySelectorAll('.top-nav a,.mobile-menu a').forEach(link=> {
    if (['#journey','#journey-midterms'].includes(link.getAttribute('href'))) link.href = enter.href;
    if (['#reflection','#reflection-midterms'].includes(link.getAttribute('href'))) link.href = term === 'prelims' ? '#reflection' : '#reflection-midterms';
  });
  if (updateUrl) {
    const url = new URL(location.href);url.searchParams.set('term',term);
    if (['#journey','#journey-midterms','#reflection','#reflection-midterms'].includes(url.hash)) url.hash = '#phase-selector';
    history.replaceState(null,'',url);
    const panel=document.querySelector(`[data-term="${term}"]`);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.getAnimations().forEach(animation=>animation.cancel());
      panel.animate([{opacity:.3,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'ease-out'});
    }
  }
}
phaseButtons.forEach((button,index)=> {
  button.addEventListener('click',()=>selectPioTerm(button.dataset.selectTerm));
  button.addEventListener('keydown',event=> {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;
    phaseButtons[next].focus();selectPioTerm(phaseButtons[next].dataset.selectTerm);
  });
});
selectPioTerm(new URLSearchParams(location.search).get('term'),false);
window.addEventListener('popstate',()=>selectPioTerm(new URLSearchParams(location.search).get('term'),false));

// Hero access always selects Midterms before moving to its opening.
document.querySelector('.midterms-hero-link').addEventListener('click', event => {
  event.preventDefault();
  selectPioTerm('midterms');
  document.querySelector('#journey-midterms').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
const learningFilters=[...document.querySelectorAll('[data-learning-filter]')];
function filterPioEntries(filter) {
  if (!['all','energy','glucose','lab'].includes(filter)) filter='all';
  let count=0;
  document.querySelectorAll('[data-learning-category]').forEach(card=> {
    card.hidden=filter!=='all'&&card.dataset.learningCategory!==filter;
    if (!card.hidden) count++;
  });
  learningFilters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.learningFilter===filter)));
  const label={all:'learning',energy:'energy',glucose:'glucose & metabolism',lab:'virtual lab'}[filter];
  document.querySelector('.filter-status').textContent=`Showing ${count} ${label} ${count===1?'entry':'entries'}`;
}
learningFilters.forEach(button=>button.addEventListener('click',()=>filterPioEntries(button.dataset.learningFilter)));
