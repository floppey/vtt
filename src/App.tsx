import { useEffect, useRef, useState } from "react";
import "./App.css";

import { VTT } from "./classes/VTT";
import { ConfigureMap } from "./interface/ConfigureMap";
import { useMapSettings } from "./context/mapSettings";

function App() {
  const [game, setGame] = useState<VTT | null>(null);
  const { mapSettings } = useMapSettings();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // get image url from query string
      const urlParams = new URLSearchParams(window.location.search);
      const imageUrl = urlParams.get("background");

      setGame(new VTT(canvasRef.current.id, imageUrl ?? ""));
    }
  }, [canvasRef]);

  useEffect(() => {
    if (game) {
      game.backgroundImage = mapSettings.backgroundImage;
    }
  }, [game, mapSettings.backgroundImage]);

  useEffect(() => {
    if (game) {
      game.gridSize = mapSettings.gridSize;
      game.gridXOffset = mapSettings.xOffset;
      game.gridYOffset = mapSettings.yOffset;
      game.gridColor = mapSettings.gridColor;
    }
  }, [
    game,
    mapSettings.gridSize,
    mapSettings.xOffset,
    mapSettings.yOffset,
    mapSettings.gridColor,
  ]);

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
