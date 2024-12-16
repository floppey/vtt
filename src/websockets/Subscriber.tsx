import { postAddUnit } from "@/api/postAddUnit";
import { useVttChannel } from "@/context/vttChannelContext";
import { useVtt } from "@/context/vttContext";
import { createUnit, CreateUnitProps } from "@/vtt/classes/Unit";
import { GridPosition } from "@/vtt/types/types";
import { Message } from "ably";
import { useChannel, usePresenceListener } from "ably/react";
import { useEffect, useState } from "react";

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
  const { presenceData } = usePresenceListener(channel);
  const [people, setPeople] = useState<string[]>([]);
  const [previousPeople, setPreviousPeople] = useState<string[]>([]);

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
        return;
      }

      const toCell = vtt?.grid?.cells?.[destination.row]?.[destination.col];

      if (!toCell) {
        return;
      }

      vtt?.moveUnit(unitToMove, toCell);
      return;
    }
    if (myMessage.name === "addUnit") {
      const { unit: createUnitProps, destination } = myMessage.data;
      const unit = createUnit(createUnitProps);
      vtt?.addUnit(unit, destination, false);
      return;
    }
  });

  useEffect(() => {
    const currentPeople = presenceData.map((member) => member.clientId);

    if (
      previousPeople.some((person) => !currentPeople.includes(person)) ||
      currentPeople.some((person) => !previousPeople.includes(person))
    ) {
      setPreviousPeople(people);
      setPeople(currentPeople);
    }
  }, [presenceData, people, previousPeople]);

  useEffect(() => {
    if (!vtt) {
      return;
    }
    if (!vtt.websocketClientId) {
      return;
    }

    // Remove units created by people who leave
    const peopleWhoLeft = previousPeople.filter(
      (person) => !people.includes(person)
    );

    peopleWhoLeft.forEach((person) => {
      vtt?.units.forEach((unit) => {
        if (person === unit.owner) {
          vtt.removeUnit(unit);
        }
      });
    });

    // If someone joins, broadcast all units to them
    if (previousPeople.length < people.length) {
      const myUnits = vtt?.units.filter(
        (unit) => unit.owner === vtt.websocketClientId
      );

      myUnits.forEach((unit) => {
        postAddUnit({
          unit: unit,
          destination: {
            row: unit.cell?.row ?? 0,
            col: unit.cell?.col ?? 0,
          },
          channelId: vtt.websocketChannel,
          author: vtt.websocketClientId ?? "",
        });
      });
    }
  }, [people, previousPeople, vtt]);

  return <></>;
};
