# Environment asset provenance

2026-11-22 handoff snapshot.

| Runtime asset | Editable source | Generator |
| --- | --- | --- |
| `furnished-room.glb` | `tools/assets/furnished-room/furnished-room.blend` | `tools/assets/prepare_furnished_room.py` |
| `manor.glb` | `tools/assets/manor/manor.blend` | `tools/assets/prepare_manor.py` |

The checked-in generators author geometry and materials procedurally in Blender; they do not download third-party assets. `3DScenen/Scene.LivingRoom.blend` is an additional living-room authoring file retained for handoff. Its `.blend1` automatic backup remains local and is not required to run or rebuild the Viewer.

These are project-authored environment assets. No separate CC0 dedication or third-party redistribution license is asserted by this handoff document; follow the repository owner's permission for reuse or external redistribution. The existing character and city asset CC0 notices apply to those separate asset directories, not automatically to these environments.

File sizes and SHA256 are recorded in `asset-manifest.json`. For Python generators, measure UTF-8 bytes after normalizing line endings to LF so the values are portable across Git checkouts. Hash binary assets as-is. Runtime GLBs are committed so normal Viewer use does not require Blender or remote asset downloads. Run the generators only in a deliberately selected Blender authoring session because they modify Blender scene state.
