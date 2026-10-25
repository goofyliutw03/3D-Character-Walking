# Stage 1.2 — City scene foundation

Implemented on 2026-10-24 following the user's instruction to continue.

## Delivered

- `SceneRenderer`: WebGL2 rendering, capped pixel ratio, resize observation, tone mapping, shadows, and disposal.
- `CityScene`: reusable geometry/materials for an eight-building street, sidewalks, crossing, trees, benches, and streetlights. All geometry is generated locally with no external asset downloads.
- `ViewerApp`: animation loop, orbit controls, smooth overview/street/overhead transitions, reduced-motion preference, graphics-context status, frame-rate sampling, and disposal.
- Responsive control panel with daylight/golden-hour lighting, functional shadow toggle, camera reset, and actual renderer status.

## Validation

- TypeScript checking and production build pass.
- Browser verification: the scene renders; overview, street-level, and overhead views switch; drag orbit and wheel zoom work; reset returns to overview.
- Daylight/golden-hour changes and shadow disable/re-enable verified visually. A discovered shader-refresh issue when disabling shadows was fixed by updating material programs and the light's shadow flag.
- Desktop and 390 × 844 responsive viewport checked. The canvas resizes, mobile controls move beneath the scene, and the page has no horizontal overflow.
- No browser errors observed. An initial obsolete `PCFSoftShadowMap` warning was corrected by using `PCFShadowMap`.
- The production bundle includes Three.js and currently triggers Vite's 500 kB chunk advisory (about 567 kB minified / 143 kB gzip). No new runtime dependencies were added. Future asset loading can introduce route/module splitting when appropriate.

Context-loss recovery and the initialization-error message are implemented, but intentional GPU-context failure and unsupported-browser testing were not performed. Mobile checks emulate viewport size, not physical-device touch performance. Orbit panning is implemented by OrbitControls but was not separately exercised in this milestone.

## Next stage design: character prototype

Create a `Character` class owning a procedural articulated human model and variant configuration for man/woman/child. Mark these as prototypes in the UI until freely licensed rigged GLB assets are integrated. Use meter-based proportions and Y-up coordinates.

Keep input separate from movement. `InputManager` exposes movement, run, and jump intent; `CharacterController` owns horizontal velocity, heading, grounded state, gravity, and jump impulse. A state machine selects idle/walk/run/jump from observable movement. Clear held inputs when the page loses focus and ignore movement keys while editing speech text or controls.

Add a follow-camera strategy targeting the character transform, with a switch to free orbit. Accept only grounded jumps, normalize diagonal input, clamp frame time, and constrain the character to the walkable street/sidewalk area. Validate movement speed, stop/run transitions, jump landing, focus loss, and camera switching. Speech and emotions follow once character anchors exist.

This next stage is a design proposal; characters and movement are not implemented in Stage 1.2.
