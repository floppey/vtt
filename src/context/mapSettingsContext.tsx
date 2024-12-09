import React, {
  createContext,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { Size } from "../types/types";
import { clamp } from "../util/clamp";

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
}

const defaultSettings: MapSettings = {
  backgroundImage: "/img/demo_medium.jpg",
  gridSize: { width: 150, height: 150 },
  xOffset: 0,
  yOffset: 0,
  gridColor: "#989898",
};

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
    ...JSON.parse(localStorage.getItem("mapSettings") ?? "{}"),
  };

  const [mapSettings, setMapSettings] = useState<MapSettings>(initialSettings);

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

      return {
        ...prevSettings,
        ...newSettings,
      };
    });
  };

  // Store map settings in local storage
  useEffect(() => {
    localStorage.setItem("mapSettings", JSON.stringify(mapSettings));
  }, [mapSettings]);

  return (
    <MapSettingsContext.Provider
      value={{ mapSettings, setMapSettings: setSafeMapSettings }}
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
