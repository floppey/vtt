"use client";
import * as Ably from "ably";
import { AblyProvider } from "ably/react";
import { MapSettingsProvider } from "@/context/mapSettingsContext";
import { VttProvider } from "@/context/vttContext";
import { useVttChannel, VttChannelProvider } from "@/context/vttChannelContext";
import { ReactNode, useState } from "react";
import { UserProvider } from "@/context/userContext";

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
        <UserProvider>
          <VttProviderWrapper>
            <MapSettingsProvider>{children}</MapSettingsProvider>
          </VttProviderWrapper>
        </UserProvider>
      </VttChannelProvider>
    </AblyProvider>
  );
};

export default ProviderOfAllThings;
