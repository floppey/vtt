# WebGL Lighting Integration Plan

## Goal

Integrate the working WebGL lighting engine (`src/webgl/lighting.ts`) — currently only used in the `/webgl` demo page — into the main VTT application view (`/local` and `/session`). The lighting must work alongside pan, zoom, tokens, grid, doors, fog of war, and all existing VTT features.

---

## Current State

### What Works (Done)

- **WebGL lighting engine** (`src/webgl/lighting.ts`, ~1019 lines): Full WebGL2 pipeline with 1D shadow maps, per-light FBO rendering, additive accumulation, multiply-blend compositing. Handles walls, doors (closed), tinting, ambient light.
- **Demo page** (`src/app/webgl/page.tsx`): Standalone interactive demo with draggable lights, ambient control, background image rendering. Fully working.
- **Partial integration in VTT engine** (`src/vtt/classes/VTT.ts`):
  - Already imports `initLighting`, `resizeLighting`, `destroyLighting` from `@/webgl/lighting`.
  - `init()` looks for a `<canvas id="webgl">` in the DOM, gets WebGL2 context, and calls `initLighting()`.
  - `resizeCanvases()` already calls `resizeLighting()`.
  - `renderLightsWithWalls.ts` already has a WebGL path (`renderLightsWebGL`) that calls `renderLighting()` and composites onto the 2D background canvas via `ctx.drawImage(webglCanvas, 0, 0)` with `multiply` blend.
- **LocalVttWrapper** (`src/components/LocalVttWrapper.tsx`): Already includes `<canvas id="webgl">` in the DOM — WebGL lighting is available in `/local`.

### What's Missing

| Gap | Where | What to do |
|-----|-------|------------|
| No WebGL canvas in multiplayer wrapper | `VttWrapper.tsx` | Add `<canvas id="webgl">` between background and foreground |
| Scene texture not loaded into WebGL | `VTT.ts` `onImageLoad()` | Call `loadSceneTexture(state, image)` when background image loads |
| No `renderScene()` call before lighting | `renderLightsWithWalls.ts` | Optionally call `renderScene()` if we want WebGL to draw the background |
| Canvas2D fallback code still present | `renderLightsWithWalls.ts` | Keep as fallback (WebGL2 not available on all devices) |
| Fog of war disabled | `VTT.ts` render loop | Currently commented out — needs WebGL-aware fog strategy |
| Unit vision disabled | `VTT.ts` render loop | Currently commented out — needs WebGL-aware vision strategy |
| `destroyLighting()` not called on cleanup | `VTT.ts` | Add to any destroy/cleanup path |

---

## Architecture

### Canvas Stack (Current)

```
#hud (div — CSS transform: scale(zoom), position: top/left for pan)
  ├── #background (2D canvas — background image, grid, walls, doors, lighting composite)
  ├── #webgl     (WebGL2 canvas — lighting only, exists in LocalVttWrapper only)
  └── #foreground (2D canvas — units/tokens, selection, grid foreground)
```

### Pan/Zoom Mechanism

Pan and zoom are **CSS-only** on the `#hud` div:
- Pan: `#hud.style.top/left` set to `vtt.getPosition()`
- Zoom: `#hud.style.transform = scale(zoom)`
- All canvases are sized to full map pixel dimensions (e.g., 3300×3750)
- **No canvas context transforms** — draw calls use map pixel coordinates directly
- This means WebGL lighting needs **zero coordinate changes** for pan/zoom — it inherits the CSS transform automatically

### Render Pipeline (Current)

```
renderLoop() {
  if (renderConditions.background) {
    1. Clear background canvas → fill black
    2. drawImage(backgroundImage, 0, 0)     ← 2D canvas
    3. grid.draw()                          ← 2D grid lines
    4. renderWalls(vtt)                     ← 2D debug wall overlay
    5. renderDoors(vtt)                     ← 2D door icons
    6. renderLightsWithWalls(vtt) {
         if (lightingState) {
           renderLighting(state, walls, lights, ambient)  ← WebGL
           ctx.drawImage(webglCanvas, 0, 0)               ← composite onto 2D
         } else {
           buildLightingCanvas(vtt)                       ← Canvas2D fallback
           ctx.drawImage(lightingCanvas, 0, 0)            ← composite onto 2D
         }
       }
    // 7. renderFogOfWar     ← commented out
    // 8. renderUnitVision   ← commented out
  }

  if (renderConditions.foreground) {
    1. Clear foreground canvas
    2. grid.drawForeground()   ← cell selection highlights
    3. units.forEach(draw)     ← tokens/units
    4. Debug text overlay
  }
}
```

