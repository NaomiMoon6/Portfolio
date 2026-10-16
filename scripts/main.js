const svg = document.querySelector('.starfield');
const NS = 'http://www.w3.org/2000/svg';
const STAR_COUNT = 150;

const rand = (min, max) => Math.random() * (max - min) + min;

const frag = document.createDocumentFragment();

for (let i = 0; i < STAR_COUNT; i++) {
  const star = document.createElementNS(NS, 'circle');
  const isHero = Math.random() < 0.05; // ~5% bright, larger stars

  star.setAttribute('class', 'star');
  star.setAttribute('cx', rand(0, 100).toFixed(2) + '%');
  star.setAttribute('cy', rand(0, 100).toFixed(2) + '%');
  star.setAttribute('r', (isHero ? rand(2.2, 3) : rand(0.6, 1.6)).toFixed(2));
  star.style.animationDuration = rand(1.5, 5).toFixed(2) + 's';
  star.style.animationDelay = '-' + rand(0, 5).toFixed(2) + 's';

  frag.appendChild(star);
}

svg.appendChild(frag);

const glow = document.querySelector('.cursor-glow');

window.addEventListener('mousemove', (e) => {
  glow.style.transform = `translate(${e.clientX - 75}px, ${e.clientY - 75}px)`;
});

async function drawCat() {
  const host = document.querySelector('.cat');
  host.innerHTML = await (await fetch('assets/cat.svg')).text(); 
  const svg = host.querySelector('svg');

  // Center of each dot
  const pts = [...svg.querySelectorAll('path')].map((dot) => {
    const b = dot.getBBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });

  // Order the dots: start at the topmost, always hop to the nearest unvisited one
  let cur = pts.reduce((a, p) => (p.x > a.x ? p : a));
  const left = new Set(pts);
  left.delete(cur);
  const order = [cur];
  while (left.size) {
    let best, bestDist = Infinity;
    for (const p of left) {
      const d = Math.hypot(p.x - cur.x, p.y - cur.y);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    left.delete(best);
    order.push(best);
    cur = best;
  }

  // One path through all the dots, inserted first so the dots draw on top
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('class', 'connect-line');
  line.setAttribute('d', 'M' + order.map((p) => `${p.x} ${p.y}`).join(' L'));
  svg.insertBefore(line, svg.firstChild);

  // Draw-on effect: hide the line with a dash gap, then slide the gap away
  const len = line.getTotalLength();
  line.style.strokeDasharray = len;
  line.animate(
    [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
    { duration: 3000, easing: 'ease-in-out', fill: 'forwards' }
  );
}

drawCat();

function setTextSmooth(el, text) {
  const startW = el.offsetWidth;        // 1. current width

  el.style.transition = 'none';         // 2. measure the new width without animating
  el.style.width = '';                  //    let CSS (fit-content) size it
  el.textContent = text;
  const endW = el.offsetWidth;

  el.style.width = startW + 'px';       // 3. snap back to the old width
  void el.offsetWidth;                  //    commit it
  el.style.transition = '';             //    re-enable the CSS transition

  el.style.width = endW + 'px';         // 4. animate to the new width

  el.addEventListener('transitionend', () => {
    el.style.width = '';                // 5. hand control back to CSS afterward
  }, { once: true });
}

const el = document.querySelector('.header__title'); // the element whose text changes
const THRESHOLD = 500;

const TEXT_TOP = '⏾';
const TEXT_SCROLLED = '⏾ Naomi Marra';

let pastPoint = false;

window.addEventListener('scroll', () => {
  const isPast = window.scrollY > THRESHOLD;
  if (isPast === pastPoint) return; // only act when crossing the line
  pastPoint = isPast;

  setTextSmooth(el, isPast ? TEXT_SCROLLED : TEXT_TOP);
}, { passive: true });