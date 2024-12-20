import { MapSettings, useMapSettings } from "@/context/mapSettingsContext";
import { tryParseJson } from "@/util/tryParseJson";
import {
  foundryValidator,
  openVttValidator,
} from "@/validation/premadeValidators";
import { Foundry } from "@/vtt/types/mapData/Foundry";
import { ImageType, MapData } from "@/vtt/types/mapData/MapData";
import { OpenVtt } from "@/vtt/types/mapData/OpenVtt";
import { Size } from "@/vtt/types/types";
import { convertFoundryToMapData } from "@/vtt/util/mapData/convertFoundryToMapData";
import { convertOpenVttToMapData } from "@/vtt/util/mapData/convertOpenVttToMapData";
import React, { useEffect, useState } from "react";

export const ConfigureMap: React.FC = () => {
  const { mapSettings, setMapSettings, mapData, setMapData } = useMapSettings();
  const [syncGridHeightAndWidth, setSyncGridHeightAndWidth] = useState(true);
  const [fileContent, setFileContent] = useState<MapData | null>(null);

  useEffect(() => {
    if (fileContent) {
      setMapData(fileContent);
      if (
        mapSettings.gridSize.width !== fileContent.cellSize.width ||
        mapSettings.gridSize.height !== fileContent.cellSize.height
      ) {
        setMapSettings((prevSettings) => {
          const newGridSize: Size = {
            height: fileContent.cellSize.height,
            width: fileContent.cellSize.width,
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

  const handleBackroundImageFileChange: React.ChangeEventHandler<
    HTMLInputElement
  > = (event) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;

        if (typeof content === "string") {
          const fileType = file.name.split(".").pop() as ImageType;
          setMapData({
            ...mapData,
            backgroundImage: content,
            backgroundImageType: fileType,
          });
        }
      };

      reader.readAsText(file);
    }
  };

  const handleMapDataFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;

        if (typeof content === "string") {
          const fileType = file.name.split(".").pop();
          let parsedContent: MapData | null = null;
          switch (fileType) {
            case "dd2vtt":
            case "uvtt": {
              const openVtt = tryParseJson<OpenVtt>(content, openVttValidator);
              if (openVtt) {
                parsedContent = convertOpenVttToMapData(openVtt);
              }
              break;
            }
            case "json": {
              const foundry = tryParseJson<Foundry>(content, foundryValidator);
              if (foundry) {
                parsedContent = convertFoundryToMapData(foundry);
              }
              break;
            }
          }

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
          Upload Background Image:
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            onChange={handleBackroundImageFileChange}
          />
        </label>
      </div>
      <div>
        <label>
          Upload Map Data:
          <input
            type="file"
            accept=".dd2vtt,.uvtt,.json"
            onChange={handleMapDataFileChange}
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
