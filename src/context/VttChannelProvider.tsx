import { ChannelProvider } from "ably/react";
import { useVtt } from "./vttContext";

interface VttChannelProviderProps {
  children: React.ReactNode;
}

export const VttChannelProvider: React.FC<VttChannelProviderProps> = ({
  children,
}) => {
  const { vtt } = useVtt();
  const channel = vtt?.websocketChannel ?? "";

  if (!channel) {
    return <div>{children}</div>;
  }

  return <ChannelProvider channelName={channel}>{children}</ChannelProvider>;
};
