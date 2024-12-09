import { VTT } from "@/vtt/classes/VTT";
import React, { createContext, useContext, useEffect, useState } from "react";

type GlobalVTT = VTT | null;

export interface VTTContextProps {
  vtt: GlobalVTT;
  setVtt: React.Dispatch<React.SetStateAction<GlobalVTT>>;
}

export const VttContext = createContext<VTTContextProps | undefined>(undefined);

interface VttProviderProps {
  children: React.ReactNode;
}

export const VttProvider: React.FC<VttProviderProps> = ({ children }) => {
  const [vtt, setVtt] = useState<GlobalVTT>(null);

  useEffect(() => {
    setVtt(new VTT("canvas", ""));
  }, []);

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
