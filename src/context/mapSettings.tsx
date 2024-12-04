import React, { createContext, useContext, useEffect, useState } from "react";
import { Size } from "../types/types";

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
  backgroundImage: "",
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

  // Store map settings in local storage
  useEffect(() => {
    localStorage.setItem("mapSettings", JSON.stringify(mapSettings));
  }, [mapSettings]);

  return (
    <MapSettingsContext.Provider value={{ mapSettings, setMapSettings }}>
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
