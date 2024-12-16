import { ConfigureMap } from "@/components/ConfigureMap";
import { ConfigureUser } from "@/components/ConfigureUser";
import React, { useState } from "react";
import { UIWindow } from "../windows/UIWindow";

type SettingsWindows = "map" | "user";

const settingsWindows: Record<SettingsWindows, React.ReactNode> = {
  user: <ConfigureUser />,
  map: <ConfigureMap />,
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
