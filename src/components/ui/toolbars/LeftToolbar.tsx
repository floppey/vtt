import { ConfigureMap } from "@/components/ConfigureMap";
import { ConfigureUser } from "@/components/ConfigureUser";
import { ConfigureLighting } from "@/components/ConfigureLighting";
import React, { useState } from "react";
import { UIWindow } from "../windows/UIWindow";

type SettingsWindows = "map" | "user" | "lighting";

const settingsWindows: Record<SettingsWindows, React.ReactNode> = {
  user: <ConfigureUser />,
  map: <ConfigureMap />,
  lighting: <ConfigureLighting />,
};

export const LeftToolbar: React.FC = () => {
  const [openSettings, setOpenSettings] = useState<SettingsWindows[]>([]);

  const openWindow = (window: SettingsWindows) => {
    if (!openSettings.includes(window)) {
      setOpenSettings([...openSettings, window]);
    }
  };

  const closeWindow = (window: SettingsWindows) => {
    if (openSettings.includes(window)) {
      setOpenSettings(openSettings.filter((w) => w !== window));
    }
  };

  return (
    <>
      <div className="toolbar toolbar--left">
        <button onClick={() => openWindow("map")} title="Configure map">
          🗺️
        </button>
        <button onClick={() => openWindow("user")} title="User settings">
          👤
        </button>
        <button onClick={() => openWindow("lighting")} title="Lighting settings">
          💡
        </button>
      </div>
      {openSettings.map((window) => {
        return (
          <UIWindow
            key={window}
            title={window}
            onClose={() => closeWindow(window)}
          >
            {settingsWindows[window]}
          </UIWindow>
        );
      })}
    </>
  );
};