### Data Flow

```
demo_medium.json
  → convertFoundryToMapData()      (in mapSettingsContext.tsx)
  → MapData { walls, lights, doors, size, cellSize, backgroundImage, darkness, globalLight }
  → VttWrapper sets vtt.mapData
  → VTT.renderLoop → renderLightsWithWalls(vtt)
    → reads vtt.mapData.walls, .lights, .doors
    → passes to renderLighting(state, allWalls, lights, ambientLight)
```

---

## Implementation Plan

### Phase 1: Enable WebGL in Main View (Minimal Changes)

**Goal**: Get the existing WebGL lighting working in both `/local` and `/session` views.

#### Step 1.1: Add WebGL canvas to VttWrapper

**File**: `src/components/VttWrapper.tsx`

Add a `<canvas id="webgl">` between background and foreground canvases, matching LocalVttWrapper:

```tsx
<div id="hud">
  <canvas ref={backgroundCanvasRef} id="background" width="800" height="600" />
  <canvas ref={webGlCanvasRef} id="webgl" width="800" height="600" />
  <canvas ref={foregroundCanvasRef} id="foreground" width="800" height="600" />
</div>
```

Also add the ref: `const webGlCanvasRef = useRef<HTMLCanvasElement>(null);`

#### Step 1.2: Load scene texture on image load

**File**: `src/vtt/classes/VTT.ts`

In `onImageLoad()`, after `resizeGrid()`, upload the background image to the WebGL lighting state:

```ts
import { loadSceneTexture } from "@/webgl/lighting";

private onImageLoad() {
  this.#zoom = 1;
  this.resizeGrid();
  this.#loading = false;
  if (this.#lightingState && this.#backgroundImage) {
    loadSceneTexture(this.#lightingState, this.#backgroundImage);
  }
}
```

#### Step 1.3: Verify cleanup

**File**: `src/vtt/classes/VTT.ts`

Ensure `destroyLighting()` is called when VTT is torn down. Check if there's an existing `destroy()` method — if not, add cleanup to `init()` (which already re-runs on re-mount and resets state). Currently `init()` re-creates `lightingState` from scratch each time, which is fine as long as the old WebGL resources are freed. Add:

```ts
// In init(), before re-creating lightingState:
if (this.#lightingState) {
  destroyLighting(this.#lightingState);
  this.#lightingState = null;
}
```

#### Step 1.4: Verify it works

After these changes:
1. Run `npm run dev`
2. Navigate to `/local` — should work as before with WebGL lighting
3. Navigate to a session page — should now also have WebGL lighting
4. Verify: pan (right-drag), zoom (scroll wheel), and token placement all work correctly
5. Check browser console for WebGL errors

**Expected**: Lighting renders identically to the `/webgl` demo, but within the full VTT with pan/zoom/tokens.

---

### Phase 2: Rendering Strategy Decision

The current approach is **hybrid**: background image is drawn by 2D canvas, then WebGL lighting is multiply-composited on top. This works but has a decision point:

#### Option A: Keep Hybrid (Recommended for now)

- Background image drawn by 2D canvas (`ctx.drawImage`)
- WebGL renders lighting only → composited via `ctx.drawImage(webglCanvas)` with multiply blend
- **Pros**: Minimal changes, 2D canvas handles grid/walls/doors/fog naturally
- **Cons**: Extra composite step per frame, slight overhead

#### Option B: Full WebGL Scene (Future optimization)

- Background image rendered by WebGL via `renderScene()`
- Lighting rendered on top in same WebGL pipeline
- Final WebGL output composited onto 2D canvas (or replaces it)
- **Pros**: Single GPU pipeline for background + lighting, no CPU-side multiply composite
- **Cons**: Grid, walls, doors would need to either stay on 2D canvas (layered on top) or be ported to WebGL shaders

**Recommendation**: Start with Option A (Phase 1). Move to Option B only if profiling shows the composite is a bottleneck.

---

### Phase 3: Fog of War + Unit Vision (Currently Disabled)

The fog of war and unit vision systems are currently commented out in `VTT.ts renderLoop()`. They need a strategy for working alongside WebGL lighting.

#### Current fog implementation (2D canvas):
- `renderFogOfWar.ts`: Creates a black canvas, cuts out circles for explored areas using `destination-out`, composites onto background
- `renderUnitVision.ts`: Creates a semi-transparent black overlay, cuts out vision radii around units with gradients

#### Integration options:

