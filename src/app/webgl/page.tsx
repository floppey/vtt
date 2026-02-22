"use client";

import { useEffect, useRef, useState } from "react";
import foundryJson from "../../data/mapData/demo_medium.json";
import { convertFoundryToMapData } from "@/vtt/util/mapData/convertFoundryToMapData";
import { mergeWalls } from "@/vtt/util/mapData/mergeWalls";
import { Foundry } from "@/vtt/types/mapData/Foundry";
import { Wall, Light } from "@/vtt/types/mapData/MapData";
import {
  initLighting,
  renderLighting,
  renderScene,
  loadSceneTexture,
  destroyLighting,
  LightingState,
} from "@/webgl/lighting";

export default function WebGLDemo() {
  const [fps, setFps] = useState(0);
  const [lightCount, setLightCount] = useState(0);
  const [wallCount, setWallCount] = useState(0);
  const [ambientLight, setAmbientLight] = useState(0.05);
  const [showWalls, setShowWalls] = useState(true);
  const [showLightMarkers, setShowLightMarkers] = useState(true);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 100, height: 100 });

  // Use refs for values needed in the animation loop to avoid stale closures
  const settingsRef = useRef({ ambientLight, showWalls, showLightMarkers });
  useEffect(() => {
    settingsRef.current = { ambientLight, showWalls, showLightMarkers };
  }, [ambientLight, showWalls, showLightMarkers]);

  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lightingStateRef = useRef<LightingState | null>(null);
  const lightsRef = useRef<Light[]>([]);
  const wallsRef = useRef<Wall[]>([]);
  
  const dragRef = useRef<{ lightIndex: number; startX: number; startY: number } | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const frameTimesRef = useRef<number[]>([]);

  // Render function that reads from refs
  const renderFrame = () => {
    if (!lightingStateRef.current || !webglCanvasRef.current || !overlayCanvasRef.current) return;

    const gl = lightingStateRef.current.gl;
    const { ambientLight, showWalls, showLightMarkers } = settingsRef.current;

    // Render scene background (or fallback to gray clear)
    if (lightingStateRef.current.sceneTexture) {
      renderScene(lightingStateRef.current);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, webglCanvasRef.current.width, webglCanvasRef.current.height);
      gl.clearColor(0.5, 0.5, 0.5, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    renderLighting(
      lightingStateRef.current,
      wallsRef.current,
      lightsRef.current,
      ambientLight
    );

    const ctx = overlayCanvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    if (showWalls) {
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      for (const wall of wallsRef.current) {
        ctx.moveTo(wall.start.x, wall.start.y);
        ctx.lineTo(wall.end.x, wall.end.y);
      }
      ctx.stroke();
    }

    if (showLightMarkers) {
      for (let i = 0; i < lightsRef.current.length; i++) {
        const light = lightsRef.current[i];
        const isDragging = dragRef.current?.lightIndex === i;
        
        ctx.beginPath();
        ctx.arc(light.position.x, light.position.y, isDragging ? 30 : 15, 0, Math.PI * 2);
        ctx.fillStyle = isDragging ? "#00ff00" : "#ffff00";
        ctx.globalAlpha = 0.8;
        ctx.fill();
        
        if (isDragging) {
          ctx.beginPath();
          ctx.arc(light.position.x, light.position.y, light.bright, 0, Math.PI * 2);
          ctx.strokeStyle = "#ffff00";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(light.position.x, light.position.y, light.dim, 0, Math.PI * 2);
          ctx.strokeStyle = "#ff8800";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  };
  
  // Ref to hold the latest renderFrame function
  const renderFrameRef = useRef(renderFrame);
  renderFrameRef.current = renderFrame;

  useEffect(() => {
    const mapData = convertFoundryToMapData(foundryJson as unknown as Foundry);
    
    const processedWalls = mergeWalls(mapData.walls);
    const doorWalls = mapData.doors
      .filter((door) => door.blocksVision && !door.isOpen)
      .map((door) => ({
        start: door.start,
        end: door.end,
        blocksMovement: !door.isOpen,
        blocksVision: door.blocksVision,
      }));
    
    const allWalls = [...processedWalls, ...doorWalls];
    wallsRef.current = allWalls;
    setWallCount(allWalls.length);

    lightsRef.current = mapData.lights;
    setLightCount(mapData.lights.length);

    const width = mapData.size.width;
    const height = mapData.size.height;

    // Compute fitted container size and listen for resize
    const updateContainerSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mapAspect = width / height;
      const viewportAspect = vw / vh;
      if (mapAspect > viewportAspect) {
        // Map is wider than viewport — constrain by width
        setContainerSize({ width: vw, height: vw / mapAspect });
      } else {
        // Map is taller than viewport — constrain by height
        setContainerSize({ width: vh * mapAspect, height: vh });
      }
    };
    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);

    if (webglCanvasRef.current && overlayCanvasRef.current) {
      webglCanvasRef.current.width = width;
      webglCanvasRef.current.height = height;
      overlayCanvasRef.current.width = width;
      overlayCanvasRef.current.height = height;
    }

    const gl = webglCanvasRef.current?.getContext("webgl2", { alpha: false });
    if (!gl || !webglCanvasRef.current) {
      console.error("WebGL2 not supported");
      return;
    }

    try {
      lightingStateRef.current = initLighting(gl, webglCanvasRef.current);
    } catch (e) {
      console.error("Failed to init lighting:", e);
      return;
    }

    // Load scene background image
    const sceneImage = new Image();
    sceneImage.onload = () => {
      if (lightingStateRef.current) {
        loadSceneTexture(lightingStateRef.current, sceneImage);
      }
    };
    sceneImage.src = "/img/demo_medium.jpg";

    const animate = (_time: number) => {
      const now = performance.now();
      while (frameTimesRef.current.length > 0 && frameTimesRef.current[0] <= now - 1000) {
        frameTimesRef.current.shift();
      }
      frameTimesRef.current.push(now);
      setFps(frameTimesRef.current.length);

      renderFrameRef.current(); // Use the ref to get the latest version
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', updateContainerSize);
      if (lightingStateRef.current) {
        destroyLighting(lightingStateRef.current);
      }
    };
  }, []);


  
  const getCanvasCoordinates = (e: React.MouseEvent) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e);
    
    if (e.shiftKey) {
      const newLight: Light = {
        position: coords,
        bright: 300,
        dim: 600,
        tintColor: "#ffffff",
        tintAlpha: 0.0,
      };
      lightsRef.current = [...lightsRef.current, newLight];
      setLightCount(lightsRef.current.length);
      return;
    }

    for (let i = lightsRef.current.length - 1; i >= 0; i--) {
      const light = lightsRef.current[i];
      const dist = Math.sqrt(
        Math.pow(light.position.x - coords.x, 2) + 
        Math.pow(light.position.y - coords.y, 2)
      );

      if (dist < 80) {
        dragRef.current = {
          lightIndex: i,
          startX: coords.x,
          startY: coords.y
        };
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e);
    mouseRef.current = coords;

    if (dragRef.current !== null) {
      const lights = [...lightsRef.current];
      lights[dragRef.current.lightIndex] = {
        ...lights[dragRef.current.lightIndex],
        position: coords
      };
      lightsRef.current = lights;
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);

    for (let i = lightsRef.current.length - 1; i >= 0; i--) {
      const light = lightsRef.current[i];
      const dist = Math.sqrt(
        Math.pow(light.position.x - coords.x, 2) + 
        Math.pow(light.position.y - coords.y, 2)
      );

      if (dist < 80) {
        const newLights = [...lightsRef.current];
        newLights.splice(i, 1);
        lightsRef.current = newLights;
        setLightCount(newLights.length);
        return;
      }
    }
  };

  const resetLights = () => {
    const mapData = convertFoundryToMapData(foundryJson as unknown as Foundry);
    lightsRef.current = mapData.lights;
    setLightCount(mapData.lights.length);
  };

  return (
    <div style={{ 
      position: "relative", 
      width: "100vw", 
      height: "100vh", 
      backgroundColor: "#111", 
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        position: "relative",
        width: containerSize.width,
        height: containerSize.height,
      }}>
        <canvas
          ref={webglCanvasRef}
          id="webgl-canvas"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          id="overlay-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
            cursor: "crosshair",
          }}
        />
      </div>

      <div style={{
        position: "fixed",
        top: 16,
        right: 16,
        width: 300,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        color: "white",
        padding: 16,
        borderRadius: 8,
        fontFamily: "monospace",
        zIndex: 100,
        backdropFilter: "blur(4px)",
        border: "1px solid #444"
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 18, borderBottom: "1px solid #444", paddingBottom: 8 }}>
          WebGL Lighting Demo
        </h2>
        
        <div style={{ marginBottom: 8, fontSize: 24, fontWeight: "bold", color: "#0f0" }}>
          {fps} FPS
        </div>
        
        <div style={{ marginBottom: 16, fontSize: 12, color: "#aaa" }}>
          Lights: {lightCount} | Walls: {wallCount}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Ambient Light: {ambientLight.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={ambientLight} 
            onChange={(e) => setAmbientLight(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={showWalls} 
              onChange={(e) => setShowWalls(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Show Walls
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={showLightMarkers} 
              onChange={(e) => setShowLightMarkers(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Show Light Markers
          </label>
        </div>

        <button 
          onClick={resetLights}
          style={{
            width: "100%",
            padding: "8px 16px",
            backgroundColor: "#444",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            marginBottom: 16
          }}
        >
          Reset Lights
        </button>

        <div style={{ fontSize: 11, color: "#888", borderTop: "1px solid #444", paddingTop: 8 }}>
          <p style={{ margin: "4px 0" }}>• Drag lights to move</p>
          <p style={{ margin: "4px 0" }}>• Shift+Click to add light</p>
          <p style={{ margin: "4px 0" }}>• Right-click to remove light</p>
        </div>
      </div>
    </div>
  );
}
