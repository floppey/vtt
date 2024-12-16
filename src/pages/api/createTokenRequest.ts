import type { NextApiRequest, NextApiResponse } from "next";
import { generateRandomName } from "@/util/generateRandomUser";
import Ably from "ably";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Ably.TokenRequest>
) {
  const client = new Ably.Rest(process.env.ABLY_CLIENT_API_KEY ?? "");

  const randomName = generateRandomName();

  const tokenRequestData = await client.auth.createTokenRequest({
    clientId: randomName,
  });

  res.status(200).json(tokenRequestData);
}
