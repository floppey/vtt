import { VttWrapper } from "@/components/VttWrapper";
import { MapSettingsProvider } from "@/context/mapSettingsContext";
import { VttChannelProvider } from "@/context/VttChannelProvider";
import { VttProvider } from "@/context/vttContext";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>VTT</title>
        <meta name="description" content="VTT Demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <VttProvider>
          <MapSettingsProvider>
            <VttChannelProvider>
              <VttWrapper />
            </VttChannelProvider>
          </MapSettingsProvider>
        </VttProvider>
      </div>
    </>
  );
}
