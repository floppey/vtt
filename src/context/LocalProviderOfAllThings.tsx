"use client";
import { useEffect, useState } from "react";
import { MapSettingsProvider } from "./mapSettingsContext";
import { VttProvider } from "./vttContext";

interface LocalProviderOfAllThingsProps {
  children: React.ReactNode;
}

const LocalProviderOfAllThings: React.FC<LocalProviderOfAllThingsProps> = ({
  children,
}) => {
  const [channel, setCannel] = useState<string | null>(null);

  useEffect(() => {
    setCannel("");
  }, []);

  if (channel === null) {
    return <div />;
  }

  return (
    <VttProvider channel={channel}>
      <MapSettingsProvider>{children}</MapSettingsProvider>
    </VttProvider>
  );
};

export default LocalProviderOfAllThings;
