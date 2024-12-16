"use client";
import { useEffect, useState } from "react";
import { MapSettingsProvider } from "@/context/mapSettingsContext";
import { VttProvider } from "@/context/vttContext";
import { UserProvider } from "@/context/userContext";

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
    <UserProvider>
      <VttProvider channel={channel}>
        <MapSettingsProvider>{children}</MapSettingsProvider>
      </VttProvider>
    </UserProvider>
  );
};

export default LocalProviderOfAllThings;
