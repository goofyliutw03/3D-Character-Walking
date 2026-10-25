# Setup validation — 2026-10-19

- Connected `origin` to https://github.com/goofyliutw03/3D-Character-Walking.git.
- Fetched GitHub `main` and linked local `main` to its history. All pre-existing local files were preserved. GitHub initially contained only a README.
- Restored missing dependencies: Three.js 0.186.1, TypeScript 7.0.2, Vite 8.3.4, and Three.js types 0.186.0. Added the pnpm lockfile and package manager version.
- Excluded the local pnpm store from Git.
- Installation required `NODE_USE_SYSTEM_CA=1` in this machine's environment; certificate verification remained enabled. This was a process-local setting.
- `./scripts/project.ps1 build` passed both TypeScript checking and Vite production compilation.
- The Vite development server started at http://127.0.0.1:5173/ and returned HTTP 200.

This verifies the project skeleton and HTTP serving. No rendered 3D scene or browser interaction has been validated; the scene implementation is the next stage. Changes have not been committed or pushed.

See [the current plan and stage 1.2 design](development-plan.md).
