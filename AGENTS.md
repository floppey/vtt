# AGENTS.md — VTT (Virtual Tabletop)

## Project Overview

A Virtual Tabletop web application built with Next.js 15, React 19, and TypeScript 5. Uses HTML Canvas for 2D rendering, WebGL for lighting, and Ably for real-time multiplayer via websockets. The core VTT engine is a class-based system (`src/vtt/`) with React wrapper components (`src/components/`).

## Build / Dev / Test Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (next lint)
npm test             # Run all tests (Jest)
npm run test:watch   # Run tests in watch mode

# Run a single test file
npx jest src/tests/util/clamp.test.ts

# Run tests matching a pattern
npx jest --testPathPattern="clamp"

# Run a specific test by name
npx jest -t "should clamp value within range"
```

## Project Structure

```
src/
  api/                  # Client-side API call functions (fetch wrappers)
  app/                  # Next.js App Router pages (layout.tsx, page.tsx)
    local/              # Local (single-player) game page
    session/            # Multiplayer session pages
    webgl/              # WebGL experiment page
  components/           # React components
    ui/toolbars/        # Toolbar UI components
    ui/windows/         # Window/dialog UI components
  context/              # React Context providers and hooks
  data/mapData/         # Static map data JSON files
  pages/api/            # Next.js Pages Router API routes (Ably integration)
  styles/               # CSS (globals.css, CSS modules)
  tests/                # All test files (mirrors src/ structure)
    util/               # Tests for src/util/
    validation/         # Tests for src/validation/
    vtt/util/           # Tests for src/vtt/util/
  util/                 # Generic utility functions
  validation/           # Validation framework (Validator classes)
  vtt/                  # Core VTT engine (non-React)
    classes/            # Core classes: VTT, Grid, Cell, Unit, BaseClass
    input/              # Mouse and keyboard input handlers
    interface/          # (empty — reserved)
    renderFunctions/    # Canvas 2D render functions (walls, doors, fog, lighting)
    types/              # Type definitions and map data types
    util/               # VTT-specific utilities (distance, map conversion)
  webgl/                # WebGL rendering (shaders, setup)
  websockets/           # Ably subscriber component
```

## Tech Stack

- **Framework**: Next.js 15 (App Router + Pages Router coexist)
- **React**: 19 with `"use client"` directives where needed
- **TypeScript**: 5, strict mode enabled
- **Testing**: Jest 29 + ts-jest, `@testing-library/react`
- **Realtime**: Ably (websockets)
- **Rendering**: HTML Canvas 2D + WebGL (via twgl.js)
- **Linting**: ESLint with `next/core-web-vitals` + `next/typescript`

## Code Style

### TypeScript

- **Strict mode** is enabled. Do not use `as any`, `@ts-ignore`, or `@ts-expect-error` unless truly unavoidable (existing usage in Validator.ts is documented with explanation comments).
- **Path alias**: Use `@/` for imports from `src/`. Configured in tsconfig.json and jest.config.js.
- **Unused variables**: Prefix with `_` (e.g., `_unused`). The ESLint rule `@typescript-eslint/no-unused-vars` is set to `error` with `argsIgnorePattern: "^_"`.

### Types & Interfaces

- **Simple types**: Use `type` aliases in shared files (`src/vtt/types/types.ts`):
  ```ts
  export type Size = { width: number; height: number };
  export type Coordinates = { x: number; y: number };
  ```
- **Component props / API contracts**: Use `interface`, defined at the top of the file that uses them or co-located in the same module:
  ```ts
  interface VttWrapperProps {
    channel: string;
  }
  ```
- **Exported interfaces** used across modules go in the file that owns the concept (e.g., `AddUnitRequest` in `pages/api/addUnit.ts`, imported by `api/postAddUnit.ts`).

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files (components) | PascalCase.tsx | `VttWrapper.tsx`, `ConfigureMap.tsx` |
| Files (utilities) | camelCase.ts | `clamp.ts`, `generateGuid.ts` |
| Files (classes) | PascalCase.ts | `VTT.ts`, `BaseClass.ts`, `Unit.ts` |
| Files (render functions) | camelCase.ts | `renderWalls.ts`, `renderDoors.ts` |
| React components | PascalCase, `const` + arrow fn | `export const VttWrapper: React.FC<Props>` |
| Classes | PascalCase | `class VTT extends BaseClass` |
| Functions | camelCase | `clamp()`, `generateGuid()` |
| Types/Interfaces | PascalCase | `type Coordinates`, `interface MapSettings` |
| Private fields | `#` prefix (ES private) | `#zoom`, `#canvas`, `#position` |
| Directories | camelCase | `renderFunctions/`, `mapData/` |

