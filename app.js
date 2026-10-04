'use strict';
const $ = id => document.getElementById(id);
const canvas = $('canvas');
const context = canvas.getContext('2d', { alpha: false });
const modes = {
  silk: ['01 / SILK CURRENT', 'LINES THAT FORGOT WHERE THEY WERE GOING.'],
  bloom: ['02 / HARMONIC BLOOM', 'NATURE, WITH THE SETTINGS TURNED UP.'],
  attractor: ['03 / STRANGE ATTRACTOR', 'ORDER IS JUST CHAOS WITH GOOD PR.'],
};
const palettes = {
  ember: { colors: ['#ffc39b', '#ec6451', '#d98772', '#a74761'], label: 'EMBER / SOFT THINGS, SHARP EDGES' },
  acid: { colors: ['#f5ffc0', '#a8db65', '#72baa0', '#277f76'], label: 'ACID / A BOTANICAL INCIDENT' },
  iris: { colors: ['#f7bdff', '#a790ed', '#c2a2ef', '#536bcc'], label: 'IRIS / TWILIGHT WITH AN OPINION' },
  ice: { colors: ['#e1fcff', '#81cde5', '#a3bce8', '#3b6b8d'], label: 'ICE / THE QUIET END OF THE SPECTRUM' },
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let mode = 'silk';
let palette = 'ember';
let seed = 1;
let random;
let width = 1;
let height = 1;
let density = 65;
let motion = 40;
let structure = 55;
let particles = [];
let frame = 0;
let phase = 0;
let lastTime = 0;
let needsRender = true;
let attractorX = 0.1;
let attractorY = 0.1;

function seededRandom(value) {
  let state = value >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clear() {
  context.fillStyle = '#09090c';
  context.fillRect(0, 0, width, height);
}

function reset() {
  random = seededRandom(seed);
  frame = 0;
  phase = random() * Math.PI * 2;
  attractorX = random() * 0.2;
  attractorY = random() * 0.2;
  particles = Array.from({ length: Math.round(density * 8) }, () => ({
    x: random() * width, y: random() * height,
    life: Math.floor(random() * 200), color: Math.floor(random() * 4),
  }));
  $('seed-label').textContent = `SEED ${String(seed).padStart(6, '0')}`;
  clear();
  needsRender = true;
  // Pre-roll a still composition, including when reduced motion is enabled.
  for (let i = 0; i < (mode === 'attractor' ? 15 : mode === 'silk' ? 32 : 1); i++) render(1);
}

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  width = Math.max(1, Math.round(rect.width));
  height = Math.max(1, Math.round(rect.height));
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  reset();
}

function silk(delta) {
  const speed = (0.35 + motion / 23) * delta;
  const frequency = 0.0015 + structure * 0.000065;
  context.lineWidth = 0.7;
  context.globalAlpha = 0.36;
  for (const particle of particles) {
    const previousX = particle.x;
    const previousY = particle.y;
    const angle = Math.sin(particle.x * frequency + phase) * 2.2
      + Math.cos(particle.y * frequency - phase * 0.7) * 2.2
      + Math.sin((particle.x + particle.y) * frequency * 0.45) * 1.1;
    particle.x += Math.cos(angle) * speed;
    particle.y += Math.sin(angle) * speed;
    particle.life += delta;
    if (particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height || particle.life > 260) {
      particle.x = random() * width;
      particle.y = random() * height;
      particle.life = 0;
      continue;
    }
    context.strokeStyle = palettes[palette].colors[particle.color];
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.lineTo(particle.x, particle.y);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function bloom() {
  clear();
  const rings = Math.round(15 + density * 0.55);
  const radius = Math.min(width, height) * 0.34;
  const petals = 3 + Math.floor(structure / 15);
  context.lineWidth = 0.6;
  for (let ring = 0; ring < rings; ring++) {
    const ratio = ring / rings;
    context.strokeStyle = palettes[palette].colors[ring % 4];
    context.globalAlpha = 0.15 + ratio * 0.55;
    context.beginPath();
    for (let point = 0; point <= 380; point++) {
      const angle = point / 380 * Math.PI * 2;
      const ripple = Math.sin(angle * petals + phase + ratio * 3) * (0.1 + structure / 550);
      const r = radius * (0.15 + ratio * 0.85) * (1 + ripple);
      const twist = angle + Math.sin(phase * 0.3 + ratio * 2) * ratio * 0.3;
      const x = width / 2 + Math.cos(twist) * r;
      const y = height / 2 + Math.sin(twist) * r;
      if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();
  }
  context.globalAlpha = 1;
}

function attractor() {
  const a = -1.4 + structure / 200;
  const b = 1.6 + structure / 220;
  const c = 1.05 + Math.sin(phase * 0.16) * 0.06;
  const d = 0.65 + structure / 300;
  const scale = Math.min(width, height) * 0.2;
  context.globalAlpha = 0.28;
  const count = Math.round(400 + density * 20);
  for (let i = 0; i < count; i++) {
    const nextX = Math.sin(a * attractorY) + c * Math.cos(a * attractorX);
    const nextY = Math.sin(b * attractorX) + d * Math.cos(b * attractorY);
    attractorX = nextX;
    attractorY = nextY;
    context.fillStyle = palettes[palette].colors[Math.min(3, Math.floor(Math.abs(nextX) * 2))];
    context.fillRect(width / 2 + nextX * scale, height / 2 + nextY * scale, 0.8, 0.8);
  }
  context.globalAlpha = 1;
}

function render(delta) {
  if (mode !== 'bloom') {
    context.fillStyle = mode === 'silk' ? 'rgba(9,9,12,0.012)' : 'rgba(9,9,12,0.006)';
    context.fillRect(0, 0, width, height);
  }
  if (mode === 'silk') silk(delta);
  else if (mode === 'bloom') bloom();
  else attractor();
}

function updatePause() {
  $('pause').textContent = paused ? 'RESUME ▷' : 'PAUSE Ⅱ';
  $('pause').setAttribute('aria-pressed', String(paused));
  $('render-status').textContent = paused ? 'PAUSED / TAKE YOUR TIME' : 'RENDERING / CANVAS 2D';
}

function animate(time) {
  // Cap at 30 FPS so this vanity project doesn't melt a laptop.
  if (time - lastTime >= 1000 / 30) {
    const delta = Math.min(2, (time - lastTime) / (1000 / 30)) || 1;
    lastTime = time;
    if (!document.hidden && (!paused || needsRender)) {
      if (!paused) phase += motion * 0.00022 * delta;
      render(delta);
      frame++;
      $('frame-label').textContent = `FRAME ${String(frame).padStart(5, '0')}`;
      needsRender = false;
    }
  }
  requestAnimationFrame(animate);
}

document.querySelectorAll('.study').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  document.querySelectorAll('.study').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('art-title').textContent = modes[mode][0];
  $('mode-caption').textContent = modes[mode][1];
  reset();
}));
document.querySelectorAll('.palette').forEach(button => button.addEventListener('click', () => {
  palette = button.dataset.palette;
  document.querySelectorAll('.palette').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('palette-label').textContent = palettes[palette].label;
  document.documentElement.style.setProperty('--accent', palettes[palette].colors[0]);
  reset();
}));
for (const name of ['density', 'motion', 'structure']) {
  $(name).addEventListener('input', () => {
    const value = Number($(name).value);
    $(`${name}-value`).value = String(value);
    if (name === 'density') density = value;
    if (name === 'motion') motion = value;
    if (name === 'structure') structure = value;
    if (name !== 'motion') reset();
    else needsRender = true;
  });
}
$('regenerate').addEventListener('click', () => {
  seed = crypto.getRandomValues(new Uint32Array(1))[0] % 999999 + 1;
  reset();
  $('notice').textContent = 'A new starting point. Same excellent lack of purpose.';
});
$('pause').addEventListener('click', () => { paused = !paused; updatePause(); });
$('export').addEventListener('click', () => {
  canvas.toBlob(blob => {
    if (!blob) { $('notice').textContent = 'Export failed. Try a smaller browser window.'; return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prism-${mode}-${palette}-${seed}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    $('notice').textContent = 'PNG export requested. Your masterpiece is mostly math.';
  }, 'image/png');
});
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (canvas.parentElement.requestFullscreen) await canvas.parentElement.requestFullscreen();
    else $('notice').textContent = 'Fullscreen is unavailable in this browser.';
  } catch { $('notice').textContent = 'The browser declined fullscreen. The art persists.'; }
});
reducedMotion.addEventListener('change', event => { if (event.matches) { paused = true; updatePause(); } });
if (!context) {
  $('notice').textContent = 'Canvas 2D is unavailable in this browser.';
  document.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
} else {
  new ResizeObserver(resize).observe(canvas.parentElement);
  updatePause();
  resize();
  requestAnimationFrame(animate);
}
