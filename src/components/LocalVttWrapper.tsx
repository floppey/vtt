"use client";
import { useMapSettings } from "@/context/mapSettingsContext";
import { useVtt } from "@/context/vttContext";
import { useEffect, useRef } from "react";
import { LeftToolbar } from "./ui/toolbars/LeftToolbar";
import { RightToolbar } from "./ui/toolbars/RightToolbar";

export const LocalVttWrapper: React.FC = () => {
  const { mapSettings } = useMapSettings();
  const { vtt } = useVtt();

  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (vtt) {
      vtt.backgroundImage = mapSettings.backgroundImage;
      vtt.init();
    }
  }, [vtt, mapSettings.backgroundImage]);

  useEffect(() => {
    if (vtt) {
      vtt.gridXOffset = mapSettings.xOffset;
      vtt.gridYOffset = mapSettings.yOffset;
      vtt.gridColor = mapSettings.gridColor;
    }
  }, [vtt, mapSettings.xOffset, mapSettings.yOffset, mapSettings.gridColor]);

  useEffect(() => {
    if (vtt) {
      vtt.gridSize = mapSettings.gridSize;
    }
  }, [vtt, mapSettings.gridSize]);

  return (
    <main>
      <div id="hud">
        <canvas
          ref={backgroundCanvasRef}
          id="background"
          width="800"
          height="600"
        ></canvas>
        <canvas
          ref={foregroundCanvasRef}
          id="foreground"
          width="800"
          height="600"
        ></canvas>
      </div>
      <LeftToolbar />
      <RightToolbar />
    </main>
  );
};
