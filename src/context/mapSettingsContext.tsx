import { Coordinates, Size } from "@/vtt/types/types";
import { clamp } from "@/util/clamp";
import React, {
  createContext,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { tryParseJson } from "@/util/tryParseJson";
import { validateObject } from "@/validation/validateObject";
import { mapSettingsValidator } from "@/validation/premadeValidators";

export interface MapSettings {
  backgroundImage: string;
  gridSize: Size;
  xOffset: number;
  yOffset: number;
  gridColor: string;
}

export interface Resolution {
  map_origin: Coordinates;
  map_size: Coordinates;
  pixels_per_grid: number;
}

export interface Portal {
  position: Coordinates;
  bounds: Coordinates[];
  rotation: number;
  closed: boolean;
  freestanding: boolean;
}

export interface Light {
  position: Coordinates;
  range: number;
  intensity: number;
  color: string;
  shadows: boolean;
}

export interface Environment {
  baked_lighting: boolean;
  ambient_light: string;
}

export interface MapData {
  format: number;
  resolution: Resolution;
  line_of_sight: Coordinates[][];
  portals: Portal[];
  lights: Light[];
  environment: Environment;
}

export interface MapSettingsContextProps {
  mapSettings: MapSettings;
  setMapSettings: React.Dispatch<React.SetStateAction<MapSettings>>;
  mapData: MapData | undefined;
  setMapData: React.Dispatch<React.SetStateAction<MapData | undefined>>;
}

const defaultSettings: MapSettings = {
  backgroundImage: "/img/demo_medium.jpg",
  gridSize: { width: 150, height: 150 },
  xOffset: 0,
  yOffset: 0,
  gridColor: "#989898",
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
    ...defaultSettings,
  };

  const [mapSettings, setMapSettings] = useState<MapSettings>(initialSettings);
  const [mapData, setMapData] = useState<MapData | undefined>(undefined);

  useEffect(() => {
    const storedSettings = tryParseJson<MapSettings>(
      localStorage.getItem("mapSettings"),
      mapSettingsValidator,
      defaultSettings
    );
    if (storedSettings) {
      setSafeMapSettings(storedSettings);
    }
  }, []);

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

  // Store map settings in local storage
  useEffect(() => {
    localStorage.setItem("mapSettings", JSON.stringify(mapSettings));
  }, [mapSettings]);

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
