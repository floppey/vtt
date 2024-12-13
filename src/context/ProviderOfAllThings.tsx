"use client";
import * as Ably from "ably";
import { AblyProvider } from "ably/react";
import { MapSettingsProvider } from "./mapSettingsContext";
import { VttProvider } from "./vttContext";
import { useVttChannel, VttChannelProvider } from "./vttChannelContext";
import { ReactNode, useState } from "react";

interface ProviderOfAllThingsProps {
  children: React.ReactNode;
  channelId: string;
}

const VttProviderWrapper: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { channel } = useVttChannel();
  return <VttProvider channel={channel}>{children}</VttProvider>;
};

const ProviderOfAllThings: React.FC<ProviderOfAllThingsProps> = ({
  children,
  channelId,
}) => {
  const [client] = useState(
    new Ably.Realtime({
      authUrl: `${process.env.NEXT_PUBLIC_HOSTNAME}/api/createTokenRequest`,
    })
  );
  return (
    <AblyProvider client={client}>
      <VttChannelProvider channel={channelId}>
        <VttProviderWrapper>
          <MapSettingsProvider>{children}</MapSettingsProvider>
        </VttProviderWrapper>
      </VttChannelProvider>
    </AblyProvider>
  );
};

export default ProviderOfAllThings;