### Imports

- Use `@/` path alias for all non-relative imports from `src/`.
- Relative imports (`../`) are acceptable within the same module (e.g., within `vtt/`).
- Import ordering (observed convention):
  1. External packages (`react`, `next`, `ably`)
  2. Internal `@/` aliases
  3. Relative imports (`../`, `./`)

### Exports

- **Components**: Named exports (`export const VttWrapper`).
- **Classes**: Mixed — `export class VTT` (named) and `export default class Unit` (default). Prefer named exports for new code.
- **Utilities**: Named exports (`export const clamp`).
- **API route handlers**: `export default async function handler(...)`.

### Components

- Functional components only, typed as `React.FC<Props>`.
- Use `"use client"` directive at the top of client components.
- State management: React Context (`src/context/`) with custom hooks (`useVtt`, `useMapSettings`, `useUser`).
- Context pattern: `createContext` + `Provider` component + `useXxx` hook with error check:
  ```ts
  export const useVtt = (): VTTContextProps => {
    const context = useContext(VttContext);
    if (!context) {
      throw new Error("useVtt must be used within a VttProvider");
    }
    return context;
  };
  ```

### Error Handling

- API routes: Early-return pattern with proper HTTP status codes (405, 400, 500, 404).
- Client-side fetch: Check `res.ok`, log to console on failure.
- Context hooks: Throw descriptive errors when used outside providers.
- No error boundaries currently — use try/catch for async operations.

### Classes (VTT Engine)

- Core engine classes use ES private fields (`#field`) extensively.
- Getter/setter pattern for controlled property access with side effects (e.g., `set gridColor` triggers re-render).
- `BaseClass` provides auto-generated GUID `id` for all entities.
- Inheritance: `Unit extends BaseClass`, `VTT extends BaseClass`.

## Testing

- **Framework**: Jest 29 with ts-jest.
- **Test location**: `src/tests/` directory, mirroring the source structure. Tests are NOT co-located with source.
- **File naming**: `<name>.test.ts` (no `.spec.ts` used).
- **Test environment**: Node (configured in jest.config.js).
- **Path alias**: `@/` is mapped in jest.config.js moduleNameMapper.

### Test Patterns

```ts
import { clamp } from "@/util/clamp";

describe("clamp", () => {
  it("should clamp value within range", () => {
    expect(clamp({ min: 0, max: 10, value: 5 })).toBe(5);
  });

  it("should handle edge cases", () => {
    expect(clamp({ min: 0, max: 10, value: 0 })).toBe(0);
  });
});
```

- Use `describe` blocks named after the function/class under test.
- Use `it` with descriptive "should..." sentences.
- No mocking framework in heavy use — tests focus on pure logic (utils, validators).
- Use `@ts-expect-error` in tests when intentionally testing invalid inputs.

## API Routes

- Located in `src/pages/api/` (Pages Router — NOT App Router).
- Use Ably for publishing events to channels.
- Pattern: validate method -> validate env -> validate body -> execute -> respond.
- Corresponding client-side fetch functions in `src/api/`.

## Environment Variables

- `ABLY_SERVER_API_KEY` — Required for API routes (server-side only).
- `.env.local` exists (gitignored) for local development.

## Key Dependencies

- `ably` — Realtime websocket communication
- `twgl.js` — WebGL helper library
- `next` 15 — Framework (App Router + Pages Router hybrid)
- `react` 19 — UI library
