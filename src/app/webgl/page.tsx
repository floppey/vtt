"use client";

import { Wall } from "@/vtt/types/mapData/MapData";
import { convertOpenVttToMapData } from "@/vtt/util/mapData/convertOpenVttToMapData";
import {
  initLighting,
  renderLighting,
  destroyLighting,
} from "@/webgl/lighting";
import { useEffect } from "react";
import openVttJson from "../../data/mapData/openVtt.json";
import { OpenVtt } from "@/vtt/types/mapData/OpenVtt";
import { mergeWalls } from "@/vtt/util/mapData/mergeWalls";

export default function Home() {
  useEffect(() => {
    const mapData = convertOpenVttToMapData(openVttJson as OpenVtt);
    const canvasWidth = mapData.size.width;
    const canvasHeight = mapData.size.height;

    mapData.walls = mergeWalls(mapData.walls);

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    if (!canvas) throw new Error("Canvas not found");

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.border = "1px solid black";

    if (mapData.backgroundImage) {
      canvas.style.backgroundImage = `url('data:image/png;base64,${mapData.backgroundImage}')`;
    } else {
      canvas.style.background = "#333";
    }

    const gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL2 not supported");

    // Collect all vision-blocking segments: walls + closed doors
    const allWalls: Wall[] = [
      ...mapData.walls,
      ...mapData.doors
        .filter((door) => door.blocksVision && !door.isOpen)
        .map((door) => ({
          start: door.start,
          end: door.end,
          blocksMovement: door.isOpen,
          blocksVision: door.blocksVision,
        })),
    ];

    const lights = mapData.lights;

    // Initialize WebGL lighting
    const state = initLighting(gl, canvas);

    // Render a single frame
    renderLighting(state, allWalls, lights, 0.05);

    console.log(
      `WebGL lighting rendered: ${lights.length} lights, ${allWalls.filter((w) => w.blocksVision).length} vision-blocking walls`
    );

    return () => {
      destroyLighting(state);
    };
  }, []);

  return (
    <main>
      <canvas id="canvas" width="500" height="500"></canvas>
    </main>
  );
}
