import {
  MapData,
  MapSettings,
  useMapSettings,
} from "@/context/mapSettingsContext";
import { tryParseJson } from "@/util/tryParseJson";
import { mapDataValidator } from "@/validation/premadeValidators";
import { Size } from "@/vtt/types/types";
import React, { useEffect, useState } from "react";

export const ConfigureMap: React.FC = () => {
  const { mapSettings, setMapSettings, setMapData } = useMapSettings();
  const [syncGridHeightAndWidth, setSyncGridHeightAndWidth] = useState(true);
  const [fileContent, setFileContent] = useState<MapData | null>(null);

  useEffect(() => {
    if (fileContent) {
      setMapData(fileContent);
      if (
        mapSettings.gridSize.width !== fileContent.resolution.pixels_per_grid ||
        mapSettings.gridSize.height !== fileContent.resolution.pixels_per_grid
      ) {
        setMapSettings((prevSettings) => {
          const newGridSize: Size = {
            height: fileContent.resolution.pixels_per_grid,
            width: fileContent.resolution.pixels_per_grid,
          };
          return {
            ...prevSettings,
            gridSize: newGridSize,
          };
        });
      }
    }
  }, [
    fileContent,
    mapSettings.gridSize.height,
    mapSettings.gridSize.width,
    setMapData,
    setMapSettings,
  ]);

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

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          const parsedContent = tryParseJson<MapData>(
            content,
            mapDataValidator
          );
          console.log("parsedContent", parsedContent);
          setFileContent(parsedContent);
        } else {
          console.error("Invalid file content type", typeof content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div id="map-settings">
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
          Upload Map Data:
          <input
            type="file"
            accept=".dd2vtt,.uvtt"
            onChange={handleFileChange}
          />
        </label>
        {fileContent && <pre>Map data loaded</pre>}
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