**Option 1: Keep fog on 2D canvas (simplest)**
- Uncomment the fog calls in renderLoop
- Fog composites onto 2D background canvas AFTER the WebGL lighting composite
- Render order: background image → grid → walls → doors → WebGL lighting composite → fog of war → unit vision
- Works because fog is drawn last and occludes both scene and lighting

**Option 2: Move fog to WebGL (better visuals)**
- Fog becomes part of the WebGL pipeline
- Vision radius per-unit could be another light source (Unit.toLight() already exists)
- Unexplored areas are fully dark in the lighting pass
- **Pros**: Fog interacts naturally with lighting (explored areas are lit, unexplored are dark)
- **Cons**: Requires shader changes, more complex state management

**Recommendation**: Start with Option 1 to get fog working again, then consider Option 2 for better visual integration.

---

### Phase 4: Dynamic Lights from Units

`Unit.ts` already has a `toLight()` method that converts a unit's position into a `Light` object. This can be used for:
- Token vision (each unit emits a vision light)
- Torch-carrying units
- Spell effects

#### Integration:
In `renderLightsWebGL()` (`renderLightsWithWalls.ts`), combine map lights with unit lights:

```ts
const unitLights = vtt.units
  .filter(unit => unit.hasVision) // or some criteria
  .map(unit => unit.toLight());

const allLights = [...mapData.lights, ...unitLights];
renderLighting(state, allWalls, allLights, ambientLight);
```

This requires no WebGL changes — `renderLighting()` already accepts an array of lights.

---

### Phase 5: Performance Optimizations

#### 5.1: Conditional WebGL rendering

Currently `renderLoop()` re-renders lighting every time the background is dirty. Since lighting only changes when lights or walls change (not on every pan/zoom), we could:
- Track a `lightingDirty` flag
- Only call `renderLighting()` when lights/walls/doors change
- Cache the WebGL output and reuse the composite

Note: Pan/zoom is CSS-based and doesn't trigger re-renders, so this is already partially optimized.

#### 5.2: Wall VBO caching

`buildWallVBO()` in `lighting.ts` currently rebuilds per-light per-frame. For static maps (walls don't move), we could cache the VBO data per-light and only rebuild when walls change.

#### 5.3: Shadow map resolution

`SHADOW_MAP_SIZE` is 1024 in `lighting.ts`. This can be tuned:
- 512 for lower-end devices
- 2048 for high-quality shadows on capable GPUs
- Could be a user-configurable setting

---

### Phase 6: UI Controls

Add UI for controlling lighting parameters. Location: existing toolbar components (`src/components/ui/toolbars/`).

Possible controls:
- Ambient light slider (0.0 – 1.0)
- Toggle lighting on/off
- Debug: show shadow maps
- Per-light controls (if implementing a light editor)

---

## File Change Summary

| File | Change | Phase |
|------|--------|-------|
| `src/components/VttWrapper.tsx` | Add `<canvas id="webgl">` + ref | 1 |
| `src/vtt/classes/VTT.ts` | Call `loadSceneTexture()` in `onImageLoad()`, cleanup in `init()` | 1 |
| `src/vtt/renderFunctions/renderLightsWithWalls.ts` | (No changes for Phase 1 — already has WebGL path) | — |
| `src/vtt/renderFunctions/renderLightsWithWalls.ts` | Add unit lights to lighting pass | 4 |
| `src/vtt/classes/VTT.ts` | Uncomment fog of war calls | 3 |
| `src/webgl/lighting.ts` | Performance optimizations (VBO caching, configurable shadow res) | 5 |
| `src/components/ui/toolbars/` | Lighting UI controls | 6 |

## Key Invariants

- **Pan/zoom requires no WebGL changes** — CSS transforms on `#hud` apply to all canvases equally
- **Tokens render independently** — foreground canvas is separate from lighting
- **WebGL canvas size must match background canvas** — `resizeCanvases()` already handles this
- **Canvas2D fallback must be preserved** — not all browsers support WebGL2 + float textures
- **Wall/door data flows from `mapData`** — no separate wall state management needed

## Dependencies Between Phases

```
Phase 1 (Enable WebGL) ← required for everything else
  ├── Phase 2 (Rendering strategy) — independent decision
  ├── Phase 3 (Fog of war) — can be done independently
  ├── Phase 4 (Unit lights) — can be done independently  
  ├── Phase 5 (Performance) — do after 3 & 4
  └── Phase 6 (UI controls) — can be done anytime after Phase 1
```

Phase 1 is the only blocking prerequisite. Phases 2–6 can be done in any order.
