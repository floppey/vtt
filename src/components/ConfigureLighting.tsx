import { useMapSettings } from "@/context/mapSettingsContext";
import React from "react";

export const ConfigureLighting: React.FC = () => {
  const { mapData, setMapData } = useMapSettings();

  const handleDarknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMapData((prev) => ({
      ...prev,
      darkness: value,
    }));
  };

  const handleGlobalLightToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapData((prev) => ({
      ...prev,
      globalLight: e.target.checked,
    }));
  };

  return (
    <div id="lighting-settings">
      <div>
        <label>
          <input
            type="checkbox"
            checked={mapData.globalLight}
            onChange={handleGlobalLightToggle}
          />
          Global Illumination
        </label>
      </div>
      <div>
        <label>
          Darkness: {Math.round(mapData.darkness * 100)}%
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mapData.darkness}
            onChange={handleDarknessChange}
            disabled={mapData.globalLight}
          />
        </label>
      </div>
    </div>
  );
};
