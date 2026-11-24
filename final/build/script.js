// ===== grab the pieces =====
const panel     = document.getElementById('panel');
const features  = Array.from(document.querySelectorAll('.feature'));
const shots     = Array.from(document.querySelectorAll('.shot'));
const upBtn     = document.getElementById('upBtn');
const downBtn   = document.getElementById('downBtn');
const counter   = document.getElementById('counter');
const ppBtn     = document.getElementById('ppBtn');
const closeBtn  = document.getElementById('closeBtn');
const tclBtn    = document.getElementById('tclBtn');
const dots      = Array.from(document.querySelectorAll('.dot'));
const colorName = document.getElementById('colorName');

const COLORS = { Burgundy: '#6B2A36', Silver: '#C9CACD', Blue: '#3A4A63', Black: '#2B2B2D' };
const AUTOPLAY_MS = 5000;   // progress bar fills over 5 seconds
const GROW_MS = 400;        // pill <-> card over 0.4 seconds

// ===== state =====
let openIndex = null;       // which feature card is open (null = none)
let playing   = false;      // autoplay on/off
let progress  = 0;          // 0 to 1 for the open card's progress bar

// ===== "database" (saved in the browser so it survives a refresh) =====
function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
function load(key)        { try { return localStorage.getItem(key); } catch (e) { return null; } }

let savedFeature = Number(load('finalFeature'));
if (!(savedFeature >= 0 && savedFeature < features.length)) savedFeature = 0;
let currentColor = COLORS[load('finalColor')] ? load('finalColor') : 'Burgundy';

// =========================================================
// pill <-> card resize (animates the width and height)
// =========================================================
function resize(el, change) {
  const before = el.getBoundingClientRect();
  change();
  const after = el.getBoundingClientRect();
  el.animate(
    [
      { width: before.width + 'px', height: before.height + 'px' },
      { width: after.width + 'px',  height: after.height + 'px' }
    ],
    { duration: GROW_MS, easing: 'ease' }
  );
}

// =========================================================
// open / close feature cards
// =========================================================
function openFeature(i) {
  if (i === openIndex) return;

  // the open card shrinks back into a pill
  if (openIndex !== null) closeCardOnly(features[openIndex]);

  // the clicked pill grows into a card
  const f = features[i];
  resize(f, function () {
    f.classList.add('feature--open');
    f.querySelector('.feature-toggle').setAttribute('aria-expanded', 'true');
    f.querySelector('.feature-toggle').setAttribute('aria-label', 'Close ' + f.querySelector('.feature-name').textContent);
  });

  openIndex = i;
  progress = 0;
  showShot(shotKey(i));
  updateNav();

  // the open feature is saved to the database
  save('finalFeature', i);
}

function closeCardOnly(f) {
  resize(f, function () {
    f.classList.remove('feature--open');
    const t = f.querySelector('.feature-toggle');
    t.setAttribute('aria-expanded', 'false');
    t.removeAttribute('aria-label');
  });
}

function closeOpenCard() {
  if (openIndex === null) return;
  closeCardOnly(features[openIndex]);
  openIndex = null;
  progress = 0;
  showShot('home');           // image fades back to the full phone
  updateNav();
}

function shotKey(i) {
  return ['colors', 'two', 'camera', 'island', 'durability', 'control', 'action'][i];
}

// image fades out, new image fades in zooming 105% -> 100%
function showShot(key) {
  shots.forEach(function (s) {
    s.classList.toggle('shot--active', s.dataset.shot === key);
  });
}

// counter + arrow buttons
function updateNav() {
  if (openIndex === null) {
    counter.classList.add('counter--hidden');
    upBtn.disabled = true;
    downBtn.disabled = false;
  } else {
    counter.classList.remove('counter--hidden');
    counter.textContent = (openIndex + 1) + ' of ' + features.length;
    upBtn.disabled = openIndex === 0;                       // can't go before the first
    downBtn.disabled = openIndex === features.length - 1;   // can't go past the last
  }
}

