"use client";
import { useMapSettings } from "@/context/mapSettingsContext";
import { useVtt } from "@/context/vttContext";
import { useEffect, useRef } from "react";
import { Participants } from "@/components/Participants";
import { Subscriber } from "@/websockets/Subscriber";
import { LeftToolbar } from "./ui/toolbars/LeftToolbar";
import { RightToolbar } from "./ui/toolbars/RightToolbar";
import { useUser } from "@/context/userContext";

interface VttWrapperProps {
  channel: string;
}

export const VttWrapper: React.FC<VttWrapperProps> = ({ channel }) => {
  const { mapSettings, mapData } = useMapSettings();
  const { vtt } = useVtt();
  const { color } = useUser();

  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (vtt) {
      if (mapData?.backgroundImage) {
        if (mapData.backgroundImageType === "url") {
          vtt.backgroundImage = `${mapData.backgroundImage}`;
        } else {
          vtt.backgroundImage = `data:image/${mapData.backgroundImageType};base64,${mapData.backgroundImage}`;
        }
      } else if (mapSettings.backgroundImage) {
        vtt.backgroundImage = mapSettings.backgroundImage;
      }
      vtt.init();
    }
  }, [
    vtt,
    mapSettings.backgroundImage,
    mapData.backgroundImage,
    mapData.backgroundImageType,
  ]);

  useEffect(() => {
    if (vtt) {
      vtt.mapData = mapData ?? null;
    }
  }, [vtt, mapData]);

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

  useEffect(() => {
    if (vtt && vtt.userColor !== color) {
      vtt.userColor = color;
      vtt.render("foreground");
    }
  }, [color, vtt]);

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
      {channel && <Participants />}
      {channel && <Subscriber />}
    </main>
  );
};
