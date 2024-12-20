import { Size } from "@/vtt/types/types";
import { clamp } from "@/util/clamp";
import React, {
  createContext,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { validateObject } from "@/validation/validateObject";
import { mapSettingsValidator } from "@/validation/premadeValidators";
import { MapData } from "@/vtt/types/mapData/MapData";
import demo_medium from "@/data/mapData/demo_medium.json";
import { Foundry } from "@/vtt/types/mapData/Foundry";
import { convertFoundryToMapData } from "@/vtt/util/mapData/convertFoundryToMapData";
import { hexToRgb } from "@/util/hexToRgb";
import { rgbToHex } from "@/util/rgbToHex";

export interface MapSettings {
  backgroundImage: string;
  gridSize: Size;
  xOffset: number;
  yOffset: number;
  gridColor: string;
}

export interface MapSettingsContextProps {
  mapSettings: MapSettings;
  setMapSettings: React.Dispatch<React.SetStateAction<MapSettings>>;
  mapData: MapData;
  setMapData: React.Dispatch<React.SetStateAction<MapData>>;
}

const defaultMapSettings: MapSettings = {
  backgroundImage: "/img/demo_medium.jpg",
  gridSize: { width: 150, height: 150 },
  xOffset: 0,
  yOffset: 0,
  gridColor: "#989898",
} as const;

const demoMapData = convertFoundryToMapData(demo_medium as Foundry);

const defaultMapData: MapData = {
  ...demoMapData,
  backgroundImage: "/img/demo_medium.jpg",
  backgroundImageType: "url",
} as const;

export const MapSettingsContext = createContext<
  MapSettingsContextProps | undefined
>(undefined);

interface MapSettingsProviderProps {
  children: React.ReactNode;
}
export const MapSettingsProvider: React.FC<MapSettingsProviderProps> = ({
  children,
}) => {
  const initialSettings = {
    ...defaultMapSettings,
  };

  const [mapSettings, setMapSettings] = useState<MapSettings>(initialSettings);
  const [mapData, setMapData] = useState<MapData>(defaultMapData);

  useEffect(() => {
    if (mapData) {
      setMapSettings((prevSettings) => {
        const newSettings = {
          ...prevSettings,
          gridSize: {
            width: mapData.cellSize.width,
            height: mapData.cellSize.height,
          },
          gridColor: mapData.gridColor,
          xOffset: mapData.offset.x,
          yOffset: mapData.offset.y,
        };

        if (mapData.backgroundImage) {
          newSettings.backgroundImage = mapData.backgroundImage;
        }

        if (mapData.gridColor) {
          const color = hexToRgb(mapData.gridColor);
          color.a = mapData.gridAlpha ?? 1;
          newSettings.gridColor = rgbToHex(color);
        }

        return newSettings;
      });
    }
  }, [mapData]);

  const setSafeMapSettings = (action: SetStateAction<MapSettings>) => {
    setMapSettings((prevSettings) => {
      // Resolve the new settings based on the type of action
      const newSettings =
        typeof action === "function" ? action(prevSettings) : action;

      newSettings.gridSize.width = clamp({
        value: newSettings.gridSize.width,
        min: 10,
        max: 500,
        defaultValue: 150,
      });
      newSettings.gridSize.height = clamp({
        value: newSettings.gridSize.height,
        min: 10,
        max: 500,
        defaultValue: 150,
      });
      newSettings.xOffset = clamp({
        value: newSettings.xOffset,
        min: -newSettings.gridSize.width,
        max: newSettings.gridSize.width,
        defaultValue: 0,
        loop: true,
      });
      newSettings.yOffset = clamp({
        value: newSettings.yOffset,
        min: -newSettings.gridSize.height,
        max: newSettings.gridSize.height,
        loop: true,
        defaultValue: 0,
      });

      const settings = {
        ...prevSettings,
        ...newSettings,
      };
      const validation = validateObject(settings, mapSettingsValidator);
      if (validation.isValid) {
        return settings;
      }
      return prevSettings;
    });
  };

  return (
    <MapSettingsContext.Provider
      value={{
        mapSettings,
        setMapSettings: setSafeMapSettings,
        mapData,
        setMapData,
      }}
    >
      {children}
    </MapSettingsContext.Provider>
  );
};

export const useMapSettings = (): MapSettingsContextProps => {
  const context = useContext(MapSettingsContext);
  if (!context) {
    throw new Error("useMapSettings must be used within a MapSettingsProvider");
  }
  return context;
};
