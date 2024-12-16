import { useVtt } from "@/context/vttContext";
import { generateRandomName } from "@/util/generateRandomUser";
import Unit from "@/vtt/classes/Unit";
import React from "react";

export const RightToolbar: React.FC = () => {
  const { vtt } = useVtt();
  const addNewUnit = () => {
    if (vtt) {
      const newUnit = new Unit({
        name: generateRandomName(),
        maxHealth: 100,
        gridPosition: null,
        owner: vtt.websocketClientId ?? "unset",
        type: "unit",
        vtt,
      });
      vtt.addUnit(newUnit, null, true);
      vtt.selectUnit(newUnit, false);
    }
  };

  return (
    <>
      <div className="toolbar toolbar--right">
        <button onClick={addNewUnit} title="Add unit">
          +♟️
        </button>
      </div>
    </>
  );
};
