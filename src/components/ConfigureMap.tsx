import {
  MapData,
  MapSettings,
  useMapSettings,
} from "@/context/mapSettingsContext";
import { tryParseJson } from "@/util/tryParseJson";
import {
  ArrayValidator,
  NumberValidator,
  TypeValidator,
} from "@/validation/Validator";
import { GridPosition } from "@/vtt/types/types";
import React, { useState } from "react";

export const ConfigureMap: React.FC = () => {
  const { mapSettings, setMapSettings } = useMapSettings();
  const [syncGridHeightAndWidth, setSyncGridHeightAndWidth] = useState(true);
  const [fileContent, setFileContent] = useState<MapData | null>(null);

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
        console.log(typeof content);
        if (typeof content === "string") {
          const validator: TypeValidator<MapData> = {
            format: new NumberValidator("format must be a number").isNumber(),
            line_of_sight: new ArrayValidator<GridPosition[]>(
              "line_of_sight must be an array"
            )
              .isRequired()
              .isArray()
              .isNotEmpty(),
          };
          const parsedContent = tryParseJson<MapData>(content, validator);
          console.log(parsedContent);
          setFileContent(parsedContent);
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
          Upload Map Data (dd2vtt):
          <input type="file" accept=".dd2vtt" onChange={handleFileChange} />
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
