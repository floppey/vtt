import Unit from "@/vtt/classes/Unit";
import { GridPosition } from "@/vtt/types/types";
import Ably from "ably";
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export interface MoveUnitRequest {
  channelId: string;
  unit: Unit;
  destination: GridPosition;
  author: string;
}

interface MoveUnitResponse {
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MoveUnitResponse>
) {
  if (req.method !== "POST") {
    res.status(405).json({
      message: "Method Not Allowed",
    });
    return;
  }

  const apiKey = process.env.ABLY_SERVER_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    return;
  }

  const { channelId, unit, destination, author } = req.body as MoveUnitRequest;

  if (!channelId || !unit || !destination || !author) {
    res.status(400).json({
      message: "Bad Request",
    });
    return;
  }

  const ably = new Ably.Rest(apiKey);
  const channel = ably.channels.get(channelId);

  if (!channel) {
    res.status(404).json({
      message: "Channel Not Found",
    });
    return;
  }

  await channel.publish("moveUnit", { unit, destination, author });

  res.status(200).json({
    message: "Unit moved",
  });
}
