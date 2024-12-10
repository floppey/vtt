import { AddUnitRequest } from "@/pages/api/addUnit";

export const postAddUnit = async ({
  unit,
  destination,
  channelId,
  author,
}: AddUnitRequest): Promise<void> => {
  const body = JSON.stringify({
    unit: "###UNIT-HACK###",
    destination,
    channelId,
    author,
  }).replace('"###UNIT-HACK###"', unit.toString());
  const res = await fetch("/api/addUnit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  if (!res.ok) {
    console.error("Failed to add unit");
  }
};
