import { useEffect, useRef } from "react";
import "./App.css";

import { ConfigureMap } from "./interface/ConfigureMap";
import { useMapSettings } from "./context/mapSettingsContext";
import { useVtt } from "./context/vttContext";

function App() {
  const { mapSettings } = useMapSettings();
  const { vtt } = useVtt();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
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
      <div
        id="controls"
        style={{
          position: "absolute",
          top: "0",
          left: "0",
        }}
      >
        <ConfigureMap />
      </div>
    </main>
  );
}

export default App;
