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
    7. units.forEach(renderFogOfWar)        ← fog from explored masks
    8. renderUnitVision(vtt)                ← current vision fog overlay
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

## ✅ COMPLETED PHASES (1-6)

All original phases have been implemented:
- Phase 1: WebGL enabled in main view
- Phase 2: Hybrid rendering (2D background + WebGL lighting composite)
- Phase 3: Fog of war + unit vision (CPU-based raycasting with wall occlusion, light-aware explored masks)
- Phase 4: Dynamic lights from units (unit.toLight() integrated into vision and lighting)
- Phase 5: Performance (lightingDirty flag, cached lighting canvas)
- Phase 6: UI controls (ConfigureLighting.tsx with darkness slider + globalLight toggle)

Additional features completed:
- Door toggle (click to open/close, visual states for open/closed/locked)
- Light-aware vision (darkvision + visible light sources extend vision)
- Per-unit explored masks (each unit tracks its own explored areas)

---

# VTT Phase 2 — Feature Plan

## Status: Pending

## Prerequisites
- Branch: `feature/webgl-lighting` (8 commits ahead of origin)
- All prior work committed (vision, fog of war, light-aware explored masks, door toggle)
- Build passes clean

---

## Feature 1: Animated Token Movement

### Goal
When a token is released to move, animate it cell-by-cell along the path instead of teleporting. Clear fog of war progressively as the token moves through each cell. Support multi-step movement (ctrl+click waypoints).

### Current Behavior
- `MouseHandler.mouseUp()` → calls `vtt.moveUnit(unit, toCell, true)` which instantly sets `unit.cell = to` and calls `renderAll()`
- Multi-step: `unit.#tempPositions[]` stores waypoint coordinates from ctrl+click, retrieved via `getTempPositions()`, but on final release the unit teleports directly to the last cell
- `unit.cell` setter adds new position to `#exploredAreas` and calls `updateExploredMask()`

### Implementation

#### Phase 1A: Core Animation System
**File: `src/vtt/classes/VTT.ts`**
- Add `animateMovement(unit: Unit, path: Cell[], broadcast: boolean): void`
  - Takes an array of `Cell` waypoints (including intermediate cells between waypoints)
  - Iterates through cells sequentially with a delay (~80-120ms per cell)
  - For each cell: set `unit.cell = cell` (triggers `updateExploredMask`), mark `lightingDirty`, call `renderAll()`
  - On final cell: clear `tempPosition`, broadcast if needed
  - Use `requestAnimationFrame` + timestamp tracking (not `setTimeout`) for smooth animation
  - During animation, block further mouse input (set an `#animating` flag checked in MouseHandler)

#### Phase 1B: Path Resolution
**File: `src/vtt/util/resolvePath.ts` (new)**
- `resolvePath(from: GridPosition, to: GridPosition, gridSize: Size): GridPosition[]`
  - Given two grid positions, returns all intermediate cells the token passes through
  - Walk cell-by-cell using Bresenham's line or simple step-by-step (move one axis at a time)
  - For multi-step paths: resolve each segment, concatenate, deduplicate

#### Phase 1C: MouseHandler Integration
**File: `src/vtt/input/MouseHandler.ts`**
- In `mouseUp()`: instead of calling `vtt.moveUnit(unit, toCell, true)` directly:
  1. Collect full path: `unit.cell` → each tempPosition → `toCell`
  2. Resolve intermediate cells for each segment via `resolvePath`
  3. Call `vtt.animateMovement(unit, resolvedPath, true)`
  4. Clear `tempPositions` after handing off to animation

### Files Modified
- `src/vtt/classes/VTT.ts` — add `animateMovement`, `#animating` flag
- `src/vtt/input/MouseHandler.ts` — use animation instead of instant move
- `src/vtt/util/resolvePath.ts` — **new file**

### Tests
- `src/tests/vtt/util/resolvePath.test.ts` — test path resolution for straight, diagonal, multi-step

---

## Feature 2: Wall-Crossing Visual Indicator

### Goal
When a movement path crosses a wall, show a visual warning on the line between points. Don't block the movement.

### Current Behavior
- `Unit.drawPath()` draws lines between waypoints with distance labels
- No wall intersection checking on movement paths
- Walls are in `MapData.walls[]` and `MapData.doors[]` (closed doors)

### Implementation

#### Phase 2A: Wall Intersection Detection
**File: `src/vtt/util/segmentIntersectsWall.ts` (new)**
- `segmentIntersectsWalls(start: Coordinates, end: Coordinates, walls: Wall[]): Coordinates[]`
  - For each wall segment, check line-line intersection with the movement segment
  - Return array of intersection points (empty if no crossings)
  - Use standard line segment intersection math (parametric approach)

#### Phase 2B: Visual Indicator in drawPath
**File: `src/vtt/classes/Unit.ts`**
- In `drawPath()`, after drawing each line segment between positions:
  1. Collect vision-blocking walls (reuse `collectVisionWalls()`)
  2. Call `segmentIntersectsWalls` for the segment
  3. If intersections found: draw the segment in red/orange instead of white, and draw X markers or warning icons at each intersection point
  4. Keep the existing distance text rendering unchanged

### Files Modified
- `src/vtt/classes/Unit.ts` — add wall-crossing visual in `drawPath()`
- `src/vtt/util/segmentIntersectsWall.ts` — **new file**

### Tests
- `src/tests/vtt/util/segmentIntersectsWall.test.ts` — test intersection detection with various wall/segment configurations

---

## Feature 3: Per-Token Vision & Exploration

### Goal
When one or more tokens are selected, only show their vision and explored areas. Each token tracks its own explored mask independently. GM users see everything when no token is selected; other players only see what their token(s) have explored.

