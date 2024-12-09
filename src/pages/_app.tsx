import "@/styles/globals.css";
import type { AppProps } from "next/app";
import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";

export default function App({ Component, pageProps }: AppProps) {
  const client = new Ably.Realtime({
    authUrl: `${process.env.NEXT_PUBLIC_HOSTNAME}/api/createTokenRequest`,
  });
  return (
    <AblyProvider client={client}>
      <ChannelProvider channelName="headlines">
        <Component {...pageProps} />;
      </ChannelProvider>
    </AblyProvider>
  );
}
