import { VTT } from "@/vtt/classes/VTT";
import React, { createContext, useContext, useState } from "react";

type GlobalVTT = VTT | null;

export interface VTTContextProps {
  vtt: GlobalVTT;
  setVtt: React.Dispatch<React.SetStateAction<GlobalVTT>>;
}

export const VttContext = createContext<VTTContextProps | undefined>(undefined);

interface VttProviderProps {
  children: React.ReactNode;
  channel: string;
}

export const VttProvider: React.FC<VttProviderProps> = ({
  children,
  channel,
}) => {
  const [vtt, setVtt] = useState<GlobalVTT>(new VTT("canvas", channel));

  return (
    <VttContext.Provider value={{ vtt, setVtt }}>
      {children}
    </VttContext.Provider>
  );
};

export const useVtt = (): VTTContextProps => {
  const context = useContext(VttContext);
  if (!context) {
    throw new Error("useVtt must be used within a VttProvider");
  }
  return context;
};
