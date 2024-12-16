import Unit from "@/vtt/classes/Unit";
import Ably from "ably";
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export interface RemoveUnitRequest {
  channelId: string;
  unit: Unit;
  author: string;
}

interface RemoveUnitResponse {
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RemoveUnitResponse>
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

  const { channelId, unit, author } = req.body as RemoveUnitRequest;

  if (!channelId || !unit || !author) {
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

  await channel.publish("removeUnit", { unit, author });

  res.status(200).json({
    message: "Unit removed",
  });
}
