import { useEffect, useRef, useState } from "react";
import "./App.css";

import { VTT } from "./classes/VTT";

function App() {
  const [game, setGame] = useState<VTT | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // get image url from query string
      const urlParams = new URLSearchParams(window.location.search);
      const imageUrl = urlParams.get("background");

      setGame(new VTT(canvasRef.current.id, imageUrl ?? ""));
    }
  }, [canvasRef]);

  return (
    <main>
      <canvas ref={canvasRef} id="canvas" width="800" height="600"></canvas>
    </main>
  );
}

export default App;
