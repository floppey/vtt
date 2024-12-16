import { RemoveUnitRequest } from "@/pages/api/removeUnit";

export const postRemoveUnit = async ({
  unit,
  channelId,
  author,
}: RemoveUnitRequest): Promise<void> => {
  const body = JSON.stringify({
    unit: "###UNIT-HACK###",
    channelId,
    author,
  }).replace('"###UNIT-HACK###"', unit.toString());
  const res = await fetch("/api/removeUnit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  if (!res.ok) {
    console.error("Failed to remove unit");
  }
};
