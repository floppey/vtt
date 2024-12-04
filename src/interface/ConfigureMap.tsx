import React, { useState } from "react";
import { MapSettings, useMapSettings } from "../context/mapSettingsContext";

export const ConfigureMap: React.FC = () => {
  const { mapSettings, setMapSettings } = useMapSettings();
  const [syncGridHeightAndWidth, setSyncGridHeightAndWidth] = useState(true);

  const handleChange = (field: keyof MapSettings, value: string | number) => {
    setMapSettings((prevSettings) => {
      const newSettings = {
        ...prevSettings,
        [field]: value,
      };

      return newSettings;
    });
  };

  const handleGridSizeChange = (
    field: "width" | "height",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputNumber = Number(e.target.value);
    setMapSettings((prevSettings) => {
      const newGridSize = {
        ...prevSettings.gridSize,
        [field]: inputNumber,
      };

      if (syncGridHeightAndWidth) {
        newGridSize.width = inputNumber;
        newGridSize.height = inputNumber;
      }

      return {
        ...prevSettings,
        gridSize: newGridSize,
      };
    });
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
          Grid {syncGridHeightAndWidth ? "Size" : "Width"} (pixels):
          <input
            type="number"
            value={mapSettings.gridSize.width}
            onChange={(e) => handleGridSizeChange("width", e)}
          />
        </label>
        {syncGridHeightAndWidth ? null : (
          <label>
            Grid Height (pixels):
            <input
              type="number"
              value={mapSettings.gridSize.height}
              onChange={(e) => handleGridSizeChange("height", e)}
              disabled={syncGridHeightAndWidth}
            />
          </label>
        )}
        <label>
          <input
            type="checkbox"
            checked={syncGridHeightAndWidth}
            onChange={(e) => setSyncGridHeightAndWidth(e.target.checked)}
          />
          Sync Width and Height
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
