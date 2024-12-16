import { KeyboardHandler } from "@/vtt/input/KeyboardHandler";
import { MouseHandler } from "@/vtt/input/MouseHandler";

// global.d.ts
export {};

declare global {
  interface Window {
    mousehandlers?: MouseHandler[];
    keyboardhandlers?: KeyboardHandler[];
  }
}
