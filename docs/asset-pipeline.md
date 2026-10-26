# Character assets: local operation and rebuild

## Current assets
The viewer serves `public/assets/characters/man.glb`, `woman.glb`, and `child.glb` locally. Each file contains a skinned character and four skeletal clips: Idle, Walk, Run, Jump. Original adult meshes and locomotion clips are by Quaternius (CC0 1.0). **Child proportions and all three Jump clips are project-derived**, explicitly labeled in the interface. This is not a facial-animation or motion-capture claim.

See [attribution](../public/assets/characters/ATTRIBUTION.md), [manifest](../public/assets/characters/asset-manifest.json), and [validation](../.kiro/specs/rigged-character-assets/validation.md). The original selected GLBs are preserved in `tools/assets/source/`; SHA256 hashes identify both source and generated outputs. Original downloads and investigation evidence are in ignored `.local/asset-audit/milestone-6/` on this machine, but rebuilding does not need that directory or network access.

## Run
From the repository root:

```powershell
./scripts/project.ps1 dev
# Or validate and serve the production result:
./scripts/project.ps1 build
./scripts/project.ps1 preview
```

Node.js and pnpm requirements remain in README. No model account, API key, paid service, Blender process or CDN is needed at runtime. The GLTFLoader module loads on demand from the same local build.

Choose Man, Woman, or Child. The status changes from Loading to Rigged Ready after actual decode and clip validation. Movement, Run, Jump, cameras, lighting and expressions work through the existing controls. First person hides the selected character and its speech overlay. Text editing stops movement. Changing characters preserves world position, motion authority, emotion and text.

If a model cannot load, the page explicitly shows **FALLBACK**, an error and **Retry character**. The procedural fallback is still controllable; it is not counted as successful GLB loading. Restore the missing/corrupt local asset, then Retry or choose another character. Rapid selection only adopts the newest result. Reload is not required for retry.

## Rebuild with the installed Blender 5.2
This project uses the existing Blender 5.2.2 LTS at `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`. No installation or add-on is required. From the repository root:

```powershell
$env:BLENDER_USER_RESOURCES = Join-Path (Get-Location) '.local/blender-profile'
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --factory-startup --disable-autoexec --background --python tools/assets/prepare_characters.py
node --experimental-transform-types --test --test-isolation=none tests/*.test.mjs
./scripts/project.ps1 build
```

The script imports the preserved GLBs as data, retains Idle/Walk/Run, removes helper geometry and unused actions, authors an in-place articulated Jump on the target rig, and exports the three GLBs plus a fresh manifest. The child uses shorter legs, a shorter/wider torso and a relatively larger head, with mesh and rest-bone deformation performed together. Jump rotations use world-aligned bend axes transformed into each bone's base local space; the regression test rejects crossed wrists.

Generated SHA256 hashes can change if Blender/exporter versions change. Revalidate the actual outputs; do not blindly copy old expected hashes. Runtime normalizes feet and height to 1.8m / 1.68m / 1.15m and maps clips explicitly. AnimationMixer never drives the outer world transform; CharacterController continues to own world translation and jumping physics.

## Validation and limits
Automated tests parse all three real GLBs, verify skinning and four clips, proportion changes, Jump pose, target height/feet, action transitions, controller transform, disposal, stale requests, missing clips and retry. Production browser evidence includes real loading, deliberate unavailable-asset failure and restored Retry, three variants, motion, first person, fisheye, expressions, responsive layout and renderer counters.

The footer's draw/triangle counters include all render passes in that frame, including fish-eye capture plus its screen pass. Geometry/texture counts are recorded during validation to check for obvious growth. FPS is a short local sample, not a benchmark or cross-device guarantee. The existing main-chunk >500kB advisory remains; loader splitting reduces its startup dependency, not the cost of Three.js and animation code already used by the app.

Still unverified: cross-GPU/multi-browser compatibility, real touch-device performance, deliberate graphics context loss, actual screen-reader and physical IME operation. The earlier near-obstacle Front camera occlusion observation belongs to camera-modes and is not repaired by this asset integration. No collision, navigation, rendering backend or camera-policy changes are implied.
