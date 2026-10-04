# ◭ PRISM / Experimental Field Lab

**A field guide to beautiful noise.**

A deliberately over-designed procedural art toy. Choose a study, disturb the parameters, and save something pretty. No AI inference, imaginary revenue, or venture capital required.

## Three studies

- **Silk current:** seeded particles drift through a trigonometric vector field and leave fine trails.
- **Harmonic bloom:** layered polar curves form a gently shifting geometric flower.
- **Strange attractor:** a Clifford-style iterative map deposits a cloud of colorful points.

Four palettes, live density/motion/structure controls, regeneration, pause/resume, fullscreen where supported, and PNG export of the actual canvas. No backend, accounts, tracking, or npm dependencies. The canvas is capped at 30 FPS and 2× pixel density. Reduced-motion users start with a paused, pre-rendered composition.

## Run it

Node.js 18 or later:

```sh
npm start
```

Open http://localhost:3000. You can also open `index.html` directly. Optional Google Fonts are the only external resource; fallback fonts work offline.

```sh
npm run check
```

Syntax checks only. No build step. Publish `index.html`, `styles.css`, and `app.js` on any static host, or use GitHub Pages from the root of the main branch.

## Details

HTML + CSS + Canvas 2D + vanilla JavaScript. The displayed seed controls initial particle positions and composition. An identical seed, study, settings, canvas size and frame sequence reproduce the same drawing; different frame timing and window sizes can change the result. PNG export saves the artwork, not the surrounding interface. Settings reset on refresh.

Local server defaults to localhost. Set `PORT` if port 3000 is occupied. The server is a development convenience, not production infrastructure.

MIT licensed. No profound meaning included.
