// ----- grab the pieces -----
const sizeButtons = document.querySelectorAll('.size:not(:disabled)');
const sizeGrid    = document.getElementById('sizes');
const sizeLabel   = document.getElementById('sizeLabel');
const sizeError   = document.getElementById('sizeError');
const atb         = document.getElementById('atb');
const atbLabel    = document.getElementById('atbLabel');
const viewBag     = document.getElementById('viewBag');
const bag         = document.getElementById('bag');
const bagCount    = document.getElementById('bagCount');

let selectedSize = null;   // e.g. "M 10"
let locked = false;        // true while "Adding…" or "✓ Added" is showing

// Bag count is saved so it is still there after the page is refreshed
let count = 0;
try { count = Number(localStorage.getItem('bagCount')) || 0; } catch (e) {}
bagCount.textContent = count;

// small shoe drawing used for the flying thumbnail
const SHOE_SVG = '<svg viewBox="0 0 48 24" aria-hidden="true"><path d="M4 19V12q1-4 5-4l5 1 4-2 6 3 10 2q10 1 11 5v2z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 16.5h41" stroke="#111" stroke-width="1.2"/><path d="M16 10l3 4M20 9l3 4" stroke="#111" stroke-width="1.2" stroke-linecap="round"/></svg>';

// restart a CSS animation class so it plays again every time
function replay(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

// ----- shoe size buttons -----
sizeButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    // any other selected shoe size button fades back to white
    sizeButtons.forEach(function (b) { b.classList.remove('size--selected'); });
    // this one fades to black
    btn.classList.add('size--selected');
    selectedSize = btn.dataset.short;

    // "Add to Bag" text shows the size (unless it's mid-add)
    if (!locked) atbLabel.textContent = 'Add to Bag – ' + selectedSize;

    // clear the error if it's showing
    sizeLabel.classList.remove('pdp-label--error');
    sizeGrid.classList.remove('sizes--error');
    sizeError.hidden = true;
  });
});

// ----- "Add to Bag" button -----
atb.addEventListener('click', function () {
  if (locked) return;                       // clicking does nothing while adding

  if (!selectedSize) {
    // no size: shake, red label, red outline, message
    replay(atb, 'atb--shake');
    sizeLabel.classList.add('pdp-label--error');
    replay(sizeGrid, 'sizes--error');
    sizeError.hidden = false;
    return;
  }

  addToBag();
});

atb.addEventListener('animationend', function (e) {
  if (e.animationName === 'atb-shake') atb.classList.remove('atb--shake');
});

function addToBag() {
  locked = true;
  atb.classList.add('atb--locked');

  // 1) gray bar fills the button over 0.6 seconds
  atbLabel.textContent = 'Adding…';
  replay(atb, 'atb--filling');

  setTimeout(function () {
    // shoe is added to the bag and the count is saved
    count += 1;
    try { localStorage.setItem('bagCount', count); } catch (e) {}

    // 2) shoe thumbnail arcs up to the Bag icon over 0.6 seconds
    flyShoeToBag(function () {
      // 3) Bag icon grows and the number goes up
      bagCount.textContent = count;
      replay(bag, 'bag--pop');

      // 4) "✓ Added" + "View Bag" link for 2 seconds
      atb.classList.remove('atb--filling');
      atbLabel.textContent = '✓ Added';
      viewBag.classList.add('view-bag--show');

      setTimeout(function () {
        atbLabel.textContent = 'Add to Bag – ' + selectedSize;
        viewBag.classList.remove('view-bag--show');
        atb.classList.remove('atb--locked');
        locked = false;
      }, 2000);
    });
  }, 600);
}

function flyShoeToBag(done) {
  const from = atb.getBoundingClientRect();
  const to   = bag.getBoundingClientRect();

  const shoe = document.createElement('span');
  shoe.className = 'flyer';
  shoe.innerHTML = SHOE_SVG;
  document.body.appendChild(shoe);

  // start at the middle of the button, end at the middle of the Bag icon
  const startX = from.left + from.width / 2 - 28;
  const startY = from.top + from.height / 2 - 14;
  const endX   = to.left + to.width / 2 - 28;
  const endY   = to.top + to.height / 2 - 14;
  const dx = endX - startX;
  const dy = endY - startY;

  shoe.style.left = startX + 'px';
  shoe.style.top  = startY + 'px';

  // arc: goes up higher than the bag in the middle, then drops onto it
  const anim = shoe.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: 'translate(' + dx * 0.5 + 'px,' + (dy - 50) + 'px) scale(.8)', opacity: 1, offset: 0.5 },
    { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.3)', opacity: 0.2 }
  ], { duration: 600, easing: 'ease-in-out' });

  anim.onfinish = function () {
    shoe.remove();
    done();
  };
}