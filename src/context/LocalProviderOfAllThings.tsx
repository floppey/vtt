"use client";
import { MapSettingsProvider } from "./mapSettingsContext";
import { VttProvider } from "./vttContext";

interface LocalProviderOfAllThingsProps {
  children: React.ReactNode;
}

const LocalProviderOfAllThings: React.FC<LocalProviderOfAllThingsProps> = ({
  children,
}) => {
  return (
    <VttProvider channel="">
      <MapSettingsProvider>{children}</MapSettingsProvider>
    </VttProvider>
  );
};

export default LocalProviderOfAllThings;
