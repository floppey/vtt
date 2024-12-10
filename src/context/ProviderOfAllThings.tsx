"use client";
import * as Ably from "ably";
import { AblyProvider } from "ably/react";
import { MapSettingsProvider } from "./mapSettingsContext";
import { VttProvider } from "./vttContext";
import { VttChannelProvider } from "./vttChannelContext";

interface ProviderOfAllThingsProps {
  children: React.ReactNode;
  channelId: string;
}

const ProviderOfAllThings: React.FC<ProviderOfAllThingsProps> = ({
  children,
  channelId,
}) => {
  const client = new Ably.Realtime({
    authUrl: `${process.env.NEXT_PUBLIC_HOSTNAME}/api/createTokenRequest`,
  });
  return (
    <AblyProvider client={client}>
      <VttChannelProvider channel={channelId}>
        <VttProvider>
          <MapSettingsProvider>{children}</MapSettingsProvider>
        </VttProvider>
      </VttChannelProvider>
    </AblyProvider>
  );
};

export default ProviderOfAllThings;
