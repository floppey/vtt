import { useUser } from "@/context/userContext";
import { useVtt } from "@/context/vttContext";
import React from "react";

export const ConfigureUser: React.FC = () => {
  const { color, name, setColor, setUserName, isEditing, setEditing } =
    useUser();
  const { vtt, initVtt } = useVtt();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vtt?.initialized) {
      initVtt("background", "foreground");
    }
    setEditing(false);
  };

  if (!isEditing) {
    return null;
  }

  return (
    <div id="user-settings" className="window window--map">
      <form onSubmit={handleSubmit}>
        <h2>User Settings</h2>
        <div>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setUserName(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Color:
            <input
              type="color"
              name="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
        </div>
        <button type="submit">
          {vtt?.initialized ? "Save" : "Save and Start VTT"}
        </button>
      </form>
    </div>
  );
};
