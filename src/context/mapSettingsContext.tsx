import { Size } from "@/vtt/types/types";
import { clamp } from "@/util/clamp";
import React, {
  createContext,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { tryParseJson } from "@/util/tryParseJson";
import {
  NumberValidator,
  SizeValidator,
  StringValidator,
  TypeValidator,
} from "@/validation/Validator";
import { validateObject } from "@/validation/validateObject";

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
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

const defaultSettings: MapSettings = {
  backgroundImage: "/img/demo_medium.jpg",
  gridSize: { width: 150, height: 150 },
  xOffset: 0,
  yOffset: 0,
  gridColor: "#989898",
} as const;

const mapSettingsValidator: TypeValidator<MapSettings> = {
  backgroundImage: new StringValidator("backgroundImage must be a string")
    .isRequired()
    .isString(),
  gridSize: new SizeValidator(
    "gridSize must be a Size object with width and height greater than 0"
  )
    .isRequired()
    .isSize()
    .isValid(),
  xOffset: new NumberValidator("xOffset must be a number")
    .isRequired()
    .isNumber(),
  yOffset: new NumberValidator("yOffset must be a number")
    .isRequired()
    .isNumber(),
  gridColor: new StringValidator("gridColor must be a string")
    .isRequired()
    .isString()
    .matchesRegex(/^(#[0-9A-F]{6}|rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\))$/i),
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
  };

  const [mapSettings, setMapSettings] = useState<MapSettings>(initialSettings);
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
        isEditing,
        setIsEditing,
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
