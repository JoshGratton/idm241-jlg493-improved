// Grab the pieces of the microinteraction
const lesson = document.getElementById('lesson');
const lessonBtn = document.getElementById('lessonBtn');
const popover = document.getElementById('popover');

// Open the popover: button stays pressed down, START tag hides
function openPopover() {
  lesson.classList.add('is-open');
  popover.hidden = false;
  lessonBtn.setAttribute('aria-expanded', 'true');
}

// Close the popover: button goes back up, START tag comes back
function closePopover() {
  lesson.classList.remove('is-open');
  popover.hidden = true;
  lessonBtn.setAttribute('aria-expanded', 'false');
}

// Click the lesson button to open or close the popover
lessonBtn.addEventListener('click', function (event) {
  event.stopPropagation();
  if (lesson.classList.contains('is-open')) {
    closePopover();
  } else {
    openPopover();
  }
});

// Clicking inside the popover should not close it
popover.addEventListener('click', function (event) {
  event.stopPropagation();
});

// Clicking anywhere else on the page closes it
document.addEventListener('click', closePopover);

// Escape key also closes it
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') closePopover();
});