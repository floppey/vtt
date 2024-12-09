import { useVtt } from "@/context/vttContext";
import { createUnit, CreateUnitProps } from "@/vtt/classes/Unit";
import { GridPosition } from "@/vtt/types/types";
import { Message } from "ably";
import { useChannel } from "ably/react";

export interface BaseMessageData {
  author: string;
}
export interface MoveUnitMessageData extends BaseMessageData {
  unit: CreateUnitProps;
  destination: GridPosition;
}

type MyMessages = Omit<Message, "message" | "data"> &
  (
    | { name: "base"; data: BaseMessageData }
    | { name: "moveUnit"; data: MoveUnitMessageData }
  );

export const Subscriber: React.FC = () => {
  const { vtt } = useVtt();

  useChannel(vtt?.websocketChannel ?? "", (message) => {
    const myMessage = message as MyMessages;
    if (myMessage.data.author === vtt?.websocketClientId) {
      return;
    }
    if (myMessage.name === "moveUnit") {
      const { unit: createUnitProps, destination } = myMessage.data;
      const unit = createUnit(createUnitProps);

      const unitToMove = vtt?.units.find(
        (u) => u.id === unit.id || unit.name === u.name
      );
      if (!unitToMove) {
        console.error("Unit not found");
        return;
      }

      const toCell = vtt?.grid?.cells?.[destination.row]?.[destination.col];

      if (!toCell) {
        console.error("Destination cell not found");
        return;
      }

      vtt?.moveUnit(unitToMove, toCell);
    }
  });

  return <></>;
};
