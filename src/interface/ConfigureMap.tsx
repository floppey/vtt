import React from "react";
import { MapSettings, useMapSettings } from "../context/mapSettings";

export const ConfigureMap: React.FC = () => {
  const { mapSettings, setMapSettings } = useMapSettings();

  const handleChange = (field: keyof MapSettings, value: string | number) => {
    setMapSettings((prevSettings) => ({
      ...prevSettings,
      [field]: value,
    }));
  };

  return (
    <div>
      <h2>Map Settings</h2>
      <div>
        <label>
          Background Image URL:
          <input
            type="text"
            value={mapSettings.backgroundImage}
            onChange={(e) => handleChange("backgroundImage", e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Grid Size (pixels):
          <input
            type="number"
            value={mapSettings.gridSize}
            onChange={(e) => handleChange("gridSize", Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          X Offset:
          <input
            type="number"
            value={mapSettings.xOffset}
            onChange={(e) => handleChange("xOffset", Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Y Offset:
          <input
            type="number"
            value={mapSettings.yOffset}
            onChange={(e) => handleChange("yOffset", Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Grid Color:
          <input
            type="color"
            value={mapSettings.gridColor}
            onChange={(e) => handleChange("gridColor", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};
