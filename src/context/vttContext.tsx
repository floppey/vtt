import React, { createContext, useContext, useState } from "react";

import { VTT } from "../classes/VTT";


type GlobalVTT = VTT;

export interface VTTContextProps {
  vtt: GlobalVTT;
  setVtt: React.Dispatch<React.SetStateAction<GlobalVTT>>;
}


export const VttContext = createContext<
  VTTContextProps | undefined
>(undefined);

interface VttProviderProps {
  children: React.ReactNode;
}

export const VttProvider: React.FC<VttProviderProps> = ({
  children,
}) => {


  const [vtt, setVtt] = useState<GlobalVTT>(new VTT("canvas", ""));


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
