const canvas = document.querySelector(".matrix");
const context = canvas.getContext("2d");
const effectToggle = document.querySelector(".effect-toggle");
const effectLabel = document.querySelector(".effect-label");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let width = 0;
let height = 0;
let columns = [];
let frame = 0;
let lastFrame = 0;
let animationEnabled = true;
const pointer = { x: -1000, y: -1000, active: false };
const characters = "0123456789";

function makeColumns() {
  const spacing = window.innerWidth < 700 ? 20 : 16;
  columns = Array.from({ length: Math.ceil(width / spacing) }, (_, index) => ({
    x: index * spacing,
    y: Math.random() * height,
    speed: 0.65 + Math.random() * 0.9,
    spacing,
  }));
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  makeColumns();
}

function drawMatrix(timestamp) {
  if (!animationEnabled) return;
  frame = window.requestAnimationFrame(drawMatrix);
  if (timestamp - lastFrame < 32) return;
  lastFrame = timestamp;

  context.clearRect(0, 0, width, height);
  context.font = "13px 'DM Mono', monospace";
  context.textAlign = "center";

  for (const column of columns) {
    const trailLength = 16;
    for (let index = 0; index < trailLength; index += 1) {
      const y = column.y - index * column.spacing;
      if (y < -column.spacing || y > height + column.spacing) continue;

      let x = column.x;
      const distanceX = x - pointer.x;
      const distanceY = y - pointer.y;
      const distance = Math.hypot(distanceX, distanceY);
      if (pointer.active && distance < 100) {
        const force = ((100 - distance) / 100) ** 2;
        const direction = distanceX === 0 ? (column.x < width / 2 ? -1 : 1) : Math.sign(distanceX);
        x += direction * force * 30;
      }

      const fade = 1 - index / trailLength;
      context.fillStyle = index === 0
        ? `rgba(255, 112, 112, ${0.95 * fade})`
        : `rgba(241, 67, 67, ${0.62 * fade})`;
      context.fillText(characters[Math.floor(Math.random() * characters.length)], x, y);
    }

    column.y += column.speed;
    if (column.y - trailLength * column.spacing > height && Math.random() > 0.975) {
      column.y = -Math.random() * height * 0.35;
      column.speed = 0.65 + Math.random() * 0.9;
    }
  }
}

function stopMatrix() {
  animationEnabled = false;
  window.cancelAnimationFrame(frame);
  context.clearRect(0, 0, width, height);
  canvas.classList.add("is-hidden");
  effectToggle.setAttribute("aria-pressed", "false");
  effectToggle.setAttribute("aria-label", "Zapnout Matrix animaci");
  effectLabel.textContent = "Matrix vypnutý";
}

function startMatrix() {
  animationEnabled = true;
  canvas.classList.remove("is-hidden");
  effectToggle.setAttribute("aria-pressed", "true");
  effectToggle.setAttribute("aria-label", "Vypnout Matrix animaci");
  effectLabel.textContent = "Matrix zapnutý";
  frame = window.requestAnimationFrame(drawMatrix);
}

window.addEventListener("resize", resizeCanvas, { passive: true });
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = event.pointerType === "mouse";
}, { passive: true });
window.addEventListener("pointerleave", () => { pointer.active = false; });

effectToggle.addEventListener("click", () => {
  if (animationEnabled) stopMatrix();
  else startMatrix();
});

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mainNav.classList.toggle("is-open", !isOpen);
});

mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });

  document.querySelectorAll(".section-heading, .about-copy, .skill-group, .project-item, .future-inner, .contact-content").forEach((element) => {
    element.classList.add("js-reveal");
    revealObserver.observe(element);
  });
}

resizeCanvas();
if (reduceMotion.matches) stopMatrix();
else startMatrix();