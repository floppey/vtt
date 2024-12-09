import { VttWrapper } from "@/components/VttWrapper";
import { MapSettingsProvider } from "@/context/mapSettingsContext";
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
        <main>
          <VttProvider>
            <MapSettingsProvider>
              <VttWrapper />
            </MapSettingsProvider>
          </VttProvider>
        </main>
      </div>
    </>
  );
}
