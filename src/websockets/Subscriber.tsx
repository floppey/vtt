import { useVttChannel } from "@/context/vttChannelContext";
import { useVtt } from "@/context/vttContext";
import { createUnit, CreateUnitProps } from "@/vtt/classes/Unit";
import { GridPosition } from "@/vtt/types/types";
import { Message } from "ably";
import { useChannel } from "ably/react";

interface BaseMessageData {
  author: string;
}
interface MoveUnitMessageData extends BaseMessageData {
  unit: CreateUnitProps;
  destination: GridPosition;
}

interface AddUnitMessageData extends BaseMessageData {
  unit: CreateUnitProps;
  destination: GridPosition;
}

type MyMessages = Omit<Message, "message" | "data"> &
  (
    | { name: "base"; data: BaseMessageData }
    | { name: "moveUnit"; data: MoveUnitMessageData }
    | { name: "addUnit"; data: AddUnitMessageData }
  );

export const Subscriber: React.FC = () => {
  const { vtt } = useVtt();
  const { channel } = useVttChannel();

  useChannel(channel, (message) => {
    const myMessage = message as MyMessages;
    if (myMessage.data.author === vtt?.websocketClientId) {
      return;
    }
    if (myMessage.name === "moveUnit") {
      const { unit: createUnitProps, destination } = myMessage.data;
      const unit = createUnit(createUnitProps);

      const unitToMove = vtt?.units.find((u) => u.id === unit.id);
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
      return;
    }
    if (myMessage.name === "addUnit") {
      const { unit: createUnitProps, destination } = myMessage.data;
      const unit = createUnit(createUnitProps);

      const toCell = vtt?.grid?.cells?.[destination.row]?.[destination.col];

      if (!toCell) {
        console.error("Destination cell not found");
        return;
      }

      vtt.addUnit(unit, toCell, false);
      return;
    }
  });

  return <></>;
};
