"use client";
import { useMapSettings } from "@/context/mapSettingsContext";
import { useVtt } from "@/context/vttContext";
import { useEffect, useRef } from "react";
import { ConfigureMap } from "./ConfigureMap";
import { Participants } from "./Participants";
import { Subscriber } from "@/websockets/Subscriber";
import { useVttChannel } from "@/context/vttChannelContext";

export const VttWrapper: React.FC = () => {
  const { mapSettings } = useMapSettings();
  const { vtt } = useVtt();
  const { channel } = useVttChannel();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && vtt) {
      vtt.canvas = canvasRef.current;
      vtt.init();
    }

    return () => {
      if (vtt) {
        vtt.destroy();
      }
    };
  }, [vtt]);

  useEffect(() => {
    if (vtt) {
      vtt.backgroundImage = mapSettings.backgroundImage;
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
      <canvas ref={canvasRef} id="canvas" width="800" height="600"></canvas>

      <ConfigureMap />
      {channel && <Participants />}
      {channel && <Subscriber />}
    </main>
  );
};