// =========================================================
// autoplay (Play/Pause)
// =========================================================
function setPlayButton() {
  ppBtn.classList.toggle('pp-btn--play', !playing);
  ppBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

function startAutoplay() {
  playing = true;
  panel.classList.add('panel--auto');
  panel.classList.remove('panel--paused');
  if (openIndex === null) openFeature(0);   // no card open: the first one opens
  setPlayButton();
}

// Pause button: progress bar stops where it is (still shown)
function pauseAutoplay() {
  playing = false;
  panel.classList.remove('panel--auto');
  panel.classList.add('panel--paused');
  setPlayButton();
}

// manual mode (clicking a pill, arrow or color dot): progress bar hidden
function goManual() {
  playing = false;
  progress = 0;
  panel.classList.remove('panel--auto', 'panel--paused');
  setPlayButton();
}

// progress bar loop: fills over 5 seconds, then the next feature opens
let lastTime = null;
function tick(now) {
  if (lastTime === null) lastTime = now;
  const dt = now - lastTime;
  lastTime = now;

  if (playing && openIndex !== null) {
    progress += dt / AUTOPLAY_MS;
    if (progress >= 1) {
      // after the last feature, go back to the first
      openFeature((openIndex + 1) % features.length);
      progress = 0;
    }
  }

  // draw the progress bar on the open card
  features.forEach(function (f, i) {
    const fill = f.querySelector('.prog-fill');
    fill.style.width = (i === openIndex ? progress * 100 : 0) + '%';
  });

  requestAnimationFrame(tick);
}

// =========================================================
// event listeners
// =========================================================

// feature pills: click a closed pill opens it; click the x closes it
features.forEach(function (f, i) {
  f.querySelector('.feature-toggle').addEventListener('click', function () {
    goManual();
    if (openIndex === i) {
      closeOpenCard();
    } else {
      openFeature(i);
    }
  });
});

// up and down arrow buttons
downBtn.addEventListener('click', function () {
  goManual();
  if (openIndex === null) openFeature(0);
  else if (openIndex < features.length - 1) openFeature(openIndex + 1);
});
upBtn.addEventListener('click', function () {
  goManual();
  if (openIndex !== null && openIndex > 0) openFeature(openIndex - 1);
});

// color dots
function setColor(name) {
  currentColor = name;
  document.documentElement.style.setProperty('--phone', COLORS[name]);   // phone fades to the new color
  dots.forEach(function (d) {
    d.classList.toggle('dot--selected', d.dataset.color === name);       // ring moves
    d.setAttribute('aria-pressed', d.dataset.color === name ? 'true' : 'false');
  });
  colorName.textContent = name;
}
dots.forEach(function (d) {
  d.addEventListener('click', function () {
    goManual();
    setColor(d.dataset.color);
    save('finalColor', d.dataset.color);     // chosen color saved to the database
  });
});

// Play/Pause button
ppBtn.addEventListener('click', function () {
  if (playing) pauseAutoplay();
  else startAutoplay();
});

// Close (x) button
closeBtn.addEventListener('click', function () {
  playing = false;
  setPlayButton();
  panel.classList.remove('panel--opening');
  panel.classList.add('panel--closing');
  panel.addEventListener('animationend', function done() {
    panel.removeEventListener('animationend', done);
    panel.hidden = true;
    panel.classList.remove('panel--closing');
    tclBtn.hidden = false;                   // "Take a closer look" fades in
    tclBtn.classList.remove('tcl-btn--leaving');
  });
});

// "Take a closer look" button
tclBtn.addEventListener('click', function () {
  tclBtn.classList.add('tcl-btn--leaving');  // button fades out
  setTimeout(function () {
    tclBtn.hidden = true;

    // last open feature and chosen color are loaded from the database
    const lastFeature = Number(load('finalFeature'));
    const lastColor = load('finalColor');
    if (COLORS[lastColor]) setColor(lastColor);

    panel.hidden = false;
    panel.classList.add('panel--opening');   // fades in and grows 95% -> 100%
    panel.addEventListener('animationend', function done() {
      panel.removeEventListener('animationend', done);
      panel.classList.remove('panel--opening');
    });

    if (lastFeature >= 0 && lastFeature < features.length && lastFeature !== openIndex) {
      openFeature(lastFeature);
    }
    progress = 0;
    startAutoplay();
  }, 200);
});

// =========================================================
// start: panel opens in autoplay mode
// =========================================================
setColor(currentColor);
openFeature(savedFeature);
startAutoplay();
requestAnimationFrame(tick);