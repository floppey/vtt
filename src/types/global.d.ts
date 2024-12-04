import { MouseHandler } from "../input/MouseHandler";

// global.d.ts
export {};

declare global {
  interface Window {
    mousehandlers?: MouseHandler[];
  }
}
