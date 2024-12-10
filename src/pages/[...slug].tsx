import { VttWrapper } from "@/components/VttWrapper";
import { MapSettingsProvider } from "@/context/mapSettingsContext";
import { VttChannelProvider } from "@/context/vttChannelContext";
import { VttProvider } from "@/context/vttContext";
import { NextApiRequest, NextApiResponse } from "next";
import Head from "next/head";

interface HomeProps {
  channelId: string;
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}

export async function getStaticProps({
  params,
}: {
  params: { slug: string[] };
  req: NextApiRequest;
  res: NextApiResponse;
}) {
  const channelId = params.slug[0];
  if (!channelId) {
    // create id and redirect
    // channelId = generateGuid();
    // return {
    //   redirect: {
    //     destination: `/${channelId}`,
    //     permanent: false,
    //   },
    // }
    return {
      notFound: true,
    }
  }

  return {
    props: {
      channelId,
    },
  };
}

export default function Home({ channelId }: HomeProps) {
  return (
    <>
      <Head>
        <title>VTT</title>
        <meta name="description" content="VTT Demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <VttChannelProvider channel={channelId}>
          <VttProvider>
            <MapSettingsProvider>
              <VttWrapper />
            </MapSettingsProvider>
          </VttProvider>
        </VttChannelProvider>
      </div>
    </>
  );
}
