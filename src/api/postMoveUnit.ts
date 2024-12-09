import { MoveUnitRequest } from "@/pages/api/moveUnit";

export const postMoveUnit = async ({
  unit,
  destination,
  channelId,
  author,
}: MoveUnitRequest): Promise<void> => {
  const body = JSON.stringify({
    unit: "###UNIT-HACK###",
    destination,
    channelId,
    author,
  }).replace('"###UNIT-HACK###"', unit.toString());
  const res = await fetch("/api/moveUnit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  if (!res.ok) {
    throw new Error("Failed to move unit");
  }
};