### Current Behavior
- `renderUnitVision`: uses `vtt.selectedUnits.length > 0 ? vtt.selectedUnits : vtt.units` — already partially correct for vision
- `renderFogOfWar(unit)`: called once per unit in `renderLoop`, draws fog per-unit — but currently iterates ALL units, not just selected
- Each `Unit` already has its own `#exploredMask` and `#exploredAreas` — per-token exploration is already tracked
- No concept of GM vs player roles yet

### Implementation

#### Phase 3A: Selective Fog of War Rendering
**File: `src/vtt/classes/VTT.ts`**
- In `renderLoop`, change `this.units.forEach((unit) => renderFogOfWar(unit))` to:
  - If selectedUnits.length > 0: only call `renderFogOfWar` for selected units, merging their explored masks
  - If no units selected AND user is GM: skip fog of war entirely (show everything)
  - If no units selected AND user is player: merge all owned unit explored masks
- This requires a merged fog render function or compositing multiple explored masks

#### Phase 3B: Merged Explored Mask Rendering
**File: `src/vtt/renderFunctions/renderFogOfWar.ts`**
- Refactor `renderFogOfWar` to accept `Unit[]` instead of a single `Unit`
- Create a combined explored mask by compositing (source-over) all provided units' masks onto one temporary canvas
- Punch out the combined explored area from the fog overlay

#### Phase 3C: User Role System (Minimal)
**File: `src/vtt/classes/VTT.ts`**
- Add `#isGM: boolean` property (default: `true` for now, can be set via context/UI later)
- Expose getter/setter
- Logic: GM with no selection → no fog. Player with no selection → only show owned unit exploration

#### Phase 3D: Vision Rendering Update
**File: `src/vtt/renderFunctions/renderUnitVision.ts`**
- Already handles selected vs all units correctly
- Add GM logic: if GM and no selection, skip the fog overlay entirely (return early)

### Files Modified
- `src/vtt/classes/VTT.ts` — GM flag, selective fog rendering in renderLoop
- `src/vtt/renderFunctions/renderFogOfWar.ts` — accept Unit[], merge masks
- `src/vtt/renderFunctions/renderUnitVision.ts` — GM skip logic

---

## Feature 4: Lighting Settings (Global Illumination & Darkness)

### Goal
- **Global Illumination = true**: reveal entire map, no fog of war (only unexplored areas remain black for players)
- **Darkness slider**: controls how dark the fog of war is (0 = fully lit areas are clear, 1 = maximum fog). Unexplored areas are always 100% black regardless of darkness setting.

### Current Behavior
- `ConfigureLighting.tsx` has UI for `globalLight` checkbox and `darkness` slider (0-1), stored in `MapData`
- `renderLightsWithWalls.ts` reads `mapData.darkness` to set ambient light alpha (line 69-70)
- `renderUnitVision.ts` hardcodes fog opacity to `rgba(0, 0, 0, 0.8)` — ignores darkness
- `renderFogOfWar.ts` uses solid `rgb(0, 0, 0)` for unexplored — correct behavior
- `globalLight` is not read by any render function

### Implementation

#### Phase 4A: Global Illumination
**File: `src/vtt/renderFunctions/renderUnitVision.ts`**
- At the top of `renderUnitVision()`: check `vtt.mapData?.globalLight`
- If `globalLight === true`: skip the entire fog overlay (return early — the map is fully visible)
- This means: no vision fog, but `renderFogOfWar` still applies (unexplored areas stay black for players)

#### Phase 4B: Darkness Slider Affects Fog Opacity
**File: `src/vtt/renderFunctions/renderUnitVision.ts`**
- Replace hardcoded `rgba(0, 0, 0, 0.8)` with `rgba(0, 0, 0, ${darkness})`
- Read `darkness` from `vtt.mapData?.darkness ?? 0.8`
- When `darkness = 0`: fog is fully transparent (everything visible within LOS)
- When `darkness = 1`: fog is fully opaque outside vision/light (maximum darkness)

#### Phase 4C: Ensure Unexplored Stays Black
**File: `src/vtt/renderFunctions/renderFogOfWar.ts`**
- Verify that unexplored areas always use `rgb(0, 0, 0)` (fully opaque) regardless of darkness
- Currently correct — no changes needed unless Feature 3 changes break this

### Files Modified
- `src/vtt/renderFunctions/renderUnitVision.ts` — globalLight check, darkness-driven fog opacity
- `src/vtt/renderFunctions/renderFogOfWar.ts` — verify/preserve behavior

---

## Implementation Order (Recommended)

1. **Feature 4** (Lighting Settings) — smallest scope, isolated changes to 2 render functions, no new files
2. **Feature 3** (Per-Token Vision) — moderate scope, requires refactoring fog rendering but builds on existing per-unit masks
3. **Feature 2** (Wall-Crossing Indicator) — self-contained, new utility + small UI change in drawPath
4. **Feature 1** (Animated Movement) — largest scope, touches movement flow, needs animation system, path resolution, input blocking

This order minimizes conflicts: Feature 4 establishes the lighting foundation, Feature 3 refactors fog rendering (which Feature 1 will interact with), Feature 2 is independent, and Feature 1 is done last when the rendering pipeline is stable.

---

## Constraints (from user)
- CPU approach for now; GPU optimization later if performance issues arise
- Walls always block unit vision; light extends vision range
- Open doors do not block vision
- Don't block wall-crossing movement, just indicate it visually
- GM sees everything when no token selected; players see only their tokens' explored areas
- Unexplored areas are always 100% black; darkness slider only affects fog of war opacity
- Vision rays extend as long as they are in an illuminated area (no chaining around corners)
