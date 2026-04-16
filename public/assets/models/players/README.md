# Player GLB Models

Drop player GLB files here:

- `male-player.glb` — Male outfield player with skeletal rig + animation clips
- `female-player.glb` — Female outfield player with same rig + clips
- `kid-player.glb` — Kid player with same rig + clips, smaller proportions

Goalkeeper variants use the same models with gloves mesh toggled on.

## Required Animation Clips (embedded in each GLB)

idle, walk, jog, run, sprint, shoot, volley, header, pass, tackle-standing,
slide-tackle, press, intercept, block-shot, jockey, change-direction,
throw-in, call-for-pass, jump, gk-idle, gk-dive-left, gk-dive-right,
gk-dive-top-left, gk-dive-top-right, gk-dive-bottom-left, gk-dive-bottom-right,
gk-jump-parry, gk-collect, gk-kick, gk-volley-kick, gk-pass

## Specs

- All models must share the **same skeleton** (clip interchangeability)
- < 5K triangles per model
- Draco compressed geometry
- Embedded textures (basis/KTX2 preferred)
