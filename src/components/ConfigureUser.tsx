import { useUser } from "@/context/userContext";
import React from "react";

export const ConfigureUser: React.FC = () => {
  const { color, name, setColor, setUserName } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div id="user-settings">
      <form onSubmit={handleSubmit}>
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
      </form>
    </div>
  );
};
