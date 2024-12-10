import React, { createContext, useContext, useState } from "react";
import { ChannelProvider } from "ably/react";

export interface VTTChannelProps {
  channel: string;
  setChannel: React.Dispatch<React.SetStateAction<string>>;
}

export const VttChannelContext = createContext<VTTChannelProps | undefined>(undefined);

interface VttProviderProps {
  channel: string;
  children: React.ReactNode;
}

export const VttChannelProvider: React.FC<VttProviderProps> = ({ children, channel: initialChannel }) => {
  const [channel, setChannel] = useState<string>(initialChannel);


  return (
    <VttChannelContext.Provider value={{ channel, setChannel }}>
      <ChannelProvider channelName={channel}>{children}</ChannelProvider>
    </VttChannelContext.Provider>
  );
};

export const useVttChannel = (): VTTChannelProps => {
  const context = useContext(VttChannelContext);
  if (!context) {
    throw new Error("useVttChannel must be used within a VttChannelProvider");
  }
  return context;
};
